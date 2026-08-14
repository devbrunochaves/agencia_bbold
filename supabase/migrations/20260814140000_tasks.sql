-- BBOLD Flow — Tasks / Demandas (phase 4)
--
-- A task is the operational unit of the agency: what needs to be done, for
-- which client, by whom, by when. Reuses the tasks.view/tasks.manage
-- permissions already seeded in phase 1 — no new permission catalogue entry
-- needed.

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,

  client_id uuid not null references public.clients (id) on delete restrict,
  service_id uuid references public.services (id) on delete set null,

  title text not null,
  description text,

  status text not null default 'backlog',
  priority text not null default 'normal',

  assignee_id uuid references public.users (id) on delete set null,

  due_date date,
  completed_at timestamptz,

  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tasks_status_check check (status in (
    'backlog', 'todo', 'in_progress', 'internal_review', 'waiting_client',
    'changes_requested', 'approved', 'completed', 'cancelled'
  )),
  constraint tasks_priority_check check (priority in ('none', 'normal', 'high', 'urgent'))
);

comment on table public.tasks is 'Operational demand: what needs to be done, for which client, by whom, by when. due_date has no time component — the product has no delivery-time concept yet, so date avoids unnecessary timezone handling.';

create index tasks_organization_id_idx on public.tasks (organization_id);
create index tasks_client_id_idx on public.tasks (client_id);
create index tasks_assignee_id_idx on public.tasks (assignee_id);
create index tasks_status_idx on public.tasks (organization_id, status);
create index tasks_due_date_idx on public.tasks (organization_id, due_date);

create trigger set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- completed_at follows status automatically — centralized here so every
-- write path (UI, future automations, direct SQL) gets it right, instead of
-- relying on the application layer to remember to set/clear it.
-- ---------------------------------------------------------------------------
create function public.sync_task_completed_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'completed' and (old.status is distinct from 'completed') then
    new.completed_at = now();
  elsif new.status <> 'completed' and old.status = 'completed' then
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create trigger tasks_sync_completed_at
  before update on public.tasks
  for each row execute function public.sync_task_completed_at();

create function public.sync_task_completed_at_on_insert()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'completed' and new.completed_at is null then
    new.completed_at = now();
  end if;
  return new;
end;
$$;

create trigger tasks_sync_completed_at_insert
  before insert on public.tasks
  for each row execute function public.sync_task_completed_at_on_insert();

-- ---------------------------------------------------------------------------
-- Cross-entity consistency, enforced in the database (not just app code):
-- client and service (when set) belong to the task's organization, and the
-- assignee (when set) holds an active membership in that organization.
-- ---------------------------------------------------------------------------
create function public.check_task_consistency()
returns trigger
language plpgsql
as $$
declare
  v_client_org uuid;
  v_service_org uuid;
begin
  select organization_id into v_client_org from public.clients where id = new.client_id;
  if v_client_org is null or v_client_org <> new.organization_id then
    raise exception 'tasks: client must belong to the task''s organization';
  end if;

  if new.service_id is not null then
    select organization_id into v_service_org from public.services where id = new.service_id;
    if v_service_org is null or v_service_org <> new.organization_id then
      raise exception 'tasks: service must belong to the task''s organization';
    end if;
  end if;

  if new.assignee_id is not null and not exists (
    select 1 from public.memberships m
    where m.user_id = new.assignee_id
      and m.organization_id = new.organization_id
      and m.status = 'active'
  ) then
    raise exception 'tasks: assignee must have an active membership in the task''s organization';
  end if;

  return new;
end;
$$;

create trigger tasks_check_consistency
  before insert or update on public.tasks
  for each row execute function public.check_task_consistency();

-- ---------------------------------------------------------------------------
-- RLS
--
-- SELECT is organization-level for now (tasks.view), same as clients in
-- phase 3. member_client_access is ready for a future per-client
-- restriction — the policy below is written so that swapping in that
-- restriction later only means adding one more `or` clause referencing
-- member_client_access, not rewriting the policy: see the commented
-- alternative underneath.
-- ---------------------------------------------------------------------------
alter table public.tasks enable row level security;

create policy tasks_select on public.tasks
  for select
  using (public.has_permission(organization_id, 'tasks.view'));

-- Future (phase 7) per-client visibility, once member_client_access rows
-- exist for a membership: restrict to clients explicitly allow-listed for
-- that membership, falling back to "no restriction rows = sees everything"
-- so this can be introduced without a breaking migration:
--
-- create policy tasks_select on public.tasks
--   for select
--   using (
--     public.has_permission(organization_id, 'tasks.view')
--     and (
--       not exists (
--         select 1 from public.member_client_access mca
--         join public.memberships m on m.id = mca.membership_id
--         where m.user_id = auth.uid() and m.organization_id = tasks.organization_id
--       )
--       or exists (
--         select 1 from public.member_client_access mca
--         join public.memberships m on m.id = mca.membership_id
--         where m.user_id = auth.uid()
--           and m.organization_id = tasks.organization_id
--           and mca.client_id = tasks.client_id
--       )
--     )
--   );

create policy tasks_insert on public.tasks
  for insert
  with check (public.has_permission(organization_id, 'tasks.manage'));

create policy tasks_update on public.tasks
  for update
  using (public.has_permission(organization_id, 'tasks.manage'))
  with check (public.has_permission(organization_id, 'tasks.manage'));

-- No delete policy: cancellation is status = 'cancelled', never DELETE.
