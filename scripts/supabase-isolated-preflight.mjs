import { readFile, writeFile, unlink } from "node:fs/promises";
import { parseEnv } from "node:util";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

const root = new URL("../", import.meta.url);
const reportFile = new URL(".supabase-preflight-report.local", root);
export const INVENTORY_SQL = `select jsonb_build_object(
 'compatibility', jsonb_build_object(
   'postgres_supported', current_setting('server_version_num')::integer >= 150000,
   'auth_users', to_regclass('auth.users') is not null,
   'auth_uid', to_regprocedure('auth.uid()') is not null,
   'uuid_function', to_regprocedure('gen_random_uuid()') is not null,
   'roles', (select count(*) = 2 from pg_catalog.pg_roles where rolname in ('anon','authenticated'))),
 'target_tables', (select jsonb_agg(jsonb_build_object('name', name, 'exists', to_regclass(name) is not null))
   from (values ('public.admin_users'),('public.poems'),('public.publications')) as targets(name)),
 'schemas', (select coalesce(jsonb_agg(nspname order by nspname), '[]'::jsonb) from pg_catalog.pg_namespace),
 'public_private_relations', (select coalesce(jsonb_agg(jsonb_build_object('schema',n.nspname,'name',c.relname,'kind',c.relkind,'rls',c.relrowsecurity)), '[]'::jsonb)
   from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
   where n.nspname in ('public','private') and c.relkind in ('r','p','v','m','f','S')),
 'private_exists', exists(select 1 from pg_catalog.pg_namespace where nspname='private'),
 'private_owner', (select pg_get_userbyid(nspowner) from pg_catalog.pg_namespace where nspname='private'),
 'private_permissions', (select coalesce(jsonb_agg(jsonb_build_object(
   'grantee',case when a.grantee=0 then 'PUBLIC' else pg_get_userbyid(a.grantee) end,
   'privilege',a.privilege_type,'grantable',a.is_grantable)), '[]'::jsonb)
   from pg_catalog.pg_namespace n cross join lateral pg_catalog.aclexplode(coalesce(n.nspacl,pg_catalog.acldefault('n',n.nspowner))) a
   where n.nspname='private'),
 'private_objects', (select coalesce(jsonb_agg(pg_catalog.pg_describe_object(d.classid,d.objid,d.objsubid)), '[]'::jsonb)
   from pg_catalog.pg_depend d join pg_catalog.pg_namespace n on d.refobjid=n.oid
   where d.refclassid='pg_catalog.pg_namespace'::regclass and n.nspname='private'),
 'migration_history_exists', to_regclass('supabase_migrations.schema_migrations') is not null
) as inventory`;

export async function preflight({ token, projectUrl, fetchImpl = globalThis.fetch }) {
  if (typeof token !== "string" || !/^sbp_[A-Za-z0-9_.-]{16,4096}$/.test(token)) {
    throw new Error("TOKEN_REQUIRED");
  }
  let url;
  try {
    url = new URL(projectUrl);
  } catch {
    throw new Error("LOCAL_CONFIG_INVALID");
  }
  if (
    url.protocol !== "https:" ||
    !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.username ||
    url.password ||
    url.port
  ) {
    throw new Error("LOCAL_CONFIG_INVALID");
  }
  const ref = url.hostname.split(".")[0];
  async function request(suffix, query) {
    let response;
    try {
      response = await fetchImpl(`https://api.supabase.com/v1/projects/${ref}${suffix}`, {
        method: query ? "POST" : "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          ...(query ? { "Content-Type": "application/json" } : {}),
        },
        ...(query ? { body: JSON.stringify({ query }) } : {}),
        redirect: "error",
        signal: AbortSignal.timeout(20_000),
      });
    } catch {
      throw new Error("NETWORK_ERROR");
    }
    if (response.status === 401) throw new Error("TOKEN_REJECTED");
    if (response.status === 403) throw new Error("PERMISSION_DENIED");
    if (!response.ok) throw new Error("API_UNAVAILABLE");
    try {
      return await response.json();
    } catch {
      throw new Error("INVALID_RESPONSE");
    }
  }
  const project = await request("");
  if (
    (project.ref ?? project.id) !== ref ||
    project.name !== "brilla-con-trinity" ||
    project.region !== "eu-central-1"
  ) {
    throw new Error("PROJECT_MISMATCH");
  }
  // The only POST is the official read-only SQL endpoint. No generic SQL fallback.
  const rows = await request("/database/query/read-only", INVENTORY_SQL);
  const inventory = Array.isArray(rows) && rows.length === 1 ? rows[0]?.inventory : null;
  if (
    !inventory ||
    typeof inventory.private_exists !== "boolean" ||
    !Array.isArray(inventory.target_tables) ||
    inventory.target_tables.length !== 3 ||
    !inventory.compatibility ||
    !["schemas", "public_private_relations", "private_permissions", "private_objects"].every((k) =>
      Array.isArray(inventory[k]),
    ) ||
    ["postgres_supported", "auth_users", "auth_uid", "uuid_function", "roles"].some(
      (k) => typeof inventory.compatibility[k] !== "boolean",
    ) ||
    inventory.target_tables
      .map((t) => t.name)
      .sort()
      .join(",") !== "public.admin_users,public.poems,public.publications" ||
    inventory.target_tables.some((t) => typeof t.exists !== "boolean")
  )
    throw new Error("INVALID_RESPONSE");
  const migrations = await request("/database/migrations");
  if (!Array.isArray(migrations) || migrations.some((m) => typeof m.version !== "string"))
    throw new Error("INVALID_RESPONSE");
  const clean =
    Object.values(inventory.compatibility).every((v) => v === true) &&
    inventory.target_tables.every((t) => t.exists === false) &&
    !inventory.private_exists &&
    migrations.length === 0;
  // Select metadata only. Never retain project.database, API payloads or headers.
  return {
    checkedAt: new Date().toISOString(),
    project: { name: project.name, reference: ref, region: project.region },
    inventory,
    migrations: migrations.map((m) => ({ version: m.version })),
    conclusion: clean ? "READY_FOR_HUMAN_REVIEW" : "REVIEW_REQUIRED",
    migrationApplied: false,
  };
}

