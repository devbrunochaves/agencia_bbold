-- BBOLD Flow — executable RLS/permission verification for access control (phase 7 + fase 9 audit)
--
-- Rewritten for the "RLS Test Suite Real" homologação step — see
-- clients_rls.sql's header for why (was documentation-only). Self-contained
-- and transactional: creates its own auth.users fixtures (all disposable
-- test users, never the real BBOLD Owner) inside the transaction it rolls
-- back, asserts with real DO $$ blocks. This is the most important suite —
-- it's the one that actually proves cross-tenant/cross-client isolation.

begin;

insert into public.organizations (id, name, slug) values
  ('a1000000-0000-0000-0000-000000000001', 'Org A', 'test-org-a-access'),
  ('a1000000-0000-0000-0000-000000000002', 'Org B', 'test-org-b-access');

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('e1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-test-access-owner@example.invalid', '{}', '{}', now(), now()),
  ('e1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-test-access-restricted@example.invalid', '{}', '{}', now(), now()),
  ('e1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-test-access-otherorg@example.invalid', '{}', '{}', now(), now()),
  ('e1000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-test-access-nofinance@example.invalid', '{}', '{}', now(), now()),
  ('e1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-test-access-viewonly@example.invalid', '{}', '{}', now(), now());

-- Owner of Org A — a disposable TEST fixture, never the real BBOLD Owner
-- (5fe5f27b-08a8-49a4-a863-4309a24064e5), which this suite never touches.
insert into public.memberships (id, organization_id, user_id, role_id, status, client_access_mode)
select 'aa000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', r.id, 'active', 'all'
from public.roles r where r.key = 'owner' and r.organization_id is null;

-- Restricted member of Org A.
insert into public.memberships (id, organization_id, user_id, role_id, status, client_access_mode)
select 'aa000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000002', r.id, 'active', 'restricted'
from public.roles r where r.key = 'member' and r.organization_id is null;

-- Owner of Org B (unrelated organization).
insert into public.memberships (id, organization_id, user_id, role_id, status, client_access_mode)
select 'aa000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000003', r.id, 'active', 'all'
from public.roles r where r.key = 'owner' and r.organization_id is null;

-- Custom role: no finance.view at all (dashboard/clients/tasks view only) —
-- needed because both system roles that have any real permissions (owner,
-- admin, member) all include finance.view; there's no system role that
-- lacks it to test the negative case with.
insert into public.roles (id, organization_id, key, name, is_system)
values ('d1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'no-finance', 'No Finance', false);
insert into public.role_permissions (role_id, permission_id)
select 'd1000000-0000-0000-0000-000000000001', p.id from public.permissions p where p.key in ('dashboard.view', 'clients.view', 'tasks.view');
insert into public.memberships (id, organization_id, user_id, role_id, status, client_access_mode)
values ('aa000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000001', 'active', 'all');

-- Custom role: clients.view only, no clients.manage — for the "manage vs
-- view" test.
insert into public.roles (id, organization_id, key, name, is_system)
values ('d1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'view-only', 'View Only', false);
insert into public.role_permissions (role_id, permission_id)
select 'd1000000-0000-0000-0000-000000000002', p.id from public.permissions p where p.key in ('dashboard.view', 'clients.view');
insert into public.memberships (id, organization_id, user_id, role_id, status, client_access_mode)
values ('aa000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000002', 'active', 'all');

insert into public.clients (id, organization_id, name, status, client_type) values
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Cliente Visível', 'active', 'project'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Cliente Bloqueado', 'active', 'project');

insert into public.member_client_access (membership_id, client_id) values
  ('aa000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001');

insert into public.tasks (organization_id, client_id, title, status, priority) values
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Task visível', 'todo', 'normal'),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'Task bloqueada', 'todo', 'normal');

insert into public.financial_categories (id, organization_id, name, type) values
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Categoria Teste Access', 'income');

insert into public.financial_entries (organization_id, client_id, category_id, type, description, amount, competence_month) values
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'income', 'Receita do cliente bloqueado', 100.00, date_trunc('month', current_date)::date);

-- ---------------------------------------------------------------------------
-- Test 1 — organization isolation: Org B's owner never sees Org A data.
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'e1000000-0000-0000-0000-000000000003', 'role', 'authenticated')::text, true);

do $$
declare v_count int;
begin
  select count(*) into v_count from public.clients where organization_id = 'a1000000-0000-0000-0000-000000000001';
  if v_count <> 0 then
    raise exception 'TEST FAILED (access Test 1 - organization isolation): expected 0, got %', v_count;
  end if;
  raise notice 'PASS access Test 1 - organization isolation';
end $$;

-- ---------------------------------------------------------------------------
-- Test 2 — module permission: without finance.view, SELECT on
-- financial_entries returns zero rows.
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'e1000000-0000-0000-0000-000000000004', 'role', 'authenticated')::text, true);

