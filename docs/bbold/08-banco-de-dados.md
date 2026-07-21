# 08 — Banco de Dados

## 8.1 Visão Geral

**SGBD:** PostgreSQL (hospedado no Supabase)  
**Extensão habilitada:** `uuid-ossp` (geração de UUIDs)  
**Único arquivo SQL oficial:** `supabase-schema.sql` (raiz do projeto)  
**Migrations:** ❌ Não existe sistema de migrations — nenhum diretório `supabase/migrations/` encontrado  
**Tipos TypeScript gerados:** ❌ Não existem arquivos `.d.ts` de tipos do banco no projeto  
**RLS (Row Level Security):** ❌ **Desabilitado em todas as tabelas**

---

## 8.2 Inventário Completo de Tabelas

| # | Tabela | Definida no Schema? | Usada no Código? | Sistema |
|---|---|---|---|---|
| 1 | `clients` | ✅ Sim | ✅ Sim | `/flow` |
| 2 | `contents` | ✅ Sim | ✅ Sim | `/flow` |
| 3 | `approvals` | ✅ Sim | ✅ Sim | `/flow` |
| 4 | `library` | ✅ Sim | ❌ **Não usada** | — |
| 5 | `subfolders` | ✅ Sim | ❌ **Não usada** | — |
| 6 | `leads` | ❌ Não | ✅ Sim | `/flow` + `/diagnostico` |
| 7 | `performance_records` | ❌ Não | ✅ Sim | `/flow` |
| 8 | `library_files` | ❌ Não | ✅ Sim | `/flow` |
| 9 | `contracts` | ❌ Não | ✅ Sim | `/flow` |
| 10 | `crm_clientes` | ❌ Não | ✅ Sim | CRM legado |
| 11 | `crm_contratos` | ❌ Não | ✅ Sim | CRM legado |
| 12 | `crm_entregas` | ❌ Não | ✅ Sim | CRM legado |
| 13 | `crm_cobrancas` | ❌ Não | ✅ Sim | CRM legado |
| 14 | `crm_comentarios` | ❌ Não | ✅ Sim | CRM legado |

**Total:** 14 tabelas — 5 no schema oficial, 9 ausentes do schema mas usadas em produção.

---

## 8.3 Documentação por Tabela

---

### 8.3.1 `clients`

**Finalidade:** Cadastro de clientes da agência BBold. Tabela central do `/flow` — referenciada por quase todos os módulos.  
**Definida em:** `supabase-schema.sql` (linha 8)  
**Trigger:** `clients_updated_at`

| Campo | Tipo | Default | Nulo | Observação |
|---|---|---|---|---|
| `id` | `uuid` | `uuid_generate_v4()` | NOT NULL | Chave primária |
| `name` | `text` | — | NOT NULL | Nome do cliente |
| `niche` | `text` | `''` | NULL | Segmento/nicho de mercado |
| `plan` | `text` | `'Growth'` | NULL | Plano contratado (free text) |
| `responsible` | `text` | `''` | NULL | Responsável interno |
| `status` | `text` | `'Ativo'` | NULL | Status do cliente |
| `contents` | `integer` | `10` | NULL | Quantidade de conteúdos do plano |
| `initials` | `text` | `''` | NULL | Iniciais para avatar |
| `color` | `text` | `'#FFD22E'` | NULL | Cor do avatar (hex) |
| `instagram` | `text` | `''` | NULL | Handle/URL do Instagram |
| `whatsapp` | `text` | `''` | NULL | Número de WhatsApp |
| `email` | `text` | `''` | NULL | E-mail do cliente |
| `observations` | `text` | `''` | NULL | Observações gerais |
| `created_at` | `timestamptz` | `now()` | NULL | Data de criação |
| `updated_at` | `timestamptz` | `now()` | NULL | Data de atualização (gerenciado pelo trigger) |

**Chave primária:** `id`  
**Chaves estrangeiras:** Nenhuma  
**Índices:** Apenas PK (implícito)  
**Constraints adicionais:** Nenhuma  
**RLS:** Desabilitado

**Valores de `status` usados no código:**
- `'Ativo'` (default do schema)
- `'Pausado'`
- `'Em onboarding'`
- `'Atenção'` (visto em `app/flow/clientes/[id]/page.jsx`)

**Áreas que utilizam:**
| Área | Operação |
|---|---|
| `/flow` (dashboard) | SELECT (name, niche, color, status) |
| `/flow/clientes` | SELECT *, INSERT, UPDATE, DELETE |
| `/flow/clientes/[id]` | SELECT * (single), UPDATE status |
| `/flow/aprovacoes` | SELECT name (para dropdown) |
| `/flow/calendario` | SELECT name (para dropdown) |
| `/flow/conteudos` | SELECT name (para dropdown) |
| `/flow/contratos` | SELECT * (para seleção de cliente no PDF) |
| `/flow/performance` | SELECT * via JOIN em `performance_records` |
| `/flow/relatorios` | SELECT id, name, niche, plan, status, responsible |
| `/flow/workflow` | SELECT name (para filtro) |
| `/flow/biblioteca` | SELECT name (para dropdown) |
| `/flow/layout.jsx` | Realtime INSERT → notificação "Novo cliente" |

