# 03 — Arquitetura

## 3.1 Padrão Arquitetural

A aplicação segue o padrão **Monolith com Route Groups** — uma única base de código Next.js que hospeda três sub-aplicações distintas:

| Sub-aplicação | Padrão interno | Localização |
|--------------|----------------|-------------|
| Site público | Server Components + ISR | `app/(main)/` |
| Painel interno | Client Components + Supabase Realtime | `app/flow/` |
| CRM legado | SPA React Router dentro do Next.js | `app/crm/` + `crm/` |

Não há separação física entre frontend e backend. O Next.js atua como o único servidor, entregando tanto páginas renderizadas no servidor quanto ativos estáticos. Não existem rotas de API customizadas nem Server Actions no projeto.

---

## 3.2 Diagrama Textual da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         NAVEGADOR                               │
│                                                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │  Site Público  │  │ Painel /flow   │  │   CRM /crm (SPA) │  │
│  │  (SSR + ISR)   │  │ (Client-only)  │  │  (React Router)  │  │
│  └───────┬────────┘  └───────┬────────┘  └────────┬─────────┘  │
│          │                   │  WebSocket           │            │
└──────────┼───────────────────┼──────────────────────┼───────────┘
           │ HTTPS             │ Realtime              │ HTTPS
           ▼                   ▼                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                        VERCEL (Edge + CDN)                       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                   NEXT.JS 15 SERVER                        │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │  │
