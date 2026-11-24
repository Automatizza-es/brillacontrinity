-- READ ONLY verification after the corrective update. No UUIDs or poem bodies.
begin read only;
with expected as (
  select $desired${
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
}$desired$::jsonb as fields
), target as (
  select p.* from public.publications p where p.slug='cuentos-y-poesia'
), checks as (
  select p.*, jsonb_build_object(
    'title',p.title,'publisher',p.publisher,'role',p.role,
    'synopsis',p.synopsis,'purchase_links',p.purchase_links
  ) as actual from target p
)
select jsonb_build_object(
  'publication_records',(select count(*) from target),
  'editorial_fields_correct',
    (select count(*)=1 and coalesce(bool_and(c.actual=e.fields),false) from checks c cross join expected e),
  'differing_fields',coalesce((
    select jsonb_agg(e.key order by e.key)
    from checks c cross join expected x cross join lateral jsonb_each(x.fields) e
    where (c.actual->e.key) is distinct from e.value
  ),'[]'::jsonb),
  'compatible_cover_preserved',(select cover_url='/images/portada-cuentos-y-poesia.jpeg' from target),
  'other_known_fields_preserved',(select year=2026 and kind='Antología colectiva'
    and place is not distinct from 'San Luis, Argentina' and isbn is null from target),
  'linked_poems',(select count(*) from public.poems p join target t on p.publication_id=t.id),
  'linked_originals',(select count(*) from public.poems p join target t on p.publication_id=t.id
    where p.slug in ('circulo-de-mujeres','yo-soy-agua','me-pierdo','desaprendiendo'))
) as anthology_corrective_postcheck;
commit;
