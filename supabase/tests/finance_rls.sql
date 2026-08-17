-- BBOLD Flow — executable RLS/permission verification for the financial module
--
-- Rewritten for the "RLS Test Suite Real" homologação step — see
-- clients_rls.sql's header for why (was documentation-only). Self-contained
-- and transactional: creates its own auth.users fixtures inside the
-- transaction it rolls back, asserts with real DO $$ blocks.

begin;

insert into public.organizations (id, name, slug) values
  ('a0000000-0000-0000-0000-000000000001', 'Org A', 'test-org-a-finance'),
  ('a0000000-0000-0000-0000-000000000002', 'Org B', 'test-org-b-finance');

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('e0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-test-finance-a@example.invalid', '{}', '{}', now(), now()),
  ('e0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-test-finance-b@example.invalid', '{}', '{}', now(), now());

insert into public.memberships (organization_id, user_id, role_id, status)
select 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000005', r.id, 'active'
from public.roles r where r.key = 'owner' and r.organization_id is null;

-- Note: the system 'member' role has finance.view but not finance.manage —
-- it already fits this test's "view but not manage" scenario, no custom
-- role needed here (unlike tasks_rls.sql, where Member has tasks.manage).
insert into public.memberships (organization_id, user_id, role_id, status)
select 'a0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000006', r.id, 'active'
from public.roles r where r.key = 'member' and r.organization_id is null;

insert into public.clients (id, organization_id, name, status, client_type) values
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Cliente A', 'active', 'project'),
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002', 'Cliente B', 'active', 'project');

insert into public.financial_categories (id, organization_id, name, type) values
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Receita A', 'income'),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Despesa A', 'expense'),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'Receita B', 'income');

insert into public.financial_entries (organization_id, client_id, category_id, type, description, amount, competence_month) values
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000003', 'income', 'Entrada da Org A', 1000.00, date_trunc('month', current_date)::date),
  ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000005', 'income', 'Entrada da Org B', 500.00, date_trunc('month', current_date)::date);

-- ---------------------------------------------------------------------------
-- Test 1 — organization isolation.
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'e0000000-0000-0000-0000-000000000005', 'role', 'authenticated')::text, true);

do $$
declare v_desc text;
begin
  select string_agg(description, ', ') into v_desc from public.financial_entries;
  if v_desc is distinct from 'Entrada da Org A' then
    raise exception 'TEST FAILED (finance Test 1 - organization isolation): expected only "Entrada da Org A", got: %', v_desc;
  end if;
  raise notice 'PASS finance Test 1 - organization isolation';
end $$;

-- ---------------------------------------------------------------------------
-- Test 2 — permission: user B (role 'member' — finance.view but not
-- finance.manage) cannot insert.
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'e0000000-0000-0000-0000-000000000006', 'role', 'authenticated')::text, true);

do $$
begin
  begin
    insert into public.financial_entries (organization_id, category_id, type, description, amount, competence_month)
      values ('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000005', 'income', 'Sem permissão', 100.00, date_trunc('month', current_date)::date);
    raise exception 'TEST FAILED (finance Test 2 - manage permission): insert should have been rejected by RLS but succeeded';
  exception when others then
    if sqlerrm not ilike '%row-level security%' then
      raise exception 'TEST FAILED (finance Test 2 - manage permission): unexpected error: %', sqlerrm;
    end if;
    raise notice 'PASS finance Test 2 - manage permission (correctly rejected: %)', sqlerrm;
  end;
end $$;

-- Positive control: user B CAN still read the whole org's financial_entries
-- (finance.view) — confirms Test 2 isn't just "everything blocked".
do $$
declare v_count int;
begin
  select count(*) into v_count from public.financial_entries;
  if v_count <> 1 then
    raise exception 'TEST FAILED (finance Test 2b - view permission): expected 1 visible entry for user B, got %', v_count;
  end if;
  raise notice 'PASS finance Test 2b - view permission (finance.view grants read access)';
end $$;

-- ---------------------------------------------------------------------------
-- Test 3 — category type must match entry type.
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'e0000000-0000-0000-0000-000000000005', 'role', 'authenticated')::text, true);

do $$
begin
  begin
    insert into public.financial_entries (organization_id, category_id, type, description, amount, competence_month)
      values ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'income', 'Tipo errado', 100.00, date_trunc('month', current_date)::date);
    raise exception 'TEST FAILED (finance Test 3 - category type consistency): insert should have been rejected by trigger but succeeded';
  exception when others then
    if sqlerrm not ilike '%category type%does not match%' then
      raise exception 'TEST FAILED (finance Test 3 - category type consistency): unexpected error: %', sqlerrm;
    end if;
    raise notice 'PASS finance Test 3 - category type consistency (correctly rejected: %)', sqlerrm;
  end;
