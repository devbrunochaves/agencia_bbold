-- BBOLD Flow — Fase 9 audit hardening
--
-- Fixes four gaps found during the V1 full audit (Fase 9), none of them
-- schema additions for a new feature — pure hardening of decisions already
-- made in earlier phases:
--
--   1. memberships allowed a hard DELETE via a single `for all` policy,
--      contradicting the documented "removed, never DELETEd" intent
--      (see the comment at the top of 20260814170000_access_control.sql).
--   2. contract_installments.organization_id was never validated against
--      its contract's real organization_id — the one cross-entity
--      relationship among clients/tasks/contracts/financial_entries/
--      client_services that lacked the same-org trigger its four siblings
--      already have (client_services, tasks, financial_entries,
--      financial_recurrences, contracts all got one in earlier phases).
--   3. member_client_access.client_id was never validated against its
--      membership's real organization_id — same class of gap, lower
--      severity since can_view_client()'s own join already neutralizes a
--      mis-scoped row, but there's no reason to leave it unenforced.
--   4. Contract → financial_entries/financial_recurrences generation was
--      idempotent only via an application-level count-then-insert check
--      (modules/contracts/application/create-finance-from-contract.ts),
--      which has a real TOCTOU race under concurrent requests. The
--      recurrence-generation path (financial_entries_recurrence_competence_uidx,
--      added in phase 5) already has a DB-level backstop; this migration
--      gives the contract-generation path the same kind of backstop.

-- ---------------------------------------------------------------------------
-- 1. memberships — remove hard-DELETE capability
-- ---------------------------------------------------------------------------
drop policy if exists memberships_manage on public.memberships;

create policy memberships_insert on public.memberships
  for insert
  with check (public.has_permission(organization_id, 'members.manage'));

create policy memberships_update on public.memberships
  for update
  using (public.has_permission(organization_id, 'members.manage'))
  with check (public.has_permission(organization_id, 'members.manage'));

-- Deliberately no memberships_delete policy — membership rows are never
-- physically deleted, only moved to status = 'removed' (see members.repository.ts
-- changeMemberStatus). With RLS enabled and no DELETE policy, any DELETE
-- attempt is blocked outright, matching clients/tasks/contracts/financial_entries.

-- ---------------------------------------------------------------------------
-- 2. contract_installments — same-organization trigger
-- ---------------------------------------------------------------------------
create function public.check_contract_installment_same_org()
returns trigger
language plpgsql
as $$
declare
  v_contract_org uuid;
begin
  select organization_id into v_contract_org from public.contracts where id = new.contract_id;

  if v_contract_org is null then
    raise exception 'contract_installments: contract_id does not reference an existing contract';
  end if;

  if new.organization_id <> v_contract_org then
    raise exception 'contract_installments: organization_id must match the contract''s organization';
  end if;

  return new;
end;
$$;

create trigger contract_installments_same_org
  before insert or update on public.contract_installments
  for each row execute function public.check_contract_installment_same_org();

-- ---------------------------------------------------------------------------
-- 3. member_client_access — same-organization trigger
-- ---------------------------------------------------------------------------
create function public.check_member_client_access_same_org()
returns trigger
language plpgsql
as $$
declare
  v_membership_org uuid;
  v_client_org uuid;
begin
  select organization_id into v_membership_org from public.memberships where id = new.membership_id;
  select organization_id into v_client_org from public.clients where id = new.client_id;

  if v_membership_org is null or v_client_org is null or v_membership_org <> v_client_org then
    raise exception 'member_client_access: membership and client must belong to the same organization';
  end if;

  return new;
end;
$$;

create trigger member_client_access_same_org
  before insert or update on public.member_client_access
  for each row execute function public.check_member_client_access_same_org();

-- ---------------------------------------------------------------------------
-- 4. Contract → financial_entries/financial_recurrences generation —
--    DB-level idempotency backstop, mirroring the existing recurrence-
--    competence unique index. Two concurrent "gerar financeiro" calls for
--    the same contract can both pass the application's count-check before
--    either inserts (TOCTOU); these constraints make the second call's
--    bulk insert fail atomically instead of silently duplicating entries.
-- ---------------------------------------------------------------------------

-- One entry per (contract, due_date) — covers both the one_time case (a
-- single row) and the installment case (one row per installment, each with
-- its own due_date). A genuine business need for two entries on the same
-- contract with the same due_date has never come up; if it ever does, this
-- constraint is the right place to loosen, not the right pattern to skip.
create unique index financial_entries_contract_due_date_uidx
  on public.financial_entries (contract_id, due_date)
  where contract_id is not null;

-- One recurrence per contract — a contract only ever spawns a single
-- recurring-billing recurrence (see create-finance-from-contract.ts).
create unique index financial_recurrences_contract_id_uidx
  on public.financial_recurrences (contract_id)
  where contract_id is not null;
