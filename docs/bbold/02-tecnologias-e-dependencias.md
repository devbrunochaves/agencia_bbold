# 02 — Tecnologias e Dependências

## 2.1 Framework e Runtime

| Item | Valor |
|------|-------|
| Framework | **Next.js 15.3.6** (App Router) |
| Runtime | Node.js (versão não fixada no projeto) |
| Linguagem principal | TypeScript `^5` |
| Modo de renderização | Server Components por padrão; Client Components onde há interatividade (`"use client"`) |

**Observação:** o projeto usa `allowJs: true` no `tsconfig.json`, o que permite arquivos `.jsx` sem tipagem. Os módulos do painel `/flow` e do CRM legado (`crm/`) são inteiramente JavaScript (`.jsx`/`.js`), sem tipagem. Apenas os componentes do site público e a página `/presenca-digital` estão em TypeScript.

**Evidência:** `package.json` · `tsconfig.json` · estrutura de diretórios

---

## 2.2 Linguagem e Compilação

```json
// tsconfig.json — configurações relevantes
{
  "strict": true,
  "allowJs": true,
  "noEmit": true,
  "moduleResolution": "bundler",
  "paths": { "@/*": ["./*"] }
}
```

- **`strict: true`** — ativo, mas limitado pois metade do código está em `.jsx`.
- **`allowJs: true`** — permite JavaScript puro no projeto TypeScript; necessário para os módulos do `/flow`.
- **`@/*`** — alias de importação que aponta para a raiz do projeto. Usado nos componentes TypeScript (`import X from "@/components/X"`).
- **`target: ES2017`** — compatibilidade com ambientes modernos.

**Evidência:** `tsconfig.json`

---

## 2.3 Dependências de Produção

### Next.js e React

| Pacote | Versão | Uso |
|--------|--------|-----|
| `next` | 15.3.6 | Framework principal — App Router, SSR, SSG, otimização de imagens |
| `react` | ^19.0.0 | Biblioteca de UI |
| `react-dom` | ^19.0.0 | Renderização DOM |
| `react-is` | ^19.2.6 | Utilitário de reflexão React — necessário como peer dependency de `styled-components` |

### Banco de Dados e Autenticação

| Pacote | Versão | Uso real no projeto |
|--------|--------|---------------------|
| `@supabase/supabase-js` | ^2.106.2 | SDK principal do Supabase — chamadas ao banco e subscriptions em tempo real nos módulos `/flow` |
| `@supabase/ssr` | ^0.10.3 | Cliente Supabase adaptado para SSR — usado em `lib/supabase.js` (browser) e `middleware.ts` (servidor) |

Dois clientes Supabase coexistem no projeto:
- `lib/supabase.js` — `createBrowserClient` — singleton para os módulos do `/flow`
- `crm/lib/supabase.js` — cliente independente para o CRM legado (padrão e configuração próprios)
- `middleware.ts` — `createServerClient` — exclusivo para verificação de sessão no edge

### CMS e Conteúdo Editorial

| Pacote | Versão | Uso |
|--------|--------|-----|
| `sanity` | ^3.99.0 | Core do Sanity Studio — renderizado em `/studio` para gestão do blog |
| `next-sanity` | ^9.8.9 | Integração Next.js ↔ Sanity — `createClient`, `PortableText`, `LiveQuery` |
| `@sanity/image-url` | ^1.1.0 | Gera URLs otimizadas para imagens hospedadas no CDN do Sanity |
| `@portabletext/react` | ^3.1.0 | Renderiza o campo `body` (Portable Text) nos posts do blog como HTML |

**Evidência:** `sanity/client.ts` · `sanity/sanity.config.ts` · `app/(main)/blog/[slug]/page.tsx`

### Geração de Documentos

| Pacote | Versão | Uso |
|--------|--------|-----|
| `jspdf` | ^4.2.1 | Geração de PDFs no cliente — usado em dois locais específicos |

Locais de uso confirmados:
- `app/flow/contratos/page.jsx` — gera a minuta de contrato em PDF com dados do formulário
- `app/flow/clientes/[id]/page.jsx` — gera PDF do Grid Instagram (9 imagens em layout 3×3 com cabeçalho BBold)

### Animação e Interface

