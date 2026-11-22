import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout } from "node:timers/promises";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { poems } from "../src/content/poems.ts";
import { publications } from "../src/content/publications.ts";
const key = "sb_publishable_synthetic_http_tests_only";
const source = publications[0];
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
rows.push({
  ...rows[0],
  id: "local-private",
  slug: "borrador-simulado",
  title: "Prueba de publicación local",
  body: "Texto temporal\n\nSegunda estrofa\n",
  publication_id: "book-1",
  sort_order: 6,
  status: "draft",
});
let failure = false,
  books = [book],
  apiRequests = 0;
const api = createServer((req, res) => {
  apiRequests++;
  assert.equal(req.method, "GET");
  assert.ok(req.headers.apikey === key, "Only synthetic test keys permitted");
  assert.ok(req.headers.cookie === undefined, "No user cookies may reach the public API");
  assert.ok(req.headers.authorization === `Bearer ${key}`, "Public API must stay anonymous");
  res.setHeader("Content-Type", "application/json");
  if (failure) {
    res.writeHead(503);
    res.end(JSON.stringify({ message: "synthetic provider failure" }));
    return;
  }
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
    values = books.filter(
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
let child;
try {
  api.listen(0, "127.0.0.1");
  await once(api, "listening");
  const apiPort = api.address().port;
  const portProbe = createServer();
  portProbe.listen(0, "127.0.0.1");
  await once(portProbe, "listening");
  const port = portProbe.address().port;
  await new Promise((resolve) => portProbe.close(resolve));
  const env = {
    ...process.env,
    VITE_SUPABASE_URL: `http://127.0.0.1:${apiPort}`,
    VITE_SUPABASE_PUBLISHABLE_KEY: key,
  };
  delete env.SUPABASE_ACCESS_TOKEN;
  child = spawn(
    process.execPath,
    [
      "node_modules/vite/bin/vite.js",
      "dev",
      "--host",
      "127.0.0.1",
      "--port",
      String(port),
      "--strictPort",
    ],
    { env, stdio: ["ignore", "pipe", "pipe"] },
  );
  // Drain development logs without recording request details or environment values.
  child.stdout.on("data", () => {});
  child.stderr.on("data", () => {});
  const origin = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let n = 0; n < 120; n++) {
    if (child.exitCode !== null) throw Error("Isolated preview exited");
    try {
      const r = await fetch(origin + "/poesia");
      if (r.status === 200) {
        ready = true;
        break;
      }
    } catch {}
    await setTimeout(500);
  }
  assert.ok(ready);
  assert.ok(apiRequests > 0, "Must use the isolated mock API");
  async function page(path, status = 200, headers = {}) {
    const r = await fetch(origin + path, { headers });
    const html = await r.text();
    assert.equal(r.status, status, `HTTP status for ${path}`);
    assert.equal(r.headers.get("Cache-Control"), "private, no-store");
    return new JSDOM(html).window.document;
  }
  const library = await page("/poesia");
  assert.deepEqual(
    [...library.querySelectorAll("main ol a")].map((a) => a.getAttribute("href")),
    poems.map((p) => "/poesia/" + p.slug),
  );
  const publication = await page("/publicaciones");
  assert.deepEqual(
    [...publication.querySelectorAll('main a[href^="/poesia/"]')].map((a) =>
      a.getAttribute("href"),
    ),
    source.poemSlugs.map((s) => "/poesia/" + s),
  );
  for (const p of poems) {
    const doc = await page("/poesia/" + p.slug);
    assert.equal(doc.querySelector("p.poem").textContent, p.text);
    assert.equal(doc.querySelector("h1").textContent, p.title);
    assert.ok(doc.title.includes(p.title));
    assert.ok(doc.querySelector('meta[property="og:title"]').content.includes(p.title));
  }
  await page("/poesia/borrador-simulado", 404);
  await page("/poesia/slug-inexistente", 404);
  await page("/poesia/INVALIDO", 404);
  console.log(
    "PASS SSR HTML, all six source texts, public links, dates/SEO, private draft and unknown-slug 404.",
  );
  rows.at(-1).status = "published";
  let doc = await page("/poesia/borrador-simulado");
  assert.equal(doc.querySelector("p.poem").textContent, rows.at(-1).body);
  assert.equal((await page("/poesia")).querySelectorAll("main ol a").length, 7);
  rows.at(-1).status = "draft";
  await page("/poesia/borrador-simulado", 404, {
    Cookie: "sb-synthetic-auth-token=invalid-test-value",
  });
  assert.equal((await page("/poesia")).querySelectorAll("main ol a").length, 6);
  rows.find((p) => p.slug === "yo-soy-agua").status = "draft";
  await page("/poesia/yo-soy-agua", 404);
  assert.equal(
    (await page("/publicaciones")).querySelectorAll('main a[href^="/poesia/"]').length,
    3,
  );
  assert.equal((await page("/")).querySelector("blockquote p.poem"), null);
  rows.find((p) => p.slug === "yo-soy-agua").status = "published";
  assert.equal(
    (await page("/")).querySelector("blockquote p.poem").textContent,
    "“Yo soy todo eso y mi error\nes querer no serlo”",
  );
  rows[0].body = "Texto editado local\n\nOtra estrofa\n";
  assert.equal(
    (await page("/poesia/" + rows[0].slug)).querySelector("p.poem").textContent,
    rows[0].body,
  );
  console.log(
    "PASS publish, withdraw, republish, new URL, anthology/home updates and fresh edited text without a rebuild.",
  );
  failure = true;
  for (const path of ["/poesia", "/publicaciones", "/poesia/atrevete-a-brillar", "/"]) {
    const response = await fetch(origin + path);
    assert.ok(
      response.status >= 500,
      `Outage must not be 200 or 404: ${path} (${response.status})`,
    );
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
    const html = await response.text();
    doc = new JSDOM(html).window.document;
    assert.equal(doc.querySelector("p.poem"), null);
    assert.ok(!doc.querySelector("main")?.textContent.includes("Ahora no hay"));
    assert.ok(!html.includes("synthetic provider failure"));
  }
  failure = false;
  rows.forEach((r) => (r.status = "draft"));
  books = [];
  assert.ok(
    (await page("/poesia"))
      .querySelector("main")
      .textContent.includes("Ahora no hay poemas publicados."),
  );
  await page("/poesia/atrevete-a-brillar", 404);
  console.log(
    "PASS outages return errors, never stale poems or false empty libraries; genuine empty state remains distinct.",
  );
  console.log("All HTTP tests used temporary local data. Supabase was not contacted or modified.");
} finally {
  if (child && child.exitCode === null) {
    child.kill("SIGTERM");
    await once(child, "exit");
  }
  await new Promise((resolve) => api.close(resolve));
}
