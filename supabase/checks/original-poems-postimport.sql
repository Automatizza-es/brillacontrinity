-- Supplementary inventory only; run AFTER the separately authorized import.
-- First rerun original-poems-preflight.sql for the exact source comparison.
-- Project: brilla-con-trinity / gwckhuwespupovgweahj (verify dashboard URL).
begin read only;
with targets(slug,expected_order) as (values
 ('atrevete-a-brillar',0),('quise-ser',1),('circulo-de-mujeres',2),
 ('yo-soy-agua',3),('me-pierdo',4),('desaprendiendo',5)
), originals as (
 select t.slug,t.expected_order,p.id,p.status,p.sort_order,pub.slug as publication_slug
 from targets t left join public.poems p on p.slug=t.slug
 left join public.publications pub on pub.id=p.publication_id
)
select jsonb_build_object(
 'reader_sees_all_rows',(select rolsuper or rolbypassrls from pg_roles where rolname=current_user),
 'total_poems',(select count(*) from public.poems),
 'original_poems',(select count(id) from originals),
 'published_originals',(select count(*) from originals where id is not null and status='published'),
 'publication_records',(select count(*) from public.publications where slug='cuentos-y-poesia'),
 'linked_originals',(select count(*) from originals where publication_slug='cuentos-y-poesia'),
 'order_correct',(select count(id)=6 and bool_and(sort_order=expected_order) from originals),
 'unrelated_poems',(select count(*) from public.poems p where not exists(select 1 from targets t where t.slug=p.slug)),
 'unrelated_drafts',(select count(*) from public.poems p where p.status='draft' and not exists(select 1 from targets t where t.slug=p.slug)),
 'originals',(select jsonb_agg(jsonb_build_object('slug',slug,'status',status,'sort_order',sort_order,'publication_slug',publication_slug) order by expected_order) from originals)
) as import_postcheck;
commit;
