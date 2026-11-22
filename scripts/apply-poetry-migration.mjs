import { readFile, open, unlink, link, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { parseEnv } from "node:util";
import { pathToFileURL } from "node:url";
import { buildPlan, TARGET, MIGRATION_SHA256 } from "./poetry-migration-plan.mjs";
import { preflight, promptHiddenToken } from "./supabase-isolated-preflight.mjs";

const root = new URL("../", import.meta.url);
const stateFile = new URL(".supabase-poetry-application.local", root);
const lockFile = new URL(".supabase-poetry-application-lock.local", root);

export function canonicalSql(source) {
  // Preserve quoted values and dollar-quoted function bodies; ignore only SQL
  // comments, external whitespace and statement terminators for history matching.
  const tokens =
    source
      .replace(/\r\n/g, "\n")
      .match(
        /--[^\n]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|"(?:""|[^"])*"|(\$[A-Za-z_0-9]*\$)[\s\S]*?\1|[^\s]/g,
      ) ?? [];
  return tokens.filter((t) => !t.startsWith("--") && !t.startsWith("/*") && t !== ";").join("");
}

export function verificationQueries(source) {
  return source
    .replace(/--[^\n]*/g, "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((sql) => {
      if (!/^select\s/i.test(sql)) throw new Error("INVALID_POSTCHECK_SQL");
      return sql;
    });
}

export function policyRoles(value) {
  // Management API serializes PostgreSQL name[] as a literal, unlike node-pg.
  if (Array.isArray(value) && value.every((r) => typeof r === "string")) return [...value].sort();
  if (
    typeof value === "string" &&
    /^\{(?:anon|authenticated)(?:,(?:anon|authenticated))*\}$/.test(value)
  )
    return value.slice(1, -1).split(",").sort();
  return [];
}

export function verifyStructure(results) {
  const [
    tables,
    policies,
    privileges,
    functions,
    triggers,
    constraints,
    reader,
    counts,
    schemaPermissions,
  ] = results;
  const issues = [];
  const tableNames = ["admin_users", "poems", "publications"];
  if (
    !Array.isArray(tables) ||
    tables.length !== 3 ||
    tables.some(
      (t) =>
        !tableNames.includes(t.table_name) ||
        t.rls_enabled !== true ||
        ["anon", "authenticated"].includes(t.owner),
    ) ||
    new Set(tables.map((t) => t.table_name)).size !== 3
  )
    issues.push("TABLES_OR_RLS");
  const expected = {
    admin_reads_own_membership: ["admin_users", "SELECT", "authenticated", "auth.uid()"],
    public_reads_publications: ["publications", "SELECT", "anon,authenticated", "true"],
    visitor_reads_published_poems: ["poems", "SELECT", "anon", "published"],
    authenticated_reads_poems: ["poems", "SELECT", "authenticated", "private.is_admin()"],
    admin_inserts_poems: ["poems", "INSERT", "authenticated", "private.is_admin()"],
    admin_updates_poems: ["poems", "UPDATE", "authenticated", "private.is_admin()"],
    admin_deletes_poems: ["poems", "DELETE", "authenticated", "private.is_admin()"],
  };
  if (
    !Array.isArray(policies) ||
    policies.length !== 7 ||
    new Set(policies.map((p) => p.policyname)).size !== 7 ||
    policies.some((p) => {
      const e = expected[p.policyname];
      return (
        !e ||
        p.tablename !== e[0] ||
        p.cmd !== e[1] ||
        policyRoles(p.roles).join(",") !== e[2] ||
        p.permissive !== "PERMISSIVE" ||
        !(p.qual ?? p.with_check ?? "").includes(e[3]) ||
        (p.cmd === "UPDATE" && !p.with_check?.includes("private.is_admin()"))
      );
    })
  )
    issues.push("POLICIES");
  const allowed = (r, t, p) =>
    p === "SELECT"
      ? t !== "admin_users" || r === "authenticated"
      : r === "authenticated" && t === "poems" && ["INSERT", "UPDATE", "DELETE"].includes(p);
  if (
    !Array.isArray(privileges) ||
    privileges.length !== 42 ||
    privileges.some((p) => p.allowed !== allowed(p.role_name, p.table_name, p.privilege))
  )
    issues.push("PRIVILEGES");
  if (
    !Array.isArray(functions) ||
    functions.length !== 2 ||
    new Set(functions.map((f) => f.function_name)).size !== 2 ||
    functions.some((f) => {
      const admin = f.function_name === "is_admin";
      return (
        !["is_admin", "protect_poem_metadata"].includes(f.function_name) ||
        f.security_definer !== admin ||
        f.anon_execute !== false ||
        f.authenticated_execute !== admin ||
        !f.function_settings?.some((s) => s.replaceAll('"', "") === "search_path=") ||
        ["anon", "authenticated"].includes(f.owner)
      );
    })
  )
    issues.push("FUNCTIONS");
  if (
    !Array.isArray(triggers) ||
    triggers.length !== 1 ||
    triggers[0].trigger_name !== "protect_poem_metadata" ||
    triggers[0].enabled !== "O" ||
    !triggers[0].definition.includes("private.protect_poem_metadata()")
  )
    issues.push("TRIGGER");
  const requiredConstraints = [
    "admin_users_pkey",
    "admin_users_user_id_fkey",
    "publications_pkey",
    "publications_slug_key",
    "publications_slug_check",
    "publications_title_check",
    "publications_publisher_check",
    "publications_year_check",
    "publications_purchase_links_check",
    "poems_pkey",
    "poems_slug_key",
    "poems_slug_check",
    "poems_title_check",
    "poems_body_check",
    "poems_description_check",
    "poems_status_check",
    "published_poems_have_text",
    "poems_publication_id_fkey",
  ];
  if (
    !Array.isArray(constraints) ||
    requiredConstraints.some((name) => !constraints.some((c) => c.conname === name))
  )
    issues.push("CONSTRAINTS");
  if (!Array.isArray(counts) || counts.length !== 3 || counts.some((c) => Number(c.rows) !== 0))
    issues.push("UNEXPECTED_ROWS");
  if (
    !Array.isArray(schemaPermissions) ||
    schemaPermissions.length !== 2 ||
    schemaPermissions.some(
      (p) => p.usage !== (p.role_name === "authenticated") || p.create_objects !== false,
    )
  )
    issues.push("PRIVATE_SCHEMA_PERMISSIONS");
  return {
    passed: issues.length === 0,
    issues,
    rowCountsConclusive: reader?.[0]?.reader_bypasses_rls === true,
    results,
  };
}

