import { readFile, writeFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { pathToFileURL } from "node:url";
import { buildPlan, TARGET } from "./poetry-migration-plan.mjs";
import { preflight, promptHiddenToken } from "./supabase-isolated-preflight.mjs";
import { canonicalSql, verificationQueries, verifyStructure } from "./apply-poetry-migration.mjs";

export async function reconcile({ token, projectUrl, sql, queries, fetchImpl = globalThis.fetch }) {
  buildPlan(projectUrl, sql);
  const inventory = await preflight({ token, projectUrl, fetchImpl });
  if (inventory.project.reference !== TARGET.reference) throw new Error("WRONG_TARGET");
  const base = `https://api.supabase.com/v1/projects/${TARGET.reference}`;
  async function read(suffix, query) {
    // The only permitted POST endpoint enforces a read-only database transaction.
    if (query && suffix !== "/database/query/read-only") throw new Error("READ_ONLY_REQUIRED");
    const response = await fetchImpl(base + suffix, {
      method: query ? "POST" : "GET",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      ...(query ? { body: JSON.stringify({ query }) } : {}),
      redirect: "error",
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error("READ_FAILED");
    return response.json();
  }
  const history = await read("/database/migrations");
  if (
    !Array.isArray(history) ||
    history.length !== 1 ||
    history[0].version !== "20261121175059" ||
    history[0].name !== "poetry_foundation"
  )
    throw new Error("HISTORY_REQUIRES_REVIEW");
  const entry = await read("/database/migrations/20261121175059");
  if (
    entry.version !== history[0].version ||
    entry.name !== history[0].name ||
    !Array.isArray(entry.statements) ||
    canonicalSql(entry.statements.join(";\n")) !== canonicalSql(sql.toString("utf8"))
  )
    throw new Error("HISTORY_SQL_MISMATCH");
  const results = [];
  for (const query of queries) results.push(await read("/database/query/read-only", query));
  const verification = verifyStructure(results);
  return {
    checkedAt: new Date().toISOString(),
    project: inventory.project,
    remoteVersion: entry.version,
    historyMatchesSql: true,
    verification,
    remoteWritesPerformed: false,
    status: verification.passed ? "VERIFIED_READ_ONLY" : "REQUIRES_REVIEW",
  };
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  delete process.env.SUPABASE_ACCESS_TOKEN;
  try {
    const root = new URL("../", import.meta.url);
    const env = parseEnv(await readFile(new URL(".env.local", root), "utf8"));
    const sql = await readFile(
      new URL("supabase/migrations/20261121175059_poetry_foundation.sql", root),
    );
    buildPlan(env.VITE_SUPABASE_URL, sql);
    const queries = verificationQueries(
      await readFile(new URL("supabase/checks/poetry-postmigration.sql", root), "utf8"),
    );
    if (queries.length !== 9) throw new Error("INVALID_CHECKS");
    console.log(
      `Solo lectura: ${TARGET.name}, ${TARGET.reference}, Frankfurt. No aplica ni modifica migraciones.`,
    );
    process.env.SUPABASE_ACCESS_TOKEN = await promptHiddenToken();
    const report = await reconcile({
      token: process.env.SUPABASE_ACCESS_TOKEN,
      projectUrl: env.VITE_SUPABASE_URL,
      sql,
      queries,
    });
    delete process.env.SUPABASE_ACCESS_TOKEN;
    await writeFile(
      new URL(".supabase-poetry-reconciliation.local", root),
      JSON.stringify(report, null, 2) + "\n",
      { mode: 0o600 },
    );
    console.log(
      report.status === "VERIFIED_READ_ONLY"
        ? "Migración e historial verificados mediante lectura. Informe guardado."
        : "Verificación pendiente de revisión. Informe guardado.",
    );
  } catch {
    console.error(
      "Comprobación de lectura detenida. No se ha enviado ninguna operación de escritura. No se muestran detalles sensibles.",
    );
    process.exitCode = 1;
  } finally {
    delete process.env.SUPABASE_ACCESS_TOKEN;
  }
}
