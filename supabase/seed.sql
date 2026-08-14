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

-- Contractor (BBOLD) legal data used on every contract's contractor_snapshot.
-- Placeholder values — replace with the real CNPJ/address before signing an
-- actual contract from this seed.
update public.organizations set
  legal_name = 'BBOLD Serviços Digitais LTDA',
  document_number = '00000000000000',
  address_street = 'Rua Exemplo',
  address_number = '100',
  address_neighborhood = 'Centro',
  address_city = 'São Paulo',
  address_state = 'SP',
  address_zip_code = '00000-000',
  representative_name = 'Bruno Chaves',
  representative_document = '00000000000',
  default_forum = 'São Paulo/SP'
where id = '00000000-0000-0000-0000-000000000001';

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

-- ---------------------------------------------------------------------------
-- Financial categories — BBOLD demo organization
-- ---------------------------------------------------------------------------
insert into public.financial_categories (organization_id, name, type, sort_order) values
  ('00000000-0000-0000-0000-000000000001', 'Clientes fixos', 'income', 0),
  ('00000000-0000-0000-0000-000000000001', 'Landing Pages e Sites', 'income', 1),
  ('00000000-0000-0000-0000-000000000001', 'Pagamentos parcelados', 'income', 2),
  ('00000000-0000-0000-0000-000000000001', 'Infoprodutos', 'income', 3),
  ('00000000-0000-0000-0000-000000000001', 'Projetos avulsos', 'income', 4),
  ('00000000-0000-0000-0000-000000000001', 'Outros', 'income', 5),
  ('00000000-0000-0000-0000-000000000001', 'Ferramentas', 'expense', 0),
  ('00000000-0000-0000-0000-000000000001', 'Colaboradores', 'expense', 1),
  ('00000000-0000-0000-0000-000000000001', 'Impostos', 'expense', 2),
  ('00000000-0000-0000-0000-000000000001', 'Pró-labore', 'expense', 3),
  ('00000000-0000-0000-0000-000000000001', 'Lucro distribuído', 'expense', 4),
  ('00000000-0000-0000-0000-000000000001', 'Despesas variáveis', 'expense', 5),
  ('00000000-0000-0000-0000-000000000001', 'Outros', 'expense', 6)
on conflict (organization_id, type, name) do nothing;

-- ---------------------------------------------------------------------------
-- Financial settings — goal and opening balance for the BBOLD demo org
-- ---------------------------------------------------------------------------
insert into public.organization_financial_settings (organization_id, monthly_revenue_goal, opening_balance, opening_balance_date)
values ('00000000-0000-0000-0000-000000000001', 20000.00, 12000.00, '2026-08-01')
on conflict (organization_id) do nothing;

-- ---------------------------------------------------------------------------
-- Demo financial entries — competence is the current month, so the seed
-- keeps making sense whenever it's actually run (not hardcoded to a past
-- Agosto/2026).
-- ---------------------------------------------------------------------------
insert into public.financial_entries (
  organization_id, client_id, category_id, type, description, amount,
  competence_month, due_date, paid_at, requires_invoice
)
select
  '00000000-0000-0000-0000-000000000001',
  c.id,
  cat.id,
  'income',
  t.description,
  t.amount,
  date_trunc('month', current_date)::date,
  t.due_date,
  t.paid_at,
  true
from (values
  ('CSS Log', 'Clientes fixos', 'Mensalidade website', 5000.00, current_date - 5, current_date - 3),
  ('Padaria Diplomata', 'Clientes fixos', 'Mensalidade Social Media', 1800.00, current_date - 2, current_date - 1),
  ('Bianca Calil Nutri', 'Landing Pages e Sites', 'Landing page — sinal', 1000.00, current_date + 5, null)
) as t(client_name, category_name, description, amount, due_date, paid_at)
join public.clients c on c.name = t.client_name
join public.financial_categories cat on cat.name = t.category_name and cat.type = 'income' and cat.organization_id = c.organization_id
on conflict do nothing;

insert into public.financial_entries (
  organization_id, category_id, type, description, amount, competence_month, due_date, paid_at
)
select
  '00000000-0000-0000-0000-000000000001',
  cat.id,
  'expense',
  t.description,
  t.amount,
  date_trunc('month', current_date)::date,
  t.due_date,
  t.paid_at
from (values
  ('Ferramentas', 'Ferramentas de design e gestão', 480.00, current_date - 10, current_date - 10),
  ('Colaboradores', 'Freelancer — social media', 1200.00, current_date - 1, null)
) as t(category_name, description, amount, due_date, paid_at)
join public.financial_categories cat on cat.name = t.category_name and cat.type = 'expense'
  and cat.organization_id = '00000000-0000-0000-0000-000000000001'
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Contract templates — development
-- ---------------------------------------------------------------------------
insert into public.contract_templates (organization_id, name, slug, service_id, content)
select
  '00000000-0000-0000-0000-000000000001',
  t.name,
  t.slug,
  s.id,
  t.content
