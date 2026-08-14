-- BBOLD Flow — Identity foundation
-- organizations, users, roles, permissions, role_permissions, memberships
-- Multi-tenant model: every business table will carry organization_id and
-- be scoped through membership-based RLS (see 20260814120100_identity_rls.sql).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.organizations is 'Tenant boundary. Every business entity belongs to one organization.';

-- ---------------------------------------------------------------------------
-- users (public.users.id = auth.users.id — no parallel identity)
-- ---------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.users is 'Mirrors auth.users 1:1. id is always auth.users.id — never a parallel id.';

-- Keep public.users in sync with auth.users automatically.
create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
    set email = new.email,
        updated_at = now()
    where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_updated
  after update on auth.users
  for each row execute function public.handle_auth_user_updated();

-- ---------------------------------------------------------------------------
-- roles (not a fixed enum — organizations may define custom roles later)
-- ---------------------------------------------------------------------------
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  key text not null,
  name text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roles_key_scope_unique unique (organization_id, key)
);

comment on table public.roles is 'System roles have organization_id = null (owner/admin/member) and are available to every organization. Custom per-organization roles can be added later.';

-- ---------------------------------------------------------------------------
-- permissions (fixed catalogue, module-scoped keys like "clients.manage")
-- ---------------------------------------------------------------------------
create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  module text not null,
  description text,
  created_at timestamptz not null default now()
);

comment on table public.permissions is 'Flat catalogue of grantable permission keys, grouped by module for display purposes.';

-- ---------------------------------------------------------------------------
-- role_permissions
-- ---------------------------------------------------------------------------
create table public.role_permissions (
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  primary key (role_id, permission_id)
);

-- ---------------------------------------------------------------------------
-- memberships (organization <-> user, through a role)
-- ---------------------------------------------------------------------------
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid references public.users (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete restrict,
  status text not null default 'active',
  invited_email text,
  invited_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint memberships_status_check check (status in ('invited', 'active', 'disabled')),
  constraint memberships_org_user_unique unique (organization_id, user_id),
  constraint memberships_user_or_invite check (
    (status = 'invited' and user_id is null and invited_email is not null)
    or (status <> 'invited' and user_id is not null)
  )
);

comment on table public.memberships is 'A user''s membership in one organization, carrying the role that drives permissions. Pending invites have user_id null and invited_email set until accepted.';

-- ---------------------------------------------------------------------------
-- member_client_access — prepares per-client visibility restriction
-- (clients table itself ships in a later phase; kept here since it is part
-- of the identity/authorization model, not the clients domain).
-- ---------------------------------------------------------------------------
create table public.member_client_access (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships (id) on delete cascade,
  client_id uuid not null,
  created_at timestamptz not null default now(),
  constraint member_client_access_unique unique (membership_id, client_id)
);

comment on table public.member_client_access is 'Optional allow-list restricting which clients a membership may see. Empty = no restriction (sees every client in the organization). client_id references public.clients(id), added as a real FK once the clients table exists (phase 3).';

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.users
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.roles
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.memberships
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- indexes
-- ---------------------------------------------------------------------------
create index memberships_user_id_idx on public.memberships (user_id);
create index memberships_organization_id_idx on public.memberships (organization_id);
create index roles_organization_id_idx on public.roles (organization_id);
create index role_permissions_permission_id_idx on public.role_permissions (permission_id);
create index member_client_access_client_id_idx on public.member_client_access (client_id);
