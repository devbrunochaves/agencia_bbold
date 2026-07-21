# 10 — CRM: Visão Geral

## Sumário

- [Objetivo](#objetivo)
- [Usuários](#usuários)
- [Como o CRM apoia a operação da BBOLD](#como-o-crm-apoia-a-operação-da-bbold)
- [Módulos](#módulos)
- [Menu e Navegação](#menu-e-navegação)
- [Dashboard](#dashboard)
- [Fluxo Comercial](#fluxo-comercial)
- [Fluxo Operacional](#fluxo-operacional)
- [Entidades Principais](#entidades-principais)
- [Integração com o Site Institucional](#integração-com-o-site-institucional)
- [Origem dos Leads](#origem-dos-leads)
- [Jornada do Lead](#jornada-do-lead)
- [Jornada do Cliente](#jornada-do-cliente)
- [Estados e Status](#estados-e-status)
- [Automações](#automações)
- [Notificações](#notificações)
- [Relatórios](#relatórios)
- [Limitações](#limitações)
- [Módulos Implementados](#módulos-implementados)
- [Módulos Incompletos](#módulos-incompletos)
- [Módulos Planejados](#módulos-planejados)

---

## Objetivo

O CRM da BBOLD é um sistema interno de gestão de clientes, acessível em `/crm/`. Seu propósito é centralizar todo o ciclo de vida do cliente dentro da agência: da prospecção (lead) ao encerramento do contrato, passando pelo registro de serviços contratados, controle de entregas, gestão de demandas e faturamento mensal recorrente.

O CRM não é voltado ao cliente final — é uma ferramenta exclusiva da equipe interna da BBOLD para acompanhar e operar a carteira de clientes ativa.

**Evidência:** `crm/CrmApp.jsx`, `crm/components/Layout.jsx`

---

## Usuários

| Perfil | Acesso | Observação |
|--------|--------|------------|
| Equipe interna da BBOLD | Sim — autenticação por email + senha via Supabase Auth | Qualquer usuário autenticado acessa todas as funcionalidades |
| Cliente final | Não | O CRM não possui área acessível para clientes |
| Visitante do site | Não | Nenhum formulário público conecta diretamente ao CRM |

O CRM não possui controle de papéis (RBAC). Um único nível de acesso é compartilhado por toda a equipe autenticada.

**Evidência:** `crm/CrmApp.jsx` linhas 15–18, `crm/pages/Login.jsx`

---

## Como o CRM apoia a operação da BBOLD

A BBOLD atua como agência de marketing digital prestando serviços mensais recorrentes a múltiplos clientes (social media, tráfego pago, design, sites, Google Meu Negócio, gestão de marca). O CRM foi construído para apoiar esse modelo de negócio com as seguintes funções:

**Comercial**
- Registrar prospects (leads) e acompanhar a negociação
- Converter leads em clientes ativos ao fechar contratos
- Registrar os serviços contratados com seus respectivos valores mensais
- Calcular e exibir o MRR (Monthly Recurring Revenue) total e por serviço

**Operacional**
- Criar e acompanhar demandas/entregas por cliente e por serviço
- Gerenciar fluxo de trabalho da equipe via Kanban e lista agrupada
- Registrar briefings e comentários por entrega
- Vincular links de Google Drive e Instagram por cliente

**Financeiro**
- Gerar registros de cobrança mensais por cliente a partir dos contratos ativos
- Controlar o status de pagamento de cada cobrança (aguardando / pago / em atraso)
- Visualizar o histórico de faturamento dos últimos 6 meses

---

## Módulos

O CRM possui 7 módulos acessíveis via menu, mais a tela de detalhe de cliente:

| # | Módulo | Rota | Arquivo |
|---|--------|------|---------|
| 1 | Dashboard | `/crm/` | `crm/pages/Dashboard.jsx` |
| 2 | Clientes | `/crm/clientes` | `crm/pages/Clientes.jsx` |
| 3 | Detalhe do Cliente | `/crm/clientes/:id` | `crm/pages/ClienteDetalhe.jsx` |
| 4 | Demandas | `/crm/demandas` | `crm/pages/Demandas.jsx` |
| 5 | Contratos | `/crm/contratos` | `crm/pages/Contratos.jsx` |
| 6 | Kanban | `/crm/entregas` | `crm/pages/Entregas.jsx` |
| 7 | Financeiro | `/crm/financeiro` | `crm/pages/Financeiro.jsx` |
| — | Login | `/crm/login` | `crm/pages/Login.jsx` |

**Evidência:** `crm/CrmApp.jsx` linhas 46–62

---

## Menu e Navegação

### Sidebar (desktop)

O layout é composto por uma sidebar fixa à esquerda e uma área de conteúdo principal à direita.

| Ícone | Label | Rota |
|-------|-------|------|
| 📊 | Dashboard | `/crm/` |
| 👥 | Clientes | `/crm/clientes` |
| ⚡ | Demandas | `/crm/demandas` |
| 📋 | Contratos | `/crm/contratos` |
| 🗂️ | Kanban | `/crm/entregas` |
| 💰 | Financeiro | `/crm/financeiro` |

A sidebar exibe o e-mail do usuário logado no rodapé e um botão de logout que chama `supabase.auth.signOut()` e redireciona para `/crm/login`.

**Nota:** O item de menu "Kanban" aponta para a rota `/crm/entregas` e o componente `Entregas.jsx`. Há inconsistência entre label, rota e nome do componente.

### Mobile

Em dispositivos móveis, a sidebar é substituída por um header com botão hamburger (☰) que abre a sidebar como drawer com backdrop. O menu fecha automaticamente ao mudar de rota.

**Evidência:** `crm/components/Layout.jsx` linhas 5–86

### Roteamento

O CRM utiliza `react-router-dom` (`BrowserRouter`) injetado pelo wrapper Next.js em `app/crm/[[...slug]]/page.jsx`. A navegação é inteiramente client-side; não há carregamento de página entre rotas do CRM.

---

## Dashboard

O Dashboard é a página inicial do CRM após login. Fornece uma visão executiva do estado atual da agência.

### KPIs (4 cards)

| Card | Fonte | Cálculo |
|------|-------|---------|
| Clientes Ativos | `crm_clientes` | `count` onde `status = 'ativo'` |
| MRR | `crm_contratos` | `sum(valor_mensal)` onde `status = 'ativo'` |
| Contratos Ativos | `crm_contratos` | `count` onde `status = 'ativo'` |
| Entregas Pendentes | `crm_entregas` | `count` onde `status != 'concluido'` |

### Seções secundárias (2 colunas)

**MRR por Serviço**
- Gráfico de barras (Recharts `BarChart`) mostrando o faturamento mensal recorrente agrupado por tipo de serviço
- Tipos: Social Media, Tráfego Pago, Design, Site/LP, Google Meu Negócio, Gestão de Marca

**Próximas Entregas**
- Lista com as 5 entregas não concluídas de prazo mais próximo
- Badge de urgência codificado por cor: verde (> 3 dias), amarelo (0–3 dias), vermelho (atrasado)
- Botão "Ver todas →" leva ao módulo Kanban

**Evidência:** `crm/pages/Dashboard.jsx`

---

## Fluxo Comercial

O fluxo comercial descreve o caminho de uma oportunidade de negócio dentro do CRM.

```
[Cadastro manual do lead]
        ↓
[Módulo Clientes — status: lead]
        ↓
   (negociação externa — sem registro no CRM)
        ↓
[Mudança de status para "ativo"]
        ↓
[Criação de contrato em Contratos]
   (serviço, valor mensal, data início, renovação)
        ↓
[Financeiro — geração de cobranças mensais]
```

Não existe funil de vendas ou pipeline de negociação dentro do CRM. A única diferenciação entre prospect e cliente ativo é o campo `status` em `crm_clientes`. Etapas de negociação (proposta, reunião, follow-up) não são registradas.

**Evidência:** `crm/pages/Clientes.jsx` linhas 7–13, `crm/pages/Contratos.jsx`

---

## Fluxo Operacional

O fluxo operacional descreve como o trabalho é executado para cada cliente ativo.

```
[Demanda criada no módulo Demandas]
   campos: cliente, tipo, título, prazo, notas, briefing
        ↓
   status: planejado
        ↓
   status: em_andamento
        ↓
   status: revisao
        (comentários registrados via crm_comentarios)
        ↓
   status: concluido
```

O mesmo registro de entrega aparece em dois módulos:
- **Demandas** — visualização em tabela agrupada por status, com editor de briefing e thread de comentários
- **Kanban** — visualização em board com colunas por status; drag-and-drop não implementado (movimentação por botões)

A equipe pode escolher o módulo preferido para cada fluxo de trabalho. Ambos leem e escrevem na mesma tabela `crm_entregas`.

**Evidência:** `crm/pages/Demandas.jsx`, `crm/pages/Entregas.jsx`

---

## Entidades Principais

### `crm_clientes`

Representa uma pessoa ou empresa que tem ou já teve relacionamento comercial com a BBOLD.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Chave primária |
| nome | TEXT | Nome do cliente ou responsável |
| empresa | TEXT | Nome da empresa (opcional) |
| nicho | TEXT | Segmento de atuação (lista fixa ou livre) |
| whatsapp | TEXT | Número de WhatsApp |
| email | TEXT | E-mail de contato |
| instagram | TEXT | Handle do Instagram |
| drive_link | TEXT | Link para pasta no Google Drive |
| status | TEXT | `lead`, `ativo`, `pausado`, `encerrado` |
| notas | TEXT | Observações livres |
| avatar_color | TEXT | Cor do avatar (hex) |
| contrato_url | TEXT | URL pública do contrato assinado (Supabase Storage) |
| created_at | TIMESTAMPTZ | Data de cadastro |

**Evidência:** `crm/pages/Clientes.jsx` linhas 23, 52–53

### `crm_contratos`

Representa um serviço contratado por um cliente. Um cliente pode ter múltiplos contratos ativos simultâneos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Chave primária |
| cliente_id | UUID | FK para `crm_clientes.id` |
| servico | TEXT | Tipo de serviço (social_media, trafego_pago, design, site, gmn, gestao_marca) |
| valor_mensal | NUMERIC | Valor mensal em BRL |
| data_inicio | DATE | Início do contrato |
| data_renovacao | DATE | Data de renovação |
| status | TEXT | `ativo`, `pausado`, `encerrado` |

**Evidência:** `crm/pages/Contratos.jsx`

### `crm_entregas`

Representa uma entrega ou tarefa individual associada a um cliente e serviço. É a entidade central do fluxo operacional.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Chave primária |
| cliente_id | UUID | FK para `crm_clientes.id` |
| servico | TEXT | Serviço ao qual a entrega pertence |
| tipo | TEXT | Tipo específico de entrega (post feed, story, reels, campanha, etc.) |
| titulo | TEXT | Título da demanda |
| prazo | DATE | Data limite |
| notas | TEXT | Observações gerais |
| briefing | TEXT | Briefing detalhado |
| status | TEXT | `planejado`, `em_andamento`, `revisao`, `concluido` |
| created_at | TIMESTAMPTZ | Data de criação |

**Evidência:** `crm/pages/Entregas.jsx`, `crm/pages/Demandas.jsx`

### `crm_cobrancas`

Representa um registro de cobrança mensal de um cliente. Gerado a partir dos contratos ativos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Chave primária |
| cliente_id | UUID | FK para `crm_clientes.id` |
| mes_ref | TEXT | Mês de referência (formato `YYYY-MM`) |
| valor | NUMERIC | Valor cobrado |
| status | TEXT | `aguardando`, `pago`, `atraso` |
| data_pagamento | DATE | Data em que o pagamento foi confirmado |

**Evidência:** `crm/pages/Financeiro.jsx`

### `crm_comentarios`

Representa um comentário registrado em uma entrega. Usado exclusivamente no módulo Demandas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Chave primária |
| entrega_id | UUID | FK para `crm_entregas.id` |
| texto | TEXT | Conteúdo do comentário |
| created_at | TIMESTAMPTZ | Data de criação |

**Evidência:** `crm/pages/Demandas.jsx`

---

## Integração com o Site Institucional

**Status: não implementada.**

O site institucional possui um formulário de diagnóstico em `/diagnostico` (`app/diagnostico/page.jsx`) que insere dados na tabela `leads` do banco. Esta tabela é gerenciada exclusivamente pelo módulo `/flow/leads` do painel interno da agência.

O CRM usa uma entidade separada (`crm_clientes` com `status = 'lead'`) para registrar prospects. Não existe ponte automática entre os dois sistemas. O CRM não lê a tabela `leads` e o site não escreve em `crm_clientes`.

| Sistema | Tabela de leads | Origem |
|---------|-----------------|--------|
| Site `/diagnostico` | `leads` | Formulário público |
| CRM `/crm/clientes` | `crm_clientes` | Cadastro manual interno |

A conversão de um lead do site para um cliente no CRM depende de ação manual da equipe.

**Evidência:** `app/diagnostico/page.jsx`, `crm/pages/Clientes.jsx`, ausência de qualquer `supabase.from('leads')` no diretório `crm/`

---

## Origem dos Leads

Os leads no CRM têm exclusivamente **origem manual**. A equipe cadastra um novo registro em Clientes com o status `lead`. Não há mecanismo de importação, integração com redes sociais, formulários automáticos ou captura via site que alimente diretamente o CRM.

Possíveis fontes de leads mapeadas externamente (não integradas ao CRM):
- Formulário de diagnóstico do site (`/diagnostico`) — vai para `leads` no Flow, não para o CRM
- Indicações recebidas por WhatsApp
- Abordagens diretas em redes sociais

---

## Jornada do Lead

```
1. Cadastro manual no módulo Clientes
   → status = 'lead'
   → campos preenchidos: nome, empresa, nicho, whatsapp/email/instagram

2. Negociação (fora do CRM — WhatsApp, reunião, proposta)

3. Fechamento do contrato
   → status alterado para 'ativo'
   → upload do contrato assinado (PDF) em ClienteDetalhe
   → novo registro criado em Contratos (serviço + valor)

4. Início da operação
   → demandas criadas em Demandas ou Kanban
   → cobranças geradas em Financeiro
```

Não existe rastreamento das etapas de negociação. O status `lead` é o único indicador de que o cliente ainda não foi convertido.

---

## Jornada do Cliente

```
1. Cliente ativo (status = 'ativo')

2. Contratos ativos registrados
   (1 ou mais serviços com valor mensal)

3. Demandas criadas mensalmente
   planejado → em_andamento → revisao → concluido

4. Cobranças geradas mensalmente via "Gerar mês"
   aguardando → pago (ou atraso)

5. Renovação ou encerramento
   → contrato status = 'encerrado'
   → cliente status = 'encerrado' ou 'pausado'
```

O perfil 360° do cliente (ClienteDetalhe) consolida dados de todas as entidades: contatos, MRR, contratos ativos, entregas pendentes, histórico recente e contrato assinado.

**Evidência:** `crm/pages/ClienteDetalhe.jsx`

---

## Estados e Status

### Cliente (`crm_clientes.status`)

| Status | Significado | Badge |
|--------|-------------|-------|
| `lead` | Prospect em negociação | Azul (info) |
| `ativo` | Cliente com contrato ativo | Verde (success) |
| `pausado` | Serviço temporariamente suspenso | Amarelo (warning) |
| `encerrado` | Contrato encerrado | Cinza (muted) |

### Contrato (`crm_contratos.status`)

| Status | Significado | Badge |
|--------|-------------|-------|
| `ativo` | Contrato em vigência | Verde |
| `pausado` | Contrato temporariamente suspenso | Amarelo |
| `encerrado` | Contrato finalizado | Cinza |

### Entrega / Demanda (`crm_entregas.status`)

| Status | Significado | Coluna no Kanban |
|--------|-------------|-----------------|
| `planejado` | Aguardando início | Coluna 1 |
| `em_andamento` | Em execução | Coluna 2 |
| `revisao` | Aguardando aprovação/revisão | Coluna 3 |
| `concluido` | Finalizado | Coluna 4 |

### Cobrança (`crm_cobrancas.status`)

| Status | Significado | Badge |
|--------|-------------|-------|
| `aguardando` | Cobrança enviada, aguardando pagamento | Azul |
| `pago` | Pagamento confirmado | Verde |
| `atraso` | Pagamento em atraso | Vermelho |

**Evidência:** `crm/pages/Clientes.jsx` linhas 7–13, `crm/pages/Contratos.jsx`, `crm/pages/Entregas.jsx`, `crm/pages/Financeiro.jsx` linhas 6–11

---

## Automações

**Status: não implementadas.**

O CRM não possui automações. Nenhum processo é executado de forma automática no sistema. A única função que se assemelha a uma automação é o botão **"Gerar mês"** no módulo Financeiro:

- Acionado manualmente pelo usuário
- Lê todos os contratos com `status = 'ativo'`
- Para o mês selecionado, cria um registro de cobrança por cliente, com valor somado de todos os contratos ativos daquele cliente
- Pula clientes que já possuem cobrança registrada para o mês selecionado (deduplicação)

Este é um processo batch **on-demand**, não automático.

Não existem: webhooks, cron jobs, Supabase Edge Functions, triggers de e-mail, integrações com ferramentas de automação de marketing ou CRMs externos.

**Evidência:** `crm/pages/Financeiro.jsx` função `gerarMes()`

---

## Notificações

**Status: não implementadas.**

O CRM não possui sistema de notificações. Não há:
- Alertas por e-mail (ex.: entrega atrasada, pagamento em atraso)
- Notificações push
- Notificações in-app
- Supabase Realtime subscriptions
- Integrações com WhatsApp, Slack ou similares

O único indicador visual de urgência é o badge colorido de "Próximas Entregas" no Dashboard (dias restantes até o prazo).

**Evidência:** ausência de `supabase.channel()`, `supabase.realtime`, ou qualquer listener de notificação em qualquer arquivo do diretório `crm/`

---

## Relatórios

**Status: parcialmente implementado.**

Não existe um módulo de relatórios dedicado. O CRM oferece visualizações de dados em dois módulos:

### Dashboard
- Gráfico de barras: MRR por tipo de serviço (contratos ativos)
- Lista: próximas 5 entregas com prazo

### Financeiro
- Gráfico de barras empilhadas (Recharts): faturamento dos últimos 6 meses segmentado por status (`pago`, `aguardando`, `atraso`)
- Cards: total do mês, valor pago, aguardando, em atraso (filtro por mês)

**Ausências:**
- Sem relatório de performance por cliente
- Sem relatório de produtividade da equipe
- Sem histórico de clientes encerrados
- Sem exportação para CSV, Excel ou PDF

---

## Limitações

As principais limitações identificadas no código:

| Limitação | Impacto |
|-----------|---------|
| Sem integração com leads do site | Conversão de leads é manual e provavelmente sujeita a esquecimento |
| Sem funil de vendas / pipeline | Impossível rastrear etapas de negociação |
| Sem notificações de prazo | Equipe depende de verificação manual do Dashboard |
| Sem automações de cobrança | "Gerar mês" é manual; esquecimento pode gerar atraso no faturamento |
| Auth via `getSession()` (client-side) | Sessão não é validada no servidor; rota `/crm/` não está no matcher do middleware SSR |
| Sem controle de acesso por papel | Toda equipe vê e pode editar todos os dados |
| Tabelas ausentes do schema SQL | `crm_clientes`, `crm_contratos`, `crm_entregas`, `crm_cobrancas`, `crm_comentarios` não estão em `supabase-schema.sql` |
| RLS desabilitado | Dados do CRM acessíveis via anon_key sem autenticação |
| Sem histórico de alterações | Campos editados não registram quem ou quando alterou |
| Sem busca global | Busca existe apenas dentro de cada módulo individualmente |
| Upload sem validação MIME | Qualquer tipo de arquivo pode ser enviado como contrato |
| Sem paginação | Todos os registros são carregados de uma vez; pode travar com volumes altos |

**Evidência:** `crm/CrmApp.jsx`, `middleware.ts` (matcher não inclui `/crm/*`), `docs/bbold/09-seguranca-e-rls.md`

---

## Módulos Implementados

Módulos totalmente funcionais com CRUD completo:

| Módulo | Operações | Status |
|--------|-----------|--------|
| Login | Autenticação email + senha, logout | ✅ Implementado |
| Dashboard | Leitura de KPIs, gráficos | ✅ Implementado |
| Clientes | Listar, criar, editar, excluir, filtrar | ✅ Implementado |
| Detalhe do Cliente | Perfil 360°, edição inline, upload de contrato | ✅ Implementado |
| Contratos | Listar, criar, editar, excluir, filtrar | ✅ Implementado |
| Demandas | Listar, criar, editar status/prazo/briefing, comentários | ✅ Implementado |
| Kanban | Board por colunas, criar, editar, mover status, excluir | ✅ Implementado |
| Financeiro | Listar, criar, editar, excluir, "Gerar mês", confirmar pagamento | ✅ Implementado |

**Evidência:** `crm/pages/*.jsx`

---

## Módulos Incompletos

Funcionalidades presentes no código mas com lacunas:

| Funcionalidade | Situação |
|----------------|----------|
| Upload de contrato assinado (ClienteDetalhe) | Implementado, mas sem validação de tipo de arquivo (MIME/extensão) e sem geração de URL assinada — URL pública permanente |
| Filtro de demandas por serviço | Filtro por cliente existe; filtro por serviço existe no Kanban mas não no módulo Demandas |
| "Gerar mês" (Financeiro) | Funcional, mas sem confirmação de valores ou preview antes de inserir |
| Detalhe do cliente — entregas | Exibe apenas as últimas 8 entregas; sem paginação ou "ver todas" dentro do perfil |
| Exclusão em cascata | `window.confirm` avisa que "todos os dados relacionados serão excluídos" ao deletar cliente, mas a cascata depende de configuração do banco — não verificada no schema |

**Evidência:** `crm/pages/ClienteDetalhe.jsx` linhas 133–156, `crm/pages/Demandas.jsx`, `crm/pages/Clientes.jsx` linha 71

---

## Módulos Planejados

**Status: não encontrado.**

Nenhum módulo planejado ou funcionalidade futura foi identificado no código. Não há comentários `// TODO`, `// PLANNED`, arquivos de rascunho, ou branches com features pendentes relacionadas ao CRM.

Funcionalidades que seriam esperadas em um CRM desta natureza e que estão ausentes (sem evidência de planejamento):
- Funil de vendas / pipeline de negociação
- Notificações e alertas automáticos
- Integração com leads do site institucional
- Relatórios exportáveis
- Histórico de atividades por cliente
- Controle de acesso por papel (gestor vs. operacional)

---

*Arquivo gerado com base na análise do código-fonte em `crm/`. Todas as afirmações são baseadas em evidências de código; funcionalidades não encontradas são explicitamente marcadas como ausentes.*
