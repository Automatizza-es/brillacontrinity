-- PREPARED ONLY: execute personally only after approval, before frontend deployment.
-- Keep the existing cover URL valid until the new frontend serves optimized derivatives.
-- Destination: brilla-con-trinity / gwckhuwespupovgweahj / Frankfurt.
-- Optimistic comparison with the read-only snapshot; no inserts and no poem updates.
begin;
set local lock_timeout = '5s';
do $update_publication$
declare target public.publications%rowtype; proposal jsonb := $proposal${"slug":"cuentos-y-poesia","title":"Antología de Cuento y Poesía: Voces entretejidas","publisher":"Rubin Editorial","year":2026,"kind":"Antología colectiva","role":"Trinidad López (Trinity) participa como autora con cuatro poemas en esta obra colectiva.","synopsis":"Una obra colectiva que reúne 251 cuentos y poemas de diferentes autores, estilos y sensibilidades. A través de la narrativa y la poesía, sus páginas entrelazan experiencias, emociones y distintas maneras de interpretar la vida.\n\nPublicada el 12 de noviembre de 2026.","cover_url":"/images/voces-entretejidas-960.webp","purchase_links":[{"label":"Comprar libro físico","url":"https://www.popularlibros.com/libro/antologia-de-cuento-y-poesia-voces-entretejidas_I0100239125"},{"label":"Comprar ebook","url":"https://www.casadellibro.com/ebook-antologia-de-cuento-y-poesia-voces-entretejidas-ebook/9798237343687/19116289"}]}$proposal$::jsonb;
begin
  select * into strict target from public.publications where slug = 'cuentos-y-poesia' for update;
  if (to_jsonb(target) - 'id' - 'created_at') is distinct from $expected${"slug":"cuentos-y-poesia","title":"Cuentos y poesía","publisher":"Editorial Rubin","place":"San Luis, Argentina","year":2026,"kind":"Antología colectiva","role":"Autora participante: Trinidad López (Trinity)","synopsis":null,"cover_url":"/images/portada-cuentos-y-poesia.jpeg","isbn":null,"purchase_links":[],"updated_at":"2026-11-22T17:09:43.439841+00:00"}$expected$::jsonb then
    raise exception 'Publication changed since review; cancel and review again';
  end if;
  if (select count(*) from public.poems where publication_id = target.id) <> 4
     or (select count(*) from public.poems where publication_id = target.id and slug in ('circulo-de-mujeres','yo-soy-agua','me-pierdo','desaprendiendo')) <> 4 then
    raise exception 'Anthology links differ; cancel and review again';
  end if;
  update public.publications set
    title = proposal->>'title', publisher = proposal->>'publisher', year = (proposal->>'year')::integer,
    kind = proposal->>'kind', role = proposal->>'role', synopsis = proposal->>'synopsis',
    cover_url = target.cover_url, purchase_links = proposal->'purchase_links', updated_at = now()
  where id = target.id;
end $update_publication$;
-- Inspect these public fields before confirming success; UUIDs are omitted.
select slug,title,publisher,year,role,synopsis,cover_url,purchase_links from public.publications where slug='cuentos-y-poesia';
commit;
