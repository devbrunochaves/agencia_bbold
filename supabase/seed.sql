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

-- ---------------------------------------------------------------------------
-- Demo tasks — left unassigned (assignee_id null) since no real membership
-- user id is known at seed time. Assign manually after creating the owner
-- membership, e.g.:
--   update public.tasks set assignee_id = '<user-uuid>' where title = '...';
-- ---------------------------------------------------------------------------
insert into public.tasks (organization_id, client_id, service_id, title, description, status, priority, due_date)
select c.organization_id, c.id, s.id, t.title, t.description, t.status, t.priority, t.due_date
from (values
  ('Padaria Diplomata', 'social-media', 'Post café da tarde', 'Peça para o feed anunciando o combo da tarde.', 'in_progress', 'normal', current_date + 2),
  ('Padaria Diplomata', 'social-media', 'Reels bastidores', 'Reels mostrando a produção dos pães do dia.', 'waiting_client', 'high', current_date - 1),
  ('Padaria Diplomata', 'social-media', 'Carrossel institucional', 'Carrossel sobre a história da padaria.', 'todo', 'normal', current_date + 6),
  ('CSS Log', 'website', 'Ajuste de SEO na home', 'Revisar meta tags e headings da página inicial.', 'internal_review', 'normal', current_date + 4),
  ('CSS Log', 'website', 'Formulário de contato', 'Implementar validação e envio por e-mail.', 'backlog', 'none', current_date + 12)
) as t(client_name, service_slug, title, description, status, priority, due_date)
join public.clients c on c.name = t.client_name
join public.services s on s.slug = t.service_slug and s.organization_id = c.organization_id
on conflict do nothing;