from (values
  ('Social Media', 'social-media', 'social-media', $tpl$CONTRATO DE PRESTAÇÃO DE SERVIÇOS — GESTÃO DE REDES SOCIAIS

CONTRATANTE: {{client_legal_name}}, documento {{client_document}}, com endereço em {{client_address}}.
CONTRATADA: {{contractor_legal_name}}, documento {{contractor_document}}, com endereço em {{contractor_address}}.

CLÁUSULA 1ª — DO OBJETO
A CONTRATADA prestará serviços de gestão de redes sociais para a CONTRATANTE, compreendendo: {{description}}

CLÁUSULA 2ª — DO VALOR
O valor dos serviços é de {{contract_value}}, pago via {{payment_method}}, em {{installments}} parcela(s).

CLÁUSULA 3ª — DA VIGÊNCIA
Vigência a partir de {{start_date}}{{end_date}}.

CLÁUSULA 4ª — DO FORO
Fica eleito o foro de {{city}}.

{{city}}, {{signature_date}}.

_______________________________
{{client_legal_name}} — CONTRATANTE

_______________________________
{{contractor_legal_name}} — CONTRATADA$tpl$),
  ('Website', 'website', 'website', $tpl$CONTRATO DE PRESTAÇÃO DE SERVIÇOS — DESENVOLVIMENTO DE WEBSITE

CONTRATANTE: {{client_legal_name}}, documento {{client_document}}, com endereço em {{client_address}}.
CONTRATADA: {{contractor_legal_name}}, documento {{contractor_document}}, com endereço em {{contractor_address}}.

CLÁUSULA 1ª — DO OBJETO
A CONTRATADA desenvolverá o website da CONTRATANTE, conforme escopo: {{description}}

CLÁUSULA 2ª — DO VALOR E FORMA DE PAGAMENTO
Valor total de {{contract_value}}, via {{payment_method}}, em {{installments}} parcela(s).

CLÁUSULA 3ª — DO PRAZO
Início em {{start_date}}{{end_date}}.

CLÁUSULA 4ª — DO FORO
Foro de {{city}}.

{{city}}, {{signature_date}}.

_______________________________
{{client_legal_name}} — CONTRATANTE

_______________________________
{{contractor_legal_name}} — CONTRATADA$tpl$),
  ('Landing Page', 'landing-page', 'landing-page', $tpl$CONTRATO DE PRESTAÇÃO DE SERVIÇOS — LANDING PAGE

CONTRATANTE: {{client_legal_name}}, documento {{client_document}}.
CONTRATADA: {{contractor_legal_name}}, documento {{contractor_document}}.

CLÁUSULA 1ª — DO OBJETO
Criação de landing page conforme escopo: {{description}}

CLÁUSULA 2ª — DO VALOR
{{contract_value}}, via {{payment_method}}, em {{installments}} parcela(s).

CLÁUSULA 3ª — DA VIGÊNCIA
{{start_date}}{{end_date}}.

CLÁUSULA 4ª — DO FORO
{{city}}.

{{city}}, {{signature_date}}.

_______________________________
{{client_legal_name}} — CONTRATANTE

_______________________________
{{contractor_legal_name}} — CONTRATADA$tpl$),
  ('Identidade Visual', 'identidade-visual', 'identidade-visual', $tpl$CONTRATO DE PRESTAÇÃO DE SERVIÇOS — IDENTIDADE VISUAL

CONTRATANTE: {{client_legal_name}}, documento {{client_document}}.
CONTRATADA: {{contractor_legal_name}}, documento {{contractor_document}}.

CLÁUSULA 1ª — DO OBJETO
Desenvolvimento de identidade visual conforme escopo: {{description}}

CLÁUSULA 2ª — DO VALOR
{{contract_value}}, via {{payment_method}}, em {{installments}} parcela(s).

CLÁUSULA 3ª — DA VIGÊNCIA
{{start_date}}{{end_date}}.

CLÁUSULA 4ª — DO FORO
{{city}}.

{{city}}, {{signature_date}}.

_______________________________
{{client_legal_name}} — CONTRATANTE

_______________________________
{{contractor_legal_name}} — CONTRATADA$tpl$)
) as t(name, slug, service_slug, content)
join public.services s on s.slug = t.service_slug and s.organization_id = '00000000-0000-0000-0000-000000000001'
on conflict (organization_id, slug) do nothing;
