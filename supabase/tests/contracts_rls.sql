-- BBOLD Flow — executable RLS/permission verification for contracts
--
-- Rewritten for the "RLS Test Suite Real" homologação step — see
-- clients_rls.sql's header for why (was documentation-only). Self-contained
-- and transactional: creates its own auth.users fixtures inside the
-- transaction it rolls back, asserts with real DO $$ blocks. Predates
-- phase 7's client_access_mode restriction (can_view_client()) — that
-- dimension is covered in access_rls.sql Test 4, not duplicated here.

begin;

insert into public.organizations (id, name, slug) values
  ('a0000000-0000-0000-0000-000000000001', 'Org A', 'test-org-a-contracts'),
  ('a0000000-0000-0000-0000-000000000002', 'Org B', 'test-org-b-contracts');

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('e0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-test-contracts-a@example.invalid', '{}', '{}', now(), now()),
  ('e0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-test-contracts-b@example.invalid', '{}', '{}', now(), now());

insert into public.memberships (organization_id, user_id, role_id, status)
select 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000007', r.id, 'active'
from public.roles r where r.key = 'owner' and r.organization_id is null;

-- system 'member' has contracts.view but not contracts.manage — fits this
-- test's "view but not manage" scenario without needing a custom role.
insert into public.memberships (organization_id, user_id, role_id, status)
select 'a0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000008', r.id, 'active'
from public.roles r where r.key = 'member' and r.organization_id is null;

insert into public.clients (id, organization_id, name, status, client_type) values
  ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'Cliente A', 'active', 'project'),
  ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000002', 'Cliente B', 'active', 'project');

insert into public.contract_templates (id, organization_id, name, slug, content) values
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Template A', 'template-a-contracts', '{{client_name}}'),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'Template B', 'template-b-contracts', '{{client_name}}');

insert into public.contracts (
  id, organization_id, client_id, template_id, title, start_date, billing_type,
  total_amount, payment_method, city, client_snapshot, contractor_snapshot, content_snapshot
) values (
  'f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000002',
  'Contrato da Org A', current_date, 'one_time', 1000.00, 'pix', 'São Paulo', '{"name":"Cliente A"}', '{}', 'conteúdo'
), (
  'f0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000003',
  'Contrato da Org B', current_date, 'one_time', 500.00, 'pix', 'Rio de Janeiro', '{"name":"Cliente B"}', '{}', 'conteúdo'
);

-- ---------------------------------------------------------------------------
-- Test 1 — organization isolation.
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'e0000000-0000-0000-0000-000000000007', 'role', 'authenticated')::text, true);

do $$
declare v_titles text;
begin
  select string_agg(title, ', ') into v_titles from public.contracts;
  if v_titles is distinct from 'Contrato da Org A' then
    raise exception 'TEST FAILED (contracts Test 1 - organization isolation): expected only "Contrato da Org A", got: %', v_titles;
  end if;
  raise notice 'PASS contracts Test 1 - organization isolation';
end $$;

-- ---------------------------------------------------------------------------
-- Test 2 — permission: user B (role 'member', no contracts.manage) cannot insert.
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'e0000000-0000-0000-0000-000000000008', 'role', 'authenticated')::text, true);

do $$
begin
  begin
    insert into public.contracts (
      organization_id, client_id, title, start_date, billing_type,
      total_amount, payment_method, city, client_snapshot, contractor_snapshot, content_snapshot
    ) values (
      'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000008', 'Sem permissão',
      current_date, 'one_time', 100.00, 'pix', 'X', '{}', '{}', 'x'
    );
    raise exception 'TEST FAILED (contracts Test 2 - manage permission): insert should have been rejected by RLS but succeeded';
  exception when others then
    if sqlerrm not ilike '%row-level security%' then
      raise exception 'TEST FAILED (contracts Test 2 - manage permission): unexpected error: %', sqlerrm;
    end if;
    raise notice 'PASS contracts Test 2 - manage permission (correctly rejected: %)', sqlerrm;
  end;
end $$;

-- ---------------------------------------------------------------------------
-- Test 3 — client from another organization.
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'e0000000-0000-0000-0000-000000000007', 'role', 'authenticated')::text, true);

do $$
begin
  begin
    insert into public.contracts (
      organization_id, client_id, title, start_date, billing_type,
      total_amount, payment_method, city, client_snapshot, contractor_snapshot, content_snapshot
    ) values (
      'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000008', 'Cliente errado',
      current_date, 'one_time', 100.00, 'pix', 'X', '{}', '{}', 'x'
    );
    raise exception 'TEST FAILED (contracts Test 3 - cross-org client): insert should have been rejected by trigger but succeeded';
  exception when others then
    if sqlerrm not ilike '%client must belong%' then
      raise exception 'TEST FAILED (contracts Test 3 - cross-org client): unexpected error: %', sqlerrm;
    end if;
    raise notice 'PASS contracts Test 3 - cross-org client (correctly rejected: %)', sqlerrm;
  end;
