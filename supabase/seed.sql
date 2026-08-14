-- BBOLD Flow — DEVELOPMENT SEED DATA
--
-- Not a migration. Never run this against production.
-- Creates a demo organization so the Flow UI has something to render while
-- building. Old CRM/Flow data (clients, crm_clientes, contracts, tasks from
-- the legacy system) is intentionally NOT imported — the new Flow starts
-- with a clean database, per the platform rebuild decision.
--
-- Usage: run manually in a local/dev Supabase project after the migrations
-- above, then create an auth user (Dashboard → Authentication → Add user,
-- or supabase.auth.admin.createUser) and insert a matching membership row,
-- e.g.:
--
--   insert into public.memberships (organization_id, user_id, role_id, status)
--   select o.id, '<auth-user-uuid>', r.id, 'active'
--   from public.organizations o, public.roles r
--   where o.slug = 'bbold' and r.key = 'owner' and r.organization_id is null;

insert into public.organizations (id, name, slug) values
  ('00000000-0000-0000-0000-000000000001', 'BBOLD', 'bbold')
on conflict (slug) do nothing;

insert into public.organizations (id, name, slug) values
  ('00000000-0000-0000-0000-000000000002', 'Padaria Diplomata (demo)', 'padaria-diplomata-demo')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Services — catalogue for the BBOLD demo organization
-- ---------------------------------------------------------------------------
insert into public.services (organization_id, name, slug) values
  ('00000000-0000-0000-0000-000000000001', 'Social Media', 'social-media'),
  ('00000000-0000-0000-0000-000000000001', 'Website', 'website'),
  ('00000000-0000-0000-0000-000000000001', 'Landing Page', 'landing-page'),
  ('00000000-0000-0000-0000-000000000001', 'Identidade Visual', 'identidade-visual'),
  ('00000000-0000-0000-0000-000000000001', 'Tráfego Pago', 'trafego-pago'),
  ('00000000-0000-0000-0000-000000000001', 'Consultoria', 'consultoria')
on conflict (organization_id, slug) do nothing;

-- ---------------------------------------------------------------------------
-- Demo clients
-- ---------------------------------------------------------------------------
insert into public.clients (organization_id, name, document_type, document_number, status, client_type, start_date) values
  ('00000000-0000-0000-0000-000000000001', 'Padaria Diplomata', 'cnpj', '12345678000190', 'active', 'recurring', '2026-01-12'),
  ('00000000-0000-0000-0000-000000000001', 'CSS Log', 'cnpj', '98765432000110', 'active', 'project', '2026-03-03'),
  ('00000000-0000-0000-0000-000000000001', 'Bianca Calil Nutri', null, null, 'prospect', 'project', null)
on conflict do nothing;

insert into public.client_services (organization_id, client_id, service_id, status, started_at)
select c.organization_id, c.id, s.id, 'active', c.start_date
from public.clients c
join public.services s
  on s.organization_id = c.organization_id
  and (
    (c.name = 'Padaria Diplomata' and s.slug = 'social-media')
    or (c.name = 'CSS Log' and s.slug = 'website')
  )
on conflict do nothing;
