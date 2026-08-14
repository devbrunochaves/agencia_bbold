-- BBOLD Flow — Access control completion (phase 7)
--
-- Completes what phase 1 deliberately left prepared: membership lifecycle
-- states beyond active/invited, explicit client-visibility mode, the
-- missing members.view/settings.* permissions, and — the core of this
-- phase — activating member_client_access as a real row-level restriction
-- on clients/tasks/contracts.
--
-- Decision — Financeiro stays organization-level (§19/§53 of the phase
-- brief): finance.view/finance.manage gate the entire module, full stop.
-- member_client_access is NOT intersected with financial_entries. Expenses
-- routinely have no client_id, and partially restricting only the
-- client-linked income rows would produce financial totals that look
-- complete but are silently wrong for a restricted viewer — worse than no
-- access at all. A user either sees the whole financial picture or none of
-- it.

-- ---------------------------------------------------------------------------
-- memberships — lifecycle states and explicit client access mode
-- ---------------------------------------------------------------------------
alter table public.memberships drop constraint memberships_status_check;
alter table public.memberships add constraint memberships_status_check
  check (status in ('invited', 'active', 'suspended', 'removed'));

comment on column public.memberships.status is 'invited: pending acceptance. active: normal access. suspended: temporarily blocked (reversible). removed: permanently revoked (kept for history, never DELETEd).';

alter table public.memberships add column client_access_mode text not null default 'all';
alter table public.memberships add constraint memberships_client_access_mode_check
  check (client_access_mode in ('all', 'restricted'));

comment on column public.memberships.client_access_mode is 'all: sees every client in the organization (default — matches current behavior for every existing row). restricted: sees only clients explicitly listed in member_client_access. Explicit column instead of inferring from an empty member_client_access, which would be ambiguous between "no clients" and "all clients".';

-- ---------------------------------------------------------------------------
-- Missing permissions from the phase-1 catalogue.
-- ---------------------------------------------------------------------------
insert into public.permissions (key, module, description) values
  ('members.view',   'members',  'Ver a lista de membros da equipe e seus acessos'),
  ('settings.view',  'settings', 'Ver as configurações da organização'),
  ('settings.manage','settings', 'Editar as configurações da organização')
on conflict (key) do update
  set module = excluded.module,
      description = excluded.description;

-- Owner already gets every permission (cross join in the phase-1 seed) —
-- nothing to do there. Admin already gets everything except
-- organization.manage (exclusion list, not an inclusion list) — the three
-- new permissions above are picked up automatically. Member gets the new
-- members.view (seeing the team directory is reasonable for a regular
-- member) but not settings.* (configuration stays admin-oriented).
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key = 'members.view'
where r.key = 'member' and r.organization_id is null
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- member_client_access — missing index (membership_id already has an
-- implicit index via its FK in most setups, but not guaranteed — add it
-- explicitly), and RLS was too broad: any org member could previously read
-- every membership's client allow-list. Tighten to "your own row, or
-- members.manage".
-- ---------------------------------------------------------------------------
create index member_client_access_membership_id_idx on public.member_client_access (membership_id);

