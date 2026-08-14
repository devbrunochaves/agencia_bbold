-- BBOLD Flow — Contracts (phase 6)
--
-- contract_templates → contracts → contract_installments, plus the
-- incremental additions phase 6 needs on tables created earlier:
-- organizations (contractor/BBOLD legal data), clients (address), and the
-- FKs financial_entries.contract_id / financial_recurrences.contract_id
-- that phases 5 and 1 deliberately left unset until this table existed.
--
-- Decision — `expired` is NOT a stored status, same precedent as
-- `overdue` in financial_entries (phase 5): it's fully derivable
-- (status = 'signed' AND end_date < today) and storing it would just be a
-- second source of truth that drifts without a write happening. The UI
-- computes it (modules/contracts/domain/rules.ts).
--
-- Decision — contract_templates.content is plain `text` with {{placeholder}}
-- tokens, not structured jsonb. A flat string is simpler, and evolving it
-- just means adding a new placeholder to the (centralized) template engine
-- — jsonb would buy structure we have no current use for.
--
-- Decision — service/client coherence on a contract (§25 "se service_id
-- informado, garantir coerência com o cliente quando aplicável") is NOT a
-- hard DB constraint: a contract can legitimately be the moment a client
-- picks up a service they didn't have in client_services yet. Enforced at
-- the DB level would block that valid case. Only same-organization is
-- enforced in the database; service/client business coherence stays a
-- judgment call in the UI (client's current services are offered first).

-- ---------------------------------------------------------------------------
-- organizations — contractor (BBOLD) legal data, added incrementally.
-- Nullable: existing rows aren't broken, and this data is genuinely
-- optional until someone fills it in from Configurações (a future phase).
-- ---------------------------------------------------------------------------
alter table public.organizations
  add column legal_name text,
  add column trade_name text,
  add column document_number text,
  add column address_street text,
  add column address_number text,
  add column address_complement text,
  add column address_neighborhood text,
  add column address_city text,
  add column address_state text,
  add column address_zip_code text,
  add column representative_name text,
  add column representative_document text,
  add column default_forum text;

-- ---------------------------------------------------------------------------
-- clients — address, added incrementally for the same reason.
-- ---------------------------------------------------------------------------
alter table public.clients
  add column address_street text,
  add column address_number text,
  add column address_complement text,
  add column address_neighborhood text,
  add column address_city text,
  add column address_state text,
  add column address_zip_code text,
  add column representative_name text,
  add column representative_document text;

-- ---------------------------------------------------------------------------
-- contract_templates
-- ---------------------------------------------------------------------------
create table public.contract_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,

  name text not null,
  slug text not null,
  service_id uuid references public.services (id) on delete set null,

  content text not null,

  active boolean not null default true,

  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint contract_templates_org_slug_unique unique (organization_id, slug)
);

comment on table public.contract_templates is 'content holds {{placeholder}} tokens rendered by modules/contracts/domain/template-engine.ts. Editing a template never touches contracts already created from it — see contracts.content_snapshot.';

create index contract_templates_organization_id_idx on public.contract_templates (organization_id);

create trigger set_updated_at before update on public.contract_templates
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- contracts
-- ---------------------------------------------------------------------------
create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,

  client_id uuid not null references public.clients (id) on delete restrict,
  service_id uuid references public.services (id) on delete set null,
  template_id uuid references public.contract_templates (id) on delete set null,

  title text not null,
  status text not null default 'draft',
  contract_number text,

  start_date date not null,
  end_date date,

  billing_type text not null,
  total_amount numeric(14, 2),
  recurring_amount numeric(14, 2),
  billing_day int,
  payment_method text not null default 'pix',
  installments_count int,

  city text not null,
  signature_date date,

  client_snapshot jsonb not null,
  contractor_snapshot jsonb not null,
  content_snapshot text not null,

  sent_at timestamptz,
  signed_at timestamptz,
  cancelled_at timestamptz,

  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint contracts_status_check check (status in ('draft', 'sent', 'signed', 'cancelled')),
  constraint contracts_billing_type_check check (billing_type in ('one_time', 'installment', 'recurring')),
  constraint contracts_payment_method_check check (payment_method in ('pix', 'bank_transfer', 'credit_card', 'cash', 'other')),
  constraint contracts_dates_check check (end_date is null or end_date >= start_date),
  constraint contracts_billing_day_check check (billing_day is null or billing_day between 1 and 28),
  constraint contracts_billing_fields_check check (
    (billing_type in ('one_time', 'installment') and total_amount is not null and total_amount > 0)
    or (billing_type = 'recurring' and recurring_amount is not null and recurring_amount > 0 and billing_day is not null)
  )
);

comment on table public.contracts is 'client_snapshot/contractor_snapshot/content_snapshot freeze, at creation time, exactly what the parties and the document said — later edits to clients/organizations/contract_templates never retroactively change an existing contract.';

