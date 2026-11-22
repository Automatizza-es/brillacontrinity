begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.publications (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 160),
  title text not null check (length(btrim(title)) between 1 and 300),
  publisher text not null check (length(btrim(publisher)) between 1 and 300),
  place text,
  year integer not null check (year between 1000 and 9999),
  kind text not null,
  role text,
  synopsis text,
  cover_url text,
  isbn text,
  purchase_links jsonb not null default '[]'::jsonb check (jsonb_typeof(purchase_links) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.poems (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 160),
  title text not null check (length(btrim(title)) between 1 and 300),
  body text not null default '' check (length(body) <= 200000),
  description text check (length(description) <= 2000),
  written_on date,
  written_on_original text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  -- First publication in this database; NOT an invented historical web date.
  first_published_at timestamptz,
  publication_id uuid references public.publications(id) on delete restrict,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_poems_have_text check (status <> 'published' or length(btrim(body)) > 0)
);
create index poems_public_order_idx on public.poems(sort_order, id) where status = 'published';
create index poems_publication_idx on public.poems(publication_id);

alter table public.admin_users enable row level security;
alter table public.publications enable row level security;
alter table public.poems enable row level security;

-- Do not rely on dashboard auto-exposure or its default grants.
revoke all on public.admin_users, public.publications, public.poems from public, anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.poems, public.publications to anon, authenticated;
grant select on public.admin_users to authenticated;
grant insert, update, delete on public.poems to authenticated;
-- Editorial records are managed through versioned maintenance for this phase.
-- No client may create/delete administrators or edit publications.

create function private.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;
revoke all on function private.is_admin() from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;

create policy admin_reads_own_membership on public.admin_users
  for select to authenticated using (user_id = (select auth.uid()));
create policy public_reads_publications on public.publications
  for select to anon, authenticated using (true);
create policy visitor_reads_published_poems on public.poems
  for select to anon using (status = 'published');
create policy authenticated_reads_poems on public.poems
  for select to authenticated using (status = 'published' or (select private.is_admin()));
create policy admin_inserts_poems on public.poems
  for insert to authenticated with check ((select private.is_admin()));
create policy admin_updates_poems on public.poems
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy admin_deletes_poems on public.poems
  for delete to authenticated using ((select private.is_admin()));

create function private.protect_poem_metadata()
returns trigger language plpgsql set search_path = '' as $$
begin
  if TG_OP = 'UPDATE' then
    if old.first_published_at is not null and new.slug is distinct from old.slug then
      raise exception 'The slug of a previously published poem cannot change' using errcode = '23514';
    end if;
    new.created_at := old.created_at;
    new.first_published_at := old.first_published_at;
  else
    new.created_at := now();
    new.first_published_at := null;
  end if;
  if new.status = 'published' and new.first_published_at is null then
    new.first_published_at := now();
  end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.protect_poem_metadata() from public, anon, authenticated;
create trigger protect_poem_metadata before insert or update on public.poems
  for each row execute function private.protect_poem_metadata();

comment on column public.poems.body is 'Original plain text; preserve whitespace, line breaks and punctuation exactly.';
comment on column public.poems.published_at is 'Known web publication date; NULL when historical date is unknown. Future publishing action supplies the date.';
comment on table public.admin_users is 'Manual authorization by database owner only. Never grant client writes.';

commit;