/** Exactly one POST attempt. persist must durably save intent before any write. */
export async function applyOnce({
  token,
  projectUrl,
  sql,
  queries,
  persist,
  fetchImpl = globalThis.fetch,
}) {
  const plan = buildPlan(projectUrl, sql);
  const before = await preflight({ token, projectUrl, fetchImpl });
  if (
    before.project.reference !== TARGET.reference ||
    before.conclusion !== "READY_FOR_HUMAN_REVIEW"
  )
    throw new Error("PREFLIGHT_NOT_CLEAN");
  const state = {
    target: TARGET,
    sourceVersion: plan.sourceVersion,
    sourceSha256: MIGRATION_SHA256,
    checkedAt: new Date().toISOString(),
    status: "WRITE_INTENT_RECORDED",
    writeAttempted: true,
    migrationApplied: false,
  };
  await persist(state); // If local recording fails, no write is sent.
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  async function read(suffix, query) {
    const response = await fetchImpl(
      `https://api.supabase.com/v1/projects/${TARGET.reference}${suffix}`,
      {
        method: query ? "POST" : "GET",
        headers,
        ...(query ? { body: JSON.stringify({ query }) } : {}),
        redirect: "error",
        signal: AbortSignal.timeout(30_000),
      },
    );
    if (!response.ok) throw new Error("VERIFICATION_READ_FAILED");
    return response.json();
  }
  try {
    const response = await fetchImpl(plan.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ name: plan.name, query: sql.toString("utf8") }),
      redirect: "error",
      signal: AbortSignal.timeout(60_000),
    });
    state.applyHttpStatus = response.status;
    // Never print/store the raw response body. Non-200 outcomes are uncertain.
    state.status = response.ok ? "POST_SUCCEEDED_VERIFYING" : "POST_FAILED_RECONCILE_ONLY";
    await persist(state);
    if (!response.ok) return state;
    const history = await read("/database/migrations");
    if (
      !Array.isArray(history) ||
      history.length !== 1 ||
      history[0].name !== "poetry_foundation" ||
      !/^\d{14}$/.test(history[0].version)
    )
      throw new Error("HISTORY_UNEXPECTED");
    state.remoteVersion = history[0].version;
    const entry = await read(`/database/migrations/${state.remoteVersion}`);
    if (
      entry.version !== state.remoteVersion ||
      entry.name !== "poetry_foundation" ||
      !Array.isArray(entry.statements) ||
      canonicalSql(entry.statements.join(";\n")) !== canonicalSql(sql.toString("utf8"))
    )
      throw new Error("HISTORY_SQL_MISMATCH");
    state.historyMatchesSql = true;
    state.migrationApplied = true;
    const results = [];
    for (const query of queries) results.push(await read("/database/query/read-only", query));
    state.verification = verifyStructure(results);
    state.status = state.verification.passed ? "VERIFIED_REMOTE" : "APPLIED_REQUIRES_REVIEW";
    await persist(state);
    return state;
  } catch {
    state.status = state.migrationApplied ? "APPLIED_REQUIRES_REVIEW" : "UNCERTAIN_RECONCILE_ONLY";
    await persist(state);
    return state;
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  delete process.env.SUPABASE_ACCESS_TOKEN;
  let lock;
  try {
    // Exclusive local lock and durable journal make accidental reruns fail closed.
    lock = await open(lockFile, "wx", 0o600);
    try {
      await access(stateFile);
      throw new Error("PREVIOUS_ATTEMPT_EXISTS");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    const env = parseEnv(await readFile(new URL(".env.local", root), "utf8"));
    const source = new URL("supabase/migrations/20261121175059_poetry_foundation.sql", root);
    const sql = await readFile(source);
    buildPlan(env.VITE_SUPABASE_URL, sql);
    const queries = verificationQueries(
      await readFile(new URL("supabase/checks/poetry-postmigration.sql", root), "utf8"),
    );
    if (queries.length !== 9) throw new Error("INVALID_POSTCHECK_SQL");
    console.log(
      `Destino exclusivo: ${TARGET.name}, ${TARGET.reference}, Frankfurt. SQL y hash comprobados.`,
    );
    console.log(
      "Este comando ejecutará la migración autorizada una sola vez, después de repetir el inventario de lectura.",
    );
    process.env.SUPABASE_ACCESS_TOKEN = await promptHiddenToken();
    let firstState = true;
    const persist = async (state) => {
      const journal = await open(stateFile, firstState ? "wx" : "w", 0o600);
      try {
        await journal.writeFile(JSON.stringify(state, null, 2) + "\n");
        await journal.sync();
      } finally {
        await journal.close();
      }
      firstState = false;
    };
    const state = await applyOnce({
      token: process.env.SUPABASE_ACCESS_TOKEN,
      projectUrl: env.VITE_SUPABASE_URL,
      sql,
      queries,
      persist,
    });
    delete process.env.SUPABASE_ACCESS_TOKEN;
    if (state.status === "VERIFIED_REMOTE") {
      // Hard-link then unlink never overwrites an existing destination.
      const destination = new URL(
        `supabase/migrations/${state.remoteVersion}_poetry_foundation.sql`,
        root,
      );
      if (
        createHash("sha256")
          .update(await readFile(source))
          .digest("hex") !== MIGRATION_SHA256
      )
        throw new Error("LOCAL_SQL_CHANGED");
      await link(source, destination);
      if (
        createHash("sha256")
          .update(await readFile(destination))
          .digest("hex") !== MIGRATION_SHA256
      )
        throw new Error("LOCAL_SQL_CHANGED");
      await unlink(source);
      state.localFile = `supabase/migrations/${state.remoteVersion}_poetry_foundation.sql`;
      state.localSha256 = MIGRATION_SHA256;
      state.status = "COMPLETE";
      await persist(state);
      console.log(
        "Migración aplicada y verificada. Archivo local renombrado conservando su contenido.",
      );
    } else {
      process.exitCode = 1;
      console.log(
        "Resultado pendiente de revisión. NO repitas el comando: solo se permite reconciliar mediante lectura.",
      );
    }
    console.log(
      "Informe sin credenciales: .supabase-poetry-application.local. Avisa en el chat para revisar el resultado.",
    );
  } catch {
    console.error(
      "Proceso detenido de forma segura. Si existe un informe de intento previo, NO vuelvas a aplicar: revisaremos el estado por lectura. No se muestran detalles sensibles.",
    );
    process.exitCode = 1;
  } finally {
    delete process.env.SUPABASE_ACCESS_TOKEN;
    if (lock) {
      await lock.close();
      await unlink(lockFile).catch(() => {});
    }
  }
}