---

### 8.3.2 `contents`

**Finalidade:** Conteúdos criados/gerenciados para os clientes. Tabela mais consultada do sistema.  
**Definida em:** `supabase-schema.sql` (linha 27)  
**Trigger:** `contents_updated_at`

| Campo | Tipo | Default | Nulo | Observação |
|---|---|---|---|---|
| `id` | `uuid` | `uuid_generate_v4()` | NOT NULL | Chave primária |
| `title` | `text` | — | NOT NULL | Título do conteúdo |
| `client` | `text` | `''` | NULL | **Nome do cliente (TEXT, sem FK)** |
| `format` | `text` | `''` | NULL | Formato do conteúdo |
| `channel` | `text` | `''` | NULL | Canal de publicação |
| `status` | `text` | `'Ideia'` | NULL | Status no workflow |
| `pub_date` | `date` | NULL | NULL | Data de publicação |
| `pub_time` | `time` | NULL | NULL | Horário de publicação |
| `responsible` | `text` | `''` | NULL | Responsável pelo conteúdo |
| `priority` | `text` | `'Normal'` | NULL | Prioridade |
| `copy` | `text` | `''` | NULL | Texto/legenda do conteúdo |
| `observations` | `text` | `''` | NULL | Observações |
| `link` | `text` | `''` | NULL | Link relacionado |
| `created_at` | `timestamptz` | `now()` | NULL | Data de criação |
| `updated_at` | `timestamptz` | `now()` | NULL | Data de atualização |

**Chave primária:** `id`  
**Chaves estrangeiras:** **Nenhuma** — `client` é `text` (nome), sem referência à tabela `clients`  
**Índices:** Apenas PK (implícito)  
**RLS:** Desabilitado

**Valores de `status` usados no código** (sem enum formal):
- `'Ideia'` (default do schema — não aparece nos filtros da UI)
- `'Briefing'`
- `'Produção'`
- `'Revisão'`
- `'Aguardando Aprovação'`
- `'Agendado'`
- `'Publicado'`
- `'Atrasado'`

**Valores de `format`:** `'Reels'`, `'Feed'`, `'Stories'`, `'Carrossel'`, `'Blog'`, `'Landing Page'`  
**Valores de `priority`:** `'Normal'`, `'Alta'`, `'Urgente'`  
**Valores de `responsible`** (hardcoded no frontend): `'Bruno'`, `'Ana Lima'`, `'Rafael Souza'`, `'Camila Rocha'`

**Áreas que utilizam:**
| Área | Operação |
|---|---|
| `/flow` (dashboard) | SELECT (campos selecionados) |
| `/flow/conteudos` | SELECT *, INSERT, UPDATE, DELETE, UPDATE status |
| `/flow/workflow` | SELECT (campos selecionados) — somente leitura |
| `/flow/calendario` | SELECT (com filtro `pub_date NOT NULL`) |
| `/flow/performance` | SELECT (publicados no período) |
| `/flow/relatorios` | SELECT * filtrado por cliente e período |
| `/flow/clientes/[id]` | SELECT, INSERT, UPDATE, DELETE (filtrado por `client = client.name`) |
| `/flow/layout.jsx` | Realtime INSERT → "Novo conteúdo criado"; UPDATE → "Publicado" / "Atrasado" |

---

### 8.3.3 `approvals`

**Finalidade:** Fluxo de aprovação de conteúdos por cliente. Registra materiais aguardando revisão/aprovação.  
**Definida em:** `supabase-schema.sql` (linha 44)  
**Trigger:** `approvals_updated_at`

| Campo | Tipo | Default | Nulo | Observação |
|---|---|---|---|---|
| `id` | `uuid` | `uuid_generate_v4()` | NOT NULL | Chave primária |
| `title` | `text` | — | NOT NULL | Título do material |
| `client` | `text` | `''` | NULL | **Nome do cliente (TEXT, sem FK)** |
| `format` | `text` | `''` | NULL | Formato do material |
| `responsible` | `text` | `''` | NULL | Responsável |
| `deadline` | `date` | NULL | NULL | Prazo de aprovação |
| `priority` | `text` | `'Normal'` | NULL | Prioridade |
| `status` | `text` | `'Pendente'` | NULL | Status de aprovação |
| `copy` | `text` | `''` | NULL | Texto/copy do material |
| `observations` | `text` | `''` | NULL | Notas / motivo de reprovação |
| `created_at` | `timestamptz` | `now()` | NULL | Data de criação |
| `updated_at` | `timestamptz` | `now()` | NULL | Data de atualização |

**Chave primária:** `id`  
**Chaves estrangeiras:** **Nenhuma** — `client` é `text` (nome), sem FK  
**RLS:** Desabilitado

**Valores de `status`:**
- `'Pendente'` (default do schema — não aparece nas opções da UI)
- `'Aguardando revisão'` (valor inicial no código)
- `'Ajustes solicitados'`
- `'Liberado p/ cliente'`
- `'Aprovado'`
- `'Reprovado'`

