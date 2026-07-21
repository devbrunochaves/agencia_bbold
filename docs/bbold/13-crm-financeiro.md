# 13 — CRM: Financeiro

## Sumário

- [Escopo do módulo](#escopo-do-módulo)
- [Contratos como base financeira](#contratos-como-base-financeira)
- [Planos e pacotes](#planos-e-pacotes)
- [Mensalidades e cobranças](#mensalidades-e-cobranças)
- [Contas a receber](#contas-a-receber)
- [Contas a pagar](#contas-a-pagar)
- [Vencimentos](#vencimentos)
- [Pagamentos](#pagamentos)
- [Inadimplência](#inadimplência)
- [Recorrência e geração de cobranças](#recorrência-e-geração-de-cobranças)
- [Receitas](#receitas)
- [Despesas](#despesas)
- [Categorias financeiras](#categorias-financeiras)
- [Centros de custo](#centros-de-custo)
- [Fluxo de caixa](#fluxo-de-caixa)
- [Dashboard financeiro](#dashboard-financeiro)
- [Relatórios](#relatórios)
- [Exportação e anexos](#exportação-e-anexos)
- [Notas fiscais](#notas-fiscais)
- [Integrações](#integrações)
- [Tabelas do banco](#tabelas-do-banco)
- [Tela e componentes](#tela-e-componentes)
- [Operações e ações](#operações-e-ações)
- [Filtros](#filtros)
- [Regras de negócio](#regras-de-negócio)
- [Permissões](#permissões)
- [Limitações](#limitações)
- [Mapa de implementação](#mapa-de-implementação)

---

## Escopo do módulo

O módulo Financeiro do CRM (`/crm/financeiro`, `crm/pages/Financeiro.jsx`) é dedicado exclusivamente ao controle de **cobranças mensais de clientes**. Ele não é um sistema contábil completo — não registra despesas, não emite notas fiscais, não integra com meios de pagamento e não produz DRE ou fluxo de caixa real.

**O que o módulo faz:**
- Registra cobranças mensais por cliente (`crm_cobrancas`)
- Gera cobranças em lote a partir dos contratos ativos ("Gerar mês")
- Controla o status de pagamento de cada cobrança (aguardando / pago / atraso)
- Exibe métricas do mês selecionado (total, pago, aguardando, atraso)
- Exibe gráfico histórico dos últimos 6 meses segmentado por status

**O que o módulo não faz** (ausente no código):
- Despesas, custos, contas a pagar
- Notas fiscais
- Integração com bancos ou gateways de pagamento
- Exportação de relatórios
- Alertas automáticos de inadimplência
- Fluxo de caixa real
- Categorias ou centros de custo

---

## Contratos como base financeira

Os contratos (`crm_contratos`) são a fonte de verdade do valor financeiro de cada cliente. O módulo Financeiro usa os contratos apenas para calcular o valor da cobrança ao executar "Gerar mês".

### Campos relevantes de `crm_contratos` para o financeiro

| Campo | Tipo | Uso financeiro |
|-------|------|---------------|
| `cliente_id` | UUID | Identifica a qual cliente a cobrança pertence |
| `servico` | TEXT | Permite breakdown de MRR por serviço no Dashboard |
| `valor_mensal` | NUMERIC | Base do valor da cobrança mensal |
| `status` | TEXT | Somente contratos `ativo` alimentam cobranças |
| `data_inicio` | DATE | Exibido no perfil do cliente; sem uso no financeiro |
| `data_renovacao` | DATE | Exibido; sem alerta ou lógica automática |

### Como contratos alimentam cobranças

Ao executar "Gerar mês", o sistema lê todos os contratos com `status = 'ativo'` (carregados na inicialização da tela) e agrupa por `cliente_id`, somando `valor_mensal`:

```js
const porCliente = {}
contratos.forEach(ct => {
  if (!porCliente[ct.cliente_id]) porCliente[ct.cliente_id] = 0
  porCliente[ct.cliente_id] += parseFloat(ct.valor_mensal) || 0
})
```

Um cliente com dois contratos ativos (ex.: Social Media R$800 + Tráfego Pago R$1.200) receberá **uma única cobrança de R$2.000** para o mês selecionado — não há cobrança separada por serviço/contrato.

**Evidência:** `crm/pages/Financeiro.jsx` linhas 75–92

---

## Planos e pacotes

**Status: não implementado no módulo CRM Financeiro.**

Não há entidade de "plano" ou "pacote" com preço tabelado no CRM. Cada contrato em `crm_contratos` tem um `valor_mensal` de entrada livre — o usuário digita qualquer valor.

Os pacotes com preço aparecem apenas na **página de diagnóstico do site** (`app/diagnostico/page.jsx`), como informação estática de marketing sem vínculo com o banco:

| Pacote | Preço (site — dado estático) |
|--------|------------------------------|
| Identidade Visual + Fundação Digital | A partir de R$1.500 |
| Gestão de Redes Sociais | R$800/mês |
| Presença Digital Completa | R$1.400/mês |
| Tráfego Pago (Meta + Google) | A partir de R$900/mês |
| Full Service BBold | A partir de R$3.500/mês |

Esses valores não são importados, não criam contratos automaticamente e não têm nenhum vínculo com `crm_contratos.valor_mensal`.

**Evidência:** `app/diagnostico/page.jsx` linhas 289–295

---

## Mensalidades e cobranças

### Entidade: `crm_cobrancas`

Cada registro em `crm_cobrancas` representa uma cobrança de um cliente em um determinado mês.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Chave primária |
| `cliente_id` | UUID | FK → `crm_clientes.id` |
| `mes_ref` | TEXT | Mês de referência no formato `YYYY-MM` |
| `valor` | NUMERIC | Valor a ser cobrado (BRL) |
| `status` | TEXT | `aguardando`, `pago`, `atraso` |
| `data_pagamento` | DATE | Data em que o pagamento foi confirmado |
| `created_at` | TIMESTAMPTZ | Data de criação do registro |

### Características do modelo de cobrança

- Uma cobrança por cliente por mês (não por contrato individual)
- Sem campo de vencimento (`data_vencimento`) — não há como definir quando a cobrança deve ser paga
- Sem campo de referência ao contrato de origem
- Sem campo de descrição ou observação
- Sem campo de forma de pagamento registrado
- Valor fixo no momento da geração — alterações nos contratos após a geração não afetam cobranças já criadas

**Evidência:** `crm/pages/Financeiro.jsx` linhas 29, 94–106

---

## Contas a receber

As cobranças com `status = 'aguardando'` ou `status = 'atraso'` equivalem a contas a receber, mas sem as características de um módulo de contas a receber completo:

| Funcionalidade | Implementado? | Observação |
|---|---|---|
| Listar cobranças pendentes | Sim | Filtro por status + mês |
| Valor total pendente no mês | Sim | Card "Aguardando" + "Em atraso" |
| Data de vencimento por cobrança | **Não** | Sem campo `data_vencimento` |
| Número de dias em atraso | **Não** | Sem cálculo automático |
| Histórico de cobranças por cliente | Sim (parcial) | Tabela filtrada por mês; sem view por cliente |
| Link para perfil do cliente | Sim | Nome é link para `/crm/clientes/:id` |
| Envio de cobrança ao cliente | **Não** | Sem e-mail, WhatsApp ou boleto |
| Detecção automática de atraso | **Não** | Status `atraso` é definido manualmente |

**Evidência:** `crm/pages/Financeiro.jsx` linhas 123–132, 237–265

---

## Contas a pagar

**Status: não implementado.**

O módulo Financeiro do CRM registra apenas receitas (cobranças de clientes). Não existe nenhuma entidade, tabela, tela ou campo para registrar despesas ou contas a pagar da agência.

Não há registro de: custas operacionais, fornecedores, ferramentas SaaS, folha de pagamento, impostos, comissões, aluguel ou qualquer outro tipo de saída financeira.

**Evidência:** ausência de qualquer tabela ou componente de despesas em todo o projeto.

---

## Vencimentos

**Status: não implementado.**

Não existe campo `data_vencimento` em `crm_cobrancas`. Não é possível definir quando uma cobrança deve ser paga. Consequentemente, não há:
- Cálculo automático de dias em atraso
- Alerta de cobrança próxima do vencimento
- Transição automática de `aguardando` → `atraso` na data de vencimento

A data relevante disponível na entidade é apenas `data_pagamento` (quando foi paga), não quando devia ser paga.

**Evidência:** `crm/pages/Financeiro.jsx` — estrutura de `crm_cobrancas` sem campo de vencimento

---

## Pagamentos

### "✓ Pago" — ação rápida

O principal mecanismo de confirmação de pagamento é o botão "✓ Pago" exibido inline na tabela para cada cobrança que não está com `status = 'pago'`:

```js
await supabase.from('crm_cobrancas')
  .update({
    status: 'pago',
    data_pagamento: new Date().toISOString().slice(0, 10)
  })
  .eq('id', c.id)
```

- Executa sem confirmação do usuário (sem `window.confirm`)
- Define `data_pagamento` como a data do clique (hoje, formato `YYYY-MM-DD`)
- Sem registro de forma de pagamento
- Sem comprovante gerado

**Evidência:** `crm/pages/Financeiro.jsx` linhas 252–259

### Edição manual de pagamento

Via modal "Editar Cobrança", o usuário pode alterar:
- `status` (aguardando / pago / atraso)
- `data_pagamento` (campo date, exibido condicionalmente apenas quando status = 'pago')
- `valor`
- `mes_ref`

O campo `data_pagamento` só aparece no modal quando o status selecionado é `pago`:
```js
{form.status === 'pago' && (
  <div className="crm-form-group">
    <label>Data do pagamento</label>
    <input className="crm-input" type="date" value={form.data_pagamento} ... />
  </div>
)}
```

**Evidência:** `crm/pages/Financeiro.jsx` linhas 306–311

### Formas de pagamento

**Status: não implementado.**

Não há campo `forma_pagamento` (PIX, boleto, transferência, cartão, dinheiro). Não é possível saber como o cliente pagou.

---

## Inadimplência

**Status: parcialmente implementado — apenas como status manual.**

O status `atraso` existe na entidade `crm_cobrancas`, mas é gerenciado **exclusivamente de forma manual**. Não há nenhuma automação que:
- Detecte que uma cobrança está vencida com base em uma data
- Transite automaticamente de `aguardando` para `atraso`
- Envie notificação ao cliente inadimplente
- Calcule e exiba dias de atraso
- Aplique multa ou juros

O usuário precisa abrir o modal de edição ou alterar o status manualmente para marcar uma cobrança como `atraso`.

### Visibilidade da inadimplência

- Card "Em atraso" no header: valor total em atraso no mês selecionado
- Filtro por status `atraso` na tabela
- Cor vermelha no badge e no card de stat
- Sem histórico de inadimplência consolidado por cliente

**Evidência:** `crm/pages/Financeiro.jsx` linhas 6–11, 132, 175–176

---

## Recorrência e geração de cobranças

### "Gerar mês" — processo detalhado

O botão "⚡ Gerar mês" é o mecanismo central de criação de cobranças recorrentes. É **100% manual e on-demand**.

**Pré-condições:**
- Contratos com `status = 'ativo'` devem existir (carregados na inicialização)
- O mês selecionado no filtro (`filtroMes`) é o mês alvo da geração

**Execução passo a passo:**

```
1. window.confirm — "Gerar cobranças de {mês} para todos os clientes com contrato ativo?"
   → Usuário cancela: interrompe
   → Usuário confirma: continua

2. Identifica clientes que já têm cobrança no mês alvo:
   existentes = cobrancas.filter(c => c.mes_ref === filtroMes).map(c => c.cliente_id)

3. Agrupa contratos ativos por cliente, somando valor_mensal:
   porCliente = { cliente_id: soma_valor_mensal }

4. Filtra clientes sem cobrança no mês:
   novas = porCliente.filter(([cid]) => !existentes.includes(cid))

5. Monta array de inserts:
   [{ cliente_id, mes_ref: filtroMes, valor: soma, status: 'aguardando' }]

6. Se novas.length === 0:
   alert('Todas as cobranças deste mês já foram geradas.')
   retorna

7. supabase.from('crm_cobrancas').insert(novas)
   → Batch insert único

8. load() — recarrega todos os dados
```

**Limitações do processo:**
- Usa `contratos` do estado local — não faz nova query no momento de gerar (usa dados carregados na inicialização da tela)
- Se um contrato foi encerrado ou criado após o carregamento inicial da tela sem recarregar a página, "Gerar mês" usará dados desatualizados
- Não há preview do que será gerado antes da confirmação
- Não é possível gerar para um subconjunto de clientes — é tudo ou nada
- Não suporta geração retroativa de múltiplos meses em lote

**Evidência:** `crm/pages/Financeiro.jsx` linhas 75–92

### Criação manual de cobrança

Botão "+ Nova Cobrança" abre modal com campos:
- Cliente (select — obrigatório)
- Mês de referência (input `type=month` — pré-preenchido com mês do filtro)
- Valor (number, step=50)
- Status (aguardando / pago / atraso)
- Data do pagamento (condicional — só aparece quando status = 'pago')

Validação: apenas `cliente_id` e `mes_ref` são obrigatórios. Permite criar cobrança com valor zero.

**Evidência:** `crm/pages/Financeiro.jsx` linhas 57–61, 94–106

---

## Receitas

### MRR (Monthly Recurring Revenue)

O MRR é calculado em dois contextos distintos:

**No Dashboard (`/crm/`):**
```js
const mrr = ctAtivos.reduce((s, c) => s + (parseFloat(c.valor_mensal) || 0), 0)
```
Fonte: `crm_contratos` com `status = 'ativo'`. Representa o potencial de receita mensal recorrente.

**No módulo Contratos (`/crm/contratos`):**
Header exibe o MRR total dos contratos ativos visíveis (após filtros aplicados).

**No perfil do cliente (`/crm/clientes/:id`):**
```js
const mrr = contratos.filter(c => c.status === 'ativo')
  .reduce((s, c) => s + (parseFloat(c.valor_mensal) || 0), 0)
```
MRR individual do cliente.

### Receita realizada vs. esperada

| Conceito | Fonte | Disponível? |
|----------|-------|------------|
| MRR esperado | `crm_contratos.valor_mensal` (contratos ativos) | Sim |
| Receita faturada | `crm_cobrancas.valor` (total do mês) | Sim |
| Receita recebida | `crm_cobrancas.valor` where `status='pago'` | Sim |
| Receita pendente | `crm_cobrancas.valor` where `status='aguardando'` | Sim |
| Receita em atraso | `crm_cobrancas.valor` where `status='atraso'` | Sim |
| Receita não faturada (sem cobrança gerada) | — | **Não** |
| Diferença entre MRR e cobrança real | — | **Não** |

**Nota:** Não há validação que impeça o valor de uma cobrança de divergir do valor do contrato correspondente. Um usuário pode editar `crm_cobrancas.valor` para qualquer número, gerando divergência silenciosa entre MRR esperado e valor cobrado.

### Breakdown de MRR por serviço

Disponível apenas no Dashboard (`/crm/`), via gráfico de barras:

```js
const byService = {}
ctAtivos.forEach(c => {
  const k = SERVICO_LABEL[c.servico] || c.servico
  byService[k] = (byService[k] || 0) + (parseFloat(c.valor_mensal) || 0)
})
```

Não está disponível no módulo Financeiro — apenas no Dashboard.

**Evidência:** `crm/pages/Dashboard.jsx` linhas 47–52

---

## Despesas

**Status: não implementado.**

O sistema não registra nenhuma despesa. Não existe nenhuma tabela, tela, campo ou componente relacionado a custos ou saídas financeiras da agência em qualquer arquivo do projeto.

---

## Categorias financeiras

**Status: não implementado.**

Não há campo de categoria em `crm_cobrancas` ou em qualquer outra entidade financeira. Todas as cobranças pertencem implicitamente à categoria "Receita de serviço prestado" sem subdivisão.

---

## Centros de custo

**Status: não implementado.**

Não existe o conceito de centro de custo em nenhum módulo do projeto.

---

## Fluxo de caixa

**Status: não implementado como módulo dedicado.**

O gráfico de "Receita — últimos 6 meses" no módulo Financeiro é a aproximação mais próxima de um fluxo de caixa, mas tem limitações significativas:
- Representa apenas receitas (cobranças de clientes), sem despesas
- Não discrimina entre recebimento efetivo e faturamento projetado
- Não considera saldo inicial ou saldo acumulado
- Não projeta meses futuros

Não existe módulo, tabela ou relatório de fluxo de caixa real no projeto.

---

## Dashboard financeiro

### Header do módulo (`/crm/financeiro`)

4 cards de KPI, calculados a partir do array `filtered` (cobranças do mês + status selecionados):

| Card | Fonte | Cor |
|------|-------|-----|
| Total do mês | `sum(valor)` de todas as cobranças filtradas | Branco (texto padrão) |
| Pago | `sum(valor)` where `status='pago'` | Verde |
| Aguardando | `sum(valor)` where `status='aguardando'` | Azul |
| Em atraso | `sum(valor)` where `status='atraso'` | Vermelho |

**Comportamento com filtros:** os KPIs respondem ao filtro de mês e de status. Se o filtro de status estiver ativo (ex.: apenas `pago`), os 4 cards mostrarão o mesmo valor — apenas o status filtrado terá valor não-zero.

**Evidência:** `crm/pages/Financeiro.jsx` linhas 129–132, 170–185

### Gráfico de barras empilhadas

**Título:** "Receita — últimos 6 meses"

**Biblioteca:** Recharts (`BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer`, `CartesianGrid`)

**Dados:**
```js
const meses = Array.from({ length: 6 }, (_, i) => mesRef(-(5 - i)))
// Gera: [5 meses atrás, 4 meses atrás, ..., mês atual]
```

**Séries:**

| Série | Cor | Campo |
|-------|-----|-------|
| Pago | Verde `#10b981` | `sum(valor)` where `status='pago'` no mês |
| Aguardando | Azul `#3b82f6` | `sum(valor)` where `status='aguardando'` no mês |
| Atraso | Vermelho `#ef4444` | `sum(valor)` where `status='atraso'` no mês |

**Fonte dos dados:** array completo `cobrancas` (não filtrado pelo mês selecionado) — o gráfico sempre mostra os 6 meses fixos independentemente do filtro da tabela.

**Tooltip personalizado:** exibe mês + valores formatados em BRL para cada série.

**Eixo Y:** formatado como `R${n}k` (ex.: `R$2k`).

**Evidência:** `crm/pages/Financeiro.jsx` linhas 114–121, 188–201

### Dashboard principal (`/crm/`)

Exibe 2 indicadores financeiros:
- MRR total (calculado de contratos ativos)
- MRR por serviço (gráfico de barras)

Nenhum dado de cobranças aparece no Dashboard principal — apenas dados de contratos.

**Evidência:** `crm/pages/Dashboard.jsx` linhas 37–52

---

## Relatórios

**Status: não implementado como módulo dedicado.**

O gráfico de 6 meses e os 4 KPIs são as únicas visualizações de dados financeiros. Não existe:
- Relatório de inadimplência
- Relatório de MRR evolution (crescimento mês a mês)
- Relatório por cliente (quanto cada cliente pagou ao longo do tempo)
- Relatório por serviço
- Relatório anual
- Projeção de receita

---

## Exportação e anexos

**Status: não implementado.**

Não há nenhuma funcionalidade de exportação de dados financeiros (CSV, Excel, PDF). Não há geração de boletos, recibos ou comprovantes de pagamento. Os dados só são acessíveis via a interface web do CRM.

---

## Notas fiscais

**Status: não implementado.**

Não há nenhum campo, tela ou integração relacionada a emissão de notas fiscais (NF-e, NFS-e). O módulo financeiro não se conecta a prefeituras municipais, sistemas de emissão de NF ou qualquer serviço fiscal.

---

## Integrações

**Status: nenhuma integração implementada.**

| Integração | Status |
|------------|--------|
| Gateway de pagamento (Stripe, Asaas, PagSeguro) | Não implementado |
| Geração de boleto | Não implementado |
| PIX automático | Não implementado |
| Open Banking | Não implementado |
| ERP / sistema contábil | Não implementado |
| Emissão de nota fiscal | Não implementado |
| Conciliação bancária | Não implementado |
| Envio de cobrança por e-mail/WhatsApp | Não implementado |

---

## Tabelas do banco

### `crm_cobrancas`

Principal (e única) tabela do módulo financeiro.

```
id              UUID PRIMARY KEY
cliente_id      UUID     →  crm_clientes.id
mes_ref         TEXT     formato 'YYYY-MM'
valor           NUMERIC  valor em BRL
status          TEXT     'aguardando' | 'pago' | 'atraso'
data_pagamento  DATE     data de confirmação do pagamento
created_at      TIMESTAMPTZ
```

**Ausências relevantes:**
- Sem `data_vencimento`
- Sem `contrato_id` (sem FK para a origem da cobrança)
- Sem `descricao` ou `observacao`
- Sem `forma_pagamento`
- Sem `comprovante_url`
- Sem `nf_url` (nota fiscal)
- Sem `desconto`
- Sem `updated_at`

### `crm_contratos` (papel financeiro)

Usada como fonte de cálculo do MRR e do valor a ser gerado nas cobranças. Não é gerenciada pelo módulo Financeiro — sua CRUD está em `/crm/contratos`.

Query no load() do Financeiro:
```js
supabase.from('crm_contratos')
  .select('cliente_id, valor_mensal, status')
  .eq('status', 'ativo')
```

**Evidência:** `crm/pages/Financeiro.jsx` linha 49

### `crm_clientes` (papel financeiro)

Usada apenas para exibição do nome do cliente nas cobranças (join):
```js
supabase.from('crm_cobrancas')
  .select('*, crm_clientes(id, nome, avatar_color)')
```

**Evidência:** `crm/pages/Financeiro.jsx` linha 47

---

## Tela e componentes

### Localização

Rota: `/crm/financeiro`
Arquivo: `crm/pages/Financeiro.jsx`
Proteção: `ProtectedRoute` (client-side em `CrmApp.jsx`, sem middleware SSR)

### Layout da tela

```
[Header] Financeiro — Cobranças e MRR da agência
[Botões] ⚡ Gerar mês  |  + Nova cobrança

[4 KPIs] Total do mês | Pago | Aguardando | Em atraso
         (respondem ao filtro de mês + status)

[Gráfico] BarChart empilhado — últimos 6 meses
          séries: pago (verde) | aguardando (azul) | atraso (vermelho)
          (fixo — não responde ao filtro de mês)

[Filtros] Select mês (12 meses) | Select status

[Tabela]  Cliente | Mês | Valor | Status | Pgto | Ações
          Ações: [✓ Pago] [Editar] [Excluir]
```

### Componente auxiliar: `CustomTooltip`

Tooltip personalizado do gráfico Recharts, definido inline. Exibe: mês, e para cada série: label + valor em BRL.

---

## Operações e ações

| Ação | Gatilho | Validação | Query |
|------|---------|-----------|-------|
| Listar cobranças | Carga inicial | — | `select('*, crm_clientes(id, nome, avatar_color)').order('mes_ref', { ascending: false })` |
| Gerar mês | Botão "⚡ Gerar mês" | `window.confirm` + deduplicação | `insert(novas)` em lote |
| Nova cobrança | Botão "+ Nova cobrança" | `cliente_id` + `mes_ref` obrigatórios | `insert(payload)` |
| Editar cobrança | Botão "Editar" por linha | `cliente_id` obrigatório | `update(payload).eq('id', editId)` |
| Marcar como pago | Botão "✓ Pago" por linha | — (sem confirmação) | `update({ status: 'pago', data_pagamento: hoje })` |
| Excluir cobrança | Botão "Excluir" por linha | `window.confirm` | `delete().eq('id', id)` |

---

## Filtros

### Filtro de mês

Select com os 12 meses anteriores (do mais antigo ao mais recente):
```js
const mesesOpts = Array.from({ length: 12 }, (_, i) => mesRef(-(11 - i)))
// Gera: [11 meses atrás, ..., mês atual]
```

Valor padrão: mês corrente (`mesRef()` sem offset).

**Importante:** o filtro de mês afeta os KPIs e a tabela, mas **não afeta o gráfico**. O gráfico sempre exibe os 6 meses mais recentes de forma fixa.

### Filtro de status

Select com: `aguardando`, `pago`, `atraso` e opção vazia "Todos os status".
Valor padrão: vazio (todos os status exibidos).

### Combinação

Ambos os filtros são aplicados com AND sobre o array `cobrancas` em memória:
```js
const filtered = cobrancas.filter(c => {
  const matchMes    = !filtroMes    || c.mes_ref === filtroMes
  const matchStatus = !filtroStatus || c.status  === filtroStatus
  return matchMes && matchStatus
})
```

**Evidência:** `crm/pages/Financeiro.jsx` linhas 123–127, 155

---

## Regras de negócio

| Regra | Implementação | Arquivo/linha |
|-------|--------------|---------------|
| Cobrança é por cliente por mês (não por contrato) | `gerarMes` agrupa por `cliente_id` antes de inserir | `Financeiro.jsx:78-85` |
| "Gerar mês" usa contratos carregados no `load()` | `contratos` é estado local — não refaz query | `Financeiro.jsx:75-92` |
| Deduplicação de cobranças: um cliente não recebe 2 cobranças no mesmo mês | `filter(([cid]) => !existentes.includes(cid))` | `Financeiro.jsx:83-84` |
| Valor da cobrança gerada = soma de todos os contratos ativos do cliente | `porCliente[ct.cliente_id] += parseFloat(ct.valor_mensal) \|\| 0` | `Financeiro.jsx:80-81` |
| Status inicial de cobranças geradas: `aguardando` | `{ status: 'aguardando' }` no payload insert | `Financeiro.jsx:85` |
| "Gerar mês" usa o mês do filtro ativo (não necessariamente o mês atual) | `filtroMes` como mês alvo | `Financeiro.jsx:76` |
| "✓ Pago" registra `data_pagamento = hoje` (data do clique) | `new Date().toISOString().slice(0, 10)` | `Financeiro.jsx:255` |
| "✓ Pago" não exige confirmação | Sem `window.confirm` | `Financeiro.jsx:252-259` |
| "✓ Pago" só aparece quando `status !== 'pago'` | `{c.status !== 'pago' && <button...>}` | `Financeiro.jsx:252` |
| Campo `data_pagamento` no modal só aparece quando `status = 'pago'` | `{form.status === 'pago' && <div>...}` | `Financeiro.jsx:306` |
| Valor da cobrança convertido para float no save | `parseFloat(form.valor) \|\| 0` | `Financeiro.jsx:97` |
| Exclusão exige `window.confirm` | `window.confirm('Excluir esta cobrança?')` | `Financeiro.jsx:109` |
| Gráfico calcula do array completo `cobrancas`, não do `filtered` | Usa `cobrancas.filter(...)` não `filtered.filter(...)` | `Financeiro.jsx:116-121` |
| KPIs calculados sobre `filtered` (afetados pelo filtro de mês + status) | `filtered.reduce(...)` | `Financeiro.jsx:129-132` |
| Mês de referência pré-preenchido ao abrir "Nova Cobrança" com o mês do filtro | `{ ...EMPTY_FORM, mes_ref: filtroMes }` | `Financeiro.jsx:59` |
| Valor de cobrança pode divergir do valor do contrato sem aviso | Sem validação cruzando `crm_contratos` | Ausência em `Financeiro.jsx` |
| Não é possível reverter "pago" com um clique | Sem botão "Reverter" — requer edição manual | Ausência em `Financeiro.jsx` |

---

## Permissões

**Status: não implementado.**

Não existe controle de acesso por papel (RBAC) no CRM. Qualquer usuário autenticado tem acesso irrestrito a todas as operações financeiras: criar, editar, excluir cobranças, gerar mês, marcar como pago. Não há separação entre quem pode visualizar dados financeiros e quem pode alterá-los.

---

## Limitações

As limitações identificadas são categorizadas por severidade de impacto operacional:

### Críticas

| Limitação | Impacto |
|-----------|---------|
| Sem `data_vencimento` | Impossível automatizar detecção de inadimplência ou enviar cobranças no prazo correto |
| Sem transição automática `aguardando` → `atraso` | A inadimplência depende de ação manual; clientes em atraso passam despercebidos |
| Gerar mês usa dados em memória (não refaz query) | Se um contrato foi alterado após o carregamento da tela, a cobrança gerada reflete dados obsoletos |

### Altas

| Limitação | Impacto |
|-----------|---------|
| Sem forma de pagamento registrada | Impossível saber se o pagamento foi via PIX, boleto ou outro método |
| Sem notificação de cobrança ao cliente | A comunicação da cobrança é feita externamente (WhatsApp manual) |
| Sem vínculo entre cobrança e contrato(s) de origem | Impossível auditar de onde veio o valor de uma cobrança |
| Valor editável sem validação cruzada | Valor cobrado pode divergir silenciosamente do contrato |

### Médias

| Limitação | Impacto |
|-----------|---------|
| Sem exportação de dados financeiros | Relatórios e prestação de contas precisam ser refeitos manualmente em planilhas |
| Sem notas fiscais | A operação fiscal da agência ocorre fora do sistema |
| Gráfico não responde ao filtro de mês | Comportamento inconsistente — usuário pode esperar que filtrar o mês afete o gráfico |
| Sem histórico de cobranças por cliente no perfil | É necessário ir ao Financeiro e buscar por cliente para ver o histórico |
| Histórico de meses limitado a 12 no filtro | Cobranças mais antigas que 11 meses ficam acessíveis apenas se o filtro for editado manualmente para um mês anterior |
| Sem reversão com um clique de "pago" | Para corrigir um "✓ Pago" marcado por engano é preciso editar o registro manualmente |
| Sem campo de observação na cobrança | Informações adicionais (ex.: número de NF, banco, chave PIX) não têm onde ser registradas |

### Baixas

| Limitação | Impacto |
|-----------|---------|
| Sem despesas ou contas a pagar | A saúde financeira real da agência não é mensurável pelo sistema |
| Sem categorias ou centros de custo | Impossível segmentar receitas por projeto, serviço ou unidade |
| Sem projeção de receita futura | O MRR futuro pode ser estimado manualmente mas não é calculado pelo sistema |
| Sem fluxo de caixa real | Entradas e saídas não consolidadas |
| Sem integração com sistemas contábeis | Dados precisam ser re-digitados em sistema contábil externo |

---

## Mapa de implementação

Resumo objetivo do que está implementado, incompleto ou ausente:

| Funcionalidade | Status |
|---|---|
| CRUD de cobranças mensais | ✅ Implementado |
| Geração em lote de cobranças ("Gerar mês") | ✅ Implementado |
| Confirmação rápida de pagamento ("✓ Pago") | ✅ Implementado |
| Filtro por mês (12 meses) | ✅ Implementado |
| Filtro por status de cobrança | ✅ Implementado |
| KPIs do mês (total, pago, aguardando, atraso) | ✅ Implementado |
| Gráfico histórico 6 meses (3 séries) | ✅ Implementado |
| MRR por serviço (no Dashboard) | ✅ Implementado |
| Data de pagamento registrada automaticamente | ✅ Implementado |
| Link para perfil do cliente na tabela | ✅ Implementado |
| Deduplicação no "Gerar mês" | ✅ Implementado |
| Status de inadimplência manual (`atraso`) | ⚠️ Parcial — sem automação |
| Vencimento de cobranças | ❌ Não implementado |
| Detecção automática de atraso | ❌ Não implementado |
| Notificação de cobrança ao cliente | ❌ Não implementado |
| Forma de pagamento registrada | ❌ Não implementado |
| Despesas / Contas a pagar | ❌ Não implementado |
| Fluxo de caixa | ❌ Não implementado |
| Notas fiscais | ❌ Não implementado |
| Exportação de dados (CSV / PDF) | ❌ Não implementado |
| Integração com gateway de pagamento | ❌ Não implementado |
| Boleto / PIX automático | ❌ Não implementado |
| Relatórios financeiros | ❌ Não implementado |
| Categorias financeiras | ❌ Não implementado |
| Centros de custo | ❌ Não implementado |
| Permissões por papel | ❌ Não implementado |
| Planos com preço tabelado | ❌ Não implementado |

---

*Arquivo gerado com base na análise direta do código-fonte de `crm/pages/Financeiro.jsx`, `crm/pages/Dashboard.jsx`, `crm/pages/Contratos.jsx`, `crm/pages/ClienteDetalhe.jsx` e `app/diagnostico/page.jsx`.*
