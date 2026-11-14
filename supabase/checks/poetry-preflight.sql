-- Read-only inventory. No DDL/DML, no row contents and no credentials.
begin transaction read only;

select current_setting('server_version_num')::integer >= 150000 as supported_postgres,
       to_regclass('auth.users') is not null as auth_users_exists,
       to_regprocedure('auth.uid()') is not null as auth_uid_exists,
       to_regprocedure('gen_random_uuid()') is not null as uuid_function_exists;

select required.role_name, exists (
  select 1 from pg_roles where rolname = required.role_name
) as exists
from (values ('anon'), ('authenticated')) as required(role_name);

select required.object_name, to_regclass(required.object_name) is not null as exists
from (values ('public.admin_users'), ('public.poems'), ('public.publications')) as required(object_name);

select nspname as schema_name, pg_get_userbyid(nspowner) as owner,
       has_schema_privilege('anon', oid, 'USAGE') as anon_usage,
       has_schema_privilege('authenticated', oid, 'USAGE') as authenticated_usage
from pg_namespace where nspname in ('public', 'private');

select n.nspname as schema_name, c.relname as object_name, c.relkind as kind,
       c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('public', 'private') and c.relkind in ('r', 'p', 'v', 'm', 'f', 'S')
order by 1, 2;

select n.nspname as schema_name, p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'private' order by 1, 2;

-- Configuration only; do not return other role settings, which may contain secrets.
select roles.rolname as role_name, split_part(setting, '=', 2) as exposed_schemas
from pg_db_role_setting cfg join pg_roles roles on roles.oid = cfg.setrole
cross join lateral unnest(cfg.setconfig) as setting
where setting like 'pgrst.db_schemas=%';

select to_regclass('supabase_migrations.schema_migrations') is not null as migration_history_exists;
commit;
