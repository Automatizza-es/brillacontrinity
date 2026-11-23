-- READ ONLY: run after the single authorized UPDATE. No UUIDs or poem bodies returned.
begin read only;
with target as (
 select * from public.publications where slug='cuentos-y-poesia'
), ordered as (
 select slug, row_number() over(order by first_published_at asc nulls first,sort_order,id) as position
 from public.poems where status='published'
)
select jsonb_build_object(
 'publication_records',(select count(*) from target),
 'editorial_fields_correct',(select (to_jsonb(t) - 'id' - 'slug' - 'place' - 'isbn' - 'cover_url' - 'created_at' - 'updated_at') = $expected${"title": "Antología de Cuento y Poesía: Voces entretejidas", "publisher": "Rubin Editorial", "year": 2026, "kind": "Antología colectiva", "role": "Trinidad López (Trinity) participa como autora con cuatro poemas en esta obra colectiva.", "synopsis": "Una obra colectiva que reúne 251 cuentos y poemas de diferentes autores, estilos y sensibilidades. A través de la narrativa y la poesía, sus páginas entrelazan experiencias, emociones y distintas maneras de interpretar la vida.\n\nPublicada el 12 de noviembre de 2026.", "purchase_links": [{"label": "Comprar libro físico", "url": "https://www.popularlibros.com/libro/antologia-de-cuento-y-poesia-voces-entretejidas_I0100239125"}, {"label": "Comprar ebook", "url": "https://www.casadellibro.com/ebook-antologia-de-cuento-y-poesia-voces-entretejidas-ebook/9798237343687/19116289"}]}$expected$::jsonb from target t),
 'compatible_cover_preserved',(select cover_url='/images/portada-cuentos-y-poesia.jpeg' from target),
 'linked_poems',(select count(*) from public.poems p join target t on p.publication_id=t.id),
 'linked_originals',(select count(*) from public.poems p join target t on p.publication_id=t.id where p.slug in ('circulo-de-mujeres','yo-soy-agua','me-pierdo','desaprendiendo')),
 'original_poems',(select count(*) from public.poems where slug in ('atrevete-a-brillar','quise-ser','circulo-de-mujeres','yo-soy-agua','me-pierdo','desaprendiendo')),
 'published_order',(select jsonb_agg(slug order by position) from ordered),
 'new_poem_position',(select position from ordered where slug='no-se-de-donde-procede-mi-alma')
) as anthology_update_postcheck;
commit;
