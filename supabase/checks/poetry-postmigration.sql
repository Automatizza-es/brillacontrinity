-- SELECT-only checks for the official read-only query endpoint.
-- Run only AFTER a separately authorized migration; no fixtures or users created.
select n.nspname as schema_name, c.relname as table_name,
       c.relrowsecurity as rls_enabled, pg_get_userbyid(c.relowner) as owner
from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('admin_users','poems','publications') and c.relkind='r'
order by c.relname;

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_catalog.pg_policies
where schemaname='public' and tablename in ('admin_users','poems','publications')
order by tablename, policyname;

select r.role_name, t.table_name, p.privilege,
       pg_catalog.has_table_privilege(r.role_name, 'public.' || t.table_name, p.privilege) as allowed
from (values ('anon'),('authenticated')) r(role_name)
cross join (values ('admin_users'),('poems'),('publications')) t(table_name)
cross join (values ('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER')) p(privilege)
order by 1,2,3;

select n.nspname as schema_name, p.proname as function_name,
       p.prosecdef as security_definer, p.proconfig as function_settings,
       pg_get_userbyid(p.proowner) as owner,
       pg_catalog.has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute,
       pg_catalog.has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_execute
from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
where n.nspname='private' and p.proname in ('is_admin','protect_poem_metadata')
order by p.proname;

select tg.tgname as trigger_name, tg.tgenabled as enabled,
       pg_catalog.pg_get_triggerdef(tg.oid) as definition
from pg_catalog.pg_trigger tg
where tg.tgrelid='public.poems'::regclass and not tg.tgisinternal;

select n.nspname as schema_name, c.relname as table_name,
       con.conname, con.contype, pg_catalog.pg_get_constraintdef(con.oid) as definition
from pg_catalog.pg_constraint con join pg_catalog.pg_class c on c.oid=con.conrelid
join pg_catalog.pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('admin_users','poems','publications')
order by c.relname, con.conname;

-- A zero count is conclusive only if this reader can see past RLS.
select current_user as reader, r.rolbypassrls as reader_bypasses_rls
from pg_catalog.pg_roles r where r.rolname=current_user;

select 'admin_users' as table_name, count(*) as rows from public.admin_users
union all select 'poems', count(*) from public.poems
union all select 'publications', count(*) from public.publications;

-- Migration history must also be checked with the official GET migrations API.
-- Database-role grants do not alone prove that a schema is excluded from Data API.
