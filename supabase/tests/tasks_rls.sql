-- BBOLD Flow — manual RLS/permission verification for tasks
--
-- Same approach as supabase/tests/clients_rls.sql: SQL-level RLS tests, run
-- each block manually via impersonation
-- (https://supabase.com/docs/guides/database/testing). Builds on the same
-- two-organization fixture as clients_rls.sql. Predates phase 7's
-- client_access_mode restriction (can_view_client()) — that dimension is
-- covered in access_rls.sql Test 4, not duplicated here.

begin;

insert into public.organizations (id, name, slug) values
  ('a0000000-0000-0000-0000-000000000001', 'Org A', 'test-org-a-tasks'),
  ('a0000000-0000-0000-0000-000000000002', 'Org B', 'test-org-b-tasks');

-- insert into auth.users ...  -- create <user-a-uuid> and <user-b-uuid> beforehand

insert into public.memberships (organization_id, user_id, role_id, status)
select 'a0000000-0000-0000-0000-000000000001', '<user-a-uuid>', r.id, 'active'
from public.roles r where r.key = 'owner' and r.organization_id is null;

insert into public.memberships (organization_id, user_id, role_id, status)
select 'a0000000-0000-0000-0000-000000000002', '<user-b-uuid>', r.id, 'member'
from public.roles r where r.key = 'member' and r.organization_id is null;

insert into public.clients (id, organization_id, name, status, client_type) values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Cliente A', 'active', 'project'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Cliente B', 'active', 'project');

insert into public.services (id, organization_id, name, slug) values
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Serviço A', 'servico-a-tasks'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Serviço B', 'servico-b-tasks');

insert into public.tasks (organization_id, client_id, service_id, title, status, priority) values
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Task da Org A', 'todo', 'normal'),
  ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'Task da Org B', 'todo', 'normal');

-- -----------------------------------------------------------------------
-- Test 1 — multi-tenancy: user A must see only Org A's task.
-- -----------------------------------------------------------------------
-- set local request.jwt.claim.sub = '<user-a-uuid>';
-- select title from public.tasks;
-- EXPECT: exactly "Task da Org A".

-- -----------------------------------------------------------------------
-- Test 2 — permission: user B (role 'member', no tasks.manage) cannot insert.
-- -----------------------------------------------------------------------
-- set local request.jwt.claim.sub = '<user-b-uuid>';
-- insert into public.tasks (organization_id, client_id, title, status, priority)
--   values ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Sem permissão', 'todo', 'normal');
-- EXPECT: error (RLS policy violation on tasks_insert).

-- -----------------------------------------------------------------------
-- Test 3 — cross-client: a task cannot reference a client from another org,
-- even for a user who is a member of the task's own organization.
-- -----------------------------------------------------------------------
-- set local request.jwt.claim.sub = '<user-a-uuid>';
-- insert into public.tasks (organization_id, client_id, title, status, priority)
--   values ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Cross-client', 'todo', 'normal');
-- EXPECT: error raised by check_task_consistency() ("client must belong to the task's organization").

-- -----------------------------------------------------------------------
-- Test 4 — cross-service: same as above, for service_id.
-- -----------------------------------------------------------------------
-- set local request.jwt.claim.sub = '<user-a-uuid>';
-- insert into public.tasks (organization_id, client_id, service_id, title, status, priority)
--   values ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Cross-service', 'todo', 'normal');
-- EXPECT: error ("service must belong to the task's organization").

-- -----------------------------------------------------------------------
-- Test 5 — assignee without active membership in the task's organization.
-- -----------------------------------------------------------------------
-- set local request.jwt.claim.sub = '<user-a-uuid>';
-- insert into public.tasks (organization_id, client_id, assignee_id, title, status, priority)
--   values ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '<user-b-uuid>', 'Assignee inválido', 'todo', 'normal');
-- EXPECT: error ("assignee must have an active membership in the task's organization").

-- -----------------------------------------------------------------------
-- Test 6 — completed_at lifecycle.
-- -----------------------------------------------------------------------
-- set local request.jwt.claim.sub = '<user-a-uuid>';
-- update public.tasks set status = 'completed' where title = 'Task da Org A';
-- select completed_at is not null as completed_at_set from public.tasks where title = 'Task da Org A';
-- EXPECT: true.
-- update public.tasks set status = 'todo' where title = 'Task da Org A';
-- select completed_at is null as completed_at_cleared from public.tasks where title = 'Task da Org A';
-- EXPECT: true.

rollback;

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