| Pacote | Versão | Uso |
|--------|--------|-----|
| `framer-motion` | (instalado) | Animações scroll-triggered na página `/presenca-digital` — `motion`, `AnimatePresence`, `useReducedMotion` |
| `lucide-react` | (instalado) | Ícones SVG na página `/presenca-digital` — `PlayCircle`, `CheckCircle2`, `Share2`, `TrendingUp`, `Globe`, `PenTool`, `MapPin`, `Palette`, `MessageSquare`, `RotateCcw`, `ArrowRight`, `X` |

**Uso restrito:** ambos os pacotes são usados **exclusivamente** em `app/(main)/presenca-digital/PresencaDigitalClient.tsx`. Nenhum outro arquivo importa essas bibliotecas.

**Evidência:** `app/(main)/presenca-digital/PresencaDigitalClient.tsx`

### Gráficos

| Pacote | Versão | Uso |
|--------|--------|-----|
| `recharts` | ^3.8.1 | Gráficos de barras nos dashboards do CRM legado |

**Uso restrito:** confirmado apenas em `crm/pages/Dashboard.jsx` e `crm/pages/Financeiro.jsx`. O módulo `/flow/performance` da aplicação principal **não** importa recharts (funcionalidade provavelmente implementada de outra forma ou incompleta).

**Evidência:** `crm/pages/Dashboard.jsx` · `crm/pages/Financeiro.jsx`

### Roteamento (CRM Legado)

| Pacote | Versão | Uso |
|--------|--------|-----|
| `react-router-dom` | ^6.30.3 | Roteamento SPA do CRM legado — `BrowserRouter` em `app/crm/[[...slug]]/page.jsx` que envolve `crm/CrmApp.jsx` |

**Uso restrito:** exclusivo do CRM legado em `app/crm/`. O painel `/flow` usa o roteamento nativo do Next.js App Router.

**Evidência:** `app/crm/[[...slug]]/page.jsx`

### Estilização (Legado)

| Pacote | Versão | Uso |
|--------|--------|-----|
| `styled-components` | ^6.4.2 | **Não encontrado em uso** no site público nem nos módulos `/flow`. Provavelmente utilizado no CRM legado (`crm/`) |

**Evidência negativa:** nenhuma importação de `styled-components` localizada em `app/` ou `components/`. Uso confirmado somente como dependência declarada.

---

## 2.4 Dependências de Desenvolvimento

| Pacote | Versão | Uso |
|--------|--------|-----|
| `typescript` | ^5 | Compilação TypeScript |
| `@types/node` | ^20 | Tipos para APIs do Node.js |
| `@types/react` | ^19 | Tipos para React |
| `@types/react-dom` | ^19 | Tipos para React DOM |
| `tailwindcss` | ^3.4.1 | Geração do CSS utilitário — purgado em build para produção |
| `autoprefixer` | ^10.0.1 | Plugin PostCSS — adiciona prefixos de vendor automaticamente |
| `postcss` | ^8 | Processador CSS intermediário entre Tailwind e o bundle final |
| `eslint` | ^8 | Linting do código JavaScript/TypeScript |
| `eslint-config-next` | 15.3.6 | Regras de lint específicas do Next.js (inclui acessibilidade, imagens, etc.) |

**Evidência:** `package.json`

---

## 2.5 Estilização

O projeto usa **duas** estratégias de estilização em paralelo:

### Tailwind CSS (principal)

- Versão `^3.4.1` com configuração em `tailwind.config.ts`
- Tokens personalizados:

| Token | Valor | Uso |
|-------|-------|-----|
| `yellow` / `yellow.dark` | `#F5C518` / `#D4AA10` | Cor de destaque principal |
| `black` / `black.mid` / `black.light` | `#0A0A0A` / `#141414` / `#1E1E1E` | Fundos e superfícies |
| `offwhite` | `#F0EFE8` | Texto principal |
| `gray.dim` | `#2A2A2A` | Tom intermediário |
| `font-display` | `var(--font-bebas)` | Títulos (Bebas Neue) |
| `font-body` | `var(--font-barlow)` | Corpo de texto (Barlow) |
| `max-w-site` | `1200px` | Container máximo do site |

- Utilitários globais definidos em `app/globals.css`: `.section-tag`, `.section-title`, `.reveal`

### CSS Modular e Global

