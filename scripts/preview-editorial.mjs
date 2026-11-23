import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { poems } from "../src/content/poems.ts";
import { publications } from "../src/content/publications.ts";
const key = "sb_publishable_synthetic_http_tests_only";
const source = publications[0];
const proposal = JSON.parse(
  await readFile(new URL("../supabase/updates/voces-entretejidas.json", import.meta.url), "utf8"),
);
const book = {
  id: "book-1",
  slug: source.slug,
  title: source.title,
  publisher: source.publisher,
  place: source.place,
  year: source.year,
  kind: source.kind,
  role: source.role,
  synopsis: null,
  cover_url: source.coverUrl,
  isbn: null,
  purchase_links: [],
  ...proposal,
};
const rows = poems.map((p, i) => ({
  id: `poem-${i}`,
  slug: p.slug,
  title: p.title,
  body: p.text,
  description: null,
  written_on: i === 0 ? "2023-05-07" : null,
  written_on_original: p.writtenOn ?? null,
  publication_id: p.publication ? "book-1" : null,
  sort_order: i,
  status: "published",
}));
const api = createServer((req, res) => {
  assert.equal(req.method, "GET");
  assert.ok(req.headers.apikey === key, "Only synthetic test keys permitted");
  assert.ok(req.headers.cookie === undefined, "No user cookies may reach the public API");
  assert.ok(req.headers.authorization === `Bearer ${key}`, "Public API must stay anonymous");
  res.setHeader("Content-Type", "application/json");
  const u = new URL(req.url, "http://localhost");
  let values;
  if (u.pathname === "/rest/v1/poems") {
    assert.equal(u.searchParams.get("status"), "eq.published");
    values = rows
      .filter(
        (p) =>
          p.status === "published" &&
          (!u.searchParams.has("slug") || "eq." + p.slug === u.searchParams.get("slug")),
      )
      .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
  } else if (u.pathname === "/rest/v1/publications")
    values = [book].filter(
      (b) => !u.searchParams.has("id") || "eq." + b.id === u.searchParams.get("id"),
    );
  else {
    res.writeHead(404);
    res.end("{}");
    return;
  }
  values = values.slice(
    Number(u.searchParams.get("offset") ?? 0),
    Number(u.searchParams.get("offset") ?? 0) + Number(u.searchParams.get("limit") ?? 1000),
  );
  if (req.headers.accept?.includes("vnd.pgrst.object")) {
    if (values.length !== 1) {
      res.writeHead(406);
      res.end(JSON.stringify({ code: "PGRST116" }));
      return;
    }
    res.end(JSON.stringify(values[0]));
  } else res.end(JSON.stringify(values));
});

// This preview never connects to Supabase. All data below is held in memory.
api.listen(4177, "127.0.0.1");
await once(api, "listening");
const child = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "dev", "--host", "127.0.0.1", "--port", "8081", "--strictPort"],
  {
    env: {
      ...process.env,
      VITE_SUPABASE_URL: "http://127.0.0.1:4177",
      VITE_SUPABASE_PUBLISHABLE_KEY: key,
    },
    stdio: "inherit",
  },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    child.kill(signal);
    api.close();
  });
child.on("exit", (code) => {
  api.close();
  process.exit(code ?? 0);
});
console.log(
  "Editorial preview: http://127.0.0.1:8081/publicaciones — isolated in-memory data, no remote writes.",
);
