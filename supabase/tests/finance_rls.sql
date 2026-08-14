-- BBOLD Flow — manual RLS/permission verification for the financial module
--
-- Same approach as clients_rls.sql/tasks_rls.sql: no JS test runner
-- configured, run each block manually via impersonation
-- (https://supabase.com/docs/guides/database/testing).

begin;

insert into public.organizations (id, name, slug) values
  ('a0000000-0000-0000-0000-000000000001', 'Org A', 'test-org-a-finance'),
  ('a0000000-0000-0000-0000-000000000002', 'Org B', 'test-org-b-finance');

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

insert into public.financial_categories (id, organization_id, name, type) values
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Receita A', 'income'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Despesa A', 'expense'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'Receita B', 'income');

insert into public.financial_entries (organization_id, client_id, category_id, type, description, amount, competence_month) values
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'income', 'Entrada da Org A', 1000.00, date_trunc('month', current_date)::date),
  ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'income', 'Entrada da Org B', 500.00, date_trunc('month', current_date)::date);

-- -----------------------------------------------------------------------
-- Test 1 — multi-tenancy.
-- -----------------------------------------------------------------------
-- set local request.jwt.claim.sub = '<user-a-uuid>';
-- select description from public.financial_entries;
-- EXPECT: exactly "Entrada da Org A".

-- -----------------------------------------------------------------------
-- Test 2 — permission: user B (role 'member', no finance.manage) cannot insert.
-- -----------------------------------------------------------------------
-- set local request.jwt.claim.sub = '<user-b-uuid>';
-- insert into public.financial_entries (organization_id, category_id, type, description, amount, competence_month)
--   values ('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'income', 'Sem permissão', 100.00, date_trunc('month', current_date)::date);
-- EXPECT: error (RLS policy violation on financial_entries_insert).

-- -----------------------------------------------------------------------
-- Test 3 — category type must match entry type ("income não aceita categoria expense").
-- -----------------------------------------------------------------------
-- set local request.jwt.claim.sub = '<user-a-uuid>';
-- insert into public.financial_entries (organization_id, category_id, type, description, amount, competence_month)
--   values ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'income', 'Tipo errado', 100.00, date_trunc('month', current_date)::date);
-- EXPECT: error raised by check_financial_entry_consistency() ("category type does not match entry type").

-- -----------------------------------------------------------------------
-- Test 4 — client from another organization.
-- -----------------------------------------------------------------------
-- set local request.jwt.claim.sub = '<user-a-uuid>';
-- insert into public.financial_entries (organization_id, client_id, category_id, type, description, amount, competence_month)
--   values ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'income', 'Cliente errado', 100.00, date_trunc('month', current_date)::date);
-- EXPECT: error ("client must belong to the entry's organization").

-- -----------------------------------------------------------------------
-- Test 5 — invoice consistency trigger normalizes requires_invoice/invoice_status.
-- -----------------------------------------------------------------------
-- set local request.jwt.claim.sub = '<user-a-uuid>';
-- insert into public.financial_entries (organization_id, category_id, type, description, amount, competence_month, requires_invoice)
--   values ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'income', 'Com NF', 200.00, date_trunc('month', current_date)::date, true)
--   returning invoice_status; -- EXPECT: 'pending'
-- update public.financial_entries set invoice_status = 'issued' where description = 'Com NF';
-- select invoice_issued_at is not null as issued_at_set from public.financial_entries where description = 'Com NF';
-- EXPECT: true. Marking paid separately (paid_at) does NOT change invoice_status —
-- confirms §28 (payment and invoice emission are independent).

-- -----------------------------------------------------------------------
-- Test 6 — recurrence duplicate prevention: two entries for the same
-- recurrence + competence must be rejected by financial_entries_recurrence_competence_uidx.
-- -----------------------------------------------------------------------
-- insert into public.financial_recurrences (organization_id, category_id, type, description, amount, start_date, day_of_month)
--   values ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'income', 'Mensalidade teste', 1800.00, current_date, 10)
--   returning id; -- note the id as <recurrence-id>
-- insert into public.financial_entries (organization_id, category_id, type, description, amount, competence_month, recurrence_id)
--   values ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'income', 'Mensalidade teste', 1800.00, date_trunc('month', current_date)::date, '<recurrence-id>');
-- insert into public.financial_entries (organization_id, category_id, type, description, amount, competence_month, recurrence_id)
--   values ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'income', 'Mensalidade teste (duplicada)', 1800.00, date_trunc('month', current_date)::date, '<recurrence-id>');
-- EXPECT: second insert fails with a unique constraint violation on
-- financial_entries_recurrence_competence_uidx. The application layer
-- (generateEntriesForCompetence) additionally pre-filters in memory so this
-- should never even be attempted in normal use — this test proves the
-- database-level guarantee holds regardless.

rollback;

-- ---------------------------------------------------------------------------
-- Calculation tests (pure functions, modules/finance/domain/rules.ts — no JS
-- test runner configured, verify manually by constructing FinancialEntry[]
-- fixtures and checking the outputs):
--   - sumPaidIncome / sumPaidExpenses: only status='paid' AND paid_at set count;
--     'cancelled' and 'pending' entries must NOT appear in the sum.
--   - computeRealizedProfit: sumPaidIncome - sumPaidExpenses (realized only,
--     never mixes in 'pending'/'planned' entries).
--   - computeGoalProgress: percentage = round(received/goal*100); at >=100%
--     the UI shows "Meta superada em X" instead of a >100% progress bar.
--   - computeCashBalance: opening_balance + realized profit of entries paid
--     on/after opening_balance_date (not scoped to the selected competence).
--   - isEntryOverdue: due_date < today AND paid_at IS NULL AND status NOT IN
--     ('paid','cancelled') — never stored, always derived at read time.
-- ---------------------------------------------------------------------------
