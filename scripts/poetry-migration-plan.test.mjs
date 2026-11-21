import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildPlan, TARGET } from "./poetry-migration-plan.mjs";
const sql = await readFile(
  new URL("../supabase/migrations/20261111000100_poetry_foundation.sql", import.meta.url),
);
const url = `https://${TARGET.reference}.supabase.co`;
test("offline plan binds the exact reviewed SQL and project, not a generic SQL endpoint", () => {
  const plan = buildPlan(url, sql);
  assert.equal(plan.target.region, "eu-central-1");
  assert.ok(plan.endpoint.endsWith(`/projects/${TARGET.reference}/database/migrations`));
  assert.equal(plan.executable, false);
  assert.equal(plan.remoteWritesPerformed, false);
  assert.deepEqual(plan.bodyFields, ["query", "name"]);
  assert.ok(plan.versionStrategy.includes("API-generated"));
});
test("another project fails closed", () =>
  assert.throws(() => buildPlan("https://other.supabase.co", sql)));
test("changed SQL fails closed", () =>
  assert.throws(() => buildPlan(url, Buffer.concat([sql, Buffer.from("\n")]))));
test("unexpected query or API path fails closed", () => {
  assert.throws(() => buildPlan(url + "/rest/v1", sql));
  assert.throws(() => buildPlan(url + "/?token=synthetic", sql));
});
