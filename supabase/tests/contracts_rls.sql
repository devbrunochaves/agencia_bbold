-- BBOLD Flow — manual RLS/permission verification for contracts
--
-- Same approach as clients_rls.sql/tasks_rls.sql/finance_rls.sql: no JS
-- test runner configured, run each block manually via impersonation
-- (https://supabase.com/docs/guides/database/testing).

begin;

insert into public.organizations (id, name, slug) values
  ('a0000000-0000-0000-0000-000000000001', 'Org A', 'test-org-a-contracts'),
  ('a0000000-0000-0000-0000-000000000002', 'Org B', 'test-org-b-contracts');

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

insert into public.contract_templates (id, organization_id, name, slug, content) values
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Template A', 'template-a', '{{client_name}}'),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Template B', 'template-b', '{{client_name}}');

insert into public.contracts (
  organization_id, client_id, template_id, title, start_date, billing_type,
  total_amount, payment_method, city, client_snapshot, contractor_snapshot, content_snapshot
) values (
  'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
  'Contrato da Org A', current_date, 'one_time', 1000.00, 'pix', 'São Paulo', '{}', '{}', 'conteúdo'
), (
  'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002',
  'Contrato da Org B', current_date, 'one_time', 500.00, 'pix', 'Rio de Janeiro', '{}', '{}', 'conteúdo'
);

-- -----------------------------------------------------------------------
-- Test 1 — multi-tenancy.
-- -----------------------------------------------------------------------
-- set local request.jwt.claim.sub = '<user-a-uuid>';
-- select title from public.contracts;
-- EXPECT: exactly "Contrato da Org A".

-- -----------------------------------------------------------------------
-- Test 2 — permission: user B (role 'member', no contracts.manage) cannot insert.
-- -----------------------------------------------------------------------
-- set local request.jwt.claim.sub = '<user-b-uuid>';
-- insert into public.contracts (
--   organization_id, client_id, title, start_date, billing_type,
--   total_amount, payment_method, city, client_snapshot, contractor_snapshot, content_snapshot
-- ) values (
--   'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Sem permissão',
--   current_date, 'one_time', 100.00, 'pix', 'X', '{}', '{}', 'x'
-- );
-- EXPECT: error (RLS policy violation on contracts_insert).

-- -----------------------------------------------------------------------
-- Test 3 — client from another organization.
-- -----------------------------------------------------------------------
-- set local request.jwt.claim.sub = '<user-a-uuid>';
-- insert into public.contracts (
--   organization_id, client_id, title, start_date, billing_type,
--   total_amount, payment_method, city, client_snapshot, contractor_snapshot, content_snapshot
-- ) values (
--   'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Cliente errado',
--   current_date, 'one_time', 100.00, 'pix', 'X', '{}', '{}', 'x'
-- );
-- EXPECT: error ("client must belong to the contract's organization").

-- -----------------------------------------------------------------------
-- Test 4 — template from another organization.
-- -----------------------------------------------------------------------
-- set local request.jwt.claim.sub = '<user-a-uuid>';
-- insert into public.contracts (
--   organization_id, client_id, template_id, title, start_date, billing_type,
--   total_amount, payment_method, city, client_snapshot, contractor_snapshot, content_snapshot
-- ) values (
--   'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002',
--   'Template errado', current_date, 'one_time', 100.00, 'pix', 'X', '{}', '{}', 'x'
-- );
-- EXPECT: error ("template must belong to the contract's organization").

-- -----------------------------------------------------------------------
-- Test 5 — status transitions: draft → sent → signed works; draft → signed
-- (skipping a step) is rejected by the APPLICATION layer
-- (modules/contracts/domain/rules.ts canTransition), not by a DB
-- constraint — the DB only enforces status ∈ the four valid values.
-- Verify via the app: changeContractStatus({id, status:'signed'}) on a
-- draft contract should throw ValidationError.
-- -----------------------------------------------------------------------

-- -----------------------------------------------------------------------
-- Test 6 — snapshot immutability: editing the client after a contract
-- exists must NOT change the contract's client_snapshot.
-- -----------------------------------------------------------------------
-- update public.clients set name = 'Cliente A (renomeado)' where id = 'b0000000-0000-0000-0000-000000000001';
-- select client_snapshot->>'name' as snapshot_name from public.contracts where title = 'Contrato da Org A';
-- EXPECT: still the original name — clients.name changing never touches contracts.client_snapshot.

rollback;

-- ---------------------------------------------------------------------------
-- Application-level tests (no DB fixture needed, verify by code review /
-- manual exercise once Supabase is reachable):
--   - installmentsMatchTotal (modules/contracts/domain/rules.ts): sum of
--     contract_installments.amount must equal contracts.total_amount —
--     enforced in createContract/updateContract via splitAmountIntoInstallments,
--     which always distributes the full total (remainder on the last
--     installment), so this can never drift by construction.
--   - Finance from contract, recurring: creates exactly one
--     financial_recurrences row per contract (getRecurrenceByContractId
--     checked before insert — calling "Criar" twice is a no-op the second
--     time).
--   - Finance from contract, installment: creates exactly N financial_entries
--     rows (countEntriesByContract checked before insert — same
--     no-op-on-repeat guarantee).
--   - Finance from contract, one_time: creates exactly one financial_entries row.
-- ---------------------------------------------------------------------------
