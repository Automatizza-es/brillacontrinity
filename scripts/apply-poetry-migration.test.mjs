import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  policyRoles,
  applyOnce,
  canonicalSql,
  verificationQueries,
  verifyStructure,
} from "./apply-poetry-migration.mjs";
import { TARGET } from "./poetry-migration-plan.mjs";
const sql = await readFile(
  new URL("../supabase/migrations/20261121175059_poetry_foundation.sql", import.meta.url),
);
const token = "sbp_synthetic_offline_test_token_only";
const projectUrl = `https://${TARGET.reference}.supabase.co`;
const inventory = {
  compatibility: {
    postgres_supported: true,
    auth_users: true,
    auth_uid: true,
    uuid_function: true,
    roles: true,
  },
  target_tables: ["admin_users", "poems", "publications"].map((n) => ({
    name: `public.${n}`,
    exists: false,
  })),
  schemas: ["public"],
  public_private_relations: [],
  private_exists: false,
  private_permissions: [],
  private_objects: [],
  migration_history_exists: false,
};
function harness({ status = 200, timeout = false, wrongProject = false, existing = false } = {}) {
  const calls = [],
    states = [];
  let written = false;
  return {
    calls,
    states,
    token,
    projectUrl,
    sql,
    queries: [],
    persist: async (s) => states.push(structuredClone(s)),
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      if (url.endsWith("/database/query/read-only"))
        return Response.json([{ inventory: { ...inventory, private_exists: existing } }]);
      if (url.endsWith("/database/migrations") && options.method === "POST") {
        written = true;
        if (timeout) throw new Error("SYNTHETIC_TIMEOUT");
        return Response.json({}, { status });
      }
      if (url.endsWith("/database/migrations"))
        return Response.json(
          written ? [{ version: "20261121000000", name: "poetry_foundation" }] : [],
        );
      if (url.endsWith("/database/migrations/20261121000000"))
        return Response.json({
          version: "20261121000000",
          name: "poetry_foundation",
          statements: [sql.toString()],
        });
      return Response.json({
        id: TARGET.reference,
        name: wrongProject ? "wrong" : TARGET.name,
        region: TARGET.region,
      });
    },
  };
}
const writes = (h) =>
  h.calls.filter((c) => c.url.endsWith("/database/migrations") && c.options.method === "POST");
test("rejects a different destination or modified SQL before network access", async () => {
  for (const change of [
    { projectUrl: "https://wrong.supabase.co" },
    { sql: Buffer.from("select 1;") },
  ]) {
    const h = harness();
    await assert.rejects(applyOnce({ ...h, ...change }));
    assert.equal(h.calls.length, 0);
  }
});
test("rechecks remote identity and empty inventory before writing", async () => {
  for (const options of [{ wrongProject: true }, { existing: true }]) {
    const h = harness(options);
    await assert.rejects(applyOnce(h));
    assert.equal(writes(h).length, 0);
  }
});
test("journal failure prevents the write", async () => {
  const h = harness();
  await assert.rejects(
    applyOnce({
      ...h,
      persist: async () => {
        throw new Error("disk");
      },
    }),
  );
  assert.equal(writes(h).length, 0);
});
for (const options of [{ status: 403 }, { timeout: true }])
  test("uncertain or rejected write is attempted once without fallback", async () => {
    const h = harness(options);
    const result = await applyOnce(h);
    assert.equal(writes(h).length, 1);
    assert.equal(h.states[0].status, "WRITE_INTENT_RECORDED");
    assert.equal(result.migrationApplied, false);
    assert.ok(!JSON.stringify(h.states).includes(token));
  });
test("successful write checks the recorded SQL and does not repeat when verification fails", async () => {
  const h = harness();
  const result = await applyOnce(h);
  assert.equal(writes(h).length, 1);
  assert.equal(result.historyMatchesSql, true);
  assert.equal(result.migrationApplied, true);
  assert.equal(result.status, "APPLIED_REQUIRES_REVIEW");
  assert.deepEqual(JSON.parse(writes(h)[0].options.body), {
    name: "poetry_foundation",
    query: sql.toString(),
  });
  for (const c of h.calls) {
    assert.ok(c.url.startsWith(`https://api.supabase.com/v1/projects/${TARGET.reference}`));
    assert.equal(c.options.redirect, "error");
  }
});
test("history comparison preserves quoted contents and ignores external separators", () => {
  assert.equal(canonicalSql("-- comment\nselect 'a b';"), canonicalSql("select  'a b'"));
  assert.notEqual(canonicalSql("select 'a b'"), canonicalSql("select 'ab'"));
  assert.notEqual(
    canonicalSql("do $$ begin null; end $$;"),
    canonicalSql("do $$ begin null end $$;"),
  );
});
test("postchecks contain only nine SELECT queries and incomplete results fail closed", async () => {
  const queries = verificationQueries(
    await readFile(new URL("../supabase/checks/poetry-postmigration.sql", import.meta.url), "utf8"),
  );
  assert.equal(queries.length, 9);
  assert.throws(() => verificationQueries("delete from x;"));
  assert.equal(verifyStructure([]).passed, false);
});

test("normalizes API PostgreSQL role literals and rejects unexpected formats", () => {
  assert.deepEqual(policyRoles("{authenticated}"), ["authenticated"]);
  assert.deepEqual(policyRoles("{anon,authenticated}"), ["anon", "authenticated"]);
  assert.deepEqual(policyRoles(["authenticated", "anon"]), ["anon", "authenticated"]);
  for (const value of [null, "authenticated", "{public}", "{anon,,authenticated}"])
    assert.deepEqual(policyRoles(value), []);
});
