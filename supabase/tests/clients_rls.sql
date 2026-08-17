-- BBOLD Flow — executable RLS/permission verification for clients/services
--
-- Fase "RLS Test Suite Real" (homologação): this file predates real
-- execution and only had commented-out assertions referencing
-- `<user-a-uuid>` placeholders that were never created — it could not
-- actually run. Rewritten to be self-contained and transactional: creates
-- its own auth.users fixtures inside the same transaction it rolls back,
-- and asserts with real DO $$ blocks (RAISE EXCEPTION on failure, RAISE
-- NOTICE on pass) instead of comments a human has to eyeball. Run the
-- whole file as one script (psql or the SQL editor) against a project with
-- migrations applied — `begin`/`rollback` guarantee the official database
-- is byte-for-byte unchanged afterward, no cleanup step needed.
--
-- This file predates phase 7's client_access_mode/member_client_access
-- restriction (it only exercises has_permission()); the additional
-- restricted-visibility dimension on SELECT/UPDATE (can_view_client()) is
-- covered end-to-end in access_rls.sql Test 4 instead of being duplicated
-- here — the scenarios below remain valid, just not exhaustive on that axis.

begin;

insert into public.organizations (id, name, slug) values
  ('a0000000-0000-0000-0000-000000000001', 'Org A', 'test-org-a-clients'),
  ('a0000000-0000-0000-0000-000000000002', 'Org B', 'test-org-b-clients');

-- auth.users fixtures — minimal valid rows (only `id` is NOT NULL on this
-- table; everything else defaults or is nullable). Triggers
-- handle_new_auth_user() to populate public.users automatically, same as
-- a real signup.
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('e0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-test-clients-a@example.invalid', '{}', '{}', now(), now()),
  ('e0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-test-clients-b@example.invalid', '{}', '{}', now(), now());

insert into public.memberships (organization_id, user_id, role_id, status)
select 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', r.id, 'active'
from public.roles r where r.key = 'owner' and r.organization_id is null;

insert into public.memberships (organization_id, user_id, role_id, status)
select 'a0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', r.id, 'active'
from public.roles r where r.key = 'member' and r.organization_id is null;

insert into public.clients (id, organization_id, name, status, client_type) values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Cliente da Org A', 'active', 'project'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Cliente da Org B', 'active', 'project');

insert into public.services (id, organization_id, name, slug) values
  ('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Serviço A', 'servico-a-clients'),
  ('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Serviço B', 'servico-b-clients');

-- ---------------------------------------------------------------------------
-- Test 1 — organization isolation: user A (owner of Org A) must see only
-- Org A's client, never Org B's.
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'e0000000-0000-0000-0000-000000000001', 'role', 'authenticated')::text, true);

do $$
declare v_names text;
begin
  select string_agg(name, ', ' order by name) into v_names from public.clients;
  if v_names is distinct from 'Cliente da Org A' then
    raise exception 'TEST FAILED (clients Test 1 - organization isolation): expected only "Cliente da Org A", got: %', v_names;
  end if;
  raise notice 'PASS clients Test 1 - organization isolation';
end $$;

-- ---------------------------------------------------------------------------
-- Test 2 — permission: user B has role 'member' (no clients.manage). An
-- insert attempt must be rejected by the clients_insert policy.
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'e0000000-0000-0000-0000-000000000002', 'role', 'authenticated')::text, true);

do $$
begin
  begin
    insert into public.clients (organization_id, name, status, client_type)
      values ('a0000000-0000-0000-0000-000000000002', 'Tentativa sem permissão', 'active', 'project');
    raise exception 'TEST FAILED (clients Test 2 - manage permission): insert should have been rejected by RLS but succeeded';
  exception when others then
    if sqlerrm not ilike '%row-level security%' then
      raise exception 'TEST FAILED (clients Test 2 - manage permission): unexpected error: %', sqlerrm;
    end if;
    raise notice 'PASS clients Test 2 - manage permission (insert correctly rejected: %)', sqlerrm;
  end;
end $$;

-- ---------------------------------------------------------------------------
-- Test 3 — cross-tenant insert: user A (owner of Org A only) cannot insert
-- a client with organization_id = Org B, even though A holds clients.manage
-- in their own organization.
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'e0000000-0000-0000-0000-000000000001', 'role', 'authenticated')::text, true);

do $$
begin
  begin
    insert into public.clients (organization_id, name, status, client_type)
      values ('a0000000-0000-0000-0000-000000000002', 'Cross-tenant attempt', 'active', 'project');
    raise exception 'TEST FAILED (clients Test 3 - cross-tenant insert): insert should have been rejected by RLS but succeeded';
  exception when others then
    if sqlerrm not ilike '%row-level security%' then
      raise exception 'TEST FAILED (clients Test 3 - cross-tenant insert): unexpected error: %', sqlerrm;
    end if;
    raise notice 'PASS clients Test 3 - cross-tenant insert (correctly rejected: %)', sqlerrm;
  end;
end $$;

-- ---------------------------------------------------------------------------
-- Test 4 — positive control: user A CAN insert within their own
-- organization (proves clients.manage genuinely grants access — Tests 2/3
-- aren't just "everything is blocked"). Role/claims re-asserted explicitly
-- rather than relying on carryover from Test 3's exception-handling block.
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'e0000000-0000-0000-0000-000000000001', 'role', 'authenticated')::text, true);

-- Note: no RETURNING here — INSERT ... RETURNING additionally evaluates the
-- SELECT policy (can_view_client) on the new row in the same command, which
-- is a separate assertion from "was the insert itself permitted"; verified
-- as a plain follow-up SELECT below instead, to keep this test focused on
-- the INSERT policy alone.
do $$
declare v_count int;
begin
  insert into public.clients (organization_id, name, status, client_type)
    values ('a0000000-0000-0000-0000-000000000001', 'Cliente criado pelo Owner', 'active', 'project');
  select count(*) into v_count from public.clients where name = 'Cliente criado pelo Owner';
  if v_count <> 1 then
    raise exception 'TEST FAILED (clients Test 4 - positive control): insert should have succeeded and be visible, count=%', v_count;
  end if;
  raise notice 'PASS clients Test 4 - positive control (insert succeeded and visible via SELECT)';
end $$;

-- ---------------------------------------------------------------------------
-- Test 5 — service consistency: client_services must reject linking a
-- client from Org A to a service from Org B, even bypassing the app layer.
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'e0000000-0000-0000-0000-000000000001', 'role', 'authenticated')::text, true);

-- Referencing the cross-org service by literal id (not a name lookup)
-- deliberately bypasses RLS's own invisibility of "Serviço B" to user A —
-- this test targets the check_client_service_same_org() trigger
-- specifically, as a defense-in-depth check independent of RLS SELECT
-- visibility (e.g. if a service_id were ever supplied by a compromised
-- client, not looked up server-side).
do $$
begin
  begin
    insert into public.client_services (organization_id, client_id, service_id, status)
    values ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', 'active');
    raise exception 'TEST FAILED (clients Test 5 - service same-org): insert should have been rejected by trigger but succeeded';
  exception when others then
    if sqlerrm not ilike '%same organization%' then
      raise exception 'TEST FAILED (clients Test 5 - service same-org): unexpected error: %', sqlerrm;
    end if;
    raise notice 'PASS clients Test 5 - service same-org (correctly rejected: %)', sqlerrm;
  end;
end $$;

rollback; -- the official database is left byte-for-byte unchanged
