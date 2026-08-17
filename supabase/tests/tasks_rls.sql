-- BBOLD Flow — executable RLS/permission verification for tasks
--
-- Rewritten for the "RLS Test Suite Real" homologação step — see
-- clients_rls.sql's header for why (was documentation-only, comments
-- referencing UUIDs that were never created, could not actually run).
-- Self-contained and transactional: creates its own auth.users fixtures
-- inside the transaction it rolls back, asserts with real DO $$ blocks.
-- Predates phase 7's client_access_mode restriction (can_view_client()) —
-- that dimension is covered in access_rls.sql Test 4, not duplicated here.

begin;

insert into public.organizations (id, name, slug) values
  ('a0000000-0000-0000-0000-000000000001', 'Org A', 'test-org-a-tasks'),
  ('a0000000-0000-0000-0000-000000000002', 'Org B', 'test-org-b-tasks');

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('e0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-test-tasks-a@example.invalid', '{}', '{}', now(), now()),
  ('e0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-test-tasks-b@example.invalid', '{}', '{}', now(), now());

insert into public.memberships (organization_id, user_id, role_id, status)
select 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003', r.id, 'active'
from public.roles r where r.key = 'owner' and r.organization_id is null;

-- Note: the system 'member' role has tasks.manage (it's core operational
-- work, not an admin-only action) — so testing "no tasks.manage" needs a
-- custom, narrower role, not the system Member. This also exercises custom
-- per-organization roles for real.
insert into public.roles (id, organization_id, key, name, is_system)
values ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'viewer-only', 'Viewer Only', false);

-- Also grant clients.view: the check_task_consistency() trigger is NOT
-- SECURITY DEFINER, so its own internal SELECT on clients is subject to
-- RLS as the calling user — without clients.view the referenced client
-- would be invisible to the trigger too, and the test would report a
-- confusing "client must belong to org" error instead of isolating the
-- tasks.manage check this test is actually about.
insert into public.role_permissions (role_id, permission_id)
select 'd0000000-0000-0000-0000-000000000001', p.id from public.permissions p where p.key in ('tasks.view', 'clients.view');

insert into public.memberships (organization_id, user_id, role_id, status)
values ('a0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000001', 'active');

insert into public.clients (id, organization_id, name, status, client_type) values
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Cliente A', 'active', 'project'),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'Cliente B', 'active', 'project');

insert into public.services (id, organization_id, name, slug) values
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Serviço A', 'servico-a-tasks'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Serviço B', 'servico-b-tasks');

insert into public.tasks (organization_id, client_id, service_id, title, status, priority) values
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'Task da Org A', 'todo', 'normal'),
  ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'Task da Org B', 'todo', 'normal');

-- ---------------------------------------------------------------------------
-- Test 1 — organization isolation: user A must see only Org A's task.
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'e0000000-0000-0000-0000-000000000003', 'role', 'authenticated')::text, true);

do $$
declare v_titles text;
begin
  select string_agg(title, ', ') into v_titles from public.tasks;
  if v_titles is distinct from 'Task da Org A' then
    raise exception 'TEST FAILED (tasks Test 1 - organization isolation): expected only "Task da Org A", got: %', v_titles;
  end if;
  raise notice 'PASS tasks Test 1 - organization isolation';
end $$;

-- ---------------------------------------------------------------------------
-- Test 2 — permission: user B has a custom 'viewer-only' role (tasks.view
-- only, no tasks.manage — the system Member role actually has tasks.manage,
-- since day-to-day task work isn't admin-gated, so this needed a custom
-- narrower role to test the negative case for real).
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'e0000000-0000-0000-0000-000000000004', 'role', 'authenticated')::text, true);

do $$
begin
  begin
    insert into public.tasks (organization_id, client_id, title, status, priority)
      values ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'Sem permissão', 'todo', 'normal');
    raise exception 'TEST FAILED (tasks Test 2 - manage permission): insert should have been rejected by RLS but succeeded';
  exception when others then
    if sqlerrm not ilike '%row-level security%' then
      raise exception 'TEST FAILED (tasks Test 2 - manage permission): unexpected error: %', sqlerrm;
    end if;
    raise notice 'PASS tasks Test 2 - manage permission (correctly rejected: %)', sqlerrm;
  end;
end $$;

