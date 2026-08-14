-- BBOLD Flow — manual RLS/permission verification for clients/services
--
-- No JS test runner is configured in this project (package.json has no
-- "test" script — documented since phase 1), and standing up pgTAP or a
-- similar framework just for this would be more machinery than the current
-- surface area justifies. Instead: run each block below in the Supabase SQL
-- editor (or psql) against a project with the migrations applied, using
-- `set local role authenticated; set local request.jwt.claim.sub = '<uuid>'`
-- to impersonate a specific auth user per Supabase's documented RLS testing
-- pattern (https://supabase.com/docs/guides/database/testing). Each block
-- states what it proves and what a pass/fail looks like.

-- Setup: two organizations, two users, one membership each.
begin;

insert into public.organizations (id, name, slug) values
  ('a0000000-0000-0000-0000-000000000001', 'Org A', 'test-org-a'),
  ('a0000000-0000-0000-0000-000000000002', 'Org B', 'test-org-b');

-- Assumes these two auth.users already exist (create via
-- supabase.auth.admin.createUser in a dev project before running this file).
-- insert into auth.users ...  -- left to the operator

insert into public.memberships (organization_id, user_id, role_id, status)
select 'a0000000-0000-0000-0000-000000000001', '<user-a-uuid>', r.id, 'active'
from public.roles r where r.key = 'owner' and r.organization_id is null;

insert into public.memberships (organization_id, user_id, role_id, status)
select 'a0000000-0000-0000-0000-000000000002', '<user-b-uuid>', r.id, 'member'
from public.roles r where r.key = 'member' and r.organization_id is null;

insert into public.clients (organization_id, name, status, client_type) values
  ('a0000000-0000-0000-0000-000000000001', 'Cliente da Org A', 'active', 'project'),
  ('a0000000-0000-0000-0000-000000000002', 'Cliente da Org B', 'active', 'project');

insert into public.services (organization_id, name, slug) values
  ('a0000000-0000-0000-0000-000000000001', 'Serviço A', 'servico-a'),
  ('a0000000-0000-0000-0000-000000000002', 'Serviço B', 'servico-b');

-- -----------------------------------------------------------------------
-- Test 1 — multi-tenancy: user A must see only Org A's client.
-- -----------------------------------------------------------------------
-- set local request.jwt.claim.sub = '<user-a-uuid>';
-- select name from public.clients;
-- EXPECT: exactly "Cliente da Org A" — never "Cliente da Org B".

-- -----------------------------------------------------------------------
-- Test 2 — permission: user B has role 'member' (no clients.manage).
-- An insert attempt must be rejected by the clients_insert policy.
-- -----------------------------------------------------------------------
-- set local request.jwt.claim.sub = '<user-b-uuid>';
-- insert into public.clients (organization_id, name, status, client_type)
--   values ('a0000000-0000-0000-0000-000000000002', 'Tentativa sem permissão', 'active', 'project');
-- EXPECT: error (new row violates row-level security policy for table "clients").

-- -----------------------------------------------------------------------
-- Test 3 — created_by/organization_id integrity: the application layer
-- (modules/clients/application/create-client.ts) never accepts these from
-- input; this just re-confirms the DB constraint independently — a row
-- with an organization_id that user A has no membership in must be
-- rejected even if application code had a bug and tried to pass one.
-- -----------------------------------------------------------------------
-- set local request.jwt.claim.sub = '<user-a-uuid>';
-- insert into public.clients (organization_id, name, status, client_type)
--   values ('a0000000-0000-0000-0000-000000000002', 'Cross-tenant attempt', 'active', 'project');
-- EXPECT: error (RLS policy violation) — org A membership does not grant
-- clients.manage on org B.

-- -----------------------------------------------------------------------
-- Test 4 — service consistency: client_services must reject linking a
-- client from Org A to a service from Org B, even bypassing the app layer.
-- -----------------------------------------------------------------------
-- set local request.jwt.claim.sub = '<user-a-uuid>';
-- insert into public.client_services (organization_id, client_id, service_id, status)
-- select 'a0000000-0000-0000-0000-000000000001', c.id, s.id, 'active'
-- from public.clients c, public.services s
-- where c.name = 'Cliente da Org A' and s.name = 'Serviço B';
-- EXPECT: error raised by check_client_service_same_org() trigger
-- ("client and service must belong to the same organization").

rollback; -- never commit test fixtures to a real database