drop policy member_client_access_select on public.member_client_access;
create policy member_client_access_select on public.member_client_access
  for select
  using (
    exists (
      select 1 from public.memberships m
      where m.id = member_client_access.membership_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
    or exists (
      select 1 from public.memberships m
      where m.id = member_client_access.membership_id
        and public.has_permission(m.organization_id, 'members.manage')
    )
  );

-- ---------------------------------------------------------------------------
-- can_view_client() — the row-level client-visibility check, layered on
-- top of (never instead of) the module permission check. security definer
-- so it can read memberships/member_client_access regardless of the
-- caller's own RLS visibility into those tables, but it is driven only by
-- auth.uid() — never by a client-supplied value — so it doesn't reopen the
-- trust gap RLS exists to close.
-- ---------------------------------------------------------------------------
create function public.can_view_client(p_client_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.clients c
    join public.memberships m
      on m.organization_id = c.organization_id
     and m.user_id = auth.uid()
     and m.status = 'active'
    where c.id = p_client_id
      and (
        m.client_access_mode = 'all'
        or exists (
          select 1 from public.member_client_access mca
          where mca.membership_id = m.id and mca.client_id = c.id
        )
      )
  );
$$;

comment on function public.can_view_client is 'Row-level client visibility for a membership with client_access_mode = restricted. Always combined with a has_permission(...) module check by the calling policy — this function alone does not grant module access.';

-- ---------------------------------------------------------------------------
-- clients — add the row-level restriction to the existing permission checks.
-- ---------------------------------------------------------------------------
drop policy clients_select on public.clients;
create policy clients_select on public.clients
  for select
  using (public.has_permission(organization_id, 'clients.view') and public.can_view_client(id));

drop policy clients_update on public.clients;
create policy clients_update on public.clients
  for update
  using (public.has_permission(organization_id, 'clients.manage') and public.can_view_client(id))
  with check (public.has_permission(organization_id, 'clients.manage'));

-- clients_insert is unchanged: a brand-new client has no id to check
-- can_view_client against yet — creation stays gated by clients.manage alone.

-- ---------------------------------------------------------------------------
-- tasks — same pattern (this is the activation the phase-4 migration left
-- commented out and ready).
-- ---------------------------------------------------------------------------
drop policy tasks_select on public.tasks;
create policy tasks_select on public.tasks
  for select
  using (public.has_permission(organization_id, 'tasks.view') and public.can_view_client(client_id));

drop policy tasks_insert on public.tasks;
create policy tasks_insert on public.tasks
  for insert
  with check (public.has_permission(organization_id, 'tasks.manage') and public.can_view_client(client_id));

drop policy tasks_update on public.tasks;
create policy tasks_update on public.tasks
  for update
  using (public.has_permission(organization_id, 'tasks.manage') and public.can_view_client(client_id))
  with check (public.has_permission(organization_id, 'tasks.manage') and public.can_view_client(client_id));

-- ---------------------------------------------------------------------------
-- contracts — same pattern.
-- ---------------------------------------------------------------------------
drop policy contracts_select on public.contracts;
create policy contracts_select on public.contracts
  for select
  using (public.has_permission(organization_id, 'contracts.view') and public.can_view_client(client_id));

drop policy contracts_insert on public.contracts;
create policy contracts_insert on public.contracts
  for insert
  with check (public.has_permission(organization_id, 'contracts.manage') and public.can_view_client(client_id));

drop policy contracts_update on public.contracts;
create policy contracts_update on public.contracts
  for update
  using (public.has_permission(organization_id, 'contracts.manage') and public.can_view_client(client_id))
  with check (public.has_permission(organization_id, 'contracts.manage') and public.can_view_client(client_id));

-- financial_entries, financial_recurrences, organization_financial_settings,
-- contract_installments, client_services: intentionally untouched — see the
-- Financeiro decision above, and contract_installments/client_services ride
-- along with their parent contract/client's visibility already.

-- ---------------------------------------------------------------------------
-- Last-Owner protection — defense in depth alongside the application-layer
-- check (modules/identity). Blocks the specific destructive transitions
-- (losing the owner role, or leaving active status) when it would leave the
-- organization with zero active Owners.
-- ---------------------------------------------------------------------------
create function public.prevent_last_owner_removal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_role_id uuid;
  v_remaining_owners int;
begin
  select id into v_owner_role_id from public.roles where key = 'owner' and organization_id is null;

  if old.role_id = v_owner_role_id and old.status = 'active' then
    if (new.role_id is distinct from old.role_id and new.role_id <> v_owner_role_id)
       or (new.status is distinct from old.status and new.status <> 'active') then
      select count(*) into v_remaining_owners
      from public.memberships
      where organization_id = old.organization_id
        and role_id = v_owner_role_id
        and status = 'active'
        and id <> old.id;

      if v_remaining_owners = 0 then
        raise exception 'Cannot remove, suspend, or demote the last active Owner of an organization';
      end if;
    end if;
  end if;

  return new;
end;
$$;

create trigger memberships_prevent_last_owner_removal
  before update on public.memberships
  for each row execute function public.prevent_last_owner_removal();