- `app/globals.css` — reset, variáveis CSS, utilitários globais, scrollbar customizada
- `app/flow/flow.css` — estilos exclusivos do painel `/flow`
- `app/diagnostico/diagnostico.css` — estilos da página de diagnóstico público
- `crm/styles/crm.css` — estilos do CRM legado
- `style.css` (raiz) — CSS legado do site estático anterior (981 linhas, não usado pelo Next.js)

**Evidência:** `tailwind.config.ts` · `app/globals.css` · `app/flow/flow.css`

---

## 2.6 Banco de Dados

**Supabase (PostgreSQL gerenciado)**

- Projeto hospedado na nuvem Supabase
- Acesso via `@supabase/supabase-js` e `@supabase/ssr`
- Schema definido em `supabase-schema.sql`
- RLS (Row Level Security) **desabilitado** em todas as tabelas
- Extensão `uuid-ossp` habilitada para geração de IDs

Ver documentação detalhada em `03-banco-de-dados.md` (etapa futura).

**Evidência:** `supabase-schema.sql` · `lib/supabase.js` · `middleware.ts`

---

## 2.7 Autenticação

**Supabase Auth** — autenticação por e-mail e senha.

- `@supabase/ssr` fornece cliente adaptado para cookies (compatível com SSR/middleware)
- `middleware.ts` intercepta todas as requisições para `/flow/*` e `/login`, verificando a sessão
- Sem provedores OAuth configurados (Google, GitHub, etc.)
- Sem cadastro público — acesso restrito ao operador

**Evidência:** `middleware.ts` · `lib/supabase.js` · `app/login/page.jsx`

---

## 2.8 Serviços Externos

