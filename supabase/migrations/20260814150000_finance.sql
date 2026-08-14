-- BBOLD Flow — Financial module (phase 5)
--
-- Operational cash management, not accounting: no ledger, no chart of
-- accounts, no fiscal integration. financial_entries is the movement,
-- financial_recurrences is the model that generates monthly entries,
-- financial_categories groups both, organization_financial_settings holds
-- the one-row-per-organization goal/opening-balance config.
--
-- Decision — `overdue` is NOT a stored status. It's fully derivable
-- (due_date < today AND paid_at IS NULL AND status NOT IN ('paid','cancelled'))
-- and storing it would just be a second source of truth that drifts the
-- moment "today" changes without a write happening. The UI computes it
-- (modules/finance/domain/rules.ts) and displays a synthetic "overdue"
-- badge state without ever persisting it.
--
-- Decision — competence is `date`, always normalized to the first day of
-- the month (e.g. 2026-08-01 for "Agosto/2026"), never free text.
--
-- Decision — contract_id is added as a plain nullable uuid column with NO
-- foreign key yet, because public.contracts doesn't exist until phase 6.
-- The FK is added there via ALTER TABLE, not invented here against a
-- table that doesn't exist.

-- ---------------------------------------------------------------------------
-- financial_categories
-- ---------------------------------------------------------------------------
create table public.financial_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,

  name text not null,
  type text not null,

  active boolean not null default true,
  sort_order int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint financial_categories_type_check check (type in ('income', 'expense')),
  constraint financial_categories_org_type_name_unique unique (organization_id, type, name)
);

comment on table public.financial_categories is 'Configurable income/expense categories. Never hardcoded in the UI — editable later from Configurações.';

create index financial_categories_organization_id_idx on public.financial_categories (organization_id);

create trigger set_updated_at before update on public.financial_categories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- financial_recurrences — the model; financial_entries are its instances
-- ---------------------------------------------------------------------------
create table public.financial_recurrences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,

  client_id uuid references public.clients (id) on delete set null,
  category_id uuid not null references public.financial_categories (id) on delete restrict,

  type text not null,
  description text not null,
  amount numeric(14, 2) not null,

  frequency text not null default 'monthly',
  start_date date not null,
  end_date date,
  day_of_month int,

  active boolean not null default true,

  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint financial_recurrences_type_check check (type in ('income', 'expense')),
  constraint financial_recurrences_frequency_check check (frequency in ('monthly', 'one_time', 'installment')),
  constraint financial_recurrences_amount_check check (amount > 0),
  constraint financial_recurrences_day_of_month_check check (day_of_month is null or (day_of_month between 1 and 28)),
  constraint financial_recurrences_dates_check check (end_date is null or end_date >= start_date)
);

comment on table public.financial_recurrences is 'The model that generates monthly financial_entries (e.g. a client''s recurring fee). Not a general-purpose scheduler — monthly is the only frequency actually generated in this phase.';

create index financial_recurrences_organization_id_idx on public.financial_recurrences (organization_id);
create index financial_recurrences_client_id_idx on public.financial_recurrences (client_id);

create trigger set_updated_at before update on public.financial_recurrences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- financial_entries
-- ---------------------------------------------------------------------------
create table public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,

  client_id uuid references public.clients (id) on delete set null,
  contract_id uuid, -- FK added in phase 6 migration once public.contracts exists

  type text not null,
  category_id uuid references public.financial_categories (id) on delete restrict,

  description text not null,
  amount numeric(14, 2) not null,

  competence_month date not null,
  due_date date,
  paid_at date,

  status text not null default 'pending',

  recurrence_id uuid references public.financial_recurrences (id) on delete set null,

  requires_invoice boolean not null default false,
  invoice_status text not null default 'not_required',
  invoice_issued_at date,

  notes text,

  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint financial_entries_type_check check (type in ('income', 'expense')),
  constraint financial_entries_status_check check (status in ('planned', 'pending', 'paid', 'cancelled')),
  constraint financial_entries_invoice_status_check check (invoice_status in ('not_required', 'pending', 'issued')),
  constraint financial_entries_amount_check check (amount > 0),
  constraint financial_entries_competence_is_month_start check (extract(day from competence_month) = 1),
  constraint financial_entries_invoice_consistency check (
    (requires_invoice = false and invoice_status = 'not_required')
    or (requires_invoice = true and invoice_status in ('pending', 'issued'))
  )
);

comment on table public.financial_entries is 'A single financial movement. competence (accrual month), due_date (when it''s owed) and paid_at (when it was actually settled) are independent — never collapse them.';

create index financial_entries_organization_id_idx on public.financial_entries (organization_id);
create index financial_entries_competence_month_idx on public.financial_entries (organization_id, competence_month);
create index financial_entries_due_date_idx on public.financial_entries (organization_id, due_date);
create index financial_entries_type_idx on public.financial_entries (organization_id, type);
create index financial_entries_status_idx on public.financial_entries (organization_id, status);
create index financial_entries_client_id_idx on public.financial_entries (client_id);
create index financial_entries_category_id_idx on public.financial_entries (category_id);
create index financial_entries_paid_at_idx on public.financial_entries (organization_id, paid_at);

-- One entry per recurrence per competence — the mechanism that prevents
-- "gerar lançamentos do mês" from ever double-creating.
create unique index financial_entries_recurrence_competence_uidx
  on public.financial_entries (recurrence_id, competence_month)
  where recurrence_id is not null;

create trigger set_updated_at before update on public.financial_entries
  for each row execute function public.set_updated_at();

