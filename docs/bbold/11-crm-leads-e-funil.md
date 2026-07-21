# 11 — CRM: Leads e Funil Comercial

## Sumário

- [Dois sistemas de leads](#dois-sistemas-de-leads)
- [Sistema 1 — Flow Leads](#sistema-1--flow-leads)
- [Sistema 2 — CRM Leads](#sistema-2--crm-leads)
- [Fluxo completo: da entrada ao fechamento](#fluxo-completo-da-entrada-ao-fechamento)
- [Entidades e tabelas do banco](#entidades-e-tabelas-do-banco)
- [Formulários de captura](#formulários-de-captura)
- [Etapas do funil — Flow](#etapas-do-funil--flow)
- [Status no CRM](#status-no-crm)
- [Origem dos leads](#origem-dos-leads)
- [Responsáveis](#responsáveis)
- [Contatos e empresas](#contatos-e-empresas)
- [Oportunidades](#oportunidades)
- [Tarefas e follow-ups](#tarefas-e-follow-ups)
- [Notas e observações](#notas-e-observações)
- [Histórico](#histórico)
- [Propostas](#propostas)
- [Conversões](#conversões)
- [Perdas](#perdas)
- [Filtros e buscas](#filtros-e-buscas)
- [Dashboard comercial e métricas](#dashboard-comercial-e-métricas)
- [Ações disponíveis por entidade](#ações-disponíveis-por-entidade)
- [Componentes e rotas](#componentes-e-rotas)
- [Regras de negócio](#regras-de-negócio)
- [Lacunas que impedem um processo comercial completo](#lacunas-que-impedem-um-processo-comercial-completo)

---

## Dois sistemas de leads

O projeto possui **dois sistemas de leads independentes**, construídos em momentos distintos, que coexistem sem integração:

| Característica | Flow Leads | CRM Leads |
|---|---|---|
| Tabela | `leads` | `crm_clientes` (status = `lead`) |
| Módulo | `/flow/leads` | `/crm/clientes` |
| Origem dos dados | Formulário público `/diagnostico` | Cadastro manual interno |
| Visualização | Kanban (4 colunas) | Tabela com filtros |
| Realtime | Sim (INSERT + UPDATE) | Não |
| Funil de etapas | Sim (4 colunas explícitas) | Não (apenas 1 campo status) |
| Integração entre si | Nenhuma | Nenhuma |

A consequência prática é que um lead que entra pelo site pode percorrer todo o ciclo de negociação no Flow e ser convertido em cliente sem que nenhum dado seja automaticamente transferido para o CRM. A ponte é 100% manual e depende da disciplina da equipe.

**Evidência:** `app/flow/leads/page.jsx`, `crm/pages/Clientes.jsx`, ausência de qualquer query cruzando `leads` e `crm_clientes`

---

## Sistema 1 — Flow Leads

### Localização e arquivos

| Arquivo | Função |
|---------|--------|
| `app/flow/leads/page.jsx` | Página principal do módulo de leads do Flow |
| `app/diagnostico/page.jsx` | Formulário público de captura (origem dos leads) |
| `lib/supabase.js` | Cliente Supabase SSR (usado pelo Flow) |

### Rota

`/flow/leads` — protegida pelo middleware SSR (`middleware.ts`), requer sessão válida.

### Visualização

Board Kanban com 4 colunas fixas:

| ID da coluna | Label | Cor |
|---|---|---|
| `em_aberto` | Em Aberto | Amarelo `#FFD22E` |
| `contato_feito` | Contato Feito | Azul `#3B82F6` |
| `reuniao_agendada` | Reunião Agendada | Verde `#22C55E` |
| `stand_by` | Stand By | Cinza `#71717A` |

Leads sem campo `status` preenchido são tratados como `em_aberto` (linha 151: `l.status ?? 'em_aberto'`).

**Evidência:** `app/flow/leads/page.jsx` linhas 40–45, 151

### Dados exibidos por card

Cada card de lead exibe:
- Nome (`lead.name`) — destaque, peso 700
- Data de criação (`lead.created_at`) — formatada como `dd/mm/aaaa`
- Segmento (`lead.segment`) — label traduzido via `SEG_LABELS`
- Instagram — badge com link direto para `instagram.com/@handle`
- Observações (`lead.observations`) — clicável para edição inline
- Botão WhatsApp — link `wa.me/55{phone}` com número formatado
- Botão excluir — abre diálogo de confirmação (`DeleteDialog`)
- Botão "Mover ▾" — dropdown com as outras 3 colunas disponíveis

**Evidência:** `app/flow/leads/page.jsx` linhas 183–370

### Operações disponíveis

| Operação | Implementação | Tabela |
|----------|---------------|--------|
| Listar todos os leads | `select('*').order('created_at', { ascending: false })` | `leads` |
| Mover entre colunas | `update({ status }).eq('id', id)` | `leads` |
| Editar observação | `update({ observations }).eq('id', id)` | `leads` |
| Excluir | `delete().eq('id', id)` | `leads` |
| Criar novo lead | Apenas via formulário `/diagnostico` | `leads` |

**Não existe botão "Novo Lead" no módulo `/flow/leads`.** A única forma de criar um lead é via o formulário público. A equipe interna não pode adicionar leads manualmente pelo Flow.

**Evidência:** `app/flow/leads/page.jsx` — ausência de qualquer `insert` no componente

### Realtime

O módulo escuta dois eventos Supabase Realtime na tabela `leads`:

```js
supabase.channel('leads-rt')
  .on('postgres_changes', { event: 'INSERT', ... }, ({ new: row }) => {
    setLeads(prev => [row, ...prev])
  })
  .on('postgres_changes', { event: 'UPDATE', ... }, ({ new: row }) => {
    setLeads(prev => prev.map(l => l.id === row.id ? row : l))
  })
  .subscribe()
```

Quando um lead é submetido pelo site, ele aparece automaticamente no topo da coluna "Em Aberto" sem necessidade de recarregar a página.

**Evidência:** `app/flow/leads/page.jsx` linhas 83–95

### Header e métricas do módulo

O `FlowHeader` exibe:
- Total de leads captados
- Quantidade captada no mês corrente

Calculado client-side via `filter()` sobre o array em memória, sem query separada.

**Evidência:** `app/flow/leads/page.jsx` linhas 123–127

---

## Sistema 2 — CRM Leads

### Localização e arquivos

| Arquivo | Função |
|---------|--------|
| `crm/pages/Clientes.jsx` | Lista de clientes/leads do CRM |
| `crm/pages/ClienteDetalhe.jsx` | Perfil 360° — acessível para leads e clientes |
| `crm/lib/supabase.js` | Cliente Supabase legacy (localStorage-based) |

### Rota

`/crm/clientes` — protegida pela guarda client-side em `crm/CrmApp.jsx` (`ProtectedRoute`). **Não está no matcher do middleware SSR.**

### Visualização

Tabela com colunas: Cliente (avatar + nome + empresa), Nicho, WhatsApp, Status, Ações.

O status `lead` é uma das 4 opções do campo `status` em `crm_clientes`. Não há separação visual entre leads e clientes na tela — todos aparecem juntos, diferenciados apenas pelo badge de status.

**Evidência:** `crm/pages/Clientes.jsx` linhas 6–13

### Criação de lead/cliente

O formulário de "Novo Cliente" no CRM tem campos:

| Campo | Obrigatório | Tipo |
|-------|-------------|------|
| Nome | Sim (validado: `if (!form.nome.trim()) return`) | Texto livre |
| Empresa | Não | Texto livre |
| Nicho | Não | Select fixo (11 opções) |
| WhatsApp | Não | Texto com placeholder `(27) 99999-9999` |
| E-mail | Não | Input type=email |
| Instagram | Não | Texto (`@perfil` ou URL) |
| Link do Drive | Não | URL |
| Status | Não (default: `lead`) | Select: lead / ativo / pausado / encerrado |
| Cor do avatar | Não (aleatória ao criar) | Picker de 8 cores |
| Notas | Não | Textarea |

O status padrão ao criar é `lead`, o que reflete a intenção de o CRM ser o lugar onde oportunidades são registradas antes da conversão.

**Evidência:** `crm/pages/Clientes.jsx` linhas 23, 45–48

---

## Fluxo completo: da entrada ao fechamento

```
┌─────────────────────────────────────────────────────────┐
│ ENTRADA DO LEAD                                         │
│                                                         │
│  Site /diagnostico                                      │
│  → formulário (nome, phone, instagram, segment)         │
│  → INSERT leads                                         │
│  → usuário redirecionado ao WhatsApp com msg pré-pronta │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ FLUXO/LEADS — GESTÃO DO LEAD (Flow)                     │
│                                                         │
│  /flow/leads  →  Kanban de 4 colunas:                   │
│                                                         │
│  Em Aberto → Contato Feito → Reunião Agendada → Stand By│
│                                                         │
│  Ações: mover coluna | editar observação | excluir      │
│         contato via WhatsApp (link direto)              │
└────────────────────┬────────────────────────────────────┘
                     │
          ✗ Não existe handoff automático
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ ◄ GAP ► Equipe faz manualmente:                         │
│  1. Identifica que o lead virou cliente                 │
│  2. Abre /crm/clientes                                  │
│  3. Cria novo registro com status 'ativo' (ou 'lead')   │
│  4. Preenche todos os campos novamente                  │
│  5. O registro em 'leads' permanece no Flow para sempre │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ CRM — CLIENTE ATIVO                                     │
│                                                         │
│  /crm/clientes → status muda para 'ativo'               │
│  /crm/contratos → contrato criado (serviço + valor)     │
│  /crm/clientes/:id → upload do contrato assinado        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ OPERAÇÃO                                                │
│                                                         │
│  /crm/demandas → entregas criadas e acompanhadas        │
│  /crm/entregas → board Kanban de execução               │
│  /crm/financeiro → cobranças mensais geradas e pagas    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ ENCERRAMENTO                                            │
│                                                         │
│  Contrato → status = 'encerrado'                        │
│  Cliente → status = 'encerrado' ou 'pausado'            │
│  Sem registro de motivo, valor perdido ou análise       │
└─────────────────────────────────────────────────────────┘
```

---

## Entidades e tabelas do banco

### Tabela `leads` (Flow)

| Campo | Tipo | Observação |
|-------|------|-----------|
| id | UUID | Chave primária |
| name | TEXT | Nome do lead (campo do formulário) |
| phone | TEXT | WhatsApp com máscara cosmética no front |
| instagram | TEXT | Handle do Instagram (com `@`) |
| segment | TEXT | Chave de segmento (`alimentacao`, `beleza`, etc.) |
| status | TEXT | `em_aberto`, `contato_feito`, `reuniao_agendada`, `stand_by`; NULL tratado como `em_aberto` |
| observations | TEXT | Anotação livre da equipe |
| created_at | TIMESTAMPTZ | Data de entrada do lead |

**Ausências:** sem campo de responsável, sem campo de origem, sem valor estimado, sem data de follow-up, sem coluna de "convertido".

**Evidência:** `app/flow/leads/page.jsx` (campos lidos e escritos), `app/diagnostico/page.jsx` linha 49

### Tabela `crm_clientes` (leads com status = 'lead')

Descrita em detalhes em `10-crm-visao-geral.md`. Campos relevantes para o processo comercial:

| Campo | Uso comercial |
|-------|--------------|
| nome | Identificação do prospect |
| empresa | Razão social ou nome fantasia |
| nicho | Segmento de atuação (categorização) |
| whatsapp | Contato principal |
| email | Contato secundário |
| instagram | Canal social |
| status | `lead` → `ativo` → `pausado` → `encerrado` |
| notas | Campo único para observações livres (sem histórico) |

**Ausências:** sem campo de etapa de negociação, sem histórico de contatos, sem data de próximo follow-up, sem responsável, sem valor estimado, sem motivo de perda.

---

## Formulários de captura

### Formulário principal do diagnóstico (`/diagnostico`)

Localização: `app/diagnostico/page.jsx`, seção HERO, elemento `<form>` com `ref={formRef}`.

Campos:

| Campo | Obrigatório | Tipo |
|-------|-------------|------|
| Seu nome (`name`) | Sim (`required`) | Texto |
| WhatsApp (`phone`) | Sim (`required`) | `tel` com máscara `phoneMask()` |
| Instagram da empresa (`instagram`) | Não | Texto (prefixo `@` adicionado automaticamente) |
| Segmento do negócio (`segment`) | Sim (`required`) | Select com 9 opções |

Ao submeter (`handleSubmit`):
1. Executa `supabase.from('leads').insert({ name, phone, instagram, segment })` — sem await de erro
2. Monta URL do WhatsApp com mensagem pré-formatada personalizada
3. Exibe tela de sucesso com botão "Falar no WhatsApp agora"

**Evidência:** `app/diagnostico/page.jsx` linhas 44–55

### Formulário inferior da página de diagnóstico (Bottom CTA)

Localização: `app/diagnostico/page.jsx`, seção `dg-bottom-cta`, função `handleBottomSubmit`.

**Este formulário NÃO insere dados no banco.** Coleta nome e telefone, monta mensagem e abre `wa.me` diretamente. O lead originado por esse formulário **não é registrado em nenhuma tabela**.

```js
function handleBottomSubmit(e) {
  e.preventDefault()
  const { name } = bottomData
  const msg = encodeURIComponent(`Olá! Me chamo ${name} e quero o diagnóstico...`)
  window.open(`${WPP}?text=${msg}`, '_blank')
  setBottomDone(true)
}
```

Campos: nome e telefone. O campo `phone` é coletado mas não utilizado no link do WhatsApp — apenas `name` é incluído na mensagem.

**Esta é uma lacuna de captura**: leads que interagem com o CTA secundário da página não são contabilizados.

**Evidência:** `app/diagnostico/page.jsx` linhas 58–64

### Formulário de cadastro manual (CRM — Novo Cliente)

Localização: modal em `crm/pages/Clientes.jsx`, função `save()`.

Ao submeter:
- Validação: apenas `nome` é obrigatório (único campo com guard)
- `editId` presente → `supabase.from('crm_clientes').update(form).eq('id', editId)`
- `editId` ausente → `supabase.from('crm_clientes').insert(form)`
- Status padrão ao criar: `lead`

Sem feedback de erro ao usuário — nem `error` do Supabase é tratado.

**Evidência:** `crm/pages/Clientes.jsx` linhas 57–68

---

## Etapas do funil — Flow

O único funil de etapas real do sistema está no módulo `/flow/leads`, via Kanban:

```
Em Aberto → Contato Feito → Reunião Agendada → Stand By
```

### Definição de cada etapa

| Etapa | ID | Cor | Significado implícito |
|-------|-----|-----|----------------------|
| Em Aberto | `em_aberto` | Amarelo | Lead recebido, nenhuma ação feita |
| Contato Feito | `contato_feito` | Azul | Equipe entrou em contato (WhatsApp/ligação) |
| Reunião Agendada | `reuniao_agendada` | Verde | Reunião ou call agendada com o prospect |
| Stand By | `stand_by` | Cinza | Negociação pausada ou sem resposta |

**Ausências no funil:**
- Sem etapa "Proposta Enviada"
- Sem etapa "Fechado / Ganho" (conversão)
- Sem etapa "Perdido / Desqualificado"
- Sem data de entrada em cada etapa
- Sem SLA ou tempo médio por etapa

**Evidência:** `app/flow/leads/page.jsx` linhas 40–45

### Movimentação entre etapas

A movimentação é feita pelo botão "Mover ▾" em cada card, que abre um dropdown com as outras colunas disponíveis. A coluna atual não aparece no dropdown (filtrado em linha 348: `COLUMNS.filter(c => c.id !== col.id)`).

Não há drag-and-drop implementado.

**Evidência:** `app/flow/leads/page.jsx` linhas 323–369

---

## Status no CRM

O CRM usa um campo `status` único em `crm_clientes` para representar todo o ciclo de vida, incluindo a fase de lead:

| Status | Fase | Significado |
|--------|------|------------|
| `lead` | Pré-venda | Prospect em avaliação ou negociação |
| `ativo` | Cliente | Contrato assinado e operação em andamento |
| `pausado` | Suspensão | Serviço temporariamente interrompido |
| `encerrado` | Pós-venda | Contrato encerrado |

Não há sub-etapas dentro do status `lead` no CRM. A progressão de "lead → ativo" é uma operação manual de edição do registro.

---

## Origem dos leads

| Canal de entrada | Rastreado? | Onde chega | Tabela |
|-----------------|------------|------------|--------|
| Formulário `/diagnostico` (HERO) | Parcialmente | Flow Leads | `leads` |
| Formulário `/diagnostico` (Bottom CTA) | **Não** | WhatsApp direto | — |
| Indicação / WhatsApp direto | Não | Não há canal de entrada | — |
| Instagram / DM | Não | Não há canal de entrada | — |
| Cadastro manual no CRM | Sim (campo `status=lead`) | CRM Clientes | `crm_clientes` |

O campo `segment` da tabela `leads` registra o segmento do negócio, mas não registra **de onde veio o lead** (ex.: orgânico, tráfego pago, link de bio, indicação). Não há campo `source` ou `utm_source`.

**Evidência:** `app/diagnostico/page.jsx` linha 49, `crm/pages/Clientes.jsx` linha 23

---

## Responsáveis

**Status: não implementado em nenhum dos dois sistemas.**

Nem a tabela `leads` nem `crm_clientes` possuem campo `responsible`, `owner_id` ou equivalente. Não é possível saber qual membro da equipe está responsável por um lead ou cliente. A atribuição de responsabilidade é feita externamente (WhatsApp, verbal).

---

## Contatos e empresas

O CRM não separa "contato" de "empresa" como entidades distintas. Um registro em `crm_clientes` representa tanto o contato (pessoa física: `nome`, `whatsapp`, `email`) quanto a empresa (`empresa`, `nicho`, `instagram`).

Consequências:
- Uma empresa com múltiplos contatos precisa de múltiplos registros
- Um contato em várias empresas ao longo do tempo gera registros duplicados
- Não há conceito de conta-pai / conta-filha

**Evidência:** `crm/pages/Clientes.jsx` linha 23 (`EMPTY_FORM`)

---

## Oportunidades

**Status: não implementado.**

O CRM não possui entidade "oportunidade" separada de "cliente". No mundo dos CRMs, uma oportunidade representa uma negociação em andamento (com valor, probabilidade, prazo). No sistema atual, a única aproximação é o registro em `crm_clientes` com `status = 'lead'`, que não carrega:
- Valor estimado do contrato
- Probabilidade de fechamento
- Data esperada de fechamento
- Serviços em negociação
- Histórico de interações

---

## Tarefas e follow-ups

**Status: não implementado em nenhum dos dois sistemas.**

Não existe nenhuma tabela, componente ou interface para criação de tarefas ou follow-ups. A equipe não pode registrar dentro do sistema:
- "Ligar para o lead na quinta-feira"
- "Enviar proposta até sexta"
- "Verificar se o cliente aprovou o briefing"

Não há lembretes, alertas de prazo de retorno ou fila de tarefas.

---

## Notas e observações

### No Flow Leads

Campo `observations` (texto livre) por lead. Editável inline clicando na área do card. A edição é in-place com `textarea`, botões Salvar/Cancelar. Salvo via `update({ observations })`.

Limitações:
- Campo único — novas anotações sobrescrevem as anteriores
- Sem timestamp de quando a observação foi adicionada
- Sem autoria (quem escreveu)
- Não é um histórico — é uma nota estática

**Evidência:** `app/flow/leads/page.jsx` linhas 110–120, 226–258

### No CRM (crm_clientes.notas)

Campo `notas` (textarea) no formulário de criação/edição. Exibido na `ClienteDetalhe` apenas se preenchido.

Mesmas limitações: campo único, sem histórico, sem autoria, sem timestamps internos.

**Evidência:** `crm/pages/Clientes.jsx` linha 278, `crm/pages/ClienteDetalhe.jsx` linhas 417–422

---

## Histórico

**Status: não implementado.**

Não existe histórico de atividades em nenhuma parte do sistema. Não é registrado:
- Quais campos foram alterados e quando
- Quem alterou
- Quando o lead mudou de etapa
- Quando o status do cliente foi atualizado
- Sequência de interações com o lead

O único registro temporal disponível é `created_at` nas tabelas `leads` e `crm_clientes`.

---

## Propostas

**Status: não implementado no CRM de leads.**

Não existe módulo, tabela ou campo para criação, armazenamento ou rastreamento de propostas comerciais dentro do contexto de leads/funil.

Observação: o módulo `/flow/contratos` (`app/flow/contratos/page.jsx`) gera documentos PDF de contrato para clientes já ativos. Esse módulo não está ligado ao fluxo de leads e não é um gerador de propostas — é um gerador de contrato formal pós-fechamento.

---

## Conversões

**Status: não rastreado.**

Não existe métrica, flag ou evento que marque a conversão de um lead em cliente. O fluxo de conversão é implícito:

1. Lead no Flow: muda de coluna para `reuniao_agendada` (melhor caso)
2. Equipe fecha o negócio externamente
3. Equipe cria (ou edita) um registro em `crm_clientes` com `status = 'ativo'`
4. O lead em `leads` permanece no Kanban do Flow na última coluna em que estava

**Não existe:**
- Campo `converted_at`
- Campo `crm_cliente_id` na tabela `leads` (para rastrear qual registro CRM o lead originou)
- Coluna "Fechado" no Kanban do Flow
- Taxa de conversão calculada pelo sistema

---

## Perdas

**Status: não rastreado.**

Quando uma negociação não avança, o único mecanismo disponível é:
- Mover o lead para `stand_by` no Flow (não é "perdido", é "pausado")
- Excluir o lead do Flow (sem registro)
- No CRM: nada — não existe status `perdido` para `crm_clientes`

Não existe:
- Status "perdido" ou "desqualificado" em nenhum sistema
- Campo `motivo_perda`
- Análise de motivos de perda
- Ciclo de nutrição para leads perdidos (reativação)

**Evidência:** `app/flow/leads/page.jsx` linha 40 (constante `COLUMNS` sem coluna de perda), `crm/pages/Clientes.jsx` linha 6 (constante `STATUS_OPTS` sem `perdido`)

---

## Filtros e buscas

### No Flow Leads (`/flow/leads`)

**Não há filtros implementados.** O Kanban exibe todos os leads sem opção de filtrar por segmento, data ou responsável.

A busca por um lead específico requer percorrer visualmente todas as colunas.

**Evidência:** `app/flow/leads/page.jsx` — ausência de estado de filtro ou campo de busca

### No CRM Clientes (`/crm/clientes`)

Três mecanismos de filtro implementados client-side:

| Filtro | Tipo | Campo filtrado |
|--------|------|---------------|
| Busca por texto | Input livre com botão "×" | `nome`, `empresa`, `nicho` (case-insensitive) |
| Status | Select | `status` (lead / ativo / pausado / encerrado) |
| Nicho | Select | `nicho` (opções dinâmicas extraídas dos dados cadastrados) |

Os filtros são combinados com operador AND. Um botão "✕ Limpar filtros" remove todos simultaneamente.

Ordenação: sempre por `created_at DESC` (mais recente primeiro). Não há ordenação por nome, MRR ou status.

Sem paginação — todos os registros são carregados e filtrados em memória.

**Evidência:** `crm/pages/Clientes.jsx` linhas 81–87, 107–143

---

## Dashboard comercial e métricas

### No Flow (`/flow/leads`)

Header único com dois números:
- Total de leads captados
- Leads captados no mês corrente

Sem gráficos, sem conversão, sem taxa de resposta, sem tempo médio por etapa.

**Evidência:** `app/flow/leads/page.jsx` linhas 123–127, 130–134

### No CRM Dashboard (`/crm/`)

Métricas disponíveis (todas calculadas em memória a partir de queries completas):

| Métrica | Fonte | Relevância comercial |
|---------|-------|---------------------|
| Clientes Ativos | `crm_clientes` where `status='ativo'` | Alta |
| MRR | `crm_contratos` where `status='ativo'` | Alta |
| Contratos Ativos | `crm_contratos` where `status='ativo'` | Alta |
| Entregas Pendentes | `crm_entregas` where `status!='concluido'` | Operacional |

**Métricas comerciais ausentes:**
- Número de leads ativos
- Taxa de conversão lead → cliente
- Tempo médio de conversão
- MRR perdido (contratos encerrados)
- Pipeline value (soma de oportunidades em negociação)
- Churn rate

---

## Ações disponíveis por entidade

### Lead no Flow (`leads`)

| Ação | Como | Tabela |
|------|------|--------|
| Ver card | Automático no Kanban | `leads` |
| Mover de coluna | Botão "Mover ▾" → dropdown | `leads.status` |
| Editar observação | Clicar na área de observação | `leads.observations` |
| Contatar via WhatsApp | Botão verde no card | Externo |
| Ver Instagram | Link badge no card | Externo |
| Excluir | Ícone de lixeira → confirmação | `leads` |
| **Criar** | **Não disponível internamente** | — |
| Editar outros campos | **Não disponível** | — |
| Converter para cliente | **Não disponível** | — |

### Lead/Cliente no CRM (`crm_clientes`)

| Ação | Como | Onde |
|------|------|------|
| Criar | Modal "Novo Cliente" | `/crm/clientes` |
| Listar | Tabela com filtros | `/crm/clientes` |
| Editar (modal) | Botão "Editar" na linha | `/crm/clientes` |
| Excluir | Botão "Excluir" na linha | `/crm/clientes` |
| Ver perfil 360° | Link no nome | `/crm/clientes/:id` |
| Editar inline WhatsApp | Campo inline na detalhe | `/crm/clientes/:id` |
| Editar inline e-mail | Campo inline na detalhe | `/crm/clientes/:id` |
| Editar inline Instagram | Campo inline na detalhe | `/crm/clientes/:id` |
| Editar inline Drive | Campo inline na detalhe | `/crm/clientes/:id` |
| Contatar WhatsApp | Link "Abrir WhatsApp ↗" | `/crm/clientes/:id` |
| Abrir Instagram | Link "Abrir Instagram ↗" | `/crm/clientes/:id` |
| Upload contrato | Zona de clique/drag | `/crm/clientes/:id` |
| Ver contratos | Seção Serviços Contratados | `/crm/clientes/:id` |
| Ver entregas recentes | Tabela (últimas 8) | `/crm/clientes/:id` |

---

## Componentes e rotas

### Componentes principais

| Componente | Arquivo | Responsabilidade |
|-----------|---------|-----------------|
| `LeadsPage` | `app/flow/leads/page.jsx` | Board Kanban de leads do Flow |
| `DeleteDialog` | `app/flow/leads/page.jsx` (inline) | Diálogo de confirmação de exclusão |
| `DiagnosticoPage` | `app/diagnostico/page.jsx` | Landing page + formulário de captura |
| `Clientes` | `crm/pages/Clientes.jsx` | Lista e CRUD de leads/clientes do CRM |
| `ClienteDetalhe` | `crm/pages/ClienteDetalhe.jsx` | Perfil 360° com edição inline |
| `InlineField` | `crm/pages/ClienteDetalhe.jsx` (inline) | Campo editável inline com save/cancel |

### Rotas

| Rota | Componente | Proteção | Sistema |
|------|-----------|----------|---------|
| `/diagnostico` | `DiagnosticoPage` | Pública | Captura |
| `/flow/leads` | `LeadsPage` | Middleware SSR | Flow |
| `/crm/clientes` | `Clientes` | ProtectedRoute client-side | CRM |
| `/crm/clientes/:id` | `ClienteDetalhe` | ProtectedRoute client-side | CRM |

---

## Regras de negócio

As regras identificadas no código:

| Regra | Implementação | Arquivo |
|-------|--------------|---------|
| Leads do site vão para a tabela `leads` | `insert({ name, phone, instagram, segment })` | `diagnostico/page.jsx:49` |
| Lead sem `status` é tratado como `em_aberto` | `l.status ?? 'em_aberto'` | `flow/leads/page.jsx:151` |
| Handle do Instagram recebe `@` automaticamente no form do site | `if (v && !v.startsWith('@')) v = '@' + v` | `diagnostico/page.jsx:138` |
| Handle do Instagram gera URL `instagram.com/{handle}` no CRM | `instagramUrl()` trata `@` e URL completa | `ClienteDetalhe.jsx:37-41` |
| Novo cliente no CRM começa com status `lead` por padrão | `EMPTY_FORM.status = 'lead'` | `Clientes.jsx:23` |
| Apenas `nome` é obrigatório ao criar no CRM | `if (!form.nome.trim()) return` | `Clientes.jsx:58` |
| WhatsApp no CRM gera link `wa.me/55{numero_sem_mascara}` | Template literal com `.replace(/\D/g,'')` | `ClienteDetalhe.jsx:263` |
| Upload de contrato limitado a 10 MB | `file.size > 10 * 1024 * 1024` | `ClienteDetalhe.jsx:136` |
| Upload usa `upsert: true` — sobrescreve silenciosamente | `upload(path, file, { upsert: true })` | `ClienteDetalhe.jsx:144` |
| Exclusão de cliente tem aviso mas sem cascata verificada | `window.confirm(...)` + `delete().eq('id', id)` | `Clientes.jsx:70-74` |
| Edição de campo inline salva imediatamente no banco | `update({ [field]: value })` | `ClienteDetalhe.jsx:129` |

---

## Lacunas que impedem um processo comercial completo

As seguintes lacunas foram identificadas com base na análise do código. Cada uma representa uma funcionalidade ausente que prejudica a operação comercial.

### 1. Sem integração entre os dois sistemas de leads

**Impacto:** Dados de um lead captado pelo site precisam ser digitados novamente no CRM. Risco alto de dados desatualizados ou esquecidos.

**Evidência:** Ausência de qualquer query cruzando `leads` e `crm_clientes` em qualquer arquivo.

---

### 2. Formulário de CTA secundário não grava no banco

**Impacto:** Leads que interagem com o formulário inferior da página `/diagnostico` não são registrados. Esse volume de conversões é invisível.

**Evidência:** `app/diagnostico/page.jsx` função `handleBottomSubmit` — abre WhatsApp sem `supabase.from('leads').insert(...)`.

---

### 3. Sem funil completo (sem "Fechado" e sem "Perdido")

**Impacto:** Impossível medir taxa de conversão. Não se sabe quantos leads foram ganhos ou perdidos dentro do sistema.

**Evidência:** `COLUMNS` em `app/flow/leads/page.jsx` tem apenas 4 estágios intermediários. `STATUS_OPTS` em `crm/pages/Clientes.jsx` não inclui `perdido`.

---

### 4. Sem responsável por lead ou cliente

**Impacto:** Qualquer membro da equipe pode alterar qualquer registro. Sem accountability. Impossível medir produtividade individual.

**Evidência:** Ausência de campo `responsible_id` ou similar em ambas as tabelas.

---

### 5. Sem tarefas e follow-ups

**Impacto:** A equipe depende de ferramentas externas (WhatsApp, notas pessoais, planilhas) para lembrar de quando e como retomar contato com um lead.

**Evidência:** Nenhuma tabela, componente ou interface de tarefas existe em nenhum arquivo do projeto.

---

### 6. Sem histórico de interações

**Impacto:** Ao abrir um lead, não é possível saber o que já foi dito, quando foi o último contato, ou qual foi o resultado da última reunião.

**Evidência:** Campo `notas` é um campo de texto único e estático. Sem tabela de log ou histórico.

---

### 7. Sem rastreamento de origem

**Impacto:** Impossível saber quais canais de aquisição geram mais clientes. Decisões de investimento em mídia não têm suporte de dados.

**Evidência:** Tabela `leads` não possui campo `source`. Tabela `crm_clientes` também não.

---

### 8. Sem valor estimado de oportunidade

**Impacto:** Impossível calcular pipeline value ou priorizar leads pelo potencial de receita.

**Evidência:** Nem `leads` nem `crm_clientes` possuem campo de valor estimado.

---

### 9. Sem etapas de negociação dentro do CRM

**Impacto:** O CRM não sabe em que fase da venda está um lead registrado nele. O único indicador é o status `lead`, sem sub-etapas.

**Evidência:** `STATUS_OPTS = ['lead','ativo','pausado','encerrado']` — quatro valores para cobrir todo o ciclo de vida.

---

### 10. Sem módulo de propostas

**Impacto:** Propostas comerciais são criadas fora do sistema (Word, PDF avulso). Não há rastreamento de quando foram enviadas, aprovadas ou recusadas.

**Evidência:** Nenhum arquivo no projeto referencia criação ou envio de propostas para leads.

---

### 11. Sem coluna "Convertido" no Kanban do Flow

**Impacto:** Um lead convertido em cliente permanece no Kanban indefinidamente, poluindo a visão dos leads ativos.

**Evidência:** `COLUMNS` em `app/flow/leads/page.jsx` — as 4 colunas existentes são todas estágios intermediários.

---

### 12. Sem filtros no Kanban de Leads do Flow

**Impacto:** Com volume alto de leads, localizar um lead específico requer percorrer visualmente o board inteiro.

**Evidência:** `app/flow/leads/page.jsx` — ausência de qualquer estado de filtro, busca ou ordenação.

---

### 13. Sem paginação em nenhum dos módulos

**Impacto:** Todos os registros são carregados de uma vez. Com crescimento da base, o tempo de carregamento e o consumo de memória aumentam linearmente.

**Evidência:** Queries sem `.limit()` ou `.range()` em `Clientes.jsx:40` e `flow/leads/page.jsx:80`.

---

### 14. Nota do Flow sem autoria ou timestamp

**Impacto:** Quando uma observação é editada, não há registro de quem a escreveu ou quando.

**Evidência:** `app/flow/leads/page.jsx` função `saveObs` — `update({ observations })` sem campo de `updated_by` ou `updated_at`.

---

*Arquivo gerado com base na análise direta do código-fonte. Todos os pontos de lacuna estão fundamentados em ausência verificada no código, não em suposição.*
