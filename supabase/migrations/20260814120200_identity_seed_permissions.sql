-- BBOLD Flow — system roles + permission catalogue
--
-- This is a real (idempotent) migration, not demo seed data: every
-- organization relies on these system roles/permissions existing.
-- Organization-specific demo data (BBOLD, Padaria Diplomata, ...) lives
-- separately in supabase/seed.sql and must never be applied to production.

-- ---------------------------------------------------------------------------
-- permissions catalogue
-- ---------------------------------------------------------------------------
insert into public.permissions (key, module, description) values
  ('dashboard.view',      'dashboard', 'Ver o painel geral da organização'),
  ('tasks.view',          'tasks',     'Ver demandas'),
  ('tasks.manage',        'tasks',     'Criar, editar e mover demandas'),
  ('finance.view',        'finance',   'Ver dados financeiros'),
  ('finance.manage',      'finance',   'Lançar e editar entradas/saídas financeiras'),
  ('contracts.view',      'contracts', 'Ver contratos'),
  ('contracts.manage',    'contracts', 'Criar, editar e enviar contratos'),
  ('clients.view',        'clients',   'Ver clientes'),
  ('clients.manage',      'clients',   'Criar e editar clientes'),
  ('members.manage',      'members',   'Convidar, editar papéis e desativar membros da equipe'),
  ('organization.manage', 'organization', 'Editar dados e configurações da organização')
on conflict (key) do update
  set module = excluded.module,
      description = excluded.description;

-- ---------------------------------------------------------------------------
-- system roles (organization_id = null → available to every organization)
-- ---------------------------------------------------------------------------
insert into public.roles (organization_id, key, name, is_system) values
  (null, 'owner',  'Owner',  true),
  (null, 'admin',  'Admin',  true),
  (null, 'member', 'Member', true)
on conflict (organization_id, key) do nothing;

-- Owner: every permission.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'owner' and r.organization_id is null
on conflict do nothing;

-- Admin: everything except organization-level settings.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key <> 'organization.manage'
where r.key = 'admin' and r.organization_id is null
on conflict do nothing;

-- Member: operate day-to-day, no management of finance, contracts, clients,
-- members or organization settings.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in (
  'dashboard.view',
  'tasks.view',
  'tasks.manage',
  'finance.view',
  'contracts.view',
  'clients.view'
)
where r.key = 'member' and r.organization_id is null
on conflict do nothing;
