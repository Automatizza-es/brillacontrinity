-- Synthetic fixtures only. All changes roll back. Run against disposable LOCAL DB.
begin;
create function pg_temp.assert_ok(ok boolean, label text) returns void language plpgsql as $$
begin
  if ok is distinct from true then raise exception 'FAIL: %', label; end if;
  raise notice 'PASS: %', label;
end;
$$;
create function pg_temp.expect_error(statement text, expected_state text) returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    if SQLSTATE = expected_state then
      raise notice 'PASS: rejected with %', expected_state;
      return;
    end if;
    raise;
  end;
  raise exception 'FAIL: expected SQLSTATE % for %', expected_state, statement;
end;
$$;
insert into auth.users(id) values
 ('10000000-0000-4000-8000-000000000001'),
 ('10000000-0000-4000-8000-000000000002');
insert into public.admin_users(user_id) values ('10000000-0000-4000-8000-000000000001');
insert into public.publications(slug,title,publisher,year,kind)
 values ('test-book','Test book','Test publisher',2026,'Test');
insert into public.poems(slug,title,body,status,publication_id)
 select 'test-public','Public',E'  Verse one\nVerse two\n\nStanza two  ','published',id from public.publications where slug='test-book';
insert into public.poems(slug,title,body) values ('test-draft','Private draft','Draft text');

set local role anon;
select pg_temp.assert_ok((select count(*) = 1 from public.poems), 'visitor sees only published poem');
select pg_temp.assert_ok((select count(*) = 1 from public.publications), 'visitor reads editorial data');
select pg_temp.expect_error('select * from public.admin_users', '42501');
select pg_temp.expect_error($s$insert into public.poems(slug,title) values ('attack','Attack')$s$, '42501');
select pg_temp.expect_error($s$update public.poems set title='Attack'$s$, '42501');
select pg_temp.expect_error('delete from public.poems', '42501');
select pg_temp.expect_error('truncate public.poems', '42501');
select pg_temp.expect_error('select private.is_admin()', '42501');
reset role;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select pg_temp.assert_ok(not private.is_admin(), 'ordinary user is not administrator');
select pg_temp.assert_ok((select count(*) = 1 from public.poems), 'ordinary user cannot read drafts');
select pg_temp.assert_ok((select count(*) = 0 from public.admin_users), 'ordinary user cannot enumerate admins');
select pg_temp.expect_error($s$insert into public.poems(slug,title) values ('attack','Attack')$s$, '42501');
with changed as (update public.poems set title='Attack' returning id)
 select pg_temp.assert_ok(count(*) = 0, 'ordinary user cannot update any poem') from changed;
with removed as (delete from public.poems returning id)
 select pg_temp.assert_ok(count(*) = 0, 'ordinary user cannot delete any poem') from removed;
select pg_temp.expect_error($s$insert into public.admin_users(user_id) values ('10000000-0000-4000-8000-000000000002')$s$, '42501');
select pg_temp.expect_error('delete from public.admin_users', '42501');
select pg_temp.expect_error($s$update public.publications set title='Attack'$s$, '42501');
reset role;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
set local role authenticated;
select pg_temp.assert_ok(private.is_admin(), 'authorized user is administrator');
select pg_temp.assert_ok((select count(*) = 2 from public.poems), 'admin sees published and drafts');
select pg_temp.assert_ok((select count(*) = 1 from public.admin_users), 'admin sees own membership');
insert into public.poems(slug,title,body) values ('admin-new','New',E' First\n\nLast  ');
update public.poems set slug='admin-edited',title='Edited' where slug='admin-new';
select pg_temp.assert_ok((select body = E' First\n\nLast  ' from public.poems where slug='admin-edited'), 'whitespace preserved exactly');
update public.poems set status='published',published_at=now() where slug='admin-edited';
select pg_temp.assert_ok((select first_published_at is not null from public.poems where slug='admin-edited'), 'first publication recorded');
select pg_temp.expect_error($s$update public.poems set slug='changed-url' where slug='admin-edited'$s$, '23514');
update public.poems set status='draft',first_published_at=null where slug='admin-edited';
select pg_temp.expect_error($s$update public.poems set slug='changed-url' where slug='admin-edited'$s$, '23514');
select pg_temp.expect_error($s$insert into public.poems(slug,title) values ('test-draft','Duplicate')$s$, '23505');
select pg_temp.expect_error($s$insert into public.poems(slug,title,status) values ('empty','Empty','published')$s$, '23514');
select pg_temp.expect_error($s$insert into public.poems(slug,title,status) values ('bad-state','Bad','other')$s$, '23514');
select pg_temp.expect_error($s$insert into public.poems(slug,title) values ('Bad URL','Bad')$s$, '23514');
select pg_temp.expect_error($s$update public.poems set publication_id='20000000-0000-4000-8000-000000000001' where slug='test-draft'$s$, '23503');
select pg_temp.expect_error($s$insert into public.admin_users(user_id) values ('10000000-0000-4000-8000-000000000002')$s$, '42501');
select pg_temp.expect_error('update public.admin_users set user_id=user_id', '42501');
select pg_temp.expect_error('truncate public.poems', '42501');
delete from public.poems where slug='admin-edited';
select pg_temp.assert_ok((select count(*) = 0 from public.poems where slug='admin-edited'), 'admin can delete');
update public.poems set status='draft' where slug='test-public';
reset role;
set local role anon;
select pg_temp.assert_ok((select count(*) = 0 from public.poems), 'withdrawn poem is no longer public');
reset role;
-- Revocation must take effect without reissuing the JWT.
delete from public.admin_users where user_id='10000000-0000-4000-8000-000000000001';
set local role authenticated;
select pg_temp.assert_ok(not private.is_admin(), 'revocation effective with same identity');
select pg_temp.assert_ok((select count(*) = 0 from public.poems), 'revoked admin cannot see drafts');
reset role;
rollback;