do $$
declare v_count int;
begin
  select count(*) into v_count from public.financial_entries;
  if v_count <> 0 then
    raise exception 'TEST FAILED (access Test 2 - module permission): expected 0 without finance.view, got %', v_count;
  end if;
  raise notice 'PASS access Test 2 - module permission (finance.view absence enforced)';
end $$;

-- ---------------------------------------------------------------------------
-- Test 3 — manage vs view: a membership with clients.view but not
-- clients.manage can SELECT but any UPDATE attempt fails.
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'e1000000-0000-0000-0000-000000000005', 'role', 'authenticated')::text, true);

-- Note: unlike INSERT's WITH CHECK (which raises a real exception on
-- violation), UPDATE's USING clause failing simply matches zero rows —
-- Postgres does not raise for an UPDATE that RLS silently excludes. So
-- this assertion checks row count (GET DIAGNOSTICS), not an exception.
do $$
declare v_count int; v_updated int;
begin
  select count(*) into v_count from public.clients;
  if v_count <> 2 then
    raise exception 'TEST FAILED (access Test 3a - view allowed): expected 2 clients visible, got %', v_count;
  end if;

  update public.clients set name = 'Tentativa sem manage' where id = 'b1000000-0000-0000-0000-000000000001';
  get diagnostics v_updated = row_count;
  if v_updated <> 0 then
    raise exception 'TEST FAILED (access Test 3b - manage blocked): expected 0 rows updated (no clients.manage), got %', v_updated;
  end if;

  raise notice 'PASS access Test 3 - manage vs view (select allowed, update silently blocked by RLS)';
end $$;

-- ---------------------------------------------------------------------------
-- Test 4 — client restriction (the core of phase 7): the restricted
-- membership must see "Cliente Visível"/"Task visível" and get ZERO rows
-- for "Cliente Bloqueado"/"Task bloqueada" — not filtered client-side,
-- genuinely absent from the result set.
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'e1000000-0000-0000-0000-000000000002', 'role', 'authenticated')::text, true);

do $$
declare v_client_names text; v_task_titles text;
begin
  select string_agg(name, ', ') into v_client_names from public.clients;
  if v_client_names is distinct from 'Cliente Visível' then
    raise exception 'TEST FAILED (access Test 4a - restricted clients): expected only "Cliente Visível", got: %', v_client_names;
  end if;

  select string_agg(title, ', ') into v_task_titles from public.tasks;
  if v_task_titles is distinct from 'Task visível' then
    raise exception 'TEST FAILED (access Test 4b - restricted tasks): expected only "Task visível", got: %', v_task_titles;
  end if;

  raise notice 'PASS access Test 4 - client restriction (clients + tasks both scoped correctly)';
end $$;

-- ---------------------------------------------------------------------------
-- Test 5 — finance stays organization-level regardless of client
-- restriction (§19/§53 — deliberate, not an oversight). The same
-- restricted membership, via the system Member role's finance.view, sees
-- the WHOLE financial_entries table, including the entry for "Cliente
-- Bloqueado".
-- ---------------------------------------------------------------------------
do $$
declare v_desc text;
begin
  select string_agg(description, ', ') into v_desc from public.financial_entries;
  if v_desc is distinct from 'Receita do cliente bloqueado' then
    raise exception 'TEST FAILED (access Test 5 - finance org-level): expected the blocked client''s entry to be visible, got: %', v_desc;
  end if;
  raise notice 'PASS access Test 5 - finance stays organization-level (not intersected with client_access_mode)';
end $$;

-- ---------------------------------------------------------------------------
-- Test 6 — member_client_access is not globally readable: the restricted
-- member sees only their own allow-list row.
-- ---------------------------------------------------------------------------
do $$
declare v_count int;
begin
  select count(*) into v_count from public.member_client_access;
  if v_count <> 1 then
    raise exception 'TEST FAILED (access Test 6 - member_client_access privacy): expected exactly 1 (own row), got %', v_count;
  end if;
  raise notice 'PASS access Test 6 - member_client_access not globally readable';
end $$;

-- ---------------------------------------------------------------------------
-- Test 7 — suspended membership: zero access anywhere, immediately, using
-- the OWNER of Org A to flip the restricted user's status (this is app-
-- equivalent to an admin suspending a teammate).
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'e1000000-0000-0000-0000-000000000001', 'role', 'authenticated')::text, true);

update public.memberships set status = 'suspended' where id = 'aa000000-0000-0000-0000-000000000002';

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'e1000000-0000-0000-0000-000000000002', 'role', 'authenticated')::text, true);

do $$
declare v_count int;
begin
  select count(*) into v_count from public.clients;
  if v_count <> 0 then
    raise exception 'TEST FAILED (access Test 7 - suspended membership): expected 0 access after suspension, got %', v_count;
  end if;
  raise notice 'PASS access Test 7 - suspended membership loses all access immediately';
