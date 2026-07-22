-- =====================================================================
-- Migration : 001_global_permissions
-- Release   : 1
-- Depende de: nenhuma migration anterior
-- =====================================================================
-- Cria a tabela global de permissões do sistema e insere o seed
-- completo das permissões da Release 1.
--
-- Características:
--   · Sem organization_id — permissões são globais ao sistema
--   · RLS habilitado — SELECT somente para authenticated
--   · Sem policies de escrita — INSERT/UPDATE/DELETE bloqueados
--     para anon e authenticated; escrita ocorre somente em contexto
--     service_role (migrations e contexto administrativo)
--   · Seed idempotente — ON CONFLICT (key) DO UPDATE preserva id
--     e created_at originais, atualizando apenas module e description
-- =====================================================================


-- =====================================================================
-- SEÇÃO 1 — TABELA
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.permissions (
  id          UUID        NOT NULL DEFAULT gen_random_uuid(),
  key         TEXT        NOT NULL,
  module      TEXT        NOT NULL,
  description TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT permissions_pkey       PRIMARY KEY (id),
  CONSTRAINT permissions_key_unique UNIQUE      (key)
);

COMMENT ON TABLE public.permissions IS
  'Permissões globais do sistema. Sem organization_id. '
  'Administrada exclusivamente por migrations — sem escrita via SDK do cliente.';

COMMENT ON COLUMN public.permissions.key IS
  'Identificador único da permissão no formato modulo:acao (ex: leads:write).';

COMMENT ON COLUMN public.permissions.module IS
  'Módulo funcional ao qual a permissão pertence (ex: leads, clients, pipeline).';

COMMENT ON COLUMN public.permissions.description IS
  'Descrição legível da permissão em português.';


-- =====================================================================
-- SEÇÃO 2 — ÍNDICES
-- =====================================================================

-- Suporta listagem de permissões agrupadas por módulo
-- (usada na Migration 005 ao construir role_permissions por organização)
CREATE INDEX IF NOT EXISTS permissions_module_idx
  ON public.permissions (module);


-- =====================================================================
-- SEÇÃO 3 — ROW LEVEL SECURITY
-- =====================================================================

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- SELECT: apenas usuários autenticados.
-- Permissões são dados de configuração do sistema — membros autenticados
-- precisam consultá-las para exibir labels de controle de acesso na UI.
-- Nenhuma dependência de memberships, organizations ou roles nesta policy.
CREATE POLICY "permissions_select_authenticated"
  ON  public.permissions
  FOR SELECT
  TO  authenticated
  USING (true);

-- INSERT, UPDATE, DELETE: nenhuma policy criada.
-- Com RLS habilitado e ausência de policies de escrita, todas as
-- operações de modificação são bloqueadas automaticamente para anon
-- e authenticated. Escrita ocorre somente via service_role em migrations.


-- =====================================================================
-- SEÇÃO 4 — SEED: Permissões da Release 1
-- =====================================================================
-- Total: 16 permissões distribuídas em 10 módulos.
--
-- ON CONFLICT (key) DO UPDATE:
--   · Preserva: id, created_at
--   · Atualiza: module, description
--   · Seguro para reaplicação em ambientes de desenvolvimento
-- =====================================================================

INSERT INTO public.permissions (key, module, description)
VALUES

  -- ── leads ──────────────────────────────────────────────────────────

  ('leads:read',
   'leads',
   'Visualizar leads, histórico de estágios e dados de qualificação'),

  ('leads:write',
   'leads',
   'Criar, editar e mover leads entre estágios do pipeline'),

  -- ── clients ────────────────────────────────────────────────────────

  ('clients:read',
   'clients',
   'Visualizar clientes e seus dados cadastrais'),

  ('clients:write',
   'clients',
   'Criar, editar e arquivar clientes'),

  -- ── proposals ──────────────────────────────────────────────────────

  ('proposals:read',
   'proposals',
   'Visualizar propostas e seus itens'),

  ('proposals:write',
   'proposals',
   'Criar, editar e alterar o status de propostas'),

  -- ── pipeline ───────────────────────────────────────────────────────

  ('pipeline:manage',
   'pipeline',
   'Criar e configurar pipelines e seus estágios'),

  -- ── members ────────────────────────────────────────────────────────

  ('members:manage',
   'members',
   'Convidar, remover e alterar roles de membros da organização'),

  -- ── organization ───────────────────────────────────────────────────

  ('org:settings',
   'organization',
   'Alterar configurações gerais da organização'),

  -- ── brands ─────────────────────────────────────────────────────────

  ('brands:read',
   'brands',
   'Visualizar marcas e perfis sociais vinculados a clientes'),

  ('brands:write',
   'brands',
   'Criar e editar marcas e perfis sociais'),

  -- ── catalog ────────────────────────────────────────────────────────

  ('catalog:manage',
   'catalog',
   'Criar e editar serviços e tipos de entrega do catálogo'),

  -- ── activities ─────────────────────────────────────────────────────

  ('activities:read',
   'activities',
   'Visualizar atividades comerciais registradas'),

  ('activities:write',
   'activities',
   'Registrar e editar atividades comerciais'),

  -- ── diagnoses ──────────────────────────────────────────────────────

  ('diagnoses:read',
   'diagnoses',
   'Visualizar diagnósticos de leads'),

  ('diagnoses:write',
   'diagnoses',
   'Criar e atualizar diagnósticos de leads')

ON CONFLICT (key) DO UPDATE
  SET
    module      = EXCLUDED.module,
    description = EXCLUDED.description;
