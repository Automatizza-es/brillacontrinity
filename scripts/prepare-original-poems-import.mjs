import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { poems } from "../src/content/poems.ts";
import { publications } from "../src/content/publications.ts";

export const SLUGS = [
  "atrevete-a-brillar",
  "quise-ser",
  "circulo-de-mujeres",
  "yo-soy-agua",
  "me-pierdo",
  "desaprendiendo",
];
const sha = (value) => createHash("sha256").update(value).digest("hex");
export function buildPayload() {
  if (JSON.stringify(poems.map((p) => p.slug)) !== JSON.stringify(SLUGS))
    throw new Error("Review source poem set/order");
  const publication = publications.find((p) => p.slug === "cuentos-y-poesia");
  if (!publication || JSON.stringify(publication.poemSlugs) !== JSON.stringify(SLUGS.slice(2)))
    throw new Error("Review publication links");
  const rows = poems.map((p, index) => {
    if (typeof p.text !== "string" || !p.text.length || p.provisionalTitle)
      throw new Error("Incomplete source");
    const expectedPublication = index >= 2 ? publication.slug : undefined;
    if (p.publication !== expectedPublication) throw new Error("Publication mismatch");
    if (p.writtenOn !== undefined && !(index === 0 && p.writtenOn === "7 de mayo de 2023"))
      throw new Error("Review date mapping");
    return {
      slug: p.slug,
      title: p.title,
      body: p.text,
      description: p.description ?? null,
      written_on: p.writtenOn ? "2023-05-07" : null,
      written_on_original: p.writtenOn ?? null,
      status: "published",
      published_at: null,
      sort_order: index,
      publication_slug: p.publication ?? null,
    };
  });
  return {
    publication: {
      slug: publication.slug,
      title: publication.title,
      publisher: publication.publisher,
      place: publication.place ?? null,
      year: publication.year,
      kind: publication.kind,
      role: publication.role ?? null,
      synopsis: publication.synopsis ?? null,
      cover_url: publication.coverUrl ?? null,
      isbn: publication.isbn ?? null,
      purchase_links: publication.purchaseLinks ?? [],
    },
    poems: rows,
  };
}
const actualPoem = `jsonb_build_object('slug',p.slug,'title',p.title,'body',p.body,'description',p.description,'written_on',p.written_on,'written_on_original',p.written_on_original,'status',p.status,'published_at',p.published_at,'sort_order',p.sort_order,'publication_slug',pub.slug)`;
const actualPublication = `to_jsonb(pub) - 'id' - 'created_at' - 'updated_at'`;
export function artifacts() {
  const payload = buildPayload();
  const json = JSON.stringify(payload, null, 2);
  if (json.includes("$trinity_source$") || json.includes("$trinity_import$"))
    throw new Error("Delimiter conflict");
  const literal = `$trinity_source$${json}$trinity_source$::jsonb`;
  const preflight = `-- Generated from typed public content; no credentials. Do not edit manually.\n-- Run exclusively in project brilla-con-trinity (gwckhuwespupovgweahj).\nbegin read only;\nwith source as (select ${literal} as payload),\nexpected as (select value from source, jsonb_array_elements(payload->'poems')),\ncomparison as (select e.value->>'slug' as slug,\n case when p.id is null then 'absent' when ${actualPoem}=e.value then 'matching' else 'conflict' end as result,\n case when p.id is null then null else p.body = e.value->>'body' end as body_equal,\n case when p.id is null then null else (select coalesce(jsonb_agg(key order by key),'[]'::jsonb) from jsonb_object_keys(e.value) k(key) where ${actualPoem}->key is distinct from e.value->key) end as differing_fields\n from expected e left join public.poems p on p.slug=e.value->>'slug' left join public.publications pub on pub.id=p.publication_id)\nselect jsonb_build_object(\n 'project_reference_expected','gwckhuwespupovgweahj',\n 'source_sha256','${sha(json)}',\n 'reader',current_user,\n 'reader_sees_all_rows',(select rolsuper or rolbypassrls from pg_roles where rolname=current_user),\n 'poems',(select jsonb_agg(to_jsonb(comparison) order by array_position(array['${SLUGS.join("','")}']::text[],slug)) from comparison),\n 'publication',(select case when pub.id is null then 'absent' when ${actualPublication}=source.payload->'publication' then 'matching' else 'conflict' end from source left join public.publications pub on pub.slug=source.payload->'publication'->>'slug'),\n 'unrelated_poems',(select count(*) from public.poems where not(slug=any(array['${SLUGS.join("','")}']))),\n 'unrelated_drafts',(select count(*) from public.poems where status='draft' and not(slug=any(array['${SLUGS.join("','")}'])))\n) as import_preflight;\ncommit;\n`;
  const sql = `-- PREPARED ONLY: requires explicit authorization before remote execution.\n-- Project: brilla-con-trinity / gwckhuwespupovgweahj.\n-- Source SHA-256: ${sha(json)}\n-- INSERT only. Exact matches are skipped; differences abort the whole transaction.\nbegin;\nset local lock_timeout='5s';\nset local statement_timeout='30s';\nlock table public.publications, public.poems in share row exclusive mode;\ndo $trinity_import$\ndeclare\n source jsonb := ${literal};\n expected jsonb; actual jsonb; publication_id uuid;\n before_unrelated jsonb; after_unrelated jsonb;\n inserted_poems integer := 0;\nbegin\n if current_user <> 'postgres' then raise exception 'Use the explicitly authorized project owner procedure'; end if;\n select coalesce(jsonb_agg(to_jsonb(p) order by p.id),'[]'::jsonb) into before_unrelated from public.poems p where not(p.slug=any(array['${SLUGS.join("','")}']));\n select ${actualPublication},pub.id into actual,publication_id from public.publications pub where pub.slug=source->'publication'->>'slug';\n if found and actual is distinct from source->'publication' then raise exception 'Publication conflict: manual review required'; end if;\n -- Check every original before inserting anything. Never overwrite editorial changes.\n for expected in select value from jsonb_array_elements(source->'poems') loop\n   select ${actualPoem} into actual from public.poems p left join public.publications pub on pub.id=p.publication_id where p.slug=expected->>'slug';\n   if found and actual is distinct from expected then raise exception 'Poem slug conflict: %; nothing will be overwritten',expected->>'slug'; end if;\n end loop;\n insert into public.publications(slug,title,publisher,place,year,kind,role,synopsis,cover_url,isbn,purchase_links)\n select slug,title,publisher,place,year,kind,role,synopsis,cover_url,isbn,purchase_links from jsonb_to_record(source->'publication') as x(slug text,title text,publisher text,place text,year integer,kind text,role text,synopsis text,cover_url text,isbn text,purchase_links jsonb)\n on conflict(slug) do nothing;\n select id into strict publication_id from public.publications where slug=source->'publication'->>'slug';\n insert into public.poems(slug,title,body,description,written_on,written_on_original,status,published_at,sort_order,publication_id)\n select slug,title,body,description,written_on,written_on_original,status,published_at,sort_order,case when publication_slug is null then null else publication_id end\n from jsonb_to_recordset(source->'poems') as x(slug text,title text,body text,description text,written_on date,written_on_original text,status text,published_at timestamptz,sort_order integer,publication_slug text)\n on conflict(slug) do nothing;\n get diagnostics inserted_poems = row_count;\n for expected in select value from jsonb_array_elements(source->'poems') loop\n   select ${actualPoem} into actual from public.poems p left join public.publications pub on pub.id=p.publication_id where p.slug=expected->>'slug';\n   if not found or actual is distinct from expected then raise exception 'Post-import comparison failed'; end if;\n end loop;\n select coalesce(jsonb_agg(to_jsonb(p) order by p.id),'[]'::jsonb) into after_unrelated from public.poems p where not(p.slug=any(array['${SLUGS.join("','")}']));\n if before_unrelated is distinct from after_unrelated then raise exception 'Unrelated poems changed: rollback required'; end if;\n raise notice 'Originals checked: 6. Newly inserted: %. Unrelated poems unchanged.',inserted_poems;\nend;\n$trinity_import$;\ncommit;\n`;
  const manifest = {
    sourceSha256: sha(json),
    publication: payload.publication,
    poems: payload.poems.map((p) => ({
      slug: p.slug,
      url: `/poesia/${p.slug}`,
      title: p.title,
      bodySha256: sha(p.body),
      bodyUtf8Bytes: Buffer.byteLength(p.body),
      lineCount: p.body.split("\n").length,
      written_on: p.written_on,
      written_on_original: p.written_on_original,
      sort_order: p.sort_order,
      publication_slug: p.publication_slug,
      status: p.status,
      published_at: p.published_at,
    })),
  };
  return { sql, preflight, manifest: JSON.stringify(manifest, null, 2) + "\n", payload };
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const outputs = artifacts();
  const root = new URL("../", import.meta.url);
  for (const [key, path] of [
    ["sql", "supabase/imports/original-six-poems.sql"],
    ["preflight", "supabase/checks/original-poems-preflight.sql"],
    ["manifest", "supabase/imports/original-six-poems.manifest.json"],
  ]) {
    if (process.argv.includes("--check")) {
      if ((await readFile(new URL(path, root), "utf8")) !== outputs[key])
        throw new Error("Generated artifact differs: " + path);
    } else await writeFile(new URL(path, root), outputs[key]);
  }
  console.log(
    "Offline validation: six original poems, four publication links, one known writing date. No network requests or remote writes.",
  );
}
