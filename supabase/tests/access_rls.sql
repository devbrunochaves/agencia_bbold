-- BBOLD Flow — manual RLS/permission verification for access control (phase 7)
--
-- Same approach as clients_rls.sql/tasks_rls.sql/finance_rls.sql/contracts_rls.sql:
-- no JS test runner configured, run each block manually via impersonation
-- (https://supabase.com/docs/guides/database/testing).

begin;

insert into public.organizations (id, name, slug) values
  ('a0000000-0000-0000-0000-000000000001', 'Org A', 'test-org-a-access'),
  ('a0000000-0000-0000-0000-000000000002', 'Org B', 'test-org-b-access');

-- insert into auth.users ...  -- create <owner-uuid>, <admin-uuid>,
-- <restricted-uuid>, and <other-org-uuid> beforehand

insert into public.memberships (organization_id, user_id, role_id, status, client_access_mode)
select 'a0000000-0000-0000-0000-000000000001', '<owner-uuid>', r.id, 'active', 'all'
from public.roles r where r.key = 'owner' and r.organization_id is null;

insert into public.memberships (organization_id, user_id, role_id, status, client_access_mode)
select 'a0000000-0000-0000-0000-000000000001', '<restricted-uuid>', r.id, 'active', 'restricted'
from public.roles r where r.key = 'member' and r.organization_id is null
returning id; -- note as <restricted-membership-id>

insert into public.memberships (organization_id, user_id, role_id, status, client_access_mode)
select 'a0000000-0000-0000-0000-000000000002', '<other-org-uuid>', r.id, 'active', 'all'
from public.roles r where r.key = 'owner' and r.organization_id is null;

insert into public.clients (id, organization_id, name, status, client_type) values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Cliente Visível', 'active', 'project'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Cliente Bloqueado', 'active', 'project');

insert into public.member_client_access (membership_id, client_id) values
  ('<restricted-membership-id>', 'b0000000-0000-0000-0000-000000000001');

insert into public.tasks (organization_id, client_id, title, status, priority) values
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Task visível', 'todo', 'normal'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Task bloqueada', 'todo', 'normal');

-- -----------------------------------------------------------------------
-- Test 1 — organization isolation: owner of Org A never sees Org B rows,
-- and vice-versa, regardless of table.
-- -----------------------------------------------------------------------
-- set local request.jwt.claim.sub = '<other-org-uuid>';
-- select count(*) from public.clients where organization_id = 'a0000000-0000-0000-0000-000000000001';
-- EXPECT: 0.

-- -----------------------------------------------------------------------
-- Test 2 — module permission: without finance.view, SELECT on
-- financial_entries returns zero rows regardless of organization_id filter
-- attempted client-side.
-- -----------------------------------------------------------------------
-- (repeat the Test 2 pattern from finance_rls.sql with a membership whose
-- role has no finance.view)

-- -----------------------------------------------------------------------
-- Test 3 — manage vs view: a membership with clients.view but not
-- clients.manage can SELECT but any INSERT/UPDATE attempt fails.
-- -----------------------------------------------------------------------
-- (create a custom role with only clients.view, assign it, then attempt
-- an update — expect RLS violation on clients_update)

-- -----------------------------------------------------------------------
-- Test 4 — client restriction: the core of this phase. The restricted
-- membership must see "Cliente Visível" and "Task visível", and get ZERO
-- rows for "Cliente Bloqueado"/"Task bloqueada" — not filtered client-side,
-- genuinely absent from the result set.
-- -----------------------------------------------------------------------
-- set local request.jwt.claim.sub = '<restricted-uuid>';
-- select name from public.clients;
-- EXPECT: exactly "Cliente Visível".
-- select title from public.tasks;
-- EXPECT: exactly "Task visível".

-- -----------------------------------------------------------------------
-- Test 5 — finance stays organization-level regardless of client
-- restriction (§19/§53 of the phase brief — deliberate, not an oversight).
-- The same restricted membership, if granted finance.view, sees the WHOLE
-- financial_entries table for the organization, including entries for
-- "Cliente Bloqueado".
-- -----------------------------------------------------------------------
-- insert into public.financial_categories (organization_id, name, type)
--   values ('a0000000-0000-0000-0000-000000000001', 'Categoria Teste', 'income') returning id;
-- insert into public.financial_entries (organization_id, client_id, category_id, type, description, amount, competence_month)
--   values ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', '<category-id>', 'income', 'Receita do cliente bloqueado', 100.00, date_trunc('month', current_date)::date);
-- (grant restricted-uuid's role finance.view, then, impersonating it:)
-- select description from public.financial_entries;
-- EXPECT: "Receita do cliente bloqueado" IS visible — confirms finance.view
-- is organization-wide, not intersected with member_client_access.

-- -----------------------------------------------------------------------
-- Test 6 — suspended membership: zero access anywhere, immediately.
-- -----------------------------------------------------------------------
-- update public.memberships set status = 'suspended' where user_id = '<restricted-uuid>';
-- set local request.jwt.claim.sub = '<restricted-uuid>';
-- select count(*) from public.clients;
-- EXPECT: 0 — is_member_of()/has_permission() both require status = 'active'.

-- -----------------------------------------------------------------------
-- Test 7 — last Owner protection.
-- -----------------------------------------------------------------------
-- (with Org A having exactly one active Owner, <owner-uuid>)
-- update public.memberships set status = 'suspended'
--   where organization_id = 'a0000000-0000-0000-0000-000000000001'
--     and user_id = '<owner-uuid>';
-- EXPECT: error from prevent_last_owner_removal() trigger — "Cannot
-- remove, suspend, or demote the last active Owner of an organization".
-- The application layer (modules/identity/application/last-owner-guard.ts)
-- catches this earlier with a friendlier message; this proves the DB-level
-- backstop holds even if that layer were bypassed.

-- -----------------------------------------------------------------------
-- Test 8 — member_client_access itself is not globally readable: a
-- regular member without members.manage can only see their OWN allow-list
-- row, not everyone else's.
-- -----------------------------------------------------------------------
-- set local request.jwt.claim.sub = '<restricted-uuid>';
-- select membership_id from public.member_client_access;
-- EXPECT: only rows where membership_id = <restricted-membership-id>.

rollback;

-- ---------------------------------------------------------------------------
-- Direct-manipulation attempts (§71) — verify each of these fails, by code
-- review + manual exercise once Supabase is reachable:
--   - Editing a task's clientId in a client-side form to a client_id
--     outside the caller's access: rejected by RLS (tasks_update requires
--     can_view_client(client_id) on both USING and WITH CHECK).
--   - Editing the URL to /flow/clientes/<foreign-org-client-id> (no such
--     detail route exists yet, but the pattern generalizes): any query for
--     that id returns null because clients_select's has_permission() check
--     fails for a different organization_id.
--   - Calling a Server Action directly (e.g. via browser devtools) after
--     losing a permission mid-session: every application-layer function
--     calls getCurrentUserContext() fresh on each invocation — there is no
--     cached permission set to go stale. Revoking finance.manage and then
--     invoking updateFinancialEntry() fails immediately with
--     UnauthorizedError, regardless of what the client believed.
--   - Sending a forged organization_id in a Server Action payload: every
--     application function resolves organization_id from
--     getCurrentUserContext(), never from the input object — there is no
--     parameter to forge in the first place.
-- ---------------------------------------------------------------------------