end $$;

-- ---------------------------------------------------------------------------
-- Test 4 — client from another organization.
-- ---------------------------------------------------------------------------
do $$
begin
  begin
    insert into public.financial_entries (organization_id, client_id, category_id, type, description, amount, competence_month)
      values ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000003', 'income', 'Cliente errado', 100.00, date_trunc('month', current_date)::date);
    raise exception 'TEST FAILED (finance Test 4 - cross-org client): insert should have been rejected by trigger but succeeded';
  exception when others then
    if sqlerrm not ilike '%client must belong%' then
      raise exception 'TEST FAILED (finance Test 4 - cross-org client): unexpected error: %', sqlerrm;
    end if;
    raise notice 'PASS finance Test 4 - cross-org client (correctly rejected: %)', sqlerrm;
  end;
end $$;

-- ---------------------------------------------------------------------------
-- Test 5 — invoice consistency trigger + payment: requires_invoice=true
-- normalizes invoice_status to 'pending'; marking paid (paid_at) is
-- independent of invoice_status (§28 — payment and invoice emission don't
-- couple); marking invoice 'issued' sets invoice_issued_at.
-- ---------------------------------------------------------------------------
do $$
declare
  v_invoice_status text;
  v_paid_at date;
  v_issued_at date;
begin
  insert into public.financial_entries (organization_id, category_id, type, description, amount, competence_month, requires_invoice)
    values ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'income', 'Com NF', 200.00, date_trunc('month', current_date)::date, true);

  select invoice_status into v_invoice_status from public.financial_entries where description = 'Com NF';
  if v_invoice_status <> 'pending' then
    raise exception 'TEST FAILED (finance Test 5a - invoice defaults to pending): got %', v_invoice_status;
  end if;

  update public.financial_entries set paid_at = current_date, status = 'paid' where description = 'Com NF';
  select paid_at, invoice_status into v_paid_at, v_invoice_status from public.financial_entries where description = 'Com NF';
  if v_paid_at is null or v_invoice_status <> 'pending' then
    raise exception 'TEST FAILED (finance Test 5b - payment independent of invoice): paid_at=%, invoice_status=% (expected still pending)', v_paid_at, v_invoice_status;
  end if;

  update public.financial_entries set invoice_status = 'issued' where description = 'Com NF';
  select invoice_issued_at into v_issued_at from public.financial_entries where description = 'Com NF';
  if v_issued_at is null then
    raise exception 'TEST FAILED (finance Test 5c - invoice_issued_at set on issued): expected non-null';
  end if;

  raise notice 'PASS finance Test 5 - invoice consistency + payment independence';
end $$;

-- ---------------------------------------------------------------------------
-- Test 6 — recurrence duplicate prevention: two entries for the same
-- recurrence + competence must be rejected by
-- financial_entries_recurrence_competence_uidx.
-- ---------------------------------------------------------------------------
do $$
declare v_recurrence_id uuid;
begin
  insert into public.financial_recurrences (organization_id, category_id, type, description, amount, start_date, day_of_month)
    values ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'income', 'Mensalidade teste', 1800.00, current_date, 10);

  select id into v_recurrence_id from public.financial_recurrences where description = 'Mensalidade teste';

  insert into public.financial_entries (organization_id, category_id, type, description, amount, competence_month, recurrence_id)
    values ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'income', 'Mensalidade teste', 1800.00, date_trunc('month', current_date)::date, v_recurrence_id);

  begin
    insert into public.financial_entries (organization_id, category_id, type, description, amount, competence_month, recurrence_id)
      values ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'income', 'Mensalidade teste (duplicada)', 1800.00, date_trunc('month', current_date)::date, v_recurrence_id);
    raise exception 'TEST FAILED (finance Test 6 - recurrence idempotency): second insert should have violated the unique index but succeeded';
  exception when unique_violation then
    raise notice 'PASS finance Test 6 - recurrence idempotency (correctly rejected: %)', sqlerrm;
  end;
end $$;

rollback; -- the official database is left byte-for-byte unchanged

-- ---------------------------------------------------------------------------
-- Calculation tests (pure functions, modules/finance/domain/rules.ts) — NOT
-- SQL, already covered by real Vitest assertions in
-- modules/finance/domain/__tests__/rules.test.ts (sumPaidIncome/
-- sumPaidExpenses/computeRealizedProfit only count status='paid' AND
-- paid_at set — 'cancelled'/'pending' correctly excluded, verified with
-- fixture data) and modules/finance/domain/__tests__/competence.test.ts
-- (computeGoalProgress). Re-verify by running `npm test` — not duplicated
-- here as SQL since these are pure TypeScript functions with no DB access.
-- ---------------------------------------------------------------------------