**Inconsistência:** Default do schema é `'Pendente'`, mas o código insere com `status:'Aguardando revisão'`. O valor `'Pendente'` nunca é usado pela UI.

**Áreas que utilizam:**
| Área | Operação |
|---|---|
| `/flow` (dashboard) | SELECT count (pendentes) |
| `/flow/aprovacoes` | SELECT *, INSERT, UPDATE status, UPDATE observações |
| `/flow/relatorios` | SELECT * filtrado por cliente e período |
| `/flow/clientes/[id]` | SELECT (id, title, status, priority) filtrado por `client` |
| `/flow/layout.jsx` | Realtime INSERT → "Aprovação pendente"; UPDATE → "Material atualizado" |

---

### 8.3.4 `library` ⚠️ TABELA ÓRFÃ

**Finalidade declarada:** Biblioteca de arquivos por cliente.  
**Definida em:** `supabase-schema.sql` (linha 62)  
**Status:** ✅ Existe no schema, ❌ **NUNCA referenciada no código**

| Campo | Tipo | Default | Nulo | Observação |
|---|---|---|---|---|
| `id` | `uuid` | `uuid_generate_v4()` | NOT NULL | Chave primária |
| `name` | `text` | — | NOT NULL | Nome do arquivo |
| `client` | `text` | `''` | NULL | Nome do cliente |
| `subfolder` | `text` | `''` | NULL | Nome da subpasta |
| `type` | `text` | `''` | NULL | Tipo do arquivo |
| `size_kb` | `integer` | `0` | NULL | Tamanho em KB |
| `date` | `date` | NULL | NULL | Data do arquivo |
| `observations` | `text` | `''` | NULL | Observações |
| `created_at` | `timestamptz` | `now()` | NULL | Data de criação |

**Chave primária:** `id`  
**Trigger:** Nenhum (sem `updated_at`)  
**RLS:** Desabilitado

**Problema:** O código usa a tabela `library_files` (diferente) — a `library` do schema provavelmente é uma versão anterior substituída sem remoção do schema.

---

### 8.3.5 `subfolders` ⚠️ TABELA ÓRFÃ

**Finalidade declarada:** Subpastas da biblioteca de arquivos por cliente.  
**Definida em:** `supabase-schema.sql` (linha 76)  
**Status:** ✅ Existe no schema, ❌ **NUNCA referenciada no código**

| Campo | Tipo | Default | Nulo | Observação |
|---|---|---|---|---|
| `id` | `uuid` | `uuid_generate_v4()` | NOT NULL | Chave primária |
| `client` | `text` | — | NOT NULL | Nome do cliente |
| `name` | `text` | — | NOT NULL | Nome da subpasta |
| `color` | `text` | `'#FFD22E'` | NULL | Cor da pasta (hex) |
| `created_at` | `timestamptz` | `now()` | NULL | Data de criação |

**Chave primária:** `id`  
**Trigger:** Nenhum  
**RLS:** Desabilitado

**Problema:** O código usa `localStorage` para subfolders (`bbold_flow_subfolders`), não esta tabela. Dado perdido ao trocar de dispositivo/browser.

---

### 8.3.6 `leads` ⚠️ SEM DEFINIÇÃO NO SCHEMA

**Finalidade:** Captura de leads via formulário `/diagnostico` e gestão no kanban `/flow/leads`.  
**Definida em:** ❌ **Não existe em `supabase-schema.sql`**  
**Estrutura inferida:** `app/diagnostico/page.jsx` (insert) + `app/flow/leads/page.jsx` (CRUD + Realtime)

| Campo | Tipo (inferido) | Observação |
|---|---|---|
| `id` | `uuid` | Chave primária (inferida) |
| `name` | `text` | Nome do lead |
| `phone` | `text` | Telefone |
| `instagram` | `text` | Perfil do Instagram |
| `segment` | `text` | Segmento de negócio |
| `status` | `text` | Status no kanban |
| `observations` | `text` | Observações do operador |
| `created_at` | `timestamptz` | Data de criação (usada em `order('created_at')`) |

**Valores de `status`:** `'em_aberto'`, `'contato_feito'`, `'reuniao_agendada'`, `'stand_by'`

**Realtime:** `app/flow/leads/page.jsx` escuta `INSERT` e `UPDATE` nesta tabela via `supabase.channel('leads-rt')`.

**Áreas que utilizam:**
| Área | Operação |
|---|---|
| `/diagnostico` | INSERT (name, phone, instagram, segment) |
| `/flow/leads` | SELECT *, DELETE, UPDATE status, UPDATE observations |
| `/flow/leads` | Realtime (INSERT + UPDATE) |

---

### 8.3.7 `performance_records` ⚠️ SEM DEFINIÇÃO NO SCHEMA

**Finalidade:** Registros históricos de métricas de performance por cliente (seguidores, alcance, interações, etc.).  
**Definida em:** ❌ **Não existe em `supabase-schema.sql`**  
**Estrutura inferida:** `app/flow/clientes/[id]/page.jsx` (CRUD) + `app/flow/performance/page.jsx` (SELECT com JOIN)

