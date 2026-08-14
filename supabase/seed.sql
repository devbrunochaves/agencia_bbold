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