create index contracts_organization_id_idx on public.contracts (organization_id);
create index contracts_client_id_idx on public.contracts (client_id);
create index contracts_status_idx on public.contracts (organization_id, status);
create index contracts_signed_at_idx on public.contracts (organization_id, signed_at);

create trigger set_updated_at before update on public.contracts
  for each row execute function public.set_updated_at();

-- Status timestamps follow status automatically — same centralization
-- pattern as tasks.completed_at (phase 4) and the invoice trio (phase 5).
create function public.sync_contract_status_timestamps()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'sent' and (tg_op = 'INSERT' or old.status is distinct from 'sent') and new.sent_at is null then
    new.sent_at = now();
  end if;
  if new.status = 'signed' and (tg_op = 'INSERT' or old.status is distinct from 'signed') and new.signed_at is null then
    new.signed_at = now();
  end if;
  if new.status = 'cancelled' and (tg_op = 'INSERT' or old.status is distinct from 'cancelled') and new.cancelled_at is null then
    new.cancelled_at = now();
  end if;
  return new;
end;
$$;

create trigger contracts_sync_status_timestamps
  before insert or update on public.contracts
  for each row execute function public.sync_contract_status_timestamps();

-- Cross-entity consistency: client/service/template belong to the
-- contract's organization (same-organization only — see decision above
-- about NOT enforcing service/client business coherence here).
create function public.check_contract_consistency()
returns trigger
language plpgsql
as $$
declare
  v_client_org uuid;
  v_service_org uuid;
  v_template_org uuid;
begin
  select organization_id into v_client_org from public.clients where id = new.client_id;
  if v_client_org is null or v_client_org <> new.organization_id then
    raise exception 'contracts: client must belong to the contract''s organization';
  end if;

  if new.service_id is not null then
    select organization_id into v_service_org from public.services where id = new.service_id;
    if v_service_org is null or v_service_org <> new.organization_id then
      raise exception 'contracts: service must belong to the contract''s organization';
    end if;
  end if;

  if new.template_id is not null then
    select organization_id into v_template_org from public.contract_templates where id = new.template_id;
    if v_template_org is null or v_template_org <> new.organization_id then
      raise exception 'contracts: template must belong to the contract''s organization';
    end if;
  end if;

  return new;
end;
$$;

create trigger contracts_check_consistency
  before insert or update on public.contracts
  for each row execute function public.check_contract_consistency();

-- ---------------------------------------------------------------------------
-- contract_installments
-- ---------------------------------------------------------------------------
create table public.contract_installments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  contract_id uuid not null references public.contracts (id) on delete cascade,

  installment_number int not null,
  amount numeric(14, 2) not null,
  due_date date not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint contract_installments_number_check check (installment_number > 0),
  constraint contract_installments_amount_check check (amount > 0),
  constraint contract_installments_unique unique (contract_id, installment_number)
);

comment on table public.contract_installments is 'Sum of amounts should equal contracts.total_amount for installment contracts — validated in the application layer (modules/contracts/domain/rules.ts), not a DB constraint, since it depends on all rows existing together.';

create index contract_installments_contract_id_idx on public.contract_installments (contract_id);
create index contract_installments_organization_id_idx on public.contract_installments (organization_id);

create trigger set_updated_at before update on public.contract_installments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Wire up the FKs that phases 1 and 5 deliberately left unset.
-- ---------------------------------------------------------------------------
alter table public.financial_entries
  add constraint financial_entries_contract_id_fkey
  foreign key (contract_id) references public.contracts (id) on delete set null;

alter table public.financial_recurrences
  add column contract_id uuid references public.contracts (id) on delete set null;

create index financial_recurrences_contract_id_idx on public.financial_recurrences (contract_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.contract_templates enable row level security;
alter table public.contracts enable row level security;
alter table public.contract_installments enable row level security;

create policy contract_templates_select on public.contract_templates
  for select using (public.has_permission(organization_id, 'contracts.view'));
create policy contract_templates_manage on public.contract_templates
  for all
  using (public.has_permission(organization_id, 'contracts.manage'))
  with check (public.has_permission(organization_id, 'contracts.manage'));

create policy contracts_select on public.contracts
  for select using (public.has_permission(organization_id, 'contracts.view'));
create policy contracts_insert on public.contracts
  for insert with check (public.has_permission(organization_id, 'contracts.manage'));
create policy contracts_update on public.contracts
  for update
  using (public.has_permission(organization_id, 'contracts.manage'))
  with check (public.has_permission(organization_id, 'contracts.manage'));
-- No delete policy: cancellation is status = 'cancelled', never DELETE.

create policy contract_installments_select on public.contract_installments
  for select using (public.has_permission(organization_id, 'contracts.view'));
create policy contract_installments_manage on public.contract_installments
  for all
  using (public.has_permission(organization_id, 'contracts.manage'))
  with check (public.has_permission(organization_id, 'contracts.manage'));