| Campo | Tipo (inferido) | Observação |
|---|---|---|
| `id` | `uuid` | Chave primária (inferida) |
| `client_id` | `uuid` | **FK implícita para `clients.id`** — usada em JOIN |
| `metric` | `text` | Nome da métrica |
| `value` | `numeric` / `float` | Valor numérico |
| `recorded_at` | `date` / `timestamptz` | Data do registro |
| `notes` | `text` | Observações opcionais |

**JOIN confirmado:** `select('metric, value, recorded_at, client_id, clients(id, name, color)')` — Supabase infere a FK `client_id → clients.id`. Se não houver FK formal, este JOIN pode falhar.

**Valores de `metric`** (hardcoded no frontend):
`'Seguidores Instagram'`, `'Seguidores YouTube'`, `'Alcance médio'`, `'Interações'`, `'Visualizações'`, `'Curtidas'`, `'Comentários'`, `'Compartilhamentos'`, `'Saves'`

**Áreas que utilizam:**
| Área | Operação |
|---|---|
| `/flow/clientes/[id]` | SELECT *, INSERT, DELETE (filtrado por `client_id`) |
| `/flow/performance` | SELECT com JOIN em `clients`, filtrado por período |
| `/flow/relatorios` | SELECT * filtrado por `client_id` e período |

---

### 8.3.8 `library_files` ⚠️ SEM DEFINIÇÃO NO SCHEMA

**Finalidade:** Biblioteca de arquivos da agência por cliente (versão atual, substitui `library`).  
**Definida em:** ❌ **Não existe em `supabase-schema.sql`**  
**Estrutura inferida:** `app/flow/biblioteca/page.jsx` (CRUD completo)

| Campo | Tipo (inferido) | Observação |
|---|---|---|
| `id` | `uuid` | Chave primária |
| `name` | `text` | Nome do arquivo |
| `client` | `text` | Nome do cliente (text, sem FK) |
| `type` | `text` | Tipo do arquivo |
| `size_kb` | `integer` | Tamanho em KB |
| `date` | `date` | Data do arquivo |
| `observations` | `text` | Observações |

**Valores de `type`:** `'Logo'`, `'Brandbook'`, `'Foto'`, `'Vídeo'`, `'Contrato'`, `'Briefing'`, `'Campanha'`

**Nota:** O código exibe erro tratado quando a tabela não existe: se `error` na SELECT, mostra DDL SQL para criação. Isso indica que a tabela pode não existir no banco atual.

**Áreas que utilizam:**
| Área | Operação |
|---|---|
| `/flow/biblioteca` | SELECT *, INSERT, UPDATE, DELETE |

---

### 8.3.9 `contracts` ⚠️ SEM DEFINIÇÃO NO SCHEMA

**Finalidade:** Persistência de contratos gerados pelo `/flow/contratos`. Tabela adicionada posteriormente ao módulo original (que só gerava PDF sem salvar).  
**Definida em:** ❌ **Não existe em `supabase-schema.sql`**  
**Estrutura inferida:** `app/flow/contratos/page.jsx` (linhas 837–865)

| Campo | Tipo (inferido) | Observação |
|---|---|---|
| `id` | `uuid` | Chave primária |
| `client_name` | `text` | Nome/razão social do cliente |
| `client_doc` | `text` | CPF ou CNPJ |
| `client_responsible` | `text` | Nome do responsável |
| `client_email` | `text` | E-mail |
| `client_phone` | `text` | Telefone |
| `client_address` | `text` | Endereço completo |
| `package_name` | `text` | Nome do pacote contratado |
| `monthly_value` | `numeric` | Valor mensal |
| `start_date` | `date` | Data de início |
| `duration_months` | `integer` | Duração em meses |
| `due_day` | `integer` | Dia de vencimento |
| `payment_method` | `text` | Forma de pagamento |
| `revisions` | `integer` | Número de revisões incluídas |
| `services` | `text` | Serviços contratados (texto livre) |
| `observations` | `text` | Observações do contrato |
| `selected_services` | `jsonb`? | Array de IDs dos serviços selecionados |
| `installments` | `integer` | Número de parcelas (atualizado separadamente) |
| `status` | `text` | Status do contrato |
| `created_at` | `timestamptz` | Data de criação (usada em ORDER BY) |

**Nota do código** (linha 857): `// installments saved separately — column may not exist yet, ignore error` — indica que a coluna `installments` foi adicionada depois e pode não existir no banco.

**Valores de `status`:** `'ativo'`, `'encerrado'`, `'cancelado'`, `'renovado'`

**Sem FK para `clients`:** Os dados do cliente são copiados por valor no momento da criação — sem referência à tabela `clients`.

**Áreas que utilizam:**
| Área | Operação |
|---|---|
| `/flow/contratos` | SELECT *, INSERT, UPDATE status, DELETE |

---

### 8.3.10 `crm_clientes` ⚠️ CRM LEGADO — SEM DEFINIÇÃO NO SCHEMA

**Finalidade:** Cadastro de clientes no CRM legado (sistema `/crm`). Tabela central do sistema legado.  
**Definida em:** ❌ **Não existe em `supabase-schema.sql`**  
**Estrutura inferida:** `crm/pages/Clientes.jsx`, `crm/pages/ClienteDetalhe.jsx`

