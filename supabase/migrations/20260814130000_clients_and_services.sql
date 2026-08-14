-- BBOLD Flow — Clients + Services (phase 3)
--
-- Client is the aggregate root that Demandas, Contratos, Financeiro and
-- Equipe will all hang off of in later phases. Services is an
-- organization-wide catalogue; client_services is the join that records
-- which services a client currently has (or had), owned conceptually by the
-- Client aggregate — the UI never writes to client_services directly, only
-- through the clients application layer.

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,

  name text not null,
  legal_name text,

  document_type text,
  document_number text,

  email text,
  phone text,
  website text,

  status text not null default 'prospect',
  client_type text not null default 'project',

  start_date date,
  notes text,

  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint clients_status_check check (status in ('prospect', 'active', 'paused', 'closed')),
  constraint clients_client_type_check check (client_type in ('recurring', 'project', 'internal')),
  constraint clients_document_type_check check (document_type is null or document_type in ('cpf', 'cnpj', 'other'))
);

comment on table public.clients is 'Aggregate root for a client of the agency. Every future module (tasks, contracts, financial_entries) references clients.id.';

create index clients_organization_id_idx on public.clients (organization_id);
create index clients_status_idx on public.clients (organization_id, status);

create trigger set_updated_at before update on public.clients
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- services — organization-wide catalogue (Social Media, Website, ...)
-- ---------------------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,

  name text not null,
  slug text not null,
  description text,
  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint services_org_slug_unique unique (organization_id, slug)
);

comment on table public.services is 'Organization-wide catalogue of service offerings. Not hardcoded in the UI.';

create index services_organization_id_idx on public.services (organization_id);

create trigger set_updated_at before update on public.services
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- client_services — join between a client and the services they have
-- ---------------------------------------------------------------------------
create table public.client_services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete restrict,

  status text not null default 'active',
  started_at date,
  ended_at date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint client_services_status_check check (status in ('active', 'paused', 'ended')),
  constraint client_services_unique unique (client_id, service_id)
);

comment on table public.client_services is 'Which services a client currently has (or had). Written only through the clients application layer, never directly from the UI.';

create index client_services_client_id_idx on public.client_services (client_id);
create index client_services_service_id_idx on public.client_services (service_id);
create index client_services_organization_id_idx on public.client_services (organization_id);

create trigger set_updated_at before update on public.client_services
  for each row execute function public.set_updated_at();

-- Guarantee client and service belong to the same organization — enforced
-- in the database, not just in application code, via a trigger (a plain FK
-- can't express "same organization_id on both sides").
create function public.check_client_service_same_org()
returns trigger
language plpgsql
as $$
declare
  v_client_org uuid;
  v_service_org uuid;
begin
  select organization_id into v_client_org from public.clients where id = new.client_id;
  select organization_id into v_service_org from public.services where id = new.service_id;

  if v_client_org is null or v_service_org is null or v_client_org <> v_service_org then
    raise exception 'client_services: client and service must belong to the same organization';
  end if;

  if new.organization_id <> v_client_org then
    raise exception 'client_services: organization_id must match the client''s organization';
  end if;

  return new;
end;
$$;

create trigger client_services_same_org
  before insert or update on public.client_services
  for each row execute function public.check_client_service_same_org();

-- ---------------------------------------------------------------------------
-- member_client_access.client_id — now that clients exists, wire the real FK
-- prepared (but left loose) in the phase 1 migration.
-- ---------------------------------------------------------------------------
alter table public.member_client_access
  add constraint member_client_access_client_id_fkey
  foreign key (client_id) references public.clients (id) on delete cascade;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.clients enable row level security;
alter table public.services enable row level security;
alter table public.client_services enable row level security;

create policy clients_select on public.clients
  for select
  using (public.has_permission(organization_id, 'clients.view'));

create policy clients_insert on public.clients
  for insert
  with check (public.has_permission(organization_id, 'clients.manage'));

create policy clients_update on public.clients
  for update
  using (public.has_permission(organization_id, 'clients.manage'))
  with check (public.has_permission(organization_id, 'clients.manage'));

-- No delete policy: clients are closed (status = 'closed'), never deleted.

create policy services_select on public.services
  for select
  using (public.is_member_of(organization_id));

create policy services_manage on public.services
  for all
  using (public.has_permission(organization_id, 'clients.manage'))
  with check (public.has_permission(organization_id, 'clients.manage'));

create policy client_services_select on public.client_services
  for select
  using (public.has_permission(organization_id, 'clients.view'));

create policy client_services_manage on public.client_services
  for all
  using (public.has_permission(organization_id, 'clients.manage'))
  with check (public.has_permission(organization_id, 'clients.manage'));
