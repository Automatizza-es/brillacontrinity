import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { setTimeout } from "node:timers/promises";
import assert from "node:assert/strict";
import { artifacts, buildPayload } from "./prepare-original-poems-import.mjs";
const name = `trinity-import-test-${process.pid}`;
function docker(args, input, mayFail = false) {
  const r = spawnSync("docker", args, { input, encoding: "utf8" });
  if (r.status !== 0 && !mayFail)
    throw new Error("Local Docker/PostgreSQL check failed: " + r.stderr);
  return r;
}
function query(sql, mayFail = false) {
  return docker(
    [
      "exec",
      "-i",
      name,
      "psql",
      "-X",
      "-h",
      "127.0.0.1",
      "-U",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-q",
      "-tA",
    ],
    sql,
    mayFail,
  );
}
const json = (sql) => JSON.parse(query(sql).stdout);
const snapshot = () =>
  json(
    "select jsonb_build_object('poems',(select coalesce(jsonb_agg(to_jsonb(p) order by p.id),'[]'::jsonb) from public.poems p),'publications',(select coalesce(jsonb_agg(to_jsonb(p) order by p.id),'[]'::jsonb) from public.publications p))",
  );
const sqlLiteral = (s) => "'" + s.replaceAll("'", "''") + "'";
const { sql, preflight } = artifacts();
const payload = buildPayload();
const unrelated = () =>
  json("select to_jsonb(p) from public.poems p where slug='borrador-local-de-prueba'");
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
  for (let i = 0; i < 60; i++) {
    if (query("select 1", true).status === 0) {
      ready = true;
      break;
    }
    await setTimeout(500);
  }
  assert.ok(ready);
  query(await readFile("supabase/tests/local-bootstrap.sql", "utf8"));
  query(await readFile("supabase/migrations/20261121175059_poetry_foundation.sql", "utf8"));
  query(
    "insert into public.poems(slug,title,body) values('borrador-local-de-prueba','Prueba local',E'  Texto local\\n\\nOtra estrofa\\n');",
  );
  const draft = unrelated();
  const before = json(preflight);
  assert.equal(before.unrelated_drafts, 1);
  assert.ok(before.poems.every((p) => p.result === "absent"));
  query(sql);
  assert.deepEqual(unrelated(), draft);
  const after = json(preflight);
  assert.ok(after.reader_sees_all_rows);
  assert.ok(after.poems.every((p) => p.result === "matching" && p.body_equal));
  assert.equal(after.publication, "matching");
  assert.equal(after.unrelated_drafts, 1);
  const rows = json(
    "select jsonb_agg(to_jsonb(p)||jsonb_build_object('publication_slug',pub.slug) order by p.sort_order) from public.poems p left join public.publications pub on pub.id=p.publication_id where p.slug<>'borrador-local-de-prueba'",
  );
  assert.equal(rows.length, 6);
  for (let i = 0; i < rows.length; i++) {
    for (const [key, value] of Object.entries(payload.poems[i]))
      assert.deepEqual(rows[i][key], value);
    assert.ok(rows[i].first_published_at);
  }
  const postcheck = json(await readFile("supabase/checks/original-poems-postimport.sql", "utf8"));
  assert.equal(postcheck.total_poems, 7);
  assert.equal(postcheck.original_poems, 6);
  assert.equal(postcheck.published_originals, 6);
  assert.equal(postcheck.publication_records, 1);
  assert.equal(postcheck.linked_originals, 4);
  assert.equal(postcheck.order_correct, true);
  assert.equal(postcheck.unrelated_drafts, 1);
  const once = snapshot();
  query(sql);
  assert.deepEqual(snapshot(), once);
  console.log(
    "PASS exact strings, dates, order, anthology links, first import, repeated import and unchanged unrelated draft.",
  );
  query("delete from public.poems where slug in ('me-pierdo','desaprendiendo')");
  const existing = json(
    "select jsonb_agg(to_jsonb(p) order by p.id) from public.poems p where slug not in ('me-pierdo','desaprendiendo')",
  );
  query(sql);
  assert.deepEqual(
    json(
      "select jsonb_agg(to_jsonb(p) order by p.id) from public.poems p where slug not in ('me-pierdo','desaprendiendo')",
    ),
    existing,
  );
  assert.equal(json(preflight).poems.filter((p) => p.result === "matching").length, 6);
  console.log("PASS partial imports add only missing originals.");
  query("update public.poems set body=body||E'\\nCambio editorial local' where slug='quise-ser'");
  const edited = snapshot();
  assert.equal(json(preflight).poems.find((p) => p.slug === "quise-ser").result, "conflict");
  assert.notEqual(query(sql, true).status, 0);
  assert.deepEqual(snapshot(), edited);
  console.log("PASS editorial edits cause a complete abort without overwriting.");
  query(`update public.poems set body=${sqlLiteral(payload.poems[1].body)} where slug='quise-ser'`);
  query(
    "update public.publications set publisher='Conflicto editorial local' where slug='cuentos-y-poesia'",
  );
  const publicationConflict = snapshot();
  assert.notEqual(query(sql, true).status, 0);
  assert.deepEqual(snapshot(), publicationConflict);
  console.log("PASS publication conflicts abort without data changes.");
  query("truncate public.poems,public.publications");
  query(
    "insert into public.poems(slug,title,body,status) values('atrevete-a-brillar','Borrador local protegido','Texto local','draft')",
  );
  const slugConflict = snapshot();
  assert.notEqual(query(sql, true).status, 0);
  assert.deepEqual(snapshot(), slugConflict);
  assert.equal(snapshot().publications.length, 0);
  console.log(
    "PASS a conflicting draft is preserved and nothing is partially inserted. No remote database contacted.",
  );
} finally {
  docker(["rm", "--force", name], undefined, true);
}