| Campo | Tipo (inferido) | Observação |
|---|---|---|
| `id` | `uuid` | Chave primária |
| `nome` | `text` | Nome do contato (em português, diferente de `clients.name`) |
| `empresa` | `text` | Nome da empresa |
| `nicho` | `text` | Segmento de negócio |
| `whatsapp` | `text` | Telefone WhatsApp |
| `email` | `text` | E-mail |
| `instagram` | `text` | Perfil Instagram |
| `drive_link` | `text` | Link para pasta no Google Drive |
| `status` | `text` | Status do cliente |
| `notas` | `text` | Observações |
| `avatar_color` | `text` | Cor do avatar (hex) |
| `contrato_url` | `text` | URL de arquivo de contrato enviado |
| `created_at` | `timestamptz` | Data de criação |

**Valores de `status`:** `'lead'`, `'ativo'`, `'pausado'`, `'encerrado'`

**Áreas que utilizam:**
| Área | Operação |
|---|---|
| `/crm/clientes` | SELECT *, INSERT, UPDATE, DELETE |
| `/crm/clientes/:id` | SELECT * (single), UPDATE campo por campo, UPDATE contrato_url |
| `/crm/dashboard` | SELECT (id, status) |
| `/crm/contratos` | SELECT id, nome (para dropdown); JOIN em crm_contratos |
| `/crm/entregas` | SELECT id, nome (para dropdown); JOIN em crm_entregas |
| `/crm/demandas` | JOIN em crm_entregas |
| `/crm/financeiro` | SELECT id, nome; JOIN em crm_cobrancas |

---

### 8.3.11 `crm_contratos` ⚠️ CRM LEGADO — SEM DEFINIÇÃO NO SCHEMA

**Finalidade:** Contratos do CRM legado — relaciona cliente com serviço e valor mensal.  
**Definida em:** ❌ **Não existe em `supabase-schema.sql`**  
**Estrutura inferida:** `crm/pages/Contratos.jsx`, `crm/pages/Financeiro.jsx`

| Campo | Tipo (inferido) | Observação |
|---|---|---|
| `id` | `uuid` | Chave primária |
| `cliente_id` | `uuid` | **FK para `crm_clientes.id`** (JOIN explícito: `crm_clientes(id, nome, avatar_color)`) |
| `servico` | `text` | Tipo de serviço |
| `valor_mensal` | `numeric` | Valor mensal do contrato |
| `data_inicio` | `date` | Data de início |
| `data_renovacao` | `date` | Data de renovação |
| `status` | `text` | Status do contrato |
| `created_at` | `timestamptz` | Data de criação |

**Valores de `servico`:** `'social_media'`, `'trafego_pago'`, `'design'`, `'site'`, `'gmn'`, `'gestao_marca'`  
**Valores de `status`:** `'ativo'`, `'pausado'`, `'encerrado'`

**Áreas que utilizam:** `/crm/contratos` (CRUD), `/crm/dashboard`, `/crm/financeiro`

---

### 8.3.12 `crm_entregas` ⚠️ CRM LEGADO — SEM DEFINIÇÃO NO SCHEMA

**Finalidade:** Entregas/tarefas do CRM legado — usada tanto no Kanban de entregas quanto na lista de demandas.  
**Definida em:** ❌ **Não existe em `supabase-schema.sql`**  
**Estrutura inferida:** `crm/pages/Entregas.jsx`, `crm/pages/Demandas.jsx`, `crm/pages/ClienteDetalhe.jsx`

| Campo | Tipo (inferido) | Observação |
|---|---|---|
| `id` | `uuid` | Chave primária |
| `cliente_id` | `uuid` | **FK para `crm_clientes.id`** (JOIN explícito) |
| `servico` | `text` | Tipo de serviço |
| `tipo` | `text` | Tipo específico de entrega |
| `titulo` | `text` | Título da entrega |
| `prazo` | `date` | Prazo de entrega |
| `notas` | `text` | Notas gerais |
| `briefing` | `text` | Texto de briefing (editável) |
| `status` | `text` | Status no Kanban |
| `created_at` | `timestamptz` | Data de criação |

**Valores de `status`:** `'planejado'`, `'em_andamento'`, `'revisao'`, `'concluido'`

**Áreas que utilizam:** `/crm/entregas` (Kanban), `/crm/demandas` (lista agrupada), `/crm/dashboard`, `/crm/clientes/:id`

---

### 8.3.13 `crm_cobrancas` ⚠️ CRM LEGADO — SEM DEFINIÇÃO NO SCHEMA

**Finalidade:** Cobranças mensais por cliente — módulo financeiro do CRM legado.  
**Definida em:** ❌ **Não existe em `supabase-schema.sql`**  
**Estrutura inferida:** `crm/pages/Financeiro.jsx`

