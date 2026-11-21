import { test } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { preflight, promptHiddenToken } from "./supabase-isolated-preflight.mjs";

const token = "sbp_fc_synthetic_token_for_offline_tests_only";
const projectUrl = "https://synthetic-project.supabase.co";
const project = {
  id: "synthetic-project",
  name: "brilla-con-trinity",
  region: "eu-central-1",
  database: { password: "not-to-return" },
};
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
function fakeApi(p = project, i = inventory, migrations = []) {
  const calls = [];
  return {
    calls,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      if (url.endsWith("/database/query/read-only"))
        return Response.json([{ inventory: i }], { status: 201 });
      if (url.endsWith("/database/migrations")) return Response.json(migrations);
      return Response.json(p);
    },
  };
}

test("accepts scoped token using only explicit official endpoints, never returns token/project secrets", async () => {
  const api = fakeApi();
  const report = await preflight({ token, projectUrl, fetchImpl: api.fetchImpl });
  assert.equal(report.conclusion, "READY_FOR_HUMAN_REVIEW");
  assert.equal(report.migrationApplied, false);
  assert.equal(api.calls.length, 3);
  assert.ok(!JSON.stringify(report).includes(token));
  assert.ok(!JSON.stringify(report).includes("not-to-return"));
  for (const c of api.calls) {
    assert.equal(c.options.headers.Authorization, `Bearer ${token}`);
    assert.equal(c.options.redirect, "error");
    assert.ok(c.url.startsWith("https://api.supabase.com/v1/projects/synthetic-project"));
    if (c.options.method === "POST") {
      assert.ok(c.url.endsWith("/query/read-only"));
      assert.ok(JSON.parse(c.options.body).query.startsWith("select "));
    }
  }
});
for (const field of ["id", "name", "region"]) {
  test(`wrong ${field} stops before any SQL query`, async () => {
    const api = fakeApi({ ...project, [field]: "wrong" });
    await assert.rejects(
      preflight({ token, projectUrl, fetchImpl: api.fetchImpl }),
      /PROJECT_MISMATCH/,
    );
    assert.equal(api.calls.length, 1);
  });
}
for (const status of [401, 403, 500]) {
  test(`HTTP ${status} stops without fallback and without leaking response`, async () => {
    let count = 0;
    await assert.rejects(
      preflight({
        token,
        projectUrl,
        fetchImpl: async () => {
          count++;
          return new Response(token, { status });
        },
      }),
      new RegExp(
        status === 401
          ? "TOKEN_REJECTED"
          : status === 403
            ? "PERMISSION_DENIED"
            : "API_UNAVAILABLE",
      ),
    );
    assert.equal(count, 1);
  });
}
test("missing token never uses inherited credentials", async () => {
  const original = process.env.SUPABASE_ACCESS_TOKEN;
  process.env.SUPABASE_ACCESS_TOKEN = token;
  try {
    await assert.rejects(
      preflight({ projectUrl, fetchImpl: () => assert.fail("No request allowed") }),
      /TOKEN_REQUIRED/,
    );
  } finally {
    if (original === undefined) delete process.env.SUPABASE_ACCESS_TOKEN;
    else process.env.SUPABASE_ACCESS_TOKEN = original;
  }
});
for (const changed of [
  { private_exists: true },
  { target_tables: inventory.target_tables.map((t) => ({ ...t, exists: true })) },
]) {
  test("existing private schema or target table requires review", async () => {
    assert.equal(
      (await preflight({ token, projectUrl, ...fakeApi(project, { ...inventory, ...changed }) }))
        .conclusion,
      "REVIEW_REQUIRED",
    );
  });
}
test("existing migrations require review", async () => {
  const result = await preflight({
    token,
    projectUrl,
    ...fakeApi(project, inventory, [{ version: "123", statements: token }]),
  });
  assert.equal(result.conclusion, "REVIEW_REQUIRED");
  assert.deepEqual(result.migrations, [{ version: "123" }]);
});
test("incomplete inventories fail closed", async () => {
  await assert.rejects(
    preflight({ token, projectUrl, ...fakeApi(project, { private_exists: false }) }),
    /INVALID_RESPONSE/,
  );
});
test("no token entry is accepted through pipes", async () => {
  await assert.rejects(promptHiddenToken({ isTTY: false }, { isTTY: false }), /TERMINAL_REQUIRED/);
});
test("hidden terminal prompt echoes no characters and restores terminal state", async () => {
  const input = new EventEmitter();
  Object.assign(input, {
    isTTY: true,
    isRaw: false,
    setRawMode(value) {
      this.isRaw = value;
    },
    resume() {},
    pause() {},
  });
  let written = "";
  const output = {
    isTTY: true,
    write(s) {
      written += s;
    },
  };
  const promise = promptHiddenToken(input, output);
  input.emit("data", Buffer.from(token + "\r"));
  assert.equal(await promise, token);
  assert.equal(input.isRaw, false);
  assert.ok(!written.includes(token));
  assert.equal(input.listenerCount("data"), 0);
});