│  │  │ middleware.ts│  │Server Comps. │  │ Client Comps.   │  │  │
│  │  │ (auth guard) │  │ blog/projetos│  │ /flow/* pages   │  │  │
│  │  └──────┬───────┘  └──────┬───────┘  └────────┬────────┘  │  │
│  └─────────┼─────────────────┼──────────────────  ┼───────────┘  │
└────────────┼─────────────────┼────────────────────┼──────────────┘
             │                 │                    │
       ┌─────▼──────┐  ┌───────▼──────┐     ┌──────▼──────────┐
       │  SUPABASE  │  │  SANITY CMS  │     │ SUPABASE        │
       │  Auth + DB │  │  (GROQ API)  │     │ Realtime WS     │
       │  PostgreSQL│  │  CDN Assets  │     │ (browser)       │
       └────────────┘  └──────────────┘     └─────────────────┘

       ┌──────────────────────────────────┐
       │       GOOGLE ANALYTICS           │
       │       (G-QXQ4ZWWBSG)            │
       │  Script carregado via next/Script │
       └──────────────────────────────────┘
```

**Evidência:** `app/layout.tsx` · `middleware.ts` · `app/flow/layout.jsx` · `app/(main)/blog/page.tsx` · `lib/supabase.js`

---

## 3.3 Renderização: Server vs. Client Components

### Server Components (padrão no App Router)

Usados nas páginas do site público. Executam exclusivamente no servidor — nenhum JavaScript deles chega ao navegador.

| Arquivo | O que faz no servidor |
|---------|----------------------|
| `app/(main)/blog/page.tsx` | Busca posts via `client.fetch(allPostsQuery)` do Sanity |
| `app/(main)/blog/[slug]/page.tsx` | Busca post individual + gera `generateStaticParams` |
| `app/(main)/projetos/page.tsx` | Importa `data/projetos.ts` (dado estático) |
| `app/(main)/projetos/[slug]/page.tsx` | Lê projeto por slug do array estático |
| Componentes em `components/` | Maioria sem `"use client"` — renderizados no servidor |

**Revalidação (ISR):** as páginas do blog exportam `export const revalidate = 60`, fazendo com que o Next.js regenere a página em background a cada 60 segundos após a primeira requisição pós-expiração.

### Client Components (`"use client"`)

Usados para tudo que requer interatividade, estado ou APIs do browser.

| Arquivo/Diretório | Razão para ser Client Component |
|-------------------|--------------------------------|
| `app/flow/layout.jsx` | useState, useEffect, Supabase Realtime, localStorage |
| `app/flow/*/page.jsx` | Todos os módulos do painel — CRUD com Supabase, estado local |
| `app/(main)/presenca-digital/PresencaDigitalClient.tsx` | Framer Motion, quiz interativo, modal de vídeo |
| `components/Nav.tsx` | Estado de scroll e menu mobile |
| `components/RevealInit.tsx` | IntersectionObserver para animações |
| `app/login/page.jsx` | Formulário de autenticação |
| `app/diagnostico/page.jsx` | Quiz interativo público |
| `app/bio/page.tsx` | Animações client-side |

**Evidência:** presença do pragma `"use client"` nos arquivos citados

---

## 3.4 Server Actions

**Não existem.** Nenhum arquivo com `"use server"` foi encontrado. Todas as mutações de dados são feitas diretamente no cliente via SDK do Supabase.

---

## 3.5 Rotas de API

**Não existem.** Nenhum arquivo `route.ts` ou `route.js` foi encontrado em `app/`. Não há endpoints REST ou GraphQL próprios.

O acesso a dados externos ocorre de duas formas:
- **No servidor:** chamadas diretas ao SDK do Sanity (Server Components do blog)
- **No cliente:** chamadas diretas ao SDK do Supabase (módulos do `/flow`)

---

## 3.6 Middleware

`middleware.ts` é o único middleware da aplicação. Executa no Edge Runtime do Vercel (antes do servidor Node.js) para cada requisição que corresponde ao matcher.

```
matcher: ['/flow/:path*', '/login']
```

**Lógica:**

```
Requisição para /flow/*
  → Cria cliente Supabase SSR com cookies da requisição
  → Verifica sessão: supabase.auth.getUser()
  → Sem sessão → redireciona para /login
  → Com sessão → permite a requisição

Requisição para /login
  → Verifica sessão
  → Com sessão → redireciona para /flow
  → Sem sessão → permite a requisição (exibe o login)
```

**Evidência:** `middleware.ts`

---

## 3.7 Providers e Contextos

### FlowContext (`app/flow/FlowContext.js`)

Único Context da aplicação. Provido pelo `FlowLayout` (`app/flow/layout.jsx`) e disponível para todos os módulos do painel.

| Valor no contexto | Tipo | Descrição |
|------------------|------|-----------|
| `mobileOpen` | `boolean` | Estado de abertura do menu mobile |
| `setMobileOpen` | `function` | Setter do menu mobile |
| `notifications` | `array` | Lista de notificações (máx. 50, persiste em localStorage) |
| `addNotification` | `function` | Adiciona notificação com deduplicação (5s) |
| `markRead` | `function` | Marca notificação como lida por ID |
| `markAllRead` | `function` | Marca todas como lidas |
| `removeNotification` | `function` | Remove notificação por ID |
| `notifOpen` | `boolean` | Estado do painel de notificações |
| `setNotifOpen` | `function` | Setter do painel |

Hook de consumo: `export function useFlow()` em `FlowContext.js`.

**O FlowLayout também:**
- Carrega e persiste notificações no `localStorage` (chave `bbold_flow_notifs`, máx. 50 itens)
- Lê tema (`bbold_flow_theme`) e fonte (`bbold_flow_font`) do `localStorage` e aplica ao elemento `.f-root` via `data-theme` e `data-font`
- Inicia **5 subscriptions Supabase Realtime** ao montar (ver seção 3.8)

**Sem Context no site público:** os componentes públicos não compartilham estado global. Estado local com `useState` quando necessário.

**Evidência:** `app/flow/FlowContext.js` · `app/flow/layout.jsx`

---

## 3.8 Supabase Realtime

O `FlowLayout` estabelece um canal de notificações em tempo real que monitora três tabelas:

| Tabela | Evento | Ação |
|--------|--------|------|
| `contents` | INSERT | Notificação "Novo conteúdo criado" |
| `contents` | UPDATE → status `Publicado` | Notificação "Conteúdo publicado" |
| `contents` | UPDATE → status `Atrasado` | Notificação "Atraso detectado" |
| `approvals` | INSERT | Notificação "Aprovação pendente" |
| `approvals` | UPDATE → status mudou | Notificação "Material atualizado" |
| `clients` | INSERT | Notificação "Novo cliente" |

Cada tipo de notificação pode ser ativado/desativado individualmente via configurações salvas em `localStorage` (chave `bbold_notif_settings`).

O módulo de **Leads** (`app/flow/leads/page.jsx`) também usa Realtime independentemente — canal próprio para atualizar o Kanban em tempo real.

**Evidência:** `app/flow/layout.jsx` · `app/flow/leads/page.jsx`

---

## 3.9 Hooks Personalizados

**Nenhum arquivo de hook customizado** (`use*.ts`, `use*.tsx`, `use*.js`) foi encontrado fora do `node_modules`. O único hook presente é `useFlow()` em `FlowContext.js`, que é um wrapper de `useContext`.

O padrão vigente é inline — lógica de `useEffect`, `useState` e `useCallback` colocada diretamente nos componentes de página.

---

## 3.10 Camada de Acesso a Dados

**Não existe uma camada de serviço ou repositório.** O acesso ao banco ocorre diretamente nas funções dos componentes, sem abstração intermediária.

### Padrão típico nos módulos `/flow`

```js
// Exemplo simplificado de como as páginas acessam dados
useEffect(() => {
  supabase.from('clients').select('*').then(({ data }) => setClients(data))
}, [])

async function handleSave() {
  await supabase.from('clients').insert(form)
}
```

### Padrão no site público (blog)

```ts
// Server Component — executa no servidor
export default async function BlogPage() {
  const posts = await client.fetch(allPostsQuery).catch(() => [])
  return <div>{/* renderização */}</div>
}
```

### Resumo dos pontos de acesso

| Origem | Destino | Onde |
|--------|---------|------|
| Client Components (browser) | Supabase PostgreSQL | Todos os módulos `app/flow/*/page.jsx` |
| Client Components (browser) | Supabase Realtime (WebSocket) | `app/flow/layout.jsx` · `app/flow/leads/page.jsx` |
| Server Components (Node.js) | Sanity GROQ API | `app/(main)/blog/*.tsx` |
| Client Component (browser) | jsPDF (memória) | `app/flow/contratos/page.jsx` · `app/flow/clientes/[id]/page.jsx` |
| Root Layout (servidor) | Google Analytics (script) | `app/layout.tsx` |

---

## 3.11 Layouts e Hierarquia de Rotas

```
app/
├── layout.tsx              ← Root Layout: fontes, metadata global, Google Analytics
│   ├── (main)/layout.tsx   ← Injeta <Nav> e <Footer>
│   │   ├── page.tsx        ← Homepage
│   │   ├── blog/
│   │   ├── projetos/
│   │   └── presenca-digital/
│   ├── flow/layout.jsx     ← FlowContext.Provider + FlowSidebar (Client)
│   │   ├── page.jsx        ← Dashboard
│   │   ├── clientes/
│   │   ├── leads/
│   │   └── ...
│   ├── bio/page.tsx        ← Sem layout adicional
│   ├── login/page.jsx      ← Sem layout adicional
│   ├── diagnostico/        ← Sem layout adicional
│   ├── crm/                ← Sem layout adicional (SPA autônoma)
│   └── studio/             ← Sanity Studio (sem layout adicional)
```

---

## 3.12 Validações e Tratamento de Erros

### Validações

- **Não existe biblioteca de validação** (Zod, Yup, etc.)
- Formulários do `/flow` validam campos manualmente com condicionais inline
- Sanity define validações no schema com `validation: (r) => r.required()` — executadas no CMS, não no Next.js

### Tratamento de Erros

- Blog: `.catch(() => [])` — retorna array vazio se a busca Sanity falhar; sem logging
- Módulos `/flow`: padrão inconsistente — alguns usam `try/catch`, outros deixam erros silenciosos
- Middleware: erros de autenticação são silenciados (sessão nula = redirect para login)
- Nenhum Error Boundary React configurado globalmente
- Nenhum serviço de monitoramento de erros (Sentry, LogRocket, etc.) identificado

---

## 3.13 Fluxo Completo: Interface → Regras → Banco

### Fluxo de leitura (ex.: listar clientes)

```
Usuário acessa /flow/clientes
  → middleware.ts verifica sessão (Supabase SSR)
  → FlowLayout renderiza sidebar + children
  → page.jsx monta → useEffect dispara
  → supabase.from('clients').select('*')
  → Supabase retorna rows
  → setState → re-render com dados
```

### Fluxo de escrita (ex.: criar contrato)

```
Usuário preenche formulário e clica "Salvar"
  → handleSubmit() no client component
  → Validação manual dos campos obrigatórios
  → Máscara de moeda aplicada (parseCurrency)
  → supabase.from('contratos?').insert(form)  ← tabela não confirmada no schema
  → jsPDF.buildPDF(form) → download automático do PDF
  → Modal fecha / lista atualiza
```

### Fluxo de conteúdo do blog (SSR + ISR)

```
Requisição para /blog
  → Next.js verifica cache (revalidate: 60s)
  → Se expirado: client.fetch(allPostsQuery) → Sanity API
  → Renderização no servidor → HTML entregue ao browser
  → Imagens via CDN do Sanity (cdn.sanity.io)
```

---

## 3.14 Decisões Arquiteturais Relevantes

| Decisão | Impacto |
|---------|---------|
| **`allowJs: true`** no tsconfig | Permite misturar `.tsx` e `.jsx` no mesmo projeto — facilita migração progressiva, mas resulta em tipagem parcial |
| **Sem API Routes** | Simplifica a arquitetura; dados são acessados diretamente pelos SDKs. Adequado para volume atual, mas limita controle sobre autorizações server-side |
| **CRM legado como SPA dentro do Next.js** | `BrowserRouter` dentro de um Next.js App Router — anti-padrão que pode causar problemas de hidratação e conflitos de roteamento |
| **RLS desabilitado** | Toda a segurança de dados depende exclusivamente do middleware de autenticação; qualquer bug ou bypass expõe todos os dados |
| **Dados de portfólio estáticos** | `data/projetos.ts` não é gerenciável pelo painel — requer edição de código para adicionar projetos |
| **Notificações em localStorage** | Não sincronizadas entre sessões ou dispositivos; limitadas ao mesmo browser |
| **Realtime no layout pai** | Subscriptions abertas enquanto qualquer página do `/flow` estiver ativa — eficiente, mas aumenta conexões simultâneas ao Supabase |

---

## 3.15 Pontos Fortes

- **Stack moderna e coesa:** Next.js 15 + Supabase + Sanity é uma combinação madura com bom suporte e documentação
- **ISR no blog:** conteúdo editorial atualizado sem rebuild completo — boa performance sem custo operacional
- **Realtime nativo:** notificações e Kanban de leads em tempo real com zero infra adicional (Supabase Realtime)
- **Monorepo único:** site público e painel interno no mesmo repositório — fácil manutenção para um único desenvolvedor
- **Fontes otimizadas:** `next/font/google` carrega Bebas Neue, Barlow e Inter com zero layout shift (FOUT eliminado)
- **Google Analytics:** rastreamento de visitantes já configurado via `next/Script` com `afterInteractive`

---

## 3.16 Acoplamentos e Riscos

| Acoplamento | Risco |
|-------------|-------|
| `client` (nome de tabela) referenciado como texto em múltiplas tabelas | Renomear ou excluir um cliente não atualiza registros relacionados |
| Lógica de PDF embutida diretamente nas páginas | Mudanças no template afetam múltiplos arquivos sem ponto central |
| `supabase` singleton importado diretamente nas páginas | Dificulta testes unitários (sem injeção de dependência) |
| Google Analytics hardcoded no layout raiz | Sem variável de ambiente — exposto no código |
| Número do WhatsApp hardcoded | Presente em múltiplos componentes; mudança requer busca e substituição manual |

---

## 3.17 Débitos Técnicos

| Débito | Severidade | Descrição |
|--------|-----------|-----------|
| RLS desabilitado | 🔴 Alta | Qualquer requisição com a anon key acessa todos os dados sem restrição |
| CRM legado ativo | 🟡 Média | `app/crm/` duplica funcionalidades do `/flow` com tecnologias conflitantes (`BrowserRouter` + Next.js App Router) |
| JavaScript sem tipagem no `/flow` | 🟡 Média | Todos os módulos do painel são `.jsx` sem tipos — bugs silenciosos, refatoração difícil |
| Sem camada de serviço | 🟡 Média | Lógica de acesso ao banco espalhada pelos componentes — dificulta reutilização e testes |
| Sem Error Boundaries | 🟡 Média | Erros em componentes do `/flow` podem derrubar toda a página sem fallback |
| Arquivos legados na raiz | 🟢 Baixa | `style.css`, `script.js`, `bio/index.html` — não afetam a aplicação, mas poluem o repositório |
| `@google/generative-ai` sem uso rastreado | 🟢 Baixa | Dependência instalada mas não utilizada confirmada — aumenta bundle desnecessariamente |
| Ausência de `.env.example` | 🟢 Baixa | Novos colaboradores não têm referência das variáveis necessárias |

---

*Arquivos analisados: `app/layout.tsx` · `app/(main)/layout.tsx` · `app/(main)/blog/page.tsx` · `app/(main)/blog/[slug]/page.tsx` · `app/flow/layout.jsx` · `app/flow/FlowContext.js` · `app/flow/leads/page.jsx` · `app/crm/[[...slug]]/page.jsx` · `crm/CrmApp.jsx` · `middleware.ts` · `lib/supabase.js` · `tsconfig.json` · `vercel.json` · busca por `route.ts`, `"use server"`, hooks customizados e `supabase.channel` em todo o projeto*