| Campo | Tipo (inferido) | Observação |
|---|---|---|
| `id` | `uuid` | Chave primária |
| `cliente_id` | `uuid` | **FK para `crm_clientes.id`** (JOIN explícito) |
| `mes_ref` | `text` | Mês de referência (formato: `'YYYY-MM'`) |
| `valor` | `numeric` | Valor da cobrança |
| `status` | `text` | Status do pagamento |
| `data_pagamento` | `date` | Data em que o pagamento foi registrado |
| `created_at` | `timestamptz` | Data de criação |

**Valores de `status`:** `'aguardando'`, `'pago'`, `'atraso'`

**Funcionalidade especial:** "Gerar mês" — insere cobranças em lote para todos os clientes com contrato ativo (`crm/pages/Financeiro.jsx`, linhas 75–90).

**Áreas que utilizam:** `/crm/financeiro` (CRUD completo)

---

### 8.3.14 `crm_comentarios` ⚠️ CRM LEGADO — SEM DEFINIÇÃO NO SCHEMA

**Finalidade:** Comentários sobre entregas, usados no módulo Demandas do CRM legado.  
**Definida em:** ❌ **Não existe em `supabase-schema.sql`**  
**Estrutura inferida:** `crm/pages/Demandas.jsx`

| Campo | Tipo (inferido) | Observação |
|---|---|---|
| `id` | `uuid` | Chave primária (inferida) |
| `entrega_id` | `uuid` | **FK para `crm_entregas.id`** |
| `texto` | `text` | Conteúdo do comentário |
| `created_at` | `timestamptz` | Data de criação (usado em `order ascending`) |

**Áreas que utilizam:** `/crm/demandas` (INSERT, SELECT, contagem de comentários por entrega)

---

## 8.4 Objetos de Banco Definidos no Schema

### Extensões
```sql
create extension if not exists "uuid-ossp";
```
Usada por: `uuid_generate_v4()` — todas as PKs do schema oficial.

### Função
```sql
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
```
Atualiza `updated_at` automaticamente antes de cada UPDATE.

### Triggers
| Trigger | Tabela | Evento | Função |
|---|---|---|---|
| `clients_updated_at` | `clients` | BEFORE UPDATE | `update_updated_at()` |
| `contents_updated_at` | `contents` | BEFORE UPDATE | `update_updated_at()` |
| `approvals_updated_at` | `approvals` | BEFORE UPDATE | `update_updated_at()` |

**Tabelas sem trigger:** `library`, `subfolders` (sem `updated_at`), e todas as tabelas não declaradas no schema.

### Índices
**Nenhum índice explícito** definido no `supabase-schema.sql`. Apenas os índices implícitos criados automaticamente para as chaves primárias.

### Views
**Nenhuma view** definida.

### Enums
**Nenhum enum** definido. Todos os campos de status/tipo são `text` livre — sem constraint `CHECK` para validar valores permitidos.

### Migrations
**Sistema de migrations ausente.** Não existe diretório `supabase/migrations/`. O schema é aplicado manualmente via SQL Editor do Supabase Dashboard, conforme o comentário no topo do arquivo:
```sql
-- Rodar no SQL Editor do Supabase (https://supabase.com/dashboard/project/<id>/sql/new)
```

---

## 8.5 Relacionamentos e Cardinalidades

### Relacionamentos Formalmente Definidos (no schema)
**Nenhum.** O schema não define nenhuma `FOREIGN KEY` explícita.

### Relacionamentos Inferidos pelo Código

| Tabela | Campo | Referência | Tipo | FK Formal |
|---|---|---|---|---|
| `contents` | `client` (text) | `clients.name` | N:1 (por nome) | ❌ Não — texto livre |
| `approvals` | `client` (text) | `clients.name` | N:1 (por nome) | ❌ Não — texto livre |
| `performance_records` | `client_id` (uuid) | `clients.id` | N:1 | ❌ Não formal (JOIN funciona se FK existir) |
| `library_files` | `client` (text) | `clients.name` | N:1 (por nome) | ❌ Não — texto livre |
| `crm_contratos` | `cliente_id` (uuid) | `crm_clientes.id` | N:1 | ❌ Não formal (JOIN explícito no código) |
| `crm_entregas` | `cliente_id` (uuid) | `crm_clientes.id` | N:1 | ❌ Não formal (JOIN explícito) |
| `crm_cobrancas` | `cliente_id` (uuid) | `crm_clientes.id` | N:1 | ❌ Não formal (JOIN explícito) |
| `crm_comentarios` | `entrega_id` (uuid) | `crm_entregas.id` | N:1 | ❌ Não formal |

### Cardinalidades

```
clients            1 ──── N   contents         (via nome, sem FK)
clients            1 ──── N   approvals        (via nome, sem FK)
clients            1 ──── N   performance_records  (via client_id)
clients            1 ──── N   library_files    (via nome, sem FK)

crm_clientes       1 ──── N   crm_contratos    (via cliente_id)
crm_clientes       1 ──── N   crm_entregas     (via cliente_id)
crm_clientes       1 ──── N   crm_cobrancas    (via cliente_id)
crm_entregas       1 ──── N   crm_comentarios  (via entrega_id)
```

---

## 8.6 Modelo Relacional Textual Simplificado

### Sistema /flow (Principal)

