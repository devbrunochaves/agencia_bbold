-- BBOLD Flow — RLS for identity tables
--
-- Core rule: a user may only read/write data belonging to an organization
-- where they hold an active membership. Never trust an organization_id sent
-- from the browser — every policy below re-derives access from
-- auth.uid() + public.memberships on the server side.
--
-- Two security-definer helper functions break the RLS self-reference that
-- would otherwise happen when memberships' own policy needs to query
-- memberships: they run with the function owner's privileges, bypassing RLS
-- internally, while still being driven only by auth.uid() (never by a
-- client-supplied value), so they don't reintroduce a trust gap.

create function public.is_member_of(p_organization_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create function public.has_permission(p_organization_id uuid, p_permission_key text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    join public.role_permissions rp on rp.role_id = m.role_id
    join public.permissions p on p.id = rp.permission_id
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and p.key = p_permission_key
  );
$$;

comment on function public.is_member_of is 'True if the current auth.uid() has an active membership in the given organization.';
comment on function public.has_permission is 'True if the current auth.uid() has, through their active membership''s role, the given permission key in the given organization.';

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
alter table public.organizations enable row level security;

create policy organizations_select on public.organizations
  for select
  using (public.is_member_of(id));

create policy organizations_update on public.organizations
  for update
  using (public.has_permission(id, 'organization.manage'))
  with check (public.has_permission(id, 'organization.manage'));

-- Organization creation happens through a service-role bootstrap flow
-- (server-side, not exposed to the browser), so no insert policy for
-- authenticated users is defined here.

-- ---------------------------------------------------------------------------
-- users — a user always sees their own row, plus anyone they share an
-- organization with (needed for member pickers, avatars, assignee lists).
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;

create policy users_select_self on public.users
  for select
  using (id = auth.uid());

create policy users_select_org_peers on public.users
  for select
  using (
    exists (
      select 1
      from public.memberships mine
      join public.memberships theirs on theirs.organization_id = mine.organization_id
      where mine.user_id = auth.uid()
        and mine.status = 'active'
        and theirs.user_id = public.users.id
        and theirs.status = 'active'
    )
  );

create policy users_update_self on public.users
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- roles — system roles (organization_id is null) are readable by anyone
-- authenticated; org-specific custom roles are scoped like everything else.
-- ---------------------------------------------------------------------------
alter table public.roles enable row level security;

create policy roles_select on public.roles
  for select
  using (
    organization_id is null
    or public.is_member_of(organization_id)
  );

create policy roles_manage on public.roles
  for all
  using (
    organization_id is not null
    and public.has_permission(organization_id, 'members.manage')
  )
  with check (
    organization_id is not null
    and public.has_permission(organization_id, 'members.manage')
  );

-- ---------------------------------------------------------------------------
-- permissions — global read-only catalogue.
-- ---------------------------------------------------------------------------
alter table public.permissions enable row level security;

create policy permissions_select on public.permissions
  for select
  using (auth.uid() is not null);

-- ---------------------------------------------------------------------------
-- role_permissions — readable by members of the role's organization (or by
-- anyone, for system roles), manageable only by members.manage holders.
-- ---------------------------------------------------------------------------
alter table public.role_permissions enable row level security;

create policy role_permissions_select on public.role_permissions
  for select
  using (
    exists (
      select 1 from public.roles r
      where r.id = role_permissions.role_id
        and (r.organization_id is null or public.is_member_of(r.organization_id))
    )
  );

create policy role_permissions_manage on public.role_permissions
  for all
  using (
    exists (
      select 1 from public.roles r
      where r.id = role_permissions.role_id
        and r.organization_id is not null
        and public.has_permission(r.organization_id, 'members.manage')
    )
  )
  with check (
    exists (
      select 1 from public.roles r
      where r.id = role_permissions.role_id
        and r.organization_id is not null
        and public.has_permission(r.organization_id, 'members.manage')
    )
  );

-- ---------------------------------------------------------------------------
-- memberships
-- ---------------------------------------------------------------------------
alter table public.memberships enable row level security;

create policy memberships_select on public.memberships
  for select
  using (public.is_member_of(organization_id));

create policy memberships_manage on public.memberships
  for all
  using (public.has_permission(organization_id, 'members.manage'))
  with check (public.has_permission(organization_id, 'members.manage'));

-- ---------------------------------------------------------------------------
-- member_client_access
-- ---------------------------------------------------------------------------
alter table public.member_client_access enable row level security;

create policy member_client_access_select on public.member_client_access
  for select
  using (
    exists (
      select 1 from public.memberships m
      where m.id = member_client_access.membership_id
        and public.is_member_of(m.organization_id)
    )
  );

create policy member_client_access_manage on public.member_client_access
  for all
  using (
    exists (
      select 1 from public.memberships m
      where m.id = member_client_access.membership_id
        and public.has_permission(m.organization_id, 'members.manage')
    )
  )
  with check (
    exists (
      select 1 from public.memberships m
      where m.id = member_client_access.membership_id
        and public.has_permission(m.organization_id, 'members.manage')
    )
  );
