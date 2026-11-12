import { test } from "node:test";
import assert from "node:assert/strict";
import { checkConnection, resultMessage } from "./check-supabase-connection.mjs";

const key = "sb_publishable_synthetic_test_value_only";
const config = `VITE_SUPABASE_URL=https://synthetic-project.supabase.co\nVITE_SUPABASE_PUBLISHABLE_KEY=${key}\n`;
const settings = {
  disable_signup: true,
  external: { email: true, anonymous_users: false, google: false },
  mailer_autoconfirm: false,
};

for (const env of [
  "",
  "VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co\nVITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_ME",
  config.replace(key, "sb_secret_synthetic"),
  config.replace("synthetic-project.supabase.co", "other.example"),
  config.replace(".co\n", ".co/?token=synthetic\n"),
]) {
  test("invalid/example configuration never sends a request or exposes input", async () => {
    const result = await checkConnection(env, () => {
      throw new Error("Fetch must not run");
    });
    assert.equal(result.code, "CONFIGURATION_REQUIRED");
    assert.ok(!resultMessage(result).includes(key));
  });
}

test("only issues a GET to Auth settings with a public API key, no redirects", async () => {
  let calls = 0;
  const result = await checkConnection(config, async (url, options) => {
    calls++;
    assert.equal(url.href, "https://synthetic-project.supabase.co/auth/v1/settings");
    assert.equal(options.method, "GET");
    assert.equal(options.headers.apikey, key);
    assert.equal(options.redirect, "error");
    assert.equal(options.body, undefined);
    assert.equal(options.headers.Authorization, undefined);
    return Response.json(settings);
  });
  assert.equal(calls, 1);
  assert.deepEqual(result, { code: "CONNECTED" });
  assert.ok(!JSON.stringify(result).includes(key));
});

for (const changed of [
  { disable_signup: false },
  { external: { email: true, anonymous_users: true } },
  { mailer_autoconfirm: true },
  { external: { email: true, anonymous_users: false, google: true } },
]) {
  test("a readable connection does not imply administrator-only Auth is configured", async () => {
    assert.equal(
      (await checkConnection(config, async () => Response.json({ ...settings, ...changed }))).code,
      "CONNECTED_REVIEW_AUTH",
    );
  });
}

for (const status of [401, 403, 500]) {
  test(`HTTP ${status} never exposes the response body`, async () => {
    const result = await checkConnection(config, async () => new Response(key, { status }));
    assert.equal(result.code, status === 500 ? "PROJECT_UNAVAILABLE" : "KEY_REJECTED");
    assert.ok(!resultMessage(result).includes(key));
  });
}

test("network failures and unexpected JSON remain sanitized", async () => {
  const result = await checkConnection(config, async () => {
    throw new Error(key);
  });
  assert.equal(result.code, "NETWORK_OR_RESPONSE_ERROR");
  assert.ok(!resultMessage(result).includes(key));
  assert.equal(
    (await checkConnection(config, async () => Response.json({ token: key }))).code,
    "UNEXPECTED_RESPONSE",
  );
});

test("API endpoint URLs report the exact configuration problem without a request", async () => {
  for (const path of ["/rest/v1", "/rest/v1/", "/auth/v1", "/storage/v1"]) {
    let called = false;
    const result = await checkConnection(config.replace(".co\n", `.co${path}\n`), () => {
      called = true;
      throw new Error(key);
    });
    assert.equal(result.code, "PROJECT_URL_NOT_ROOT");
    assert.equal(called, false);
    assert.ok(!resultMessage(result).includes(key));
    assert.ok(resultMessage(result).includes("URL raíz"));
  }
});
