import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { reconcile } from "./reconcile-poetry-migration.mjs";
import { verifyStructure, verificationQueries } from "./apply-poetry-migration.mjs";
import { TARGET } from "./poetry-migration-plan.mjs";
const sql = await readFile(
  new URL("../supabase/migrations/20261121175059_poetry_foundation.sql", import.meta.url),
);
const results = JSON.parse(
  await readFile(new URL("./fixtures/poetry-postcheck-api.json", import.meta.url), "utf8"),
);
const queries = verificationQueries(
  await readFile(new URL("../supabase/checks/poetry-postmigration.sql", import.meta.url), "utf8"),
);
test("actual Management API result with PostgreSQL name[] strings passes postverification", () => {
  assert.equal(verifyStructure(results).passed, true);
  const changed = structuredClone(results);
  changed[1][0].roles = "{anon}";
  assert.equal(verifyStructure(changed).passed, false);
});
test("reconciliation reads existing history and schema without any write endpoint", async () => {
  const calls = [];
  let queryIndex = 0;
  const token = "sbp_synthetic_test_token_not_real";
  const report = await reconcile({
    token,
    projectUrl: `https://${TARGET.reference}.supabase.co`,
    sql,
    queries,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      if (options.method === "POST") {
        assert.ok(url.endsWith("/database/query/read-only"));
        assert.match(JSON.parse(options.body).query, /^select\s/i);
        if (queryIndex++ === 0)
          return Response.json([
            {
              inventory: {
                compatibility: {
                  postgres_supported: true,
                  auth_users: true,
                  auth_uid: true,
                  uuid_function: true,
                  roles: true,
                },
                target_tables: ["admin_users", "poems", "publications"].map((n) => ({
                  name: `public.${n}`,
                  exists: true,
                })),
                schemas: ["public", "private"],
                public_private_relations: [],
                private_exists: true,
                private_permissions: [],
                private_objects: [],
                migration_history_exists: true,
              },
            },
          ]);
        return Response.json(results[queryIndex - 2]);
      }
      if (url.endsWith("/database/migrations"))
        return Response.json([{ version: "20261121175059", name: "poetry_foundation" }]);
      if (url.endsWith("/database/migrations/20261121175059"))
        return Response.json({
          version: "20261121175059",
          name: "poetry_foundation",
          statements: [sql.toString()],
        });
      return Response.json({ id: TARGET.reference, name: TARGET.name, region: TARGET.region });
    },
  });
  assert.equal(report.status, "VERIFIED_READ_ONLY");
  assert.equal(report.remoteWritesPerformed, false);
  assert.ok(!JSON.stringify(report).includes(token));
  assert.equal(calls.length, 14);
});
