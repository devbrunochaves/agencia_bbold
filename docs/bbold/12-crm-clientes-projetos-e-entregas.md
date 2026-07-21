# 12 — CRM: Clientes, Projetos e Entregas

## Sumário

- [Fluxo do cliente após o fechamento comercial](#fluxo-do-cliente-após-o-fechamento-comercial)
- [Cadastro de clientes](#cadastro-de-clientes)
- [Dados de empresas](#dados-de-empresas)
- [Contatos](#contatos)
- [Contratos e serviços](#contratos-e-serviços)
- [Projetos](#projetos)
- [Entregas](#entregas)
- [Módulo Kanban (Entregas)](#módulo-kanban-entregas)
- [Módulo Demandas](#módulo-demandas)
- [Comparativo: Kanban vs Demandas](#comparativo-kanban-vs-demandas)
- [Etapas do fluxo de trabalho](#etapas-do-fluxo-de-trabalho)
- [Tarefas](#tarefas)
- [Responsáveis](#responsáveis)
- [Prazos](#prazos)
- [Aprovações](#aprovações)
- [Arquivos](#arquivos)
- [Comentários](#comentários)
- [Histórico](#histórico)
- [Recorrência](#recorrência)
- [Status por entidade](#status-por-entidade)
- [Relacionamento com leads](#relacionamento-com-leads)
- [Relacionamento com financeiro](#relacionamento-com-financeiro)
- [Relacionamento com usuários](#relacionamento-com-usuários)
- [Telas e navegação](#telas-e-navegação)
- [Rotas](#rotas)
- [Componentes](#componentes)
- [Tabelas do banco](#tabelas-do-banco)
- [Regras de negócio](#regras-de-negócio)
- [Lacunas identificadas](#lacunas-identificadas)

---

## Fluxo do cliente após o fechamento comercial

Este é o caminho percorrido por um cliente ativo dentro do CRM, do fechamento do contrato ao encerramento da operação.

```
┌──────────────────────────────────────────────────────────────┐
│ 1. ATIVAÇÃO DO CLIENTE                                       │
│                                                              │
│  /crm/clientes                                               │
│  → status alterado manualmente de 'lead' para 'ativo'        │
│     (edição do registro via modal)                           │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. FORMALIZAÇÃO DO CONTRATO                                  │
│                                                              │
│  /crm/contratos                                              │
│  → novo registro em crm_contratos                            │
│     campos: cliente, serviço, valor/mês, início, renovação  │
│                                                              │
│  /crm/clientes/:id                                           │
│  → upload do contrato assinado (PDF/DOC/imagem)              │
│     bucket: crm-arquivos, path: contratos/{id}/{ts}.{ext}    │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. INÍCIO DA OPERAÇÃO                                        │
│                                                              │
│  /crm/demandas  ou  /crm/entregas (Kanban)                   │
│  → demandas/entregas criadas em crm_entregas                 │
│     por serviço contratado, com prazo e tipo definidos       │
│  → briefing registrado por entrega                           │
│  → comentários registrados durante execução                  │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. EXECUÇÃO E ENTREGA                                        │
│                                                              │
│  crm_entregas.status:                                        │
│  planejado → em_andamento → revisao → concluido              │
│                                                              │
│  Movimentação:                                               │
│  - Kanban: botões "Mover para" no modal do card              │
│  - Demandas: dropdown de status por linha                    │
│  - Demandas: date picker inline de prazo por linha           │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. COBRANÇA MENSAL                                           │
│                                                              │
│  /crm/financeiro                                             │
│  → "Gerar mês" cria crm_cobrancas por cliente com contrato  │
│     ativo, agrupando valor de todos os contratos do cliente  │
│  → Status inicial: aguardando                                │
│  → "✓ Pago": status → pago + data_pagamento = hoje          │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. RENOVAÇÃO OU ENCERRAMENTO                                 │
│                                                              │
│  Renovação: data_renovacao em crm_contratos (sem automação)  │
│  Encerramento:                                               │
│  → crm_contratos.status = 'encerrado'                        │
│  → crm_clientes.status = 'encerrado' ou 'pausado'            │
│  Histórico: não registrado além de created_at                │
└──────────────────────────────────────────────────────────────┘
```

---

## Cadastro de clientes

### Localização

Módulo: `/crm/clientes` — `crm/pages/Clientes.jsx`

### Campos do formulário

| Campo | Obrigatório | Tipo/Validação |
|-------|-------------|----------------|
| Nome | Sim (`if (!form.nome.trim()) return`) | Texto livre |
| Empresa | Não | Texto livre |
| Nicho | Não | Select com 11 opções fixas |
| WhatsApp | Não | Texto com placeholder `(27) 99999-9999` |
| E-mail | Não | Input `type=email` (validação nativa do browser) |
| Instagram | Não | Texto (aceita `@handle` ou URL completa) |
| Link do Drive | Não | Texto (URL do Google Drive) |
| Status | Não (padrão: `lead`) | Select: lead / ativo / pausado / encerrado |
| Cor do avatar | Não (aleatória ao criar) | Picker de 8 cores hex fixas |
| Notas | Não | Textarea livre |

### Nicho — opções fixas

`Advocacia`, `Saúde`, `Nutrição`, `Barbearia`, `Moda`, `Estética`, `Gastronomia`, `Educação`, `Imobiliária`, `Tecnologia`, `Outro`

### Cor do avatar — paleta disponível

`#f59e0b`, `#10b981`, `#3b82f6`, `#8b5cf6`, `#ef4444`, `#ec4899`, `#06b6d4`, `#84cc16`

A cor é sorteada aleatoriamente ao abrir o modal de criação (`Math.floor(Math.random() * AVATAR_COLORS.length)`). Pode ser alterada pelo usuário antes de salvar.

**Evidência:** `crm/pages/Clientes.jsx` linhas 5, 15, 23, 45–48, 57–68

### Operações CRUD

| Operação | Query | Validação |
|----------|-------|-----------|
| Listar | `select('*').order('created_at', { ascending: false })` | — |
| Criar | `insert(form)` | `nome` obrigatório |
| Editar | `update(form).eq('id', editId)` | `nome` obrigatório |
| Excluir | `delete().eq('id', id)` | `window.confirm` |

Erros do Supabase não são tratados nem exibidos ao usuário.

**Evidência:** `crm/pages/Clientes.jsx` linhas 39–75

### Tabela exibida

Colunas: Cliente (avatar + nome + empresa), Nicho, WhatsApp, Status, Ações.

A coluna "Cliente" é um link para `/crm/clientes/:id`.

### Cabeçalho da página

Exibe: `{n} ativos · {total} total` — contagem calculada client-side do array em memória.

---

## Dados de empresas

O CRM **não possui uma entidade separada para empresas**. Os dados comerciais de pessoa física e jurídica são mesclados em `crm_clientes`:

| Dado da empresa | Campo em crm_clientes |
|----------------|----------------------|
| Razão social / nome fantasia | `empresa` |
| Segmento de atuação | `nicho` |
| Instagram da empresa | `instagram` |
| Google Drive da empresa | `drive_link` |

Consequências diretas:
- Não é possível agrupar múltiplos contatos sob a mesma empresa
- Não é possível representar uma empresa com múltiplas unidades ou departamentos como clientes separados ligados à mesma conta
- Não existe hierarquia conta-mãe / conta-filha

---

## Contatos

Cada `crm_clientes` possui um único conjunto de campos de contato:

| Canal | Campo | Ação disponível |
|-------|-------|----------------|
| WhatsApp | `whatsapp` | Link `wa.me/55{numero_sem_mascara}` |
| E-mail | `email` | Sem ação direta (só exibição) |
| Instagram | `instagram` | Link para `instagram.com/{handle}` |
| Google Drive | `drive_link` | Link direto para a pasta |

### Edição inline no perfil do cliente

Em `ClienteDetalhe.jsx`, os campos `whatsapp`, `email`, `instagram` e `drive_link` são editáveis individualmente via componente `InlineField` sem abrir o modal completo:

1. Botão "Editar" ou "+ Adicionar" aparece ao lado do label
2. Campo de input com auto-focus substitui a exibição
3. Salva com Enter ou botão "OK" — chama `supabase.from('crm_clientes').update({ [field]: value }).eq('id', id)`
4. Cancela com Escape ou botão "✕"
5. Atualiza o estado local imediatamente (sem reload da página)

**Evidência:** `crm/pages/ClienteDetalhe.jsx` linhas 43–99, 128–131

### Geração de links de contato rápido

WhatsApp: `https://wa.me/55${cliente.whatsapp.replace(/\D/g,'')}` (remove máscara)

Instagram:
- Se começa com `http` → usa diretamente
- Caso contrário → `https://instagram.com/${val.replace('@', '')}`

**Evidência:** `crm/pages/ClienteDetalhe.jsx` linhas 37–41, 263

---

## Contratos e serviços

### Localização

Módulo: `/crm/contratos` — `crm/pages/Contratos.jsx`

### Campos do formulário

| Campo | Obrigatório | Tipo |
|-------|-------------|------|
| Cliente (`cliente_id`) | Sim (guarda: `if (!form.cliente_id || !form.servico) return`) | Select de crm_clientes |
| Serviço (`servico`) | Sim | Select fixo (6 opções) |
| Valor mensal | Não (default: 0) | `number`, step=50, convertido com `parseFloat(...) \|\| 0` |
| Data de início | Não | `date` |
| Renovação | Não | `date` |
| Status | Não (default: `ativo`) | Select: ativo / pausado / encerrado |

### Serviços disponíveis

| Valor (banco) | Label exibido |
|---------------|--------------|
| `social_media` | Social Media |
| `trafego_pago` | Tráfego Pago |
| `design` | Design Gráfico |
| `site` | Site / Landing Page |
| `gmn` | Google Meu Negócio |
| `gestao_marca` | Gestão de Marca |

### Filtros da listagem

| Filtro | Opções |
|--------|--------|
| Serviço | Select com os 6 tipos + "Todos os serviços" |
| Status | Select ativo / pausado / encerrado + "Todos" |

**Filtro padrão ao carregar: `status = 'ativo'`** (`useState('ativo')`)

### MRR exibido no header

Calculado client-side: `sum(valor_mensal)` de contratos com `status = 'ativo'` sobre o array completo não filtrado.

### Join na query

```js
supabase.from('crm_contratos')
  .select('*, crm_clientes(id, nome, avatar_color)')
  .order('created_at', { ascending: false })
```

A coluna "Cliente" na tabela é um link para `/crm/clientes/{cliente_id}`.

### Relação contrato × cliente

- Um cliente pode ter **múltiplos contratos** ativos ao mesmo tempo (ex.: Social Media + Tráfego Pago)
- Não há limite de contratos por cliente no código
- Cada contrato representa um único serviço com um único valor mensal

### Relação contrato × financeiro

O módulo Financeiro usa contratos ativos para gerar cobranças. O valor da cobrança é a soma de todos os contratos ativos do cliente no mês de referência.

**Evidência:** `crm/pages/Contratos.jsx`, `crm/pages/Financeiro.jsx` linhas 78–80

---

## Projetos

**O CRM não possui uma entidade "projeto" explícita.**

O conceito de projeto é implicitamente representado pelo conjunto contrato + entregas de um cliente. Não há uma tela, tabela ou campo chamado "projeto" em nenhum arquivo do sistema.

O que mais se aproxima de um projeto são as entregas agrupadas por cliente e serviço dentro dos módulos Kanban e Demandas. Não há hierarquia formal entre contrato → projeto → tarefa — a estrutura é plana: contrato existe independentemente das entregas associadas ao mesmo serviço.

---

## Entregas

A entidade `crm_entregas` representa a unidade mínima de trabalho do CRM — equivalente a uma tarefa, entregável ou item de produção dentro de um serviço prestado.

### Campos da tabela `crm_entregas`

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | — | Chave primária |
| cliente_id | UUID | Sim | FK → `crm_clientes.id` |
| servico | TEXT | Não | Tipo de serviço (mesma enum dos contratos) |
| tipo | TEXT | Não | Subtipo da entrega (varia por serviço) |
| titulo | TEXT | Sim | Nome/título da entrega |
| prazo | DATE | Não | Data limite |
| notas | TEXT | Não | Observações gerais |
| briefing | TEXT | Não | Briefing completo da demanda |
| status | TEXT | Não (default: `planejado`) | Estado no fluxo de trabalho |
| created_at | TIMESTAMPTZ | — | Data de criação |

### Tipos por serviço (`TIPOS_POR_SERVICO`)

Disponíveis no módulo Kanban (Entregas.jsx):

| Serviço | Tipos disponíveis |
|---------|------------------|
| `social_media` | Post feed, Story, Reels, Legenda, Relatório mensal |
| `trafego_pago` | Campanha, Criativo, Relatório, Otimização |
| `design` | Arte, Identidade visual, Material impresso, Embalagem |
| `site` | Landing page, Site institucional, Ajuste |
| `gmn` | Post GMN, Resposta avaliação, Configuração |
| `gestao_marca` | Estratégia, Manual de marca, Apresentação |

No módulo Demandas, a lista de tipos é **flat e independente do serviço**:
`Post feed, Story, Reels, Legenda, Arte, Identidade visual, Landing page, Site institucional, Campanha, Criativo, Relatório, Carrossel, Outro`

Esta inconsistência significa que uma entrega criada via Demandas pode ter um tipo (`Carrossel`, `Outro`) inexistente na lista do Kanban, e vice-versa.

**Evidência:** `crm/pages/Entregas.jsx` linhas 21–28, `crm/pages/Demandas.jsx` linha 11

---

## Módulo Kanban (Entregas)

### Localização

`/crm/entregas` — `crm/pages/Entregas.jsx`

### Visualização

Board Kanban com 4 colunas fixas:

| Coluna | Chave | Cor |
|--------|-------|-----|
| Planejado | `planejado` | Cinza `#64748b` |
| Em andamento | `em_andamento` | Azul `#3b82f6` |
| Revisão | `revisao` | Âmbar `#f59e0b` |
| Concluído | `concluido` | Verde `#10b981` |

Cada coluna exibe um contador de cards. Ordenação: `prazo ASC, nullsFirst: false` (sem prazo vai para o final).

### Card de entrega

Cada card exibe: título, nome do cliente, tipo (se preenchido), prazo (data formatada com ícone de alerta se vencido).

Detecção de atraso:
```js
const atrasado = e.prazo && e.prazo < hoje && e.status !== 'concluido'
```
Card em atraso exibe `⚠️` antes da data em vermelho.

### Modal de detalhe do card

Ao clicar no card, modal exibe: título, cliente, tipo, prazo, notas (se preenchidas), botões de movimentação de status, botões Editar e Excluir.

**Não possui:** comentários (apenas no módulo Demandas), briefing, acesso ao Instagram ou Drive do cliente.

### Filtros do Kanban

| Filtro | Campo |
|--------|-------|
| Por cliente | Select gerado de `crm_clientes` |
| Por serviço | Select com 6 tipos + "Todos" |

Filtros combinados com AND, aplicados client-side.

### Header da página

`{n} pendentes · {n} concluídas` — calculado sobre o array filtrado.

**Evidência:** `crm/pages/Entregas.jsx`

---

## Módulo Demandas

### Localização

`/crm/demandas` — `crm/pages/Demandas.jsx`

### Visualização

Tabela agrupada por status, com cada grupo colapsável (toggle ▼). Cada grupo tem um cabeçalho colorido e uma sub-tabela com as demandas daquele status.

### Colunas da tabela

| Coluna | Conteúdo |
|--------|----------|
| Marcador | Barra colorida de 4px (cor do status) |
| Elemento | Título da demanda |
| 💬 | Contador de comentários + botão para abrir thread |
| Briefing | Ícone 📋 (preenchido) ou 📄 (vazio) + botão para abrir editor |
| Status | Chip colorido clicável → dropdown de mudança de status |
| Prazo | Input `type=date` inline — edita diretamente na linha |
| Cliente | Nome do cliente |
| Instagram | Link 📸 para Instagram do cliente (ou —) |
| Drive | Link 📁 para Drive do cliente (ou —) |
| Tipo | Tipo da entrega |

### Interações inline específicas do módulo Demandas

**Status inline:**
- Chip clicável que exibe as coordenadas via `getBoundingClientRect()`
- Dropdown fixo (`position: fixed`) renderizado fora do overflow para evitar clipping
- Clique fora fecha o dropdown (listener `mousedown` global via `useRef`)

**Prazo inline:**
- Input date diretamente na célula da tabela
- `onChange` salva imediatamente: `supabase.from('crm_entregas').update({ prazo }).eq('id', id)`
- Sem confirmação — atualização otimista no estado local + persistência assíncrona

### Briefing

Modal com título `"📋 Briefing — {titulo}"`, textarea de altura mínima 200px, exibe links de Instagram e Drive do cliente dentro do modal para referência rápida.

Salvo em `crm_entregas.briefing` via `update({ briefing: briefingDraft })`.

Ícone no botão da tabela: 📋 se há briefing, 📄 se vazio. Diferencia visualmente entradas com e sem briefing.

**Evidência:** `crm/pages/Demandas.jsx` linhas 88–100, 334–380

### Adicionar demanda por grupo

Cada grupo (status) tem um botão "+ Adicionar elemento" no rodapé da tabela. Abre modal pré-configurado com o status do grupo. Campos: título (obrigatório), cliente (obrigatório), prazo, tipo, serviço.

A demanda é inserida diretamente com o status do grupo em que o botão foi clicado.

**Evidência:** `crm/pages/Demandas.jsx` linhas 124–132, 322–327

### Header da página

`{n} em aberto · {total} total` — calculado sobre o array completo (sem filtro por cliente ou serviço).

**Nota:** O módulo Demandas **não possui filtro por cliente ou serviço**. Exibe todas as demandas de todos os clientes.

---

## Comparativo: Kanban vs Demandas

Ambos os módulos leem e escrevem na mesma tabela `crm_entregas`. A escolha entre eles é preferência de fluxo de trabalho da equipe.

| Funcionalidade | Kanban (`/crm/entregas`) | Demandas (`/crm/demandas`) |
|---|---|---|
| Visualização | Board 4 colunas | Tabela agrupada por status |
| Filtro por cliente | Sim | Não |
| Filtro por serviço | Sim | Não |
| Grupos colapsáveis | Não | Sim |
| Prazo inline | Não (só via modal de edição) | Sim (input direto na linha) |
| Status inline | Não (só via modal) | Sim (dropdown inline) |
| Comentários | Não | Sim (thread completa) |
| Briefing | Não | Sim (modal com textarea) |
| Instagram do cliente | Não | Sim (link na coluna) |
| Drive do cliente | Não | Sim (link na coluna) |
| Adicionar por coluna | Não (botão global) | Sim (botão por grupo) |
| Indicador de atraso | Sim (ícone ⚠️ e cor) | Sim (cor vermelha no input) |
| Ordenação | `prazo ASC` | `created_at DESC` |

**Evidência:** `crm/pages/Entregas.jsx`, `crm/pages/Demandas.jsx`

---

## Etapas do fluxo de trabalho

As quatro etapas são compartilhadas pelos dois módulos operacionais:

| Etapa | Chave | Cor | Significado |
|-------|-------|-----|-------------|
| Planejado | `planejado` | Cinza | Demanda criada, ainda não iniciada |
| Em andamento | `em_andamento` | Azul | Execução em curso |
| Revisão | `revisao` | Âmbar | Aguardando revisão interna ou aprovação |
| Concluído | `concluido` | Verde | Entrega finalizada |

### Progressão

Não há progressão forçada — o status pode ser alterado para qualquer etapa a qualquer momento, incluindo retroceder de "Em andamento" para "Planejado" ou de "Concluído" para qualquer estado anterior.

Não há data de entrada por etapa registrada. Não há campo `completed_at` ou `started_at`.

### Status "Concluído" e o conceito de aprovação

O status `revisao` é o único indicador de que uma entrega está aguardando validação. Não existe um fluxo formal de aprovação pelo cliente. A movimentação de `revisao` para `concluido` é feita internamente pela equipe, sem notificação ao cliente.

**Evidência:** `crm/pages/Entregas.jsx` linhas 4–9, `crm/pages/Demandas.jsx` linhas 4–9

---

## Tarefas

O sistema não distingue "entrega" de "tarefa". A entidade `crm_entregas` serve para ambos os propósitos:
- Grandes entregáveis ("Identidade visual completa")
- Tarefas recorrentes ("Post feed — Junho")
- Ações pontuais ("Ajuste de hero section")

Não existem sub-tarefas. Não é possível decompor uma entrega em etapas menores dentro do sistema.

---

## Responsáveis

**Status: não implementado.**

Nem `crm_clientes`, `crm_contratos`, `crm_entregas` nem `crm_cobrancas` possuem campo de responsável (`owner_id`, `assigned_to`, ou equivalente). Não é possível saber qual membro da equipe criou ou está responsável por um registro.

---

## Prazos

### Campo `prazo` em `crm_entregas`

Tipo: `DATE` (formato `YYYY-MM-DD`). Opcional — não há validação de obrigatoriedade.

### Detecção de atraso

Implementada em ambos os módulos:

```js
const hoje = new Date().toISOString().slice(0, 10)
const atrasado = e.prazo && e.prazo < hoje && e.status !== 'concluido'
```

Comparação entre strings ISO `YYYY-MM-DD` — funciona corretamente.

### Indicadores visuais

| Módulo | Indicador de atraso |
|--------|-------------------|
| Kanban | `⚠️` antes da data + cor vermelha (`var(--crm-danger)`) |
| Demandas | Input de prazo em vermelho (`var(--crm-danger)`) + `title="Prazo vencido"` |
| Dashboard | Badge colorido: verde (> 3 dias), amarelo (0–3 dias), vermelho (atrasado) |
| ClienteDetalhe | Sem indicador de atraso — exibe apenas a data |

### Prazo de renovação de contratos

`crm_contratos.data_renovacao` — data de renovação do contrato. Sem alertas ou notificações. Não aparece em nenhum dashboard. A renovação é tratada manualmente.

---

## Aprovações

**Status: não implementado como fluxo formal.**

O status `revisao` existe como estágio intermediário onde uma entrega pode ser colocada pela equipe, mas:
- Não há mecanismo para o cliente aprovar ou rejeitar
- Não há notificação enviada ao cliente quando uma entrega entra em revisão
- A movimentação de `revisao` para `concluido` é feita unilateralmente pela equipe
- Não há campo de "comentário de revisão" ou "motivo de reprovação"
- Não há ciclo de revisão numerado (ex.: revisão 1, revisão 2)

O módulo `/flow/aprovacoes` do painel interno (usando a tabela `approvals`) é um sistema separado, sem conexão com `crm_entregas`.

---

## Arquivos

### Contrato assinado do cliente

**Implementado** em `crm/pages/ClienteDetalhe.jsx`.

| Aspecto | Detalhe |
|---------|---------|
| Bucket | `crm-arquivos` |
| Path | `contratos/{cliente_id}/{timestamp}.{ext}` |
| Extensão extraída de | `file.name.split('.').pop()` |
| Limite de tamanho | 10 MB (`file.size > 10 * 1024 * 1024`) |
| Formato aceito (HTML `accept`) | `.pdf,.doc,.docx,.png,.jpg,.jpeg` |
| Validação MIME | Não — somente a extensão no accept, sem verificação no servidor |
| Modo de upload | `upsert: true` — sobrescreve o arquivo existente no mesmo path |
| URL armazenada | URL pública permanente em `crm_clientes.contrato_url` |
| Visualização | Link "Abrir" que abre em nova aba |
| Substituição | Botão "🔄 Substituir" — clica no input hidden `fileRef` |
| Remoção | Botão "Remover" → `crm_clientes.contrato_url = null` (não apaga do Storage) |

**Nota:** A remoção define `contrato_url = null` no banco mas não deleta o arquivo do bucket `crm-arquivos`. O arquivo permanece acessível via URL pública.

**Evidência:** `crm/pages/ClienteDetalhe.jsx` linhas 133–156, 158–163, 336–384

### Arquivos por entrega/demanda

**Não implementado.** Não é possível anexar arquivos a uma entrega individual. O único ponto de upload no CRM é o contrato assinado do cliente.

---

## Comentários

### Implementação

Disponível apenas no módulo Demandas (`crm/pages/Demandas.jsx`). **Não disponível no módulo Kanban.**

### Tabela `crm_comentarios`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Chave primária |
| entrega_id | UUID | FK → `crm_entregas.id` |
| texto | TEXT | Conteúdo do comentário |
| created_at | TIMESTAMPTZ | Data de criação |

### Funcionamento

**Carregamento:** Ao carregar a página, um `select('entrega_id')` sem `texto` busca apenas a contagem de comentários por entrega para exibir o badge numérico. O conteúdo completo é carregado apenas ao abrir o modal de comentários de uma entrega específica.

```js
// Ao carregar a página:
supabase.from('crm_comentarios').select('entrega_id')
// Monta mapa: { entrega_id: count }

// Ao abrir comentários de uma entrega:
supabase.from('crm_comentarios').select('*')
  .eq('entrega_id', entrega.id)
  .order('created_at', { ascending: true })
```

**Indicador visual:** Ícone 💬 com badge numérico sobre o botão quando há comentários (`counts[e.id] > 0`).

**Adição:** Input + botão "Enviar". Pressionar Enter (sem Shift) também envia. O novo comentário é inserido otimisticamente no estado local antes da confirmação do banco.

**Ausências:**
- Sem autoria (não registra quem escreveu)
- Sem edição de comentários
- Sem exclusão de comentários
- Timestamp exibido via `timeAgo()` (relativo: "agora", "5min", "2h", "3d")
- Sem menções (`@usuario`)
- Sem Realtime — novos comentários de outros usuários não aparecem sem recarregar

**Evidência:** `crm/pages/Demandas.jsx` linhas 62–75, 102–122, 382–423

---

## Histórico

**Status: não implementado.**

Não existe registro histórico de atividades em nenhuma entidade do CRM. Não é possível saber:
- Quais campos foram alterados e quando
- Quem alterou um status ou campo
- Quando um cliente mudou de `lead` para `ativo`
- Quando um contrato foi encerrado
- Qual versão tinha um briefing antes de ser editado

O único dado temporal disponível é `created_at` nas tabelas que o possuem.

---

## Recorrência

### Contratos — recorrência mensal implícita

Contratos com `status = 'ativo'` representam compromissos mensais recorrentes. O campo `valor_mensal` define o valor cobrado a cada ciclo. Não há campo de periodicidade — mensalidade é a única frequência suportada pelo design atual.

### Entregas — sem recorrência automática

Não existe mecanismo de geração automática de entregas recorrentes. Se um cliente tem contrato de Social Media ativo, as entregas mensais (posts, stories, reels) precisam ser criadas manualmente toda vez no Demandas ou Kanban.

### Cobranças — "Gerar mês" manual

O módulo Financeiro possui o botão "Gerar mês" que cria registros de cobrança para o mês selecionado. A geração é manual e on-demand, sem agendamento ou gatilho automático.

Lógica de deduplicação:
```js
const existentes = cobrancas.filter(c => c.mes_ref === filtroMes).map(c => c.cliente_id)
// Só gera para clientes SEM cobrança no mês selecionado
```

**Evidência:** `crm/pages/Financeiro.jsx` linhas 75–80

---

## Status por entidade

### `crm_clientes.status`

| Valor | Badge | Significado |
|-------|-------|------------|
| `lead` | Azul (info) | Prospect em negociação |
| `ativo` | Verde (success) | Cliente com contrato ativo |
| `pausado` | Amarelo (warning) | Serviço suspenso temporariamente |
| `encerrado` | Cinza (muted) | Contrato encerrado |

### `crm_contratos.status`

| Valor | Badge | Efeito no MRR |
|-------|-------|--------------|
| `ativo` | Verde | Incluído no MRR e na geração de cobranças |
| `pausado` | Amarelo | Excluído do MRR e das cobranças |
| `encerrado` | Cinza | Excluído do MRR e das cobranças |

### `crm_entregas.status`

| Valor | Cor | Fase |
|-------|-----|------|
| `planejado` | Cinza `#64748b` | Não iniciado |
| `em_andamento` | Azul `#3b82f6` | Em execução |
| `revisao` | Âmbar `#f59e0b` | Aguardando revisão |
| `concluido` | Verde `#10b981` | Finalizado |

### `crm_cobrancas.status`

| Valor | Badge | Ação disponível |
|-------|-------|----------------|
| `aguardando` | Azul | Botão "✓ Pago" |
| `pago` | Verde | — |
| `atraso` | Vermelho | Botão "✓ Pago" |

---

## Relacionamento com leads

O módulo de clientes e o módulo de leads são sistemas paralelos sem integração automática. Ver documentação completa em `11-crm-leads-e-funil.md`.

Resumo dos pontos de contato:

| Aspecto | Implementado? |
|---------|---------------|
| Lead vira cliente ao fechar negócio | Sim — manualmente (status lead → ativo) |
| Dados do lead migram para crm_clientes automaticamente | Não |
| Referência cruzada entre leads e crm_clientes | Não |
| Histórico de negociação visível no perfil do cliente | Não |

---

## Relacionamento com financeiro

O módulo Financeiro (`crm_cobrancas`) depende diretamente de `crm_clientes` e `crm_contratos`:

```
crm_clientes (1) ──── (N) crm_contratos
crm_clientes (1) ──── (N) crm_cobrancas
crm_contratos → alimenta cálculo de valor da cobrança
```

### Regras de relacionamento financeiro

1. Um cliente pode ter zero ou mais contratos
2. O MRR de um cliente = soma de `valor_mensal` dos contratos com `status = 'ativo'`
3. "Gerar mês" cria uma cobrança por cliente (não por contrato), somando todos os contratos ativos
4. A exclusão de um contrato não afeta cobranças já geradas
5. Não há FK explícito `crm_cobrancas → crm_contratos` — a relação é implícita pelo `cliente_id`

### Visibilidade do financeiro no perfil do cliente

Em `ClienteDetalhe.jsx`, o card "MRR do cliente" exibe:
```js
const mrr = contratos.filter(c => c.status === 'ativo')
  .reduce((s, c) => s + (parseFloat(c.valor_mensal) || 0), 0)
```

Não há exibição de cobranças (pagas/pendentes) no perfil do cliente.

**Evidência:** `crm/pages/ClienteDetalhe.jsx` linhas 182, `crm/pages/Financeiro.jsx`

---

## Relacionamento com usuários

**Status: não implementado.**

O CRM não possui nenhum vínculo entre registros e usuários do sistema. Não existe campo `created_by`, `updated_by`, `assigned_to` ou `responsible_id` em nenhuma tabela do CRM. Toda a equipe autenticada tem acesso irrestrito a todos os dados.

---

## Telas e navegação

### `/crm/clientes` — Lista de Clientes

- Barra de busca + 2 filtros (status, nicho) + limpar filtros
- Tabela com links para detalhe
- Botão "+ Novo Cliente" → modal de criação
- Botão "Editar" por linha → modal de edição com campos pré-preenchidos
- Botão "Excluir" por linha → `window.confirm` + delete

### `/crm/clientes/:id` — Perfil do Cliente

- Breadcrumb: Clientes → {nome}
- Header: avatar, nome, empresa, nicho, status badge
- 3 mini-cards: MRR do cliente, Serviços ativos, Entregas pendentes
- Linha de 3 cards: Contato (WhatsApp + e-mail), Instagram, Google Drive
- Linha de 2 cards: Contrato Assinado (upload), Serviços Contratados (lista)
- Seção Notas (condicional — só aparece se `cliente.notas` preenchido)
- Seção Entregas (condicional — só aparece se houver entregas): tabela com as 8 mais próximas do prazo, link "Ver no kanban →"

### `/crm/contratos` — Contratos

- Header: contagem de ativos + MRR total
- 2 filtros: serviço, status (padrão: ativo)
- Tabela com link para perfil do cliente
- Modal criar/editar com 6 campos

### `/crm/entregas` — Kanban

- Header: pendentes + concluídas
- 2 filtros: cliente, serviço
- Board 4 colunas com cards clicáveis
- Modal de detalhe (leitura + movimentação + editar + excluir)
- Modal de criação/edição completo

### `/crm/demandas` — Demandas

- Header: em aberto + total (sem filtros)
- 4 grupos colapsáveis por status
- Tabela com interações inline (status, prazo)
- Modal de briefing (por entrega)
- Modal de comentários (por entrega)
- Modal de nova demanda (por grupo)
- Dropdown de status fixo (position: fixed)

---

## Rotas

| Rota | Componente | Proteção |
|------|-----------|----------|
| `/crm/clientes` | `Clientes` | `ProtectedRoute` (client-side) |
| `/crm/clientes/:id` | `ClienteDetalhe` | `ProtectedRoute` (client-side) |
| `/crm/contratos` | `Contratos` | `ProtectedRoute` (client-side) |
| `/crm/entregas` | `Entregas` | `ProtectedRoute` (client-side) |
| `/crm/demandas` | `Demandas` | `ProtectedRoute` (client-side) |

Nenhuma das rotas do CRM está no matcher do `middleware.ts`. A proteção depende exclusivamente do estado React (`session`) em `CrmApp.jsx`.

---

## Componentes

| Componente | Arquivo | Responsabilidade |
|-----------|---------|-----------------|
| `Clientes` | `crm/pages/Clientes.jsx` | CRUD de clientes, lista + modal |
| `ClienteDetalhe` | `crm/pages/ClienteDetalhe.jsx` | Perfil 360°, edição inline, upload |
| `InlineField` | `crm/pages/ClienteDetalhe.jsx` (inline) | Campo editável individualmente |
| `Contratos` | `crm/pages/Contratos.jsx` | CRUD de contratos, filtros, MRR |
| `Entregas` | `crm/pages/Entregas.jsx` | Board Kanban, cards, movimentação |
| `Demandas` | `crm/pages/Demandas.jsx` | Tabela agrupada, briefing, comentários |

---

## Tabelas do banco

### `crm_clientes`

Tabela central. Representa leads, clientes ativos, pausados e encerrados.

```
id           UUID PRIMARY KEY
nome         TEXT NOT NULL
empresa      TEXT
nicho        TEXT
whatsapp     TEXT
email        TEXT
instagram    TEXT
drive_link   TEXT
status       TEXT  ('lead' | 'ativo' | 'pausado' | 'encerrado')
notas        TEXT
avatar_color TEXT
contrato_url TEXT
created_at   TIMESTAMPTZ
```

### `crm_contratos`

Serviços contratados por cliente. Alimenta MRR e cobrança.

```
id             UUID PRIMARY KEY
cliente_id     UUID  →  crm_clientes.id
servico        TEXT  ('social_media' | 'trafego_pago' | 'design' | 'site' | 'gmn' | 'gestao_marca')
valor_mensal   NUMERIC
data_inicio    DATE
data_renovacao DATE
status         TEXT  ('ativo' | 'pausado' | 'encerrado')
created_at     TIMESTAMPTZ
```

### `crm_entregas`

Tarefas e entregáveis do trabalho operacional.

```
id         UUID PRIMARY KEY
cliente_id UUID  →  crm_clientes.id
servico    TEXT
tipo       TEXT
titulo     TEXT NOT NULL
prazo      DATE
notas      TEXT
briefing   TEXT
status     TEXT  ('planejado' | 'em_andamento' | 'revisao' | 'concluido')
created_at TIMESTAMPTZ
```

### `crm_cobrancas`

Cobranças mensais por cliente. Geradas a partir de contratos ativos.

```
id              UUID PRIMARY KEY
cliente_id      UUID  →  crm_clientes.id
mes_ref         TEXT  (formato 'YYYY-MM')
valor           NUMERIC
status          TEXT  ('aguardando' | 'pago' | 'atraso')
data_pagamento  DATE
created_at      TIMESTAMPTZ
```

### `crm_comentarios`

Comentários por entrega. Apenas no módulo Demandas.

```
id          UUID PRIMARY KEY
entrega_id  UUID  →  crm_entregas.id
texto       TEXT
created_at  TIMESTAMPTZ
```

**Nota:** Nenhuma dessas tabelas está definida em `supabase-schema.sql`. Toda estrutura foi inferida das queries no código.

**Evidência:** `crm/pages/*.jsx` — campos lidos e escritos via Supabase

---

## Regras de negócio

As regras implementadas no código:

| Regra | Implementação | Arquivo/linha |
|-------|--------------|---------------|
| `nome` é o único campo obrigatório ao criar/editar cliente | `if (!form.nome.trim()) return` | `Clientes.jsx:58` |
| Novo cliente inicia com status `lead` por padrão | `EMPTY_FORM.status = 'lead'` | `Clientes.jsx:23` |
| Cor de avatar aleatória ao criar | `AVATAR_COLORS[Math.floor(Math.random() * ...)]` | `Clientes.jsx:46` |
| Excluir cliente requer confirmação | `window.confirm(...)` | `Clientes.jsx:71` |
| Notas do cliente aparecem no perfil só se preenchidas | `{cliente.notas && <div>...}` | `ClienteDetalhe.jsx:417` |
| Seção Entregas no perfil só aparece se houver entregas | `{entregas.length > 0 && <div>...}` | `ClienteDetalhe.jsx:425` |
| Perfil exibe no máximo 8 entregas | `entregas.slice(0, 8)` | `ClienteDetalhe.jsx:442` |
| MRR do cliente = soma dos contratos ativos | `contratos.filter(c => c.status === 'ativo').reduce(...)` | `ClienteDetalhe.jsx:182` |
| Contrato requer `cliente_id` e `servico` | `if (!form.cliente_id \|\| !form.servico) return` | `Contratos.jsx:71` |
| `valor_mensal` é parseado como float (default 0) | `parseFloat(form.valor_mensal) \|\| 0` | `Contratos.jsx:73` |
| Filtro padrão de contratos: apenas `ativo` | `useState('ativo')` para `filtroStatus` | `Contratos.jsx:33` |
| Entrega requer `titulo` e `cliente_id` | `if (!form.titulo.trim() \|\| !form.cliente_id) return` | `Entregas.jsx:82` |
| Entrega com `prazo < hoje && status != 'concluido'` = atrasada | Comparação de strings ISO | `Entregas.jsx:158`, `Demandas.jsx:207` |
| Prazo da demanda salvo imediatamente sem confirmação | `update({ prazo })` no `onChange` | `Demandas.jsx:83-85` |
| Comentário enviado com Enter (sem Shift) | `onKeyDown: e.key === 'Enter' && !e.shiftKey && addComment()` | `Demandas.jsx:412` |
| Nova demanda por grupo herda o status do grupo | `insert({ ...addForm, status: addModal })` | `Demandas.jsx:127` |
| Upload de contrato limitado a 10 MB | `file.size > 10 * 1024 * 1024` | `ClienteDetalhe.jsx:136` |
| Remoção de contrato não deleta arquivo do Storage | `update({ contrato_url: null })` sem delete do bucket | `ClienteDetalhe.jsx:158-162` |
| Tipos de entrega dependem do serviço selecionado (só no Kanban) | `TIPOS_POR_SERVICO[form.servico] \|\| []` | `Entregas.jsx:258` |
| Tipos de entrega são lista flat independente no Demandas | Constante `TIPOS` sem relação com serviço | `Demandas.jsx:11` |

---

## Lacunas identificadas

| Lacuna | Impacto |
|--------|---------|
| Sem entidade "projeto" | Impossível agrupar múltiplas entregas de um mesmo escopo de trabalho |
| Sem responsável por entrega ou contrato | Sem accountability; qualquer um pode alterar qualquer registro |
| Sem sub-tarefas | Entregas complexas não podem ser decompostas no sistema |
| Sem aprovação formal | O cliente não tem canal para aprovar ou rejeitar uma entrega |
| Sem arquivos por entrega | Impossível anexar o arquivo final de uma entrega ao registro |
| Sem comentários no Kanban | A thread de comentários só está disponível no módulo Demandas |
| Sem histórico de alterações | Impossível rastrear quem mudou o status ou o prazo |
| Sem alerta de renovação de contrato | `data_renovacao` existe mas não gera nenhum alerta |
| Sem geração automática de entregas recorrentes | Cada ciclo mensal precisa ser criado manualmente |
| Sem remoção de arquivo no Storage | Contratos "removidos" continuam acessíveis via URL pública |
| Listas de tipos inconsistentes entre módulos | Tipos disponíveis no Kanban diferem dos tipos no Demandas |
| Perfil limita a 8 entregas | Clientes com histórico longo perdem visibilidade das entregas antigas |
| Sem filtros no módulo Demandas | Com múltiplos clientes, o board fica difícil de usar |
| Sem autor nos comentários | Impossível saber quem escreveu cada comentário na thread |
| Sem Realtime nos comentários | Comentários de outros usuários não aparecem em tempo real |
| Sem dados financeiros no perfil do cliente | O histórico de cobranças do cliente não é visível no seu perfil |

---

*Arquivo gerado com base na análise direta do código-fonte de `crm/pages/Clientes.jsx`, `crm/pages/ClienteDetalhe.jsx`, `crm/pages/Contratos.jsx`, `crm/pages/Entregas.jsx`, `crm/pages/Demandas.jsx` e `crm/pages/Financeiro.jsx`.*