-- Normalizes the requires_invoice/invoice_status/invoice_issued_at trio so
-- every write path (UI action, future automation, direct SQL) stays
-- consistent, the same way tasks.completed_at is centralized in phase 4.
create function public.sync_financial_entry_invoice()
returns trigger
language plpgsql
as $$
begin
  if new.requires_invoice = false then
    new.invoice_status = 'not_required';
    new.invoice_issued_at = null;
  else
    if new.invoice_status = 'not_required' then
      new.invoice_status = 'pending';
    end if;
    if new.invoice_status = 'issued' and new.invoice_issued_at is null then
      new.invoice_issued_at = current_date;
    elsif new.invoice_status <> 'issued' then
      new.invoice_issued_at = null;
    end if;
  end if;
  return new;
end;
$$;

create trigger financial_entries_sync_invoice
  before insert or update on public.financial_entries
  for each row execute function public.sync_financial_entry_invoice();

-- Cross-entity consistency: client/category belong to the entry's
-- organization, and category.type matches entry.type — same approach as
-- tasks/client_services in earlier phases.
create function public.check_financial_entry_consistency()
returns trigger
language plpgsql
as $$
declare
  v_client_org uuid;
  v_category_org uuid;
  v_category_type text;
begin
  if new.client_id is not null then
    select organization_id into v_client_org from public.clients where id = new.client_id;
    if v_client_org is null or v_client_org <> new.organization_id then
      raise exception 'financial_entries: client must belong to the entry''s organization';
    end if;
  end if;

  if new.category_id is not null then
    select organization_id, type into v_category_org, v_category_type
      from public.financial_categories where id = new.category_id;
    if v_category_org is null or v_category_org <> new.organization_id then
      raise exception 'financial_entries: category must belong to the entry''s organization';
    end if;
    if v_category_type <> new.type then
      raise exception 'financial_entries: category type (%) does not match entry type (%)', v_category_type, new.type;
    end if;
  end if;

  return new;
end;
$$;

create trigger financial_entries_check_consistency
  before insert or update on public.financial_entries
  for each row execute function public.check_financial_entry_consistency();

create function public.check_financial_recurrence_consistency()
returns trigger
language plpgsql
as $$
declare
  v_client_org uuid;
  v_category_org uuid;
  v_category_type text;
begin
  if new.client_id is not null then
    select organization_id into v_client_org from public.clients where id = new.client_id;
    if v_client_org is null or v_client_org <> new.organization_id then
      raise exception 'financial_recurrences: client must belong to the recurrence''s organization';
    end if;
  end if;

  select organization_id, type into v_category_org, v_category_type
    from public.financial_categories where id = new.category_id;
  if v_category_org is null or v_category_org <> new.organization_id then
    raise exception 'financial_recurrences: category must belong to the recurrence''s organization';
  end if;
  if v_category_type <> new.type then
    raise exception 'financial_recurrences: category type (%) does not match recurrence type (%)', v_category_type, new.type;
  end if;

  return new;
end;
$$;

create trigger financial_recurrences_check_consistency
  before insert or update on public.financial_recurrences
  for each row execute function public.check_financial_recurrence_consistency();

-- ---------------------------------------------------------------------------
-- organization_financial_settings — one row per organization
-- ---------------------------------------------------------------------------
create table public.organization_financial_settings (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  monthly_revenue_goal numeric(14, 2) not null default 0,
  opening_balance numeric(14, 2) not null default 0,
  opening_balance_date date not null default current_date,
  updated_at timestamptz not null default now(),

  constraint organization_financial_settings_goal_check check (monthly_revenue_goal >= 0)
);

comment on table public.organization_financial_settings is 'One row per organization. opening_balance + opening_balance_date is what makes "Saldo em caixa" a real, non-invented number: opening_balance + (paid income) - (paid expenses) since that date.';

create trigger set_updated_at before update on public.organization_financial_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.financial_categories enable row level security;
alter table public.financial_recurrences enable row level security;
alter table public.financial_entries enable row level security;
alter table public.organization_financial_settings enable row level security;

create policy financial_categories_select on public.financial_categories
  for select using (public.has_permission(organization_id, 'finance.view'));
create policy financial_categories_manage on public.financial_categories
  for all
  using (public.has_permission(organization_id, 'finance.manage'))
  with check (public.has_permission(organization_id, 'finance.manage'));

create policy financial_recurrences_select on public.financial_recurrences
  for select using (public.has_permission(organization_id, 'finance.view'));
create policy financial_recurrences_manage on public.financial_recurrences
  for all
  using (public.has_permission(organization_id, 'finance.manage'))
  with check (public.has_permission(organization_id, 'finance.manage'));

create policy financial_entries_select on public.financial_entries
  for select using (public.has_permission(organization_id, 'finance.view'));
create policy financial_entries_insert on public.financial_entries
  for insert with check (public.has_permission(organization_id, 'finance.manage'));
create policy financial_entries_update on public.financial_entries
  for update
  using (public.has_permission(organization_id, 'finance.manage'))
  with check (public.has_permission(organization_id, 'finance.manage'));
-- No delete policy: cancellation is status = 'cancelled', never DELETE.

create policy organization_financial_settings_select on public.organization_financial_settings
  for select using (public.has_permission(organization_id, 'finance.view'));
create policy organization_financial_settings_manage on public.organization_financial_settings
  for all
  using (public.has_permission(organization_id, 'finance.manage'))
  with check (public.has_permission(organization_id, 'finance.manage'));