| Serviço | Finalidade | Configuração |
|---------|-----------|--------------|
| **Supabase** | Banco de dados + autenticação | Variáveis de ambiente `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **Sanity** | CMS headless para blog | Variáveis `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION` |
| **Vercel** | Deploy, CDN e hospedagem | Configurado via `vercel.json` + integração com repositório Git |
| **WhatsApp** | Canal de contato (links `wa.me`) | Número `5527997341557` — hardcoded nos componentes |
| **CDN Sanity** | Imagens do blog | Domínio `cdn.sanity.io` autorizado em `next.config.ts` |

**Evidência:** `next.config.ts` · `vercel.json` · `sanity/client.ts` · múltiplos componentes com links wa.me

---

## 2.9 Analytics, E-mail e Pagamentos

| Categoria | Status |
|-----------|--------|
| Analytics (Google Analytics, Plausible etc.) | ❌ **Não encontrado** — nenhum script de rastreamento identificado |
| E-mail transacional | ❌ **Não encontrado** — nenhuma dependência de e-mail (Resend, SendGrid etc.) |
| Pagamentos (Stripe, PagSeguro etc.) | ❌ **Não encontrado** — sem integração de pagamentos |

---

## 2.10 Upload e Armazenamento

| Categoria | Status |
|-----------|--------|
| Supabase Storage | ❌ **Não configurado** — `supabase-schema.sql` não define buckets; nenhum upload de arquivo identificado nos módulos `/flow` |
| Sanity Assets | ✅ Imagens dos posts do blog hospedadas no CDN do Sanity (`cdn.sanity.io`) |
| Arquivos locais (Grid Instagram) | ✅ Processados via `URL.createObjectURL()` no cliente — **sem persistência**, apenas para exportação em PDF |

**Evidência:** `supabase-schema.sql` · `app/flow/clientes/[id]/page.jsx` · `next.config.ts`

---

## 2.11 Formulários e Validação

| Status | Detalhe |
|--------|---------|
| Biblioteca de formulários | ❌ **Não encontrada** — nenhum React Hook Form, Formik, Zod ou similar |
| Validação | ⚠️ **Manual** — campos validados com verificações manuais (`if (!form.field)`) nos handlers dos formulários do `/flow` |
| Inputs controlados | ✅ `useState` + `onChange` — padrão React sem biblioteca de formulários |

**Evidência:** `app/flow/contratos/page.jsx` · `app/flow/clientes/page.jsx`

---

## 2.12 Ferramentas de Build e Deploy

### Build

```bash
# Gerado pelo Next.js
next build   # produz bundle otimizado em .next/
next dev     # desenvolvimento com HMR
next start   # serve o build de produção localmente
next lint    # ESLint com regras Next.js
```

### Deploy

- **Vercel** — integração automática com o repositório Git; push na `main` aciona deploy
- `vercel.json` define dois rewrites:
  - `/servicos` → `/servicos/index.html` (tabela interna de preços)
  - `/conteudos` → `/conteudos/index.html` (roteiros de Instagram)

**Evidência:** `package.json` · `vercel.json`

---

## 2.13 Scripts do `package.json`

```json
{
  "scripts": {
    "dev":   "next dev",
    "build": "next build",
    "start": "next start",
    "lint":  "next lint"
  }
}
```

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento com Fast Refresh na porta 3000 |
| `npm run build` | Gera build de produção otimizado (SSR + SSG + análise de bundle) |
| `npm run start` | Serve o build de produção gerado por `build` |
| `npm run lint` | Executa ESLint com as regras do `eslint-config-next` |

Não há scripts para: testes, migrations, seed de banco, geração de tipos Supabase ou deploy manual.

---

## 2.14 Variáveis de Ambiente Identificadas

Nenhum arquivo `.env` ou `.env.example` foi encontrado no repositório. As variáveis são inferidas pelo uso no código.

| Variável | Escopo | Obrigatória | Descrição |
|----------|--------|-------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente e servidor | ✅ Sim | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente e servidor | ✅ Sim | Chave anônima pública do Supabase |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Cliente | ✅ Sim | ID do projeto Sanity |
| `NEXT_PUBLIC_SANITY_DATASET` | Cliente | ⚠️ Não (default: `production`) | Dataset do Sanity |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Cliente | ⚠️ Não (default: `2024-01-01`) | Versão da API Sanity |

**Observação importante:** todas as variáveis usam o prefixo `NEXT_PUBLIC_`, o que significa que são **expostas ao navegador**. A `ANON_KEY` do Supabase é projetada para ser pública (segurança via RLS), mas como o RLS está desabilitado, qualquer pessoa com a chave tem acesso irrestrito ao banco.

**Evidência:** `lib/supabase.js` · `middleware.ts` · `sanity/env.ts`

---

## 2.15 Dependências Aparentemente Não Utilizadas

| Pacote | Motivo da suspeita |
|--------|-------------------|
| `@google/generative-ai` | Nenhuma importação localizada em `app/`, `components/`, `lib/` ou `crm/`. Pode estar em uso num arquivo não lido, mas é altamente suspeito. |
| `styled-components` | Nenhuma importação localizada fora do possível uso em `crm/`. O CRM usa CSS modular (`crm/styles/crm.css`); uso de `styled-components` não confirmado. |
| `react-is` | Declarado explicitamente como dependência, mas é tipicamente uma peer dependency transitiva de `styled-components` ou `recharts` — raramente precisa ser declarada manualmente. |

---

## 2.16 Dependências Obsoletas ou Duplicadas

| Problema | Detalhe |
|----------|---------|
| **Roteamento duplicado** | `react-router-dom` coexiste com o roteamento nativo do Next.js App Router — necessário apenas para o CRM legado (`app/crm/`) |
| **Dois clientes Supabase** | `lib/supabase.js` (para `/flow`) e `crm/lib/supabase.js` (para CRM legado) — configurações independentes sem compartilhamento |
| **CSS legado** | `style.css` (981 linhas) na raiz do projeto é o CSS do site HTML estático anterior — não é processado pelo Next.js e não afeta a aplicação atual, mas polui o repositório |
| **`script.js` legado** | Arquivo JavaScript vanilla na raiz — pertence ao site estático anterior, sem relação com o Next.js |
| **`bio/index.html`** | Versão HTML estática da página link-in-bio — duplicada pela rota Next.js `/bio` |

---

*Arquivos analisados: `package.json` · `tsconfig.json` · `next.config.ts` · `vercel.json` · `tailwind.config.ts` · `app/globals.css` · `app/flow/flow.css` · `middleware.ts` · `lib/supabase.js` · `crm/lib/supabase.js` · `sanity/env.ts` · `sanity/client.ts` · `sanity/sanity.config.ts` · `app/crm/[[...slug]]/page.jsx` · `crm/pages/Dashboard.jsx` · `crm/pages/Financeiro.jsx` · `app/(main)/presenca-digital/PresencaDigitalClient.tsx` · `app/flow/contratos/page.jsx` · `app/flow/clientes/[id]/page.jsx` · busca por importações em todo o diretório `app/` e `components/`*