end $$;

-- ---------------------------------------------------------------------------
-- Test 8 — last Owner protection: suspending, removing, or demoting the
-- ONLY active Owner of a TEST organization must fail. Org A currently has
-- exactly one active Owner (the disposable test fixture
-- e1000000-...-001) — never the real BBOLD Owner.
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'e1000000-0000-0000-0000-000000000001', 'role', 'authenticated')::text, true);

do $$
begin
  begin
    update public.memberships set status = 'suspended' where id = 'aa000000-0000-0000-0000-000000000001';
    raise exception 'TEST FAILED (access Test 8a - last owner suspend): should have been rejected but succeeded';
  exception when others then
    if sqlerrm not ilike '%last active Owner%' then
      raise exception 'TEST FAILED (access Test 8a - last owner suspend): unexpected error: %', sqlerrm;
    end if;
  end;

  begin
    update public.memberships set status = 'removed' where id = 'aa000000-0000-0000-0000-000000000001';
    raise exception 'TEST FAILED (access Test 8b - last owner remove): should have been rejected but succeeded';
  exception when others then
    if sqlerrm not ilike '%last active Owner%' then
      raise exception 'TEST FAILED (access Test 8b - last owner remove): unexpected error: %', sqlerrm;
    end if;
  end;

  begin
    update public.memberships set role_id = 'd1000000-0000-0000-0000-000000000001' where id = 'aa000000-0000-0000-0000-000000000001';
    raise exception 'TEST FAILED (access Test 8c - last owner role change): should have been rejected but succeeded';
  exception when others then
    if sqlerrm not ilike '%last active Owner%' then
      raise exception 'TEST FAILED (access Test 8c - last owner role change): unexpected error: %', sqlerrm;
    end if;
  end;

  raise notice 'PASS access Test 8 - last Owner protection (suspend/remove/role-change all rejected)';
end $$;

-- ---------------------------------------------------------------------------
-- Test 9 (fase 9 hardening) — memberships cannot be hard-deleted, even by
-- an Owner with members.manage.
-- ---------------------------------------------------------------------------
do $$
declare v_deleted int;
begin
  delete from public.memberships where id = 'aa000000-0000-0000-0000-000000000004';
  get diagnostics v_deleted = row_count;
  if v_deleted <> 0 then
    raise exception 'TEST FAILED (access Test 9 - membership DELETE blocked): expected 0 rows deleted, got %', v_deleted;
  end if;
  raise notice 'PASS access Test 9 - membership DELETE blocked (no DELETE policy exists)';
end $$;

-- ---------------------------------------------------------------------------
-- Test 10 (fase 9 hardening) — cross-organization data cannot be attached
-- via member_client_access, even by an Owner who knows a foreign-org
-- client id.
-- ---------------------------------------------------------------------------
do $$
begin
  begin
    insert into public.member_client_access (membership_id, client_id)
      values ('aa000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001');
    -- (this one is same-org and should succeed harmlessly — not the assertion)
  exception when others then
    null; -- ignore, not the point of this test
  end;

  begin
    insert into public.member_client_access (membership_id, client_id)
    select 'aa000000-0000-0000-0000-000000000003', c.id from public.clients c where c.id = 'b1000000-0000-0000-0000-000000000001';
    raise exception 'TEST FAILED (access Test 10 - cross-org member_client_access): insert should have been rejected but succeeded';
  exception when others then
    if sqlerrm not ilike '%membership and client must belong to the same organization%' then
      raise exception 'TEST FAILED (access Test 10 - cross-org member_client_access): unexpected error: %', sqlerrm;
    end if;
    raise notice 'PASS access Test 10 - cross-org member_client_access rejected (correctly: %)', sqlerrm;
  end;
end $$;

rollback; -- the official database, including the real BBOLD Owner/org, is left byte-for-byte unchanged

-- ---------------------------------------------------------------------------
-- Direct-manipulation attempts (§71 of the original phase-7 brief) —
-- verified by code review, not SQL fixtures (they're about the app layer's
-- discipline, not the schema):
--   - Editing a task's clientId in a client-side form to a client_id
--     outside the caller's access: rejected by RLS (tasks_update requires
--     can_view_client(client_id) on both USING and WITH CHECK) — same
--     mechanism proven by Test 4 above.
--   - Editing the URL to a foreign-org resource: any query for that id
--     returns null because the *_select policy's has_permission() check
--     fails for a different organization_id — same mechanism as Test 1.
--   - Calling a Server Action directly after losing a permission
--     mid-session: every application-layer function calls
--     getCurrentUserContext() fresh on each invocation — no cached
--     permission set to go stale.
--   - Sending a forged organization_id in a Server Action payload: every
--     application function resolves organization_id from
--     getCurrentUserContext(), never from the input object.
-- ---------------------------------------------------------------------------
