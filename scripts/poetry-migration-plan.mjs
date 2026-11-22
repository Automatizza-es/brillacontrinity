import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { parseEnv } from "node:util";
import { pathToFileURL } from "node:url";
export const TARGET = Object.freeze({
  name: "brilla-con-trinity",
  reference: "gwckhuwespupovgweahj",
  region: "eu-central-1",
});
export const MIGRATION_SHA256 = "3c26003a7e168e2e995f708337fd5bee9d3a95ced3f16cece9a62804de3a418d";

/** Offline preparation only. There is deliberately no fetch, token access or apply mode. */
export function buildPlan(projectUrl, sql) {
  let url;
  try {
    url = new URL(projectUrl);
  } catch {
    throw new Error("LOCAL_PROJECT_MISMATCH");
  }
  if (
    url.origin !== `https://${TARGET.reference}.supabase.co` ||
    url.pathname !== "/" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error("LOCAL_PROJECT_MISMATCH");
  if (createHash("sha256").update(sql).digest("hex") !== MIGRATION_SHA256)
    throw new Error("MIGRATION_CHANGED");
  return {
    target: TARGET,
    sourceFile: "supabase/migrations/20261121175059_poetry_foundation.sql",
    sourceVersion: "20261121175059",
    sha256: MIGRATION_SHA256,
    method: "POST",
    endpoint: `https://api.supabase.com/v1/projects/${TARGET.reference}/database/migrations`,
    bodyFields: ["query", "name"],
    name: "poetry_foundation",
    tokenPermissions: ["Project Settings Read", "Database Read", "Migrations Read & Write"],
    versionStrategy:
      "API-generated timestamp; rename local file to verified remote version, preserving SQL bytes, only after explicit approval",
    executable: false,
    remoteWritesPerformed: false,
  };
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    const root = new URL("../", import.meta.url);
    const env = parseEnv(await readFile(new URL(".env.local", root), "utf8"));
    const sql = await readFile(
      new URL("supabase/migrations/20261121175059_poetry_foundation.sql", root),
    );
    console.log(JSON.stringify(buildPlan(env.VITE_SUPABASE_URL, sql), null, 2));
    console.log(
      "Preparación local únicamente. No se ha solicitado un token ni enviado ninguna petición.",
    );
  } catch {
    console.error(
      "La configuración local o el SQL no coinciden con el destino y versión revisados. No se ha enviado ninguna petición.",
    );
    process.exitCode = 1;
  }
}