```
┌─────────────────────────────────┐
│           clients               │
│─────────────────────────────────│
│ id (PK, uuid)                   │
│ name (text, NOT NULL)           │
│ niche, plan, responsible        │
│ status, contents, initials      │
│ color, instagram, whatsapp      │
│ email, observations             │
│ created_at, updated_at          │
└──────────────┬──────────────────┘
               │
     ┌─────────┼──────────────────────────────┐
     │         │                              │
     ▼         ▼                              ▼
┌─────────┐  ┌──────────────────┐  ┌───────────────────────┐
│contents │  │    approvals     │  │  performance_records   │
│─────────│  │──────────────────│  │───────────────────────│
│id (PK)  │  │id (PK)          │  │id (PK)                │
│title    │  │title            │  │client_id ──► clients.id│
│client ──┤  │client ──────────┤  │metric                  │
│(TEXT)   │  │(TEXT) (sem FK)  │  │value                   │
│format   │  │format, responsible│ │recorded_at             │
│channel  │  │deadline, priority│  │notes                  │
│status   │  │status, copy     │  └───────────────────────┘
│pub_date │  │observations     │
│pub_time │  │created_at       │  ┌───────────────────────┐
│responsible│ │updated_at       │  │     library_files     │
│priority │  └─────────────────┘  │───────────────────────│
│copy, link│                      │id (PK)                │
│created_at│                      │name, client (TEXT)    │
│updated_at│                      │type, size_kb          │
└─────────┘                       │date, observations     │
                                  └───────────────────────┘

┌───────────────────────┐          ┌───────────────────────┐
│         leads         │          │       contracts       │
│───────────────────────│          │───────────────────────│
│id (PK)                │          │id (PK)                │
│name, phone, instagram │          │client_name (TEXT)     │
│segment, status        │          │client_doc, email      │
│observations           │          │package_name           │
│created_at             │          │monthly_value          │
└───────────────────────┘          │start_date             │
                                   │duration_months        │
                                   │due_day, payment_method│
                                   │selected_services      │
                                   │installments, status   │
                                   │created_at             │
                                   └───────────────────────┘
```

### Sistema CRM Legado

```
┌───────────────────────────────┐
│         crm_clientes          │
│───────────────────────────────│
│ id (PK, uuid)                 │
│ nome, empresa, nicho          │
│ whatsapp, email, instagram    │
│ drive_link, status, notas     │
│ avatar_color, contrato_url    │
│ created_at                    │
└──────────┬────────────────────┘
           │
  ┌────────┼──────────────────┐
  │        │                  │
  ▼        ▼                  ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐
│crm_contratos │  │  crm_entregas    │  │  crm_cobrancas   │
│──────────────│  │──────────────────│  │──────────────────│
│id (PK)       │  │id (PK)           │  │id (PK)           │
│cliente_id ───┤  │cliente_id ───────┤  │cliente_id ───────┤
│servico       │  │servico, tipo     │  │mes_ref           │
│valor_mensal  │  │titulo, prazo     │  │valor, status     │
│data_inicio   │  │notas, briefing   │  │data_pagamento    │
│data_renovacao│  │status            │  │created_at        │
│status        │  │created_at        │  └──────────────────┘
│created_at    │  └──────┬───────────┘
└──────────────┘         │
                         ▼
                ┌────────────────────┐
                │  crm_comentarios   │
                │────────────────────│
                │id (PK)             │
                │entrega_id ─────────┘
                │texto               │
                │created_at          │
                └────────────────────┘
```

---

## 8.7 Dados Derivados (Não Persistidos)

Os seguintes dados são calculados em runtime pelo código e **não são persistidos no banco**:

| Dado derivado | Calculado em | Fonte |
|---|---|---|
| Métricas do dashboard (clientes ativos, em produção, etc.) | `/flow/page.jsx` | `contents` + `clients` |
| MRR (Monthly Recurring Revenue) | `/crm/contratos/page.jsx` | `crm_contratos` |
| Cobrança mensal gerada automaticamente | `/crm/financeiro/page.jsx` | `crm_contratos` |
| PDF de contrato | `/flow/contratos/page.jsx` | Formulário + `clients` |
| PDF de exportação do cliente | `/flow/clientes/[id]/page.jsx` | `clients` + dados locais |
| Relatório por cliente | `/flow/relatorios/page.jsx` | Múltiplas tabelas |
| Status de atraso em entregas | `/crm/entregas/page.jsx` | `prazo` < `hoje` (JS) |

---

## 8.8 Inconsistências entre Schema e Código

