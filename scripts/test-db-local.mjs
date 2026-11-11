import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { setTimeout } from "node:timers/promises";

// No connection string, remote target, published ports or production credentials.
const name = `trinity-rls-test-${process.pid}`;
function docker(args, input, allowFailure = false) {
  const result = spawnSync("docker", args, { input, encoding: "utf8" });
  if (!allowFailure && result.status !== 0) {
    throw new Error(result.stderr || result.error?.message || "Docker failed");
  }
  return result;
}
function sql(path) {
  const result = docker(
    ["exec", "-i", name, "psql", "-U", "postgres", "-v", "ON_ERROR_STOP=1"],
    readFileSync(path, "utf8"),
  );
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
}
try {
  docker([
    "run",
    "--detach",
    "--rm",
    "--name",
    name,
    "--env",
    "POSTGRES_HOST_AUTH_METHOD=trust",
    "postgres:17-alpine",
  ]);
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (docker(["exec", name, "pg_isready", "-U", "postgres"], undefined, true).status === 0) {
      ready = true;
      break;
    }
    await setTimeout(500);
  }
  if (!ready) throw new Error("Local PostgreSQL did not become ready");
  sql("supabase/tests/local-bootstrap.sql");
  for (const file of readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    sql(`supabase/migrations/${file}`);
  }
  sql("supabase/tests/permissions.sql");
  console.log("Local PostgreSQL permission tests passed. No remote database was contacted.");
} finally {
  docker(["rm", "--force", name], undefined, true);
}