-- ---------------------------------------------------------------------------
-- Test 3 — cross-client: a task cannot reference a client from another org,
-- even for a user who is a member of the task's own organization.
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'e0000000-0000-0000-0000-000000000003', 'role', 'authenticated')::text, true);

do $$
begin
  begin
    insert into public.tasks (organization_id, client_id, title, status, priority)
      values ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'Cross-client', 'todo', 'normal');
    raise exception 'TEST FAILED (tasks Test 3 - cross-client): insert should have been rejected by trigger but succeeded';
  exception when others then
    if sqlerrm not ilike '%belong to the task%organization%' then
      raise exception 'TEST FAILED (tasks Test 3 - cross-client): unexpected error: %', sqlerrm;
    end if;
    raise notice 'PASS tasks Test 3 - cross-client (correctly rejected: %)', sqlerrm;
  end;
end $$;

-- ---------------------------------------------------------------------------
-- Test 4 — cross-service: same as above, for service_id.
-- ---------------------------------------------------------------------------
do $$
begin
  begin
    insert into public.tasks (organization_id, client_id, service_id, title, status, priority)
      values ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'Cross-service', 'todo', 'normal');
    raise exception 'TEST FAILED (tasks Test 4 - cross-service): insert should have been rejected by trigger but succeeded';
  exception when others then
    if sqlerrm not ilike '%service must belong%' then
      raise exception 'TEST FAILED (tasks Test 4 - cross-service): unexpected error: %', sqlerrm;
    end if;
    raise notice 'PASS tasks Test 4 - cross-service (correctly rejected: %)', sqlerrm;
  end;
end $$;

-- ---------------------------------------------------------------------------
-- Test 5 — assignee without active membership in the task's organization.
-- ---------------------------------------------------------------------------
do $$
begin
  begin
    insert into public.tasks (organization_id, client_id, assignee_id, title, status, priority)
      values ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000004', 'Assignee inválido', 'todo', 'normal');
    raise exception 'TEST FAILED (tasks Test 5 - assignee): insert should have been rejected by trigger but succeeded';
  exception when others then
    if sqlerrm not ilike '%assignee must have an active membership%' then
      raise exception 'TEST FAILED (tasks Test 5 - assignee): unexpected error: %', sqlerrm;
    end if;
    raise notice 'PASS tasks Test 5 - assignee (correctly rejected: %)', sqlerrm;
  end;
end $$;

-- ---------------------------------------------------------------------------
-- Test 6 — positive control + completed_at lifecycle: user A inserts a
-- task in their own org (no RETURNING — see clients_rls.sql Test 4 note),
-- completes it (completed_at set), reopens it (completed_at cleared).
-- ---------------------------------------------------------------------------
do $$
declare
  v_completed_at timestamptz;
begin
  insert into public.tasks (organization_id, client_id, title, status, priority)
    values ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'Task para lifecycle', 'todo', 'normal');

  update public.tasks set status = 'completed' where title = 'Task para lifecycle';
  select completed_at into v_completed_at from public.tasks where title = 'Task para lifecycle';
  if v_completed_at is null then
    raise exception 'TEST FAILED (tasks Test 6 - completed_at set): expected completed_at to be set after status=completed';
  end if;

  update public.tasks set status = 'todo' where title = 'Task para lifecycle';
  select completed_at into v_completed_at from public.tasks where title = 'Task para lifecycle';
  if v_completed_at is not null then
    raise exception 'TEST FAILED (tasks Test 6 - completed_at cleared): expected completed_at to be null after reopening';
  end if;

  raise notice 'PASS tasks Test 6 - positive control + completed_at lifecycle';
end $$;

rollback; -- the official database is left byte-for-byte unchanged

-- ---------------------------------------------------------------------------
-- Filter behavior (application-level, modules/tasks/infrastructure/tasks.repository.ts
-- — covered by manual UI testing, not SQL, since the bucketing logic for
-- "hoje"/"próximos dias"/"sem data" lives in app/flow/demandas/format.ts):
--   - overdue:            due_date < today AND status NOT IN (completed, cancelled)
--   - today:               due_date = today
--   - 7/14/30 days:        due_date <= today + N, excluding overdue/today
--   - without due date:    due_date IS NULL
--   - completed hidden:    status <> 'completed' unless includeCompleted=true
-- ---------------------------------------------------------------------------