| # | Inconsistência | Detalhe | Impacto |
|---|---|---|---|
| 1 | **`library` vs `library_files`** | Schema define `library`, código usa `library_files` | `library` nunca é populada; dados vão para tabela sem schema |
| 2 | **`subfolders` ignorada** | Schema define `subfolders`, código usa `localStorage` | Tabela nunca populada; dados perdidos ao trocar dispositivo |
| 3 | **`approvals.status` default errado** | Schema: `'Pendente'`; código insere `'Aguardando revisão'` | Inconsistência semântica; valor padrão nunca aparece na UI |
| 4 | **`contents.status` default `'Ideia'`** | Default do schema, mas não aparece nos filtros do módulo de conteúdos | Conteúdos com status `'Ideia'` podem não aparecer em nenhum filtro |
| 5 | **`leads` sem schema** | Tabela usada por 2 módulos sem DDL oficial | Sem trigger de `updated_at`; sem constraints |
| 6 | **`performance_records` sem schema** | Tabela com JOIN em `clients` (por `client_id`) sem FK formal | JOIN pode retornar dados incorretos se FK não existir no banco |
| 7 | **`library_files` sem schema** | Tabela criada sem DDL oficial; código exibe DDL como fallback | Tabela pode não existir no banco em produção |
| 8 | **`contracts` sem schema** | Tabela com coluna `installments` adicionada depois (sem migration) | Coluna pode não existir; código trata erro silenciosamente |
| 9 | **9 tabelas CRM sem schema** | `crm_*` tables inteiramente fora do schema | Sem controle de integridade, sem triggers, sem documentação |
| 10 | **`contents.client` é TEXT** | Referência a cliente por nome; se cliente mudar de nome, registros ficam órfãos | Sem integridade referencial |
| 11 | **`approvals.client` é TEXT** | Idem `contents.client` | Idem |

---

## 8.9 Problemas de Integridade

### 1. RLS Desabilitado em Todas as Tabelas

```sql
alter table clients    disable row level security;
alter table contents   disable row level security;
alter table approvals  disable row level security;
alter table library    disable row level security;
alter table subfolders disable row level security;
```

Qualquer portador da `NEXT_PUBLIC_SUPABASE_ANON_KEY` (exposta no bundle JavaScript) pode **ler, inserir, atualizar e deletar** qualquer dado sem autenticação.

### 2. Relacionamentos por Nome (TEXT) sem Integridade Referencial

As tabelas `contents`, `approvals` e `library_files` referenciam clientes por `name` (texto). Se um cliente for renomeado:
- Todos os conteúdos ficam com `client` desatualizado
- O filtro por cliente quebra silenciosamente
- Nenhuma constraint impede essa inconsistência

### 3. Sem Constraints de Validação (CHECK)

Nenhum campo usa `CHECK` constraint. Os valores de `status`, `format`, `priority` são texto livre. Qualquer valor pode ser inserido sem validação no banco.

### 4. Tabelas Sem Trigger de `updated_at`

As tabelas `library`, `subfolders`, `leads`, `performance_records`, `library_files`, `contracts` e todas as `crm_*` não possuem trigger de `updated_at`. Registros podem ser atualizados sem rastro temporal.

### 5. Coluna `installments` Potencialmente Ausente

O código em `contratos/page.jsx` (linha 857) comenta: `// installments saved separately — column may not exist yet, ignore error`. A coluna pode não existir no banco e o erro é suprimido silenciosamente.

### 6. JOIN sem FK Formal em `performance_records`

O código usa `.select('metric, value, recorded_at, client_id, clients(id, name, color)')` para fazer JOIN entre `performance_records` e `clients`. O Supabase infere a FK a partir do nome da coluna (`client_id`) e da tabela `clients`. Se essa FK não estiver definida formalmente no banco, o JOIN retornará erro.

### 7. Sem Cascade Delete

Sem FKs formais, não há cascade delete. Excluir um cliente não remove seus conteúdos, aprovações ou registros de performance associados.

---

## 8.10 Tabelas por Sistemas

### Sistema Principal `/flow`
`clients`, `contents`, `approvals`, `leads`, `performance_records`, `library_files`, `contracts`

### Sistema CRM Legado `/crm`
`crm_clientes`, `crm_contratos`, `crm_entregas`, `crm_cobrancas`, `crm_comentarios`

### Tabelas Definidas no Schema mas Aparentemente Obsoletas
`library`, `subfolders`

### Dados fora do Banco
Subpastas da biblioteca (`bbold_flow_subfolders`), configurações de equipe (`bbold_flow_team`), notificações (`bbold_flow_notifs`), tema/fonte (`bbold_flow_theme`, `bbold_flow_font`) — todos em **`localStorage`**.

---

*Arquivos analisados: `supabase-schema.sql` · `app/flow/clientes/page.jsx` · `app/flow/clientes/[id]/page.jsx` · `app/flow/leads/page.jsx` · `app/flow/contratos/page.jsx` · `app/flow/aprovacoes/page.jsx` · `app/flow/calendario/page.jsx` · `app/flow/conteudos/page.jsx` · `app/flow/performance/page.jsx` · `app/flow/relatorios/page.jsx` · `app/flow/workflow/page.jsx` · `app/flow/biblioteca/page.jsx` · `app/flow/page.jsx` · `app/flow/layout.jsx` · `app/diagnostico/page.jsx` · `crm/pages/Clientes.jsx` · `crm/pages/Contratos.jsx` · `crm/pages/Entregas.jsx` · `crm/pages/Demandas.jsx` · `crm/pages/Financeiro.jsx` · `crm/pages/ClienteDetalhe.jsx` · `crm/pages/Dashboard.jsx`*