export function promptHiddenToken(input = process.stdin, output = process.stdout) {
  if (!input.isTTY || !output.isTTY) return Promise.reject(new Error("TERMINAL_REQUIRED"));
  return new Promise((resolve, reject) => {
    let value = "";
    const wasRaw = input.isRaw;
    function finish(error) {
      input.off("data", receive);
      input.setRawMode(!!wasRaw);
      input.pause();
      output.write("\n");
      const result = value;
      value = "";
      if (error) reject(new Error(error));
      else resolve(result);
    }
    function receive(data) {
      for (const char of data.toString()) {
        if (char === "\u0003" || char === "\u0004") return finish("CANCELLED");
        if (char === "\r" || char === "\n") return finish();
        if (char === "\u007f" || char === "\b") value = value.slice(0, -1);
        else if (/^[A-Za-z0-9_.-]$/.test(char)) value += char;
        else return finish("TOKEN_REQUIRED");
        if (value.length > 4100) return finish("TOKEN_REQUIRED");
      }
    }
    output.write("Token exclusivo de Trinity (entrada oculta; Enter para continuar): ");
    input.setRawMode(true);
    input.resume();
    input.on("data", receive);
  });
}

const MESSAGES = {
  TERMINAL_REQUIRED: "Ejecuta este comando personalmente en una Terminal interactiva.",
  TOKEN_REQUIRED: "Token no válido o vacío. No se utilizará ninguna otra credencial.",
  TOKEN_REJECTED: "El token ha sido rechazado o ha caducado. No se utilizará otra sesión.",
  PERMISSION_DENIED:
    "Permisos insuficientes. Se detiene la consulta sin ampliar permisos ni cambiar de sesión.",
  PROJECT_MISMATCH:
    "El proyecto no coincide exactamente con Trinity y Frankfurt. Proceso detenido.",
  NETWORK_ERROR:
    "La consulta no se ha completado por un problema de red. Datos sensibles omitidos.",
  API_UNAVAILABLE: "La API no ha completado la consulta. No se ha utilizado ninguna alternativa.",
  INVALID_RESPONSE: "La respuesta no permite completar la comprobación. Proceso detenido.",
  LOCAL_CONFIG_INVALID: "Revisa la Project URL raíz en .env.local. Su valor no se mostrará.",
  CANCELLED: "Operación cancelada.",
};

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  // Do not inherit a token from another tool or session. Never invoke Supabase CLI.
  delete process.env.SUPABASE_ACCESS_TOKEN;
  try {
    await unlink(reportFile).catch((error) => {
      if (error.code !== "ENOENT") throw new Error("LOCAL_REPORT_ERROR");
    });
    const env = parseEnv(await readFile(new URL(".env.local", root), "utf8"));
    process.env.SUPABASE_ACCESS_TOKEN = await promptHiddenToken();
    const report = await preflight({
      token: process.env.SUPABASE_ACCESS_TOKEN,
      projectUrl: env.VITE_SUPABASE_URL,
    });
    delete process.env.SUPABASE_ACCESS_TOKEN;
    const migration = await readFile(
      new URL("supabase/migrations/20261111000100_poetry_foundation.sql", root),
    );
    report.migrationSha256 = createHash("sha256").update(migration).digest("hex");
    await writeFile(reportFile, JSON.stringify(report, null, 2) + "\n", {
      mode: 0o600,
      flag: "wx",
    });
    console.log(
      `Proyecto verificado: ${report.project.name}; región Frankfurt; referencia coincidente.`,
    );
    console.log(
      "Informe sin credenciales guardado en .supabase-preflight-report.local (ignorado por Git).",
    );
    console.log("No se han aplicado cambios. Avisa en el chat para que revisemos el informe.");
  } catch (error) {
    console.error(
      MESSAGES[error?.message] ?? "No se ha completado la revisión. Detalles sensibles omitidos.",
    );
    process.exitCode = 1;
  } finally {
    delete process.env.SUPABASE_ACCESS_TOKEN;
  }
}