end $$;

-- ---------------------------------------------------------------------------
-- Test 4 — template from another organization.
-- ---------------------------------------------------------------------------
do $$
begin
  begin
    insert into public.contracts (
      organization_id, client_id, template_id, title, start_date, billing_type,
      total_amount, payment_method, city, client_snapshot, contractor_snapshot, content_snapshot
    ) values (
      'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000003',
      'Template errado', current_date, 'one_time', 100.00, 'pix', 'X', '{}', '{}', 'x'
    );
    raise exception 'TEST FAILED (contracts Test 4 - cross-org template): insert should have been rejected by trigger but succeeded';
  exception when others then
    if sqlerrm not ilike '%template must belong%' then
      raise exception 'TEST FAILED (contracts Test 4 - cross-org template): unexpected error: %', sqlerrm;
    end if;
    raise notice 'PASS contracts Test 4 - cross-org template (correctly rejected: %)', sqlerrm;
  end;
end $$;

-- ---------------------------------------------------------------------------
-- Test 5 — snapshot immutability: editing the client after a contract
-- exists must NOT change the contract's client_snapshot.
-- ---------------------------------------------------------------------------
do $$
declare v_snapshot_name text;
begin
  update public.clients set name = 'Cliente A (renomeado)' where id = 'b0000000-0000-0000-0000-000000000007';
  select client_snapshot->>'name' into v_snapshot_name from public.contracts where title = 'Contrato da Org A';
  if v_snapshot_name <> 'Cliente A' then
    raise exception 'TEST FAILED (contracts Test 5 - snapshot immutability): expected snapshot name to stay "Cliente A", got %', v_snapshot_name;
  end if;
  raise notice 'PASS contracts Test 5 - snapshot immutability';
end $$;

-- ---------------------------------------------------------------------------
-- Test 6 — positive control: user A can insert within their own org (no
-- RETURNING — see clients_rls.sql Test 4 note).
-- ---------------------------------------------------------------------------
do $$
declare v_count int;
begin
  insert into public.contracts (
    organization_id, client_id, title, start_date, billing_type,
    total_amount, payment_method, city, client_snapshot, contractor_snapshot, content_snapshot
  ) values (
    'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000007', 'Contrato criado pelo Owner',
    current_date, 'one_time', 100.00, 'pix', 'X', '{}', '{}', 'x'
  );
  select count(*) into v_count from public.contracts where title = 'Contrato criado pelo Owner';
  if v_count <> 1 then
    raise exception 'TEST FAILED (contracts Test 6 - positive control): insert should have succeeded, count=%', v_count;
  end if;
  raise notice 'PASS contracts Test 6 - positive control';
end $$;

-- ---------------------------------------------------------------------------
-- Test 7 (fase 9 hardening) — contract_installments.organization_id must
-- match the contract's real organization, even if a caller with
-- contracts.manage in their own org tries to attach an installment to a
-- contract belonging to a different org. check_contract_installment_same_org()
-- is NOT SECURITY DEFINER, so its internal SELECT on contracts is itself
-- subject to RLS as the calling user — Org B's contract is invisible to
-- user A entirely, so the trigger reports "contract_id does not reference
-- an existing contract" rather than an org-mismatch message. Either
-- message proves the same thing: the cross-org attach is impossible.
-- ---------------------------------------------------------------------------
do $$
begin
  begin
    insert into public.contract_installments (organization_id, contract_id, installment_number, amount, due_date)
      values ('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000004', 1, 100.00, current_date);
    raise exception 'TEST FAILED (contracts Test 7 - installment same-org): insert should have been rejected by trigger but succeeded';
  exception when others then
    if sqlerrm not ilike '%organization_id must match the contract%' and sqlerrm not ilike '%does not reference an existing contract%' then
      raise exception 'TEST FAILED (contracts Test 7 - installment same-org): unexpected error: %', sqlerrm;
    end if;
    raise notice 'PASS contracts Test 7 - installment same-org (correctly rejected: %)', sqlerrm;
  end;
end $$;

rollback; -- the official database is left byte-for-byte unchanged

-- ---------------------------------------------------------------------------
-- Application-level tests (no DB fixture needed, already covered):
--   - status transitions (draft -> sent -> signed, rejecting skips) —
--     modules/contracts/domain/rules.ts canTransition, tested in
--     modules/contracts/domain/__tests__/rules.test.ts (npm test).
--   - installmentsMatchTotal / splitAmountIntoInstallments — same file,
--     rounding remainder never drifts by construction.
--   - Finance-from-contract idempotency (one_time/installment/recurring) —
--     DB-level backstop tested in finance_rls.sql Test 6 (recurrence) and
--     the fase-9 financial_entries_contract_due_date_uidx/
--     financial_recurrences_contract_id_uidx unique indexes (see
--     supabase/migrations/20260817000000_audit_hardening.sql).
-- ---------------------------------------------------------------------------
