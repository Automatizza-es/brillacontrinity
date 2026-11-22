import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { poems } from "../src/content/poems.ts";
import { publications } from "../src/content/publications.ts";
import { artifacts, buildPayload, SLUGS } from "./prepare-original-poems-import.mjs";
const generated = artifacts();
test("all six original strings survive source -> payload -> generated SQL exactly", () => {
  const embedded = generated.sql.split("$trinity_source$")[1];
  const roundtrip = JSON.parse(embedded);
  assert.deepEqual(roundtrip, buildPayload());
  for (let i = 0; i < poems.length; i++) {
    const original = poems[i],
      row = roundtrip.poems[i];
    assert.equal(row.title, original.title);
    assert.equal(row.body, original.text);
    assert.deepEqual(Buffer.from(row.body), Buffer.from(original.text));
    assert.equal(row.slug, original.slug);
    assert.equal(row.sort_order, i);
  }
});
test("preserves four reciprocal anthology links and exact editorial metadata", () => {
  const p = buildPayload();
  assert.deepEqual(
    p.poems.filter((v) => v.publication_slug).map((v) => v.slug),
    publications[0].poemSlugs,
  );
  assert.equal(p.publication.title, publications[0].title);
  assert.equal(p.publication.publisher, publications[0].publisher);
  assert.equal(p.publication.cover_url, publications[0].coverUrl);
  assert.equal(p.publication.isbn, null);
  assert.equal(p.publication.synopsis, null);
  assert.deepEqual(p.publication.purchase_links, []);
});
test("maps only the known writing date, never a guessed publication date", () => {
  const rows = buildPayload().poems;
  assert.equal(rows[0].written_on, "2023-05-07");
  assert.equal(rows[0].written_on_original, poems[0].writtenOn);
  assert.ok(rows.slice(1).every((p) => p.written_on === null && p.written_on_original === null));
  assert.ok(rows.every((p) => p.published_at === null));
});
test("manifest matches exact UTF-8 content and current public URLs", () => {
  const manifest = JSON.parse(generated.manifest);
  for (let i = 0; i < poems.length; i++) {
    assert.equal(
      manifest.poems[i].bodySha256,
      createHash("sha256").update(poems[i].text).digest("hex"),
    );
    assert.equal(manifest.poems[i].url, `/poesia/${SLUGS[i]}`);
  }
});
test("remote-check SQL is read-only and reports no unrelated poem text", () => {
  assert.match(generated.preflight, /begin read only;/);
  assert.doesNotMatch(
    generated.preflight,
    /\b(insert into|update public|delete from|truncate|create table)\b/i,
  );
  assert.match(generated.preflight, /'reader_sees_all_rows'/);
  assert.match(generated.preflight, /'unrelated_drafts'/);
});
test("import has no data UPDATE/DELETE, skips exact matches, locks concurrent writes and checks unrelated records", () => {
  assert.doesNotMatch(generated.sql, /\b(update|delete|truncate|drop)\b/i);
  assert.equal((generated.sql.match(/on conflict\(slug\) do nothing/g) || []).length, 2);
  assert.match(generated.sql, /share row exclusive mode/);
  assert.match(generated.sql, /before_unrelated is distinct from after_unrelated/);
  assert.match(generated.sql, /actual is distinct from expected/);
});
test("prepared files match the current source exactly", async () => {
  for (const [key, path] of [
    ["sql", "supabase/imports/original-six-poems.sql"],
    ["preflight", "supabase/checks/original-poems-preflight.sql"],
    ["manifest", "supabase/imports/original-six-poems.manifest.json"],
  ])
    assert.equal(await readFile(path, "utf8"), generated[key]);
});
