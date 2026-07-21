# 14 — APIs, Ações e Integrações

## Sumário

- [Visão geral da arquitetura de dados](#visão-geral-da-arquitetura-de-dados)
- [Rotas de API](#rotas-de-api)
- [Server Actions](#server-actions)
- [Webhooks e callbacks](#webhooks-e-callbacks)
- [Supabase — banco de dados](#supabase--banco-de-dados)
- [Supabase — autenticação](#supabase--autenticação)
- [Supabase — Storage](#supabase--storage)
- [Supabase — Realtime](#supabase--realtime)
- [Sanity CMS](#sanity-cms)
- [Google Analytics 4](#google-analytics-4)
- [Google Fonts](#google-fonts)
- [WhatsApp](#whatsapp)
- [Formulários e captura de dados](#formulários-e-captura-de-dados)
- [Serviços de terceiros — instalados mas não integrados](#serviços-de-terceiros--instalados-mas-não-integrados)
- [Serviços ausentes](#serviços-ausentes)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Validações e tratamento de erros](#validações-e-tratamento-de-erros)
- [Permissões e autenticação nas chamadas](#permissões-e-autenticação-nas-chamadas)
- [Riscos e dependências críticas](#riscos-e-dependências-críticas)
- [Mapa de integrações](#mapa-de-integrações)

---

## Visão geral da arquitetura de dados

O projeto não possui camada de API própria. Não existe nenhum arquivo `route.ts` ou `route.js` em `app/`, e nenhum arquivo com a diretiva `"use server"` (Server Actions). Toda comunicação com serviços externos é feita **diretamente do cliente (browser)** via SDKs de terceiros.

```
Browser
  │
  ├── Supabase JS SDK    → Banco de dados, Auth, Storage, Realtime
  ├── Sanity SDK (GROQ)  → Conteúdo do blog (Server Components)
  ├── Google Tag Manager → Analytics (script externo)
  ├── next/font/google   → Fontes tipográficas (build time)
  └── wa.me links        → WhatsApp (deep links — sem SDK)
```

**Ausências confirmadas:**
- Nenhuma rota de API (`route.ts` / `route.js`)
- Nenhum Server Action (`"use server"`)
- Nenhuma chamada `fetch()` nativa para APIs externas
- Nenhum webhook recebido (nenhum handler de eventos externos)
- Nenhuma integração de e-mail
- Nenhum gateway de pagamento

**Evidência:** `find /home/user/agencia_bbold/app -name "route.*"` retorna vazio; `grep -r '"use server"'` retorna vazio.

---

## Rotas de API

**Status: não existem.**

O projeto não define nenhuma rota de API no diretório `app/`. Não há endpoints `GET`, `POST`, `PUT`, `PATCH` ou `DELETE` expostos pela aplicação Next.js.

Todo acesso ao banco de dados ocorre via:
1. Chamadas diretas ao SDK do Supabase a partir de componentes React (client-side)
2. Chamadas ao SDK do Sanity em Server Components (build-time / SSR)

Isso significa que o banco de dados Supabase é acessado diretamente pelo browser com a `anon_key` — sem intermediação de uma camada de API que pudesse aplicar validações adicionais, rate limiting ou filtragem de dados sensíveis.

---

## Server Actions

**Status: não existem.**

Nenhum arquivo no projeto utiliza a diretiva `"use server"`. Não há Server Actions do Next.js implementadas para nenhuma operação de escrita, autenticação ou processamento de formulário.

---

## Webhooks e callbacks

**Status: nenhum implementado em nenhuma direção.**

**Webhooks recebidos (inbound):** zero. A aplicação não tem endpoint para receber eventos de serviços externos (Supabase Database Webhooks, WhatsApp Business, gateways de pagamento, etc.).

**Webhooks enviados (outbound):** zero. A aplicação não envia notificações HTTP para sistemas externos quando eventos ocorrem.

O único mecanismo reativo de dados em tempo real é o Supabase Realtime (WebSocket), descrito na seção dedicada.

---

## Supabase — banco de dados

### Configuração dos clientes

O projeto possui **dois clientes Supabase distintos** com características diferentes:

#### Cliente 1 — SSR (Flow e site)

| Atributo | Valor |
|----------|-------|
| Arquivo | `lib/supabase.js` |
| Pacote | `@supabase/ssr` |
| Função | `createBrowserClient(url, anon_key)` |
| Persistência de sessão | Cookies (compatível com SSR/Edge) |
| Usado por | `/flow/*`, `/diagnostico`, middleware |

```js
import { createBrowserClient } from '@supabase/ssr'
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
```

#### Cliente 2 — Legacy (CRM)

| Atributo | Valor |
|----------|-------|
| Arquivo | `crm/lib/supabase.js` |
| Pacote | `@supabase/supabase-js` |
| Função | `createClient(url, anon_key)` |
| Persistência de sessão | localStorage |
| Usado por | `/crm/*` |

```js
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
)
```

O cliente CRM tem fallbacks hardcoded (`placeholder.supabase.co`, `placeholder-key`) que permitem ao código carregar sem quebrar quando as variáveis de ambiente não estão definidas — mascarando erros de configuração.

#### Cliente 3 — Middleware (Edge)

| Atributo | Valor |
|----------|-------|
| Arquivo | `middleware.ts` |
| Pacote | `@supabase/ssr` |
| Função | `createServerClient(url, anon_key, { cookies })` |
| Usado por | Verificação de sessão em `/flow/*` e `/login` |

### Mapa completo de tabelas e operações

#### Tabelas do sistema Flow (`lib/supabase.js`)

| Tabela | Operações | Arquivos |
|--------|-----------|---------|
| `leads` | SELECT, INSERT, UPDATE, DELETE | `app/diagnostico/page.jsx`, `app/flow/leads/page.jsx` |
| `contents` | SELECT, INSERT, UPDATE, DELETE | `app/flow/page.jsx`, `app/flow/workflow/page.jsx`, `app/flow/calendario/page.jsx`, `app/flow/conteudos/page.jsx`, `app/flow/clientes/[id]/page.jsx` |
| `clients` | SELECT | `app/flow/page.jsx`, `app/flow/workflow/page.jsx`, `app/flow/calendario/page.jsx`, `app/flow/conteudos/page.jsx`, `app/flow/aprovacoes/page.jsx`, `app/flow/relatorios/page.jsx`, `app/flow/biblioteca/page.jsx` |
| `approvals` | SELECT | `app/flow/aprovacoes/page.jsx` |
| `contracts` | SELECT, INSERT, UPDATE, DELETE | `app/flow/contratos/page.jsx` |
| `library_files` | SELECT, INSERT, UPDATE, DELETE | `app/flow/biblioteca/page.jsx` |
| `performance_records` | SELECT, DELETE | `app/flow/clientes/[id]/page.jsx` |

#### Tabelas do CRM (`crm/lib/supabase.js`)

| Tabela | Operações | Arquivos |
|--------|-----------|---------|
| `crm_clientes` | SELECT, INSERT, UPDATE, DELETE | `crm/pages/Clientes.jsx`, `crm/pages/ClienteDetalhe.jsx`, `crm/pages/Dashboard.jsx`, `crm/pages/Demandas.jsx`, `crm/pages/Financeiro.jsx` |
| `crm_contratos` | SELECT, INSERT, UPDATE, DELETE | `crm/pages/Contratos.jsx`, `crm/pages/Dashboard.jsx`, `crm/pages/Financeiro.jsx` |
| `crm_entregas` | SELECT, INSERT, UPDATE, DELETE | `crm/pages/Entregas.jsx`, `crm/pages/Demandas.jsx`, `crm/pages/Dashboard.jsx`, `crm/pages/ClienteDetalhe.jsx` |
| `crm_cobrancas` | SELECT, INSERT, UPDATE, DELETE | `crm/pages/Financeiro.jsx` |
| `crm_comentarios` | SELECT (contagem + full), INSERT | `crm/pages/Demandas.jsx` |

### Padrão de queries

Todas as queries são construídas com o Supabase JS SDK client-side. Não há prepared statements, stored procedures chamadas por API, ou views consultadas diretamente. Exemplos representativos:

```js
// Leitura com join
supabase.from('crm_contratos')
  .select('*, crm_clientes(id, nome, avatar_color)')
  .order('created_at', { ascending: false })

// Insert em lote
supabase.from('crm_cobrancas').insert(arrayDeObjetos)

// Update condicional
supabase.from('crm_entregas').update({ status }).eq('id', id)

// Delete com confirmação manual
supabase.from('crm_clientes').delete().eq('id', id)

// Upsert no storage
supabase.storage.from('crm-arquivos').upload(path, file, { upsert: true })
```

---

## Supabase — autenticação

### Métodos utilizados

| Método | Uso | Arquivo |
|--------|-----|---------|
| `supabase.auth.signInWithPassword({ email, password })` | Login no Flow e no CRM | `app/login/page.jsx`, `crm/pages/Login.jsx` |
| `supabase.auth.getUser()` | Validação de sessão (Edge) | `middleware.ts`, `components/flow/FlowSidebar.jsx` |
| `supabase.auth.getSession()` | Verificação de sessão (client) | `crm/CrmApp.jsx` |
| `supabase.auth.onAuthStateChange(callback)` | Listener de mudança de sessão | `crm/CrmApp.jsx`, `components/flow/FlowSidebar.jsx` |
| `supabase.auth.signOut()` | Logout | `components/flow/FlowSidebar.jsx`, `crm/components/Layout.jsx` |

### Diferença crítica entre os dois contextos

| Aspecto | Flow (`/flow/*`) | CRM (`/crm/*`) |
|---------|------------------|----------------|
| Método de validação | `getUser()` — faz chamada ao servidor Supabase | `getSession()` — lê token do localStorage sem validar no servidor |
| Proteção de rota | Middleware SSR (edge function) | `ProtectedRoute` React component (client-side) |
| Vulnerabilidade | Baixa | Alta — token expirado ou inválido pode passar despercebido |

### Fluxo de login no Flow

```
1. Usuário preenche email + senha em /login
2. supabase.auth.signInWithPassword({ email, password })
3. Sucesso → router.push('/flow')
4. Erro → mensagem genérica exibida (sem detalhamento do erro)
5. middleware.ts: toda requisição a /flow/* chama getUser()
   → Inválido: redirect para /login
   → Válido: requsição segue normalmente
```

### Fluxo de login no CRM

```
1. Usuário preenche email + senha em /crm/login
2. supabase.auth.signInWithPassword({ email, password })
3. Sucesso → navigate('/crm/')
4. Erro → mensagem de erro exibida
5. CrmApp.jsx: getSession() no mount + onAuthStateChange listener
   → Sem sessão: <Navigate to="/crm/login" replace />
   → Com sessão: <Layout> com rotas protegidas renderizadas
```

**Evidência:** `middleware.ts`, `app/login/page.jsx`, `crm/CrmApp.jsx`, `crm/pages/Login.jsx`

---

## Supabase — Storage

### Bucket: `crm-arquivos`

| Atributo | Detalhe |
|----------|---------|
| **Finalidade** | Armazenar contratos assinados de clientes do CRM |
| **Arquivo envolvido** | `crm/pages/ClienteDetalhe.jsx` |
| **Tipo de acesso** | Público (URLs públicas permanentes) |
| **Path** | `contratos/{cliente_id}/{timestamp}.{ext}` |

#### Dados enviados (upload)

```js
supabase.storage
  .from('crm-arquivos')
  .upload(path, file, { upsert: true })
```

- `path`: `contratos/${id}/${Date.now()}.${ext}`
- `file`: objeto File do input HTML
- `upsert: true`: sobrescreve silenciosamente se o path já existir

Extensão extraída de: `file.name.split('.').pop()` — sem validação MIME.

Tamanho máximo: 10 MB (verificado no client antes do upload):
```js
if (file.size > 10 * 1024 * 1024) { ... return }
```

Tipos aceitos pelo atributo HTML: `.pdf,.doc,.docx,.png,.jpg,.jpeg`
(apenas cosmético — o `accept` não bloqueia outros tipos no servidor)

#### Dados recebidos (URL pública)

```js
const { data: { publicUrl } } = supabase.storage
  .from('crm-arquivos')
  .getPublicUrl(path)
```

A URL pública é armazenada em `crm_clientes.contrato_url`. Não há expiração — a URL é permanente e pública enquanto o arquivo existir no bucket.

#### Remoção

A "remoção" limpa apenas o campo no banco (`crm_clientes.contrato_url = null`). **O arquivo físico no bucket não é deletado.** Continua acessível pela URL original.

```js
await supabase.from('crm_clientes').update({ contrato_url: null }).eq('id', id)
// Arquivo em crm-arquivos/contratos/{id}/{ts}.{ext} permanece no bucket
```

#### Riscos

| Risco | Severidade |
|-------|-----------|
| Sem validação MIME — qualquer tipo de arquivo pode ser subido | Alta |
| URL pública permanente de documentos jurídicos | Alta |
| Arquivos "removidos" permanecem acessíveis via URL | Média |
| `upsert: true` sobrescreve sem aviso | Baixa |

**Evidência:** `crm/pages/ClienteDetalhe.jsx` linhas 133–163

---

## Supabase — Realtime

### Canal ativo: `flow-notif`

| Atributo | Detalhe |
|----------|---------|
| **Arquivo** | `app/flow/layout.jsx` |
| **Canal** | `supabase.channel('flow-notif')` |
| **Escopo** | Todas as páginas do `/flow/*` (montado no layout) |
| **Finalidade** | Notificações in-app em tempo real para a equipe |

#### Eventos escutados

| Evento | Tabela | Condição | Notificação gerada |
|--------|--------|----------|--------------------|
| `INSERT` | `contents` | — | "Novo conteúdo criado" |
| `UPDATE` | `contents` | `status === 'Publicado'` | "Conteúdo publicado" |
| `UPDATE` | `contents` | `pub_date < hoje && status !== 'Publicado'` | "Atraso detectado" |
| `INSERT` | `approvals` | — | "Aprovação pendente" |
| `UPDATE` | `approvals` | — | "Material atualizado" |
| `INSERT` | `clients` | — | "Novo cliente" |

As notificações são armazenadas em `localStorage` (`bbold_flow_notifs`) e exibidas pelo componente de notificações do Flow.

#### Canal de leads: `leads-rt`

| Atributo | Detalhe |
|----------|---------|
| **Arquivo** | `app/flow/leads/page.jsx` |
| **Canal** | `supabase.channel('leads-rt')` |
| **Escopo** | Apenas a página `/flow/leads` |
| **Finalidade** | Atualização do Kanban em tempo real quando leads chegam do site |

| Evento | Tabela | Efeito |
|--------|--------|--------|
| `INSERT` | `leads` | Novo card inserido no topo da coluna "Em Aberto" |
| `UPDATE` | `leads` | Card atualizado no board sem reload |

**Evidência:** `app/flow/layout.jsx`, `app/flow/leads/page.jsx`

---

## Sanity CMS

### Finalidade

CMS headless para gerenciamento do blog da BBOLD. O Sanity fornece uma interface editorial (Studio) acessível em `/studio` e uma API de conteúdo consultada via GROQ.

### Arquivos envolvidos

| Arquivo | Função |
|---------|--------|
| `sanity/env.ts` | Lê variáveis de ambiente; defaults para `dataset="production"`, `apiVersion="2024-01-01"` |
| `sanity/client.ts` | Cria o cliente Sanity com `useCdn: true`, `projectId \|\| "placeholder"` |
| `sanity/sanity.config.ts` | Configura o Studio com `structureTool()` em basePath `/studio` |
| `sanity/schema.ts` | Registra um schema: `post` |
| `sanity/schemas/post.ts` | Definição do schema do tipo `post` |
| `sanity/queries.ts` | 4 queries GROQ para listar e buscar posts |
| `app/studio/[[...tool]]/page.tsx` | Serve o Studio via `NextStudio` |
| `components/BlogPreview.tsx` | Consome `latestPostsQuery` (últimos 4 posts) |
| `app/(main)/blog/page.tsx` | Consome `allPostsQuery` |
| `app/(main)/blog/[slug]/page.tsx` | Consome `postBySlugQuery` |

### Dados enviados

Nenhum. O Sanity é somente leitura pelo lado da aplicação. A escrita de conteúdo ocorre pelo Studio (`/studio`) em chamadas gerenciadas internamente pelo Sanity SDK.

### Dados recebidos (GROQ queries)

```ts
// allPostsQuery — usado em /blog e /blog/[slug] (generateStaticParams)
*[_type == "post"] | order(publishedAt desc) {
  title, slug, publishedAt, excerpt, mainImage, body
}

// postBySlugQuery — usado em /blog/[slug]
*[_type == "post" && slug.current == $slug][0] { ... }

// latestPostsQuery — usado em BlogPreview.tsx
*[_type == "post"] | order(publishedAt desc)[0...4] { ... }

// recentPostsQuery — definida em queries.ts, sem uso identificado no código
```

### Configuração do cliente

```ts
// sanity/client.ts
export const client = createClient({
  projectId: projectId || "placeholder",
  dataset,         // default: "production"
  apiVersion,      // default: "2024-01-01"
  useCdn: true,    // usa CDN para reads (não serve para writes)
})
```

`useCdn: true` significa que leituras são servidas pelo CDN da Sanity (`cdn.sanity.io`) com latência reduzida mas dados potencialmente com alguns segundos de delay em relação à última escrita.

### Riscos

| Risco | Severidade |
|-------|-----------|
| `projectId` sem variável de ambiente configurada usa string `"placeholder"` — o blog fica silenciosamente vazio sem erro evidente | Média |
| Studio em `/studio` sem proteção de middleware — qualquer pessoa pode acessar a URL | Alta |
| `useCdn: true` pode servir conteúdo levemente desatualizado após publicação | Baixa |

**Evidência:** `sanity/client.ts`, `sanity/env.ts`, `app/studio/[[...tool]]/page.tsx`

---

## Google Analytics 4

### Finalidade

Rastreamento de visitantes e comportamento no site público da BBOLD.

### Arquivos envolvidos

- `app/layout.tsx` — único arquivo com os scripts de GA

### Dados enviados

O GA4 coleta automaticamente (sem configuração adicional no código):
- Page views (cada navegação SPA é rastreada pelo gtag)
- Sessões e usuários
- Origem do tráfego (referrer, UTM params)
- Informações de dispositivo e localização (IP anonimizado)
- Duração da sessão

### Dados recebidos

Nenhum — o GA4 é unidirecional: envia dados para o Google, não retorna dados para a aplicação.

### Implementação

```tsx
// app/layout.tsx — presente no root layout (afeta TODAS as páginas)
<Script
  src="https://www.googletagmanager.com/gtag/js?id=G-QXQ4ZWWBSG"
  strategy="afterInteractive"
/>
<Script id="gtag-init" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-QXQ4ZWWBSG');
  `}
</Script>
```

- `strategy="afterInteractive"` — carregado após hidratação da página
- Measurement ID hardcoded: `G-QXQ4ZWWBSG`
- Sem `gtag('event', ...)` personalizado em nenhum componente
- Sem consentimento de cookies implementado (LGPD)

### Estado atual

✅ Implementado e ativo. O script é carregado em todas as páginas (root layout), incluindo `/flow`, `/crm`, `/login` e `/studio` — o que significa que sessões internas da equipe também são rastreadas.

### Riscos

| Risco | Severidade |
|-------|-----------|
| Measurement ID hardcoded no código-fonte (exposto publicamente no bundle) | Baixa |
| Sem banner de consentimento de cookies (LGPD/GDPR) | Alta |
| GA rastreia páginas internas da equipe (`/flow/*`, `/crm/*`) | Média |

**Evidência:** `app/layout.tsx` linhas 46–57

---

## Google Fonts

### Finalidade

Carregar as fontes tipográficas do design system da BBOLD.

### Arquivos envolvidos

| Contexto | Método | Arquivo |
|----------|--------|---------|
| App Next.js | `next/font/google` (otimizado) | `app/layout.tsx` |
| HTMLs estáticos | `<link rel="stylesheet">` (direto) | `bio/index.html`, `valores/index.html`, `conteudos/index.html`, `public/estrategia/index.html`, `public/servicos/index.html` |

### Fontes carregadas via Next.js

| Fonte | Pesos | Variável CSS |
|-------|-------|-------------|
| Bebas Neue | 400 | `--font-bebas` |
| Barlow | 400, 600, 700, 900 | `--font-barlow` |
| Inter | 400, 500, 600, 700, 800 | `--font-inter` |

O `next/font/google` baixa as fontes no build time e as serve como arquivos estáticos locais — nenhuma requisição ao Google Fonts é feita em runtime para as páginas Next.js.

### Riscos

| Risco | Severidade |
|-------|-----------|
| HTMLs estáticos fazem requisição em runtime ao `fonts.googleapis.com` (privacidade) | Baixa |
| Inconsistência tipográfica se os HTMLs estáticos forem migrados | Baixa |

---

## WhatsApp

### Finalidade

Converter visitantes do site em contatos diretos com a equipe da BBOLD via WhatsApp.

### Arquivos envolvidos

| Arquivo | Uso |
|---------|-----|
| `app/diagnostico/page.jsx` | Constante `WPP`, link pós-formulário e Bottom CTA |
| `app/(main)/presenca-digital/PresencaDigitalClient.tsx` | Constante `WA_BASE` para botão CTA |
| `components/Contact.tsx` | Link de contato geral |
| `components/Footer.tsx` | Link no rodapé |
| `app/bio/page.tsx` | Link na bio page |
| `app/flow/leads/page.jsx` | Link dinâmico por número do lead |
| `crm/pages/ClienteDetalhe.jsx` | Link dinâmico por número do cliente |
| HTMLs estáticos | `bio/index.html`, `conteudos/index.html` |

### Tipos de integração

**1. Links estáticos (número da BBOLD)**

```js
const WPP = 'https://wa.me/5527997341557'
// Número: (27) 9 9734-1557
```

Usado em CTAs do site, Contact, Footer, bio page.

**2. Link com mensagem pré-formatada (pós-formulário de diagnóstico)**

```js
// Após submit do formulário HERO de /diagnostico
const msg = encodeURIComponent(
  `Olá! Me chamo ${name} e acabei de solicitar o diagnóstico gratuito...`
)
setWppLink(`${WPP}?text=${msg}`)
```

O nome, segmento e contexto do formulário são inseridos na mensagem. O lead é primeiro gravado no Supabase, depois o link é montado.

**3. Link dinâmico por número (leads e clientes)**

```js
// Flow leads
`https://wa.me/55${lead.phone.replace(/\D/g, '')}`

// CRM ClienteDetalhe
`https://wa.me/55${cliente.whatsapp.replace(/\D/g,'')}`
```

Remove caracteres não numéricos e prefixa com o código do Brasil (55).

### Dados enviados

Apenas o número de telefone e, opcionalmente, uma mensagem pré-formatada via parâmetro `?text=`. Nenhuma API ou webhook é chamada.

### Dados recebidos

Nenhum. Links `wa.me` abrem o WhatsApp no dispositivo do usuário — não há callback ou confirmação de que a conversa foi iniciada.

### Dependências

- Nenhuma. Funciona sem chave de API, SDK ou conta especial.
- O número `5527997341557` está hardcoded em múltiplos arquivos.

### Estado atual

✅ Implementado. Integração simples via deep-links. **Não é a WhatsApp Business API** — não há envio programático de mensagens, templates, chatbots ou webhooks de recebimento.

---

## Formulários e captura de dados

### Formulário de diagnóstico — HERO (`/diagnostico`)

| Atributo | Detalhe |
|----------|---------|
| **Arquivo** | `app/diagnostico/page.jsx` |
| **Campos** | `name` (obrigatório), `phone` (obrigatório, mascarado), `instagram` (opcional), `segment` (obrigatório) |
| **Destino** | `supabase.from('leads').insert({ name, phone, instagram, segment })` |
| **Após envio** | Link para WhatsApp com mensagem pré-preenchida |
| **Validação** | HTML `required` apenas; sem validação server-side |
| **Tratamento de erro** | Nenhum — o `await` do insert não tem `.catch()` ou verificação de `error` |

### Formulário de diagnóstico — Bottom CTA (`/diagnostico`)

| Atributo | Detalhe |
|----------|---------|
| **Arquivo** | `app/diagnostico/page.jsx` |
| **Campos** | `name`, `phone` |
| **Destino** | **Nenhum** — abre `wa.me` direto, sem INSERT no banco |
| **Risco** | Leads captados pelo CTA secundário são invisíveis ao sistema |

### Formulário de login — Flow

| Atributo | Detalhe |
|----------|---------|
| **Arquivo** | `app/login/page.jsx` |
| **Campos** | `email`, `password` |
| **Destino** | `supabase.auth.signInWithPassword({ email, password })` |
| **Resposta** | Sucesso → `router.push('/flow')` / Erro → mensagem genérica |

### Formulário de login — CRM

| Atributo | Detalhe |
|----------|---------|
| **Arquivo** | `crm/pages/Login.jsx` |
| **Campos** | `email`, `password` |
| **Destino** | `supabase.auth.signInWithPassword({ email, password })` |
| **Resposta** | Sucesso → `navigate('/crm/')` / Erro → `setError(error.message)` |

---

## Serviços de terceiros — instalados mas não integrados

### `@google/generative-ai` (Google Gemini)

| Atributo | Detalhe |
|----------|---------|
| **Versão instalada** | `^0.24.1` |
| **Finalidade prevista** | Desconhecida — sem documentação de intenção no código |
| **Uso atual** | Zero importações em qualquer arquivo do projeto |
| **Estado** | Dependência morta (`package.json` sem uso) |
| **Risco** | Aumenta o bundle de dependências sem benefício; versão desatualizada pode ter vulnerabilidades |

**Evidência:** `package.json` + `grep -r "@google/generative-ai"` retorna apenas o `package.json`

---

## Serviços ausentes

Os serviços abaixo são mencionados no contexto do negócio (formas de pagamento, comunicação, etc.) mas não têm nenhuma integração técnica no projeto:

| Serviço | Menção no código | Integração real |
|---------|-----------------|----------------|
| **E-mail** | Ausente | Não implementado |
| **Gateway de pagamento** | `PAYMENT_METHODS = ['Pix', 'Cartão de Crédito', 'Boleto']` em `app/flow/contratos/page.jsx` (dropdown de opção no contrato — dado textual, sem API) | Não implementado |
| **Nota fiscal** | Ausente | Não implementado |
| **CRM externo (HubSpot, Pipedrive, etc.)** | Ausente | Não implementado |
| **WhatsApp Business API** | Ausente | Não implementado (apenas wa.me links) |
| **Assinatura digital de contratos** | Ausente | Não implementado |
| **Push notifications** | Ausente | Não implementado |
| **SMS** | Ausente | Não implementado |

---

## Variáveis de ambiente

O projeto usa **5 variáveis de ambiente**, todas com prefixo `NEXT_PUBLIC_` (expostas no bundle client-side):

| Variável | Valor padrão | Obrigatória | Arquivo(s) |
|----------|-------------|-------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Nenhum | Sim | `lib/supabase.js`, `crm/lib/supabase.js`, `middleware.ts` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Nenhum (CRM tem `'placeholder-key'`) | Sim | `lib/supabase.js`, `crm/lib/supabase.js`, `middleware.ts` |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `""` | Sim (para blog) | `sanity/env.ts` |
| `NEXT_PUBLIC_SANITY_DATASET` | `"production"` | Não | `sanity/env.ts` |
| `NEXT_PUBLIC_SANITY_API_VERSION` | `"2024-01-01"` | Não | `sanity/env.ts` |

### Riscos das variáveis de ambiente

| Risco | Severidade |
|-------|-----------|
| Todas as variáveis são `NEXT_PUBLIC_` — expostas no bundle JavaScript do browser | Alta |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` exposta permite consultas diretas ao banco de qualquer origem (contornado apenas por RLS — que está desabilitado) | Crítica |
| Sem variáveis server-only (`SERVICE_ROLE_KEY`) — nenhuma operação privilegiada disponível | Alta |
| CRM tem fallback `'placeholder-key'` que silencia falhas de configuração | Média |
| Não há arquivo `.env.example` no repositório | Baixa |

---

## Validações e tratamento de erros

### Validações implementadas

| Formulário / Operação | Validação | Onde |
|----------------------|-----------|------|
| Login (Flow e CRM) | Email e senha obrigatórios (HTML `required`) | Browser nativo |
| Diagnóstico | `name`, `phone`, `segment` obrigatórios (HTML `required`) | Browser nativo |
| Novo cliente CRM | Apenas `nome.trim()` verificado em JS | `Clientes.jsx:58` |
| Novo contrato CRM | `cliente_id` e `servico` obrigatórios | `Contratos.jsx:71` |
| Nova entrega CRM | `titulo.trim()` e `cliente_id` obrigatórios | `Entregas.jsx:82` |
| Nova cobrança CRM | `cliente_id` e `mes_ref` obrigatórios | `Financeiro.jsx:95` |
| Upload de contrato | Tamanho ≤ 10MB verificado no client | `ClienteDetalhe.jsx:136` |
| Formulário de contratos Flow | `client_name` e outros campos obrigatórios | `contratos/page.jsx` |

### Validações ausentes

- Nenhuma validação server-side (sem API routes, sem Server Actions)
- Sem validação de MIME type em uploads
- Sem sanitização de entrada (além do React JSX que escapa HTML por padrão)
- Sem rate limiting em formulários públicos
- Sem CAPTCHA ou proteção anti-bot no `/diagnostico`
- Sem validação de formato de CPF/CNPJ nos contratos (`client_doc`)
- Sem verificação de unicidade de e-mail ao cadastrar clientes

### Tratamento de erros

A maioria das operações Supabase não trata o objeto `error` retornado:

```js
// Padrão recorrente — erro silenciado
await supabase.from('leads').insert({ name, phone, instagram, segment })
// Sem: const { error } = await ... ; if (error) { ... }

// Padrão recorrente no CRM
await supabase.from('crm_clientes').delete().eq('id', id)
// Sem verificação de erro
```

Exceções onde erros são tratados:
- `crm/pages/ClienteDetalhe.jsx` — erro no upload exibe mensagem via `setUploadMsg`
- `app/login/page.jsx` — erro no login exibe mensagem genérica
- `crm/pages/Login.jsx` — erro no login exibe `error.message`

---

## Permissões e autenticação nas chamadas

Todas as chamadas ao Supabase usam a `anon_key` — a chave pública com permissões mínimas. A separação de acesso entre usuários autenticados e anônimos deveria ser implementada via Row Level Security (RLS), mas **RLS está desabilitado em todas as tabelas**.

| Camada | Implementada? |
|--------|---------------|
| Autenticação Supabase (session válida) | Sim — middleware valida `/flow/*`, CRM usa getSession() |
| RLS (Row Level Security) | Não — desabilitado em todas as tabelas |
| Service Role Key (admin) | Não — sem uso em nenhum arquivo |
| Permissões por tabela via Supabase Policies | Não — sem policies definidas |
| Rate limiting de API | Não — dependente do free tier do Supabase |

**Consequência:** qualquer pessoa com a `anon_key` (disponível no bundle JS do browser) pode fazer chamadas diretas à API do Supabase e ler ou escrever em qualquer tabela, sem autenticação.

---

## Riscos e dependências críticas

### Dependência: Supabase

O Supabase é o único backend do projeto. Se o serviço ficar indisponível:
- Login impossível (auth)
- Todas as páginas do `/flow` e `/crm` ficam sem dados
- Formulário de diagnóstico falha silenciosamente (sem feedback ao usuário)
- Realtime para de funcionar

Sem fallback, cache de emergência ou retry logic implementados.

### Dependência: Sanity

Se o Sanity ficar indisponível ou o `projectId` não estiver configurado:
- Blog fica vazio (páginas renderizam sem conteúdo)
- Studio inacessível
- Sem mensagem de erro ao usuário

### Dependência: Google Analytics

Se o GTM bloquear ou falhar, o script `afterInteractive` falha silenciosamente — sem impacto para o usuário final.

### Tabela de riscos consolidada

| Risco | Categoria | Severidade |
|-------|-----------|-----------|
| `anon_key` pública + RLS desabilitado | Segurança | Crítica |
| Formulário de diagnóstico sem tratamento de erro | Confiabilidade | Alta |
| Bottom CTA não grava no banco | Perda de dados | Alta |
| Studio sem proteção de autenticação | Segurança | Alta |
| Sem variáveis server-only | Segurança | Alta |
| Sem banner de consentimento LGPD | Legal | Alta |
| Arquivo removido permanece no Storage | Segurança/Privacidade | Média |
| `@google/generative-ai` instalado sem uso | Manutenção | Baixa |
| Número de WhatsApp hardcoded em múltiplos arquivos | Manutenção | Baixa |

---

## Mapa de integrações

| Integração | Finalidade | Estado | Arquivos-chave |
|------------|------------|--------|---------------|
| **Supabase (database)** | Backend de dados completo | ✅ Ativo | `lib/supabase.js`, `crm/lib/supabase.js`, todos os componentes |
| **Supabase Auth** | Login/logout/sessão | ✅ Ativo | `middleware.ts`, `app/login/page.jsx`, `crm/CrmApp.jsx` |
| **Supabase Storage** | Upload de contratos assinados | ✅ Ativo | `crm/pages/ClienteDetalhe.jsx` |
| **Supabase Realtime** | Notificações e Kanban de leads em tempo real | ✅ Ativo | `app/flow/layout.jsx`, `app/flow/leads/page.jsx` |
| **Sanity CMS** | Conteúdo do blog | ✅ Ativo (se `projectId` configurado) | `sanity/client.ts`, `components/BlogPreview.tsx` |
| **Sanity Studio** | Interface editorial | ✅ Ativo em `/studio` | `app/studio/[[...tool]]/page.tsx` |
| **Google Analytics 4** | Rastreamento de visitantes | ✅ Ativo | `app/layout.tsx` |
| **Google Fonts (Next.js)** | Tipografia otimizada | ✅ Ativo | `app/layout.tsx` |
| **Google Fonts (static)** | Tipografia em HTMLs legados | ✅ Ativo (externo) | `bio/index.html`, outros |
| **WhatsApp (wa.me)** | CTAs de conversão e contato com leads | ✅ Ativo | `app/diagnostico/page.jsx`, `components/Contact.tsx`, `crm/pages/ClienteDetalhe.jsx` |
| **Google Gemini AI** | — | ❌ Instalado, não usado | `package.json` apenas |
| **E-mail** | — | ❌ Não implementado | — |
| **Gateway de pagamento** | — | ❌ Não implementado | — |
| **WhatsApp Business API** | — | ❌ Não implementado | — |
| **Nota fiscal** | — | ❌ Não implementado | — |
| **Assinatura digital** | — | ❌ Não implementado | — |
| **Webhooks (inbound)** | — | ❌ Não implementado | — |
| **Push notifications** | — | ❌ Não implementado | — |

---

*Arquivo gerado com base na análise direta do código-fonte. Comandos de busca executados sobre todo o repositório para confirmar ausências (API routes, Server Actions, fetch calls, webhooks, email, pagamentos).*
