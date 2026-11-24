-- CORRECTIVE UPDATE ONLY — PREPARED FOR REVIEW; NOT EXECUTED.
-- Intended project: brilla-con-trinity / gwckhuwespupovgweahj / Frankfurt.
-- Check that project in the Dashboard before running the COMPLETE file as postgres.
-- No INSERT, DELETE, migration, poem update or import. Do not repeat after errors.
begin;
set local lock_timeout = '5s';

do $correct_editorial_fields$
declare
  v_before public.publications%rowtype;
  v_after public.publications%rowtype;
  v_affected integer;
  v_expected_before constant jsonb := $before${
  "slug": "cuentos-y-poesia",
  "title": "Cuentos y poesía",
  "publisher": "Editorial Rubin",
  "place": "San Luis, Argentina",
  "year": 2026,
  "kind": "Antología colectiva",
  "role": "Autora participante: Trinidad López (Trinity)",
  "synopsis": null,
  "cover_url": "/images/portada-cuentos-y-poesia.jpeg",
  "isbn": null,
  "purchase_links": [],
  "updated_at": "2026-11-22T17:09:43.439841+00:00"
}$before$::jsonb;
  v_desired constant jsonb := $desired${
  "title": "Antología de Cuento y Poesía: Voces entretejidas",
  "publisher": "Rubin Editorial",
  "role": "Trinidad López (Trinity) participa como autora con cuatro poemas en esta obra colectiva.",
  "synopsis": "Una obra colectiva que reúne 251 cuentos y poemas de diferentes autores, estilos y sensibilidades. A través de la narrativa y la poesía, sus páginas entrelazan experiencias, emociones y distintas maneras de interpretar la vida.\n\nPublicada el 12 de noviembre de 2026.",
  "purchase_links": [
    {
      "label": "Comprar libro físico",
      "url": "https://www.popularlibros.com/libro/antologia-de-cuento-y-poesia-voces-entretejidas_I0100239125"
    },
    {
      "label": "Comprar ebook",
      "url": "https://www.casadellibro.com/ebook-antologia-de-cuento-y-poesia-voces-entretejidas-ebook/9798237343687/19116289"
    }
  ]
}$desired$::jsonb;
  v_links_before jsonb;
  v_links_after jsonb;
begin
  -- STRICT rejects both a missing publication and duplicate matches.
  select p.* into strict v_before
  from public.publications as p
  where p.slug = 'cuentos-y-poesia'
  for update;

  -- Guard ALL previously reviewed fields, including the last-update timestamp.
  if (to_jsonb(v_before) - 'id' - 'created_at') is distinct from v_expected_before then
    raise exception 'Current publication differs from the reviewed snapshot. Nothing changed; stop and review.';
  end if;

  -- Check and remember the exact four existing relations without changing poems.
  select jsonb_agg(p.slug order by p.slug) into v_links_before
  from public.poems as p where p.publication_id = v_before.id;
  if v_links_before is distinct from
    '["circulo-de-mujeres","desaprendiendo","me-pierdo","yo-soy-agua"]'::jsonb then
    raise exception 'The four anthology relations differ. Nothing changed; stop and review.';
  end if;

  update public.publications as p set
    title = v_desired->>'title',
    publisher = v_desired->>'publisher',
    role = v_desired->>'role',
    synopsis = v_desired->>'synopsis',
    purchase_links = v_desired->'purchase_links',
    updated_at = now()
  where p.id = v_before.id
  returning p.* into v_after;
  get diagnostics v_affected = row_count;
  if v_affected <> 1 then
    raise exception 'Expected exactly one updated publication. Transaction cancelled.';
  end if;

  -- Check exact written values BEFORE the transaction may commit.
  if jsonb_build_object(
      'title',v_after.title,'publisher',v_after.publisher,'role',v_after.role,
      'synopsis',v_after.synopsis,'purchase_links',v_after.purchase_links
    ) is distinct from v_desired then
    raise exception 'Editorial values do not match. Transaction cancelled.';
  end if;
  if (to_jsonb(v_after) - array['title','publisher','role','synopsis','purchase_links','updated_at'])
     is distinct from
     (to_jsonb(v_before) - array['title','publisher','role','synopsis','purchase_links','updated_at']) then
    raise exception 'An unrelated publication field changed. Transaction cancelled.';
  end if;
  select jsonb_agg(p.slug order by p.slug) into v_links_after
  from public.poems as p where p.publication_id = v_before.id;
  if v_links_after is distinct from v_links_before then
    raise exception 'Anthology relations changed. Transaction cancelled.';
  end if;
  raise notice 'Exactly one publication updated; editorial values verified; other fields and four relations preserved.';
end
$correct_editorial_fields$;

commit;
