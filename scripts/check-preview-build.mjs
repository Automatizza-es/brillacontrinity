// Offline validation of the generated Vercel Build Output. Never deploys.
import { readFile, readdir } from "node:fs/promises";
import assert from "node:assert/strict";
const base = new URL("../.vercel/output/", import.meta.url);
const config = JSON.parse(await readFile(new URL("config.json", base), "utf8"));
assert.equal(config.version, 3);
assert.ok(
  config.routes.some((r) => r.src === "/(.*)" && r.dest === "/__server"),
  "SSR catch-all required",
);
const fn = JSON.parse(
  await readFile(new URL("functions/__server.func/.vc-config.json", base), "utf8"),
);
assert.equal(fn.runtime, "nodejs24.x");
assert.equal(fn.handler, "index.mjs");
let files = 0;
async function inspect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = new URL(entry.name + (entry.isDirectory() ? "/" : ""), dir);
    if (entry.isDirectory()) await inspect(path);
    else if (/\.(?:mjs|js|json|html|css|map|txt)$/.test(entry.name)) {
      const text = await readFile(path, "utf8");
      assert.ok(
        !/sb_secret_[A-Za-z0-9_-]{32,}/.test(text),
        "Unexpected secret-key pattern in build; values withheld",
      );
      assert.ok(
        !/sbp_[A-Za-z0-9_-]{32,}/.test(text),
        "Unexpected access-token pattern in build; values withheld",
      );
      assert.ok(
        !/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----[\s\S]{40,}/.test(text),
        "Unexpected private-key material; values withheld",
      );
      files++;
    }
  }
}
await inspect(base);
const root = await readdir(new URL("static/", base));
assert.ok(!root.includes(".env.local"));
console.log(
  JSON.stringify({
    buildOutputVersion: 3,
    runtime: fn.runtime,
    ssrCatchAll: true,
    filesChecked: files,
    noSecretPatterns: true,
    remoteActions: 0,
  }),
);
