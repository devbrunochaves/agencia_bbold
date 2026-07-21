# 04 — Estrutura de Pastas

## 4.1 Árvore Resumida do Projeto

```
agencia_bbold/
│
├── app/                          ← Aplicação Next.js (App Router)
│   ├── layout.tsx                ← Root Layout: fontes, metadata, Google Analytics
│   ├── globals.css               ← Reset, tokens CSS, utilitários globais
│   │
│   ├── (main)/                   ← Route Group: site público com Nav + Footer
│   │   ├── layout.tsx
│   │   ├── page.tsx              ← Homepage
│   │   ├── blog/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── projetos/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   └── presenca-digital/
│   │       ├── page.tsx          ← Metadata SSR
│   │       └── PresencaDigitalClient.tsx  ← Landing page completa (754 linhas)
│   │
│   ├── bio/page.tsx              ← Link-in-bio
│   ├── login/page.jsx            ← Autenticação
│   ├── diagnostico/
│   │   ├── page.jsx              ← Quiz diagnóstico público
│   │   └── diagnostico.css
│   │
│   ├── flow/                     ← Painel interno (protegido por middleware)
│   │   ├── layout.jsx            ← FlowContext.Provider + Realtime + temas
│   │   ├── FlowContext.js        ← Context + hook useFlow()
│   │   ├── flow.css              ← Estilos do painel (1.785 linhas) ⚠️
│   │   ├── page.jsx              ← Dashboard (328 linhas)
│   │   ├── clientes/
│   │   │   ├── page.jsx          ← Lista de clientes (391 linhas)
│   │   │   └── [id]/page.jsx     ← Detalhe do cliente (1.384 linhas) 🔴
│   │   ├── leads/page.jsx        ← Kanban (405 linhas)
│   │   ├── contratos/page.jsx    ← Geração de contrato + PDF (1.129 linhas) 🔴
│   │   ├── aprovacoes/page.jsx   ← Aprovação de conteúdo (424 linhas)
│   │   ├── calendario/page.jsx   ← Calendário mensal (248 linhas)
│   │   ├── conteudos/page.jsx    ← Gestão de conteúdos (399 linhas)
│   │   ├── performance/page.jsx  ← Métricas (386 linhas)
│   │   ├── relatorios/page.jsx   ← Relatórios (435 linhas)
│   │   ├── workflow/page.jsx     ← Workflow (173 linhas)
│   │   ├── configuracoes/page.jsx ← Configurações (457 linhas)
│   │   └── biblioteca/
│   │       ├── page.jsx          ← Lista de clientes/pastas (583 linhas)
│   │       ├── [clientSlug]/page.jsx
│   │       └── [clientSlug]/[subfolderSlug]/page.jsx
│   │
│   ├── crm/[[...slug]]/page.jsx  ← Entry point do CRM legado ⚠️
│   └── studio/[[...tool]]/page.tsx ← Sanity Studio
│
├── components/                   ← Componentes React reutilizáveis
│   ├── About.tsx                 ← Seção "Quem Somos" (homepage)
│   ├── BlogPreview.tsx           ← Preview de posts (homepage)
│   ├── Contact.tsx               ← Seção de contato
│   ├── CtaBand.tsx               ← Faixa de CTA
│   ├── CustomProjects.tsx        ← Seção de projetos customizados
│   ├── Footer.tsx                ← Rodapé global
│   ├── Hero.tsx                  ← Hero da homepage
│   ├── HowWeWork.tsx             ← Seção "Como trabalhamos"
│   ├── MetodoBBold.tsx           ← Seção "Método BBold"
│   ├── Nav.tsx                   ← Navegação global
│   ├── Numbers.tsx               ← Seção de números/estatísticas
│   ├── ProjectsPreview.tsx       ← Preview de projetos (homepage)
│   ├── RevealInit.tsx            ← IntersectionObserver para animações .reveal
│   ├── Services.tsx              ← Seção de serviços
│   └── flow/                    ← Componentes exclusivos do painel /flow
│       ├── ApprovalDetailModal.jsx  ← Modal de detalhe de aprovação (219 linhas)
│       ├── ApprovalModal.jsx        ← Modal de criação de aprovação (152 linhas)
│       ├── ClientModal.jsx          ← Modal de criação/edição de cliente (244 linhas)
│       ├── ContentDetailModal.jsx   ← Modal de detalhe de conteúdo (188 linhas)
│       ├── ContentModal.jsx         ← Modal de criação de conteúdo (238 linhas)
│       ├── FlowHeader.jsx           ← Cabeçalho mobile do painel (138 linhas)
│       ├── FlowIcons.jsx            ← Definições de ícones SVG inline (53 linhas)
│       ├── FlowSidebar.jsx          ← Sidebar de navegação (140 linhas)
│       ├── MetricCard.jsx           ← Card de métrica (30 linhas)
│       └── StatusBadge.jsx          ← Badge de status (29 linhas)
│
├── crm/                          ← CRM legado (SPA React Router) ⚠️
│   ├── CrmApp.jsx                ← Entry point com rotas React Router
│   ├── components/Layout.jsx     ← Layout interno do CRM
│   ├── lib/supabase.js           ← Cliente Supabase independente
│   ├── styles/crm.css            ← Estilos do CRM
│   └── pages/
│       ├── Login.jsx
│       ├── Dashboard.jsx         ← Com Recharts (184 linhas)
│       ├── Clientes.jsx
│       ├── ClienteDetalhe.jsx
│       ├── Contratos.jsx
│       ├── Demandas.jsx          ← Nome pouco claro ⚠️
│       ├── Entregas.jsx          ← Nome pouco claro ⚠️
│       └── Financeiro.jsx        ← Com Recharts (324 linhas)
│
├── data/
│   └── projetos.ts               ← Array estático de projetos (TypeScript)
│
├── docs/bbold/                   ← Documentação do projeto (esta pasta)
│
├── lib/
│   └── supabase.js               ← Singleton do cliente Supabase (browser)
│
├── sanity/
│   ├── client.ts                 ← Cliente Sanity configurado
│   ├── env.ts                    ← Variáveis de ambiente do Sanity
│   ├── queries.ts                ← GROQ queries (allPosts, postBySlug, etc.)
│   ├── sanity.config.ts          ← Configuração do Sanity Studio
│   ├── schema.ts                 ← Registro de schemas
│   └── schemas/
│       └── post.ts               ← Schema do tipo "post"
│
├── public/                       ← Assets estáticos servidos diretamente
│   ├── img/
│   │   ├── LOGO-PRINCIPAL.svg
│   │   ├── foto-site.jpg
│   │   └── icone ID. VISUAL.svg  ← Nome com espaços e ponto ⚠️
│   ├── conteudos/index.html      ← Ferramenta interna (noindex)
│   ├── estrategia/index.html     ← Ferramenta interna (noindex)
│   └── servicos/index.html       ← Tabela de preços interna (noindex)
│
├── middleware.ts                 ← Guard de autenticação (Edge Runtime)
├── next.config.ts                ← Configuração do Next.js
├── tailwind.config.ts            ← Tokens de design e configuração Tailwind
├── tsconfig.json                 ← Configuração do TypeScript
├── postcss.config.mjs            ← PostCSS (Tailwind + Autoprefixer)
├── package.json                  ← Dependências e scripts
├── supabase-schema.sql           ← Schema SQL do banco de dados
├── vercel.json                   ← Rewrites do Vercel
│
├── bio/index.html                ← Duplicata legada da página /bio ⚠️
├── conteudos/index.html          ← Conteúdo editorial interno legado ⚠️
├── valores/index.html            ← Tabela de preços interna legada ⚠️
├── estrategia-instagram.html     ← Estratégia pessoal do Bruno legada ⚠️
├── style.css                     ← CSS do site estático anterior (981 linhas) ⚠️
└── script.js                     ← JS do site estático anterior (224 linhas) ⚠️
```

---

## 4.2 Diretórios Principais

### `app/`

Raiz do Next.js App Router. Cada subdiretório com `page.tsx` ou `page.jsx` torna-se uma rota acessível. Layouts (`layout.tsx/jsx`) envolvem todas as páginas filhas da mesma árvore.

**Convenção de Route Groups:** o diretório `(main)` usa parênteses — Next.js ignora o nome no path da URL, mas aplica o layout associado. Todas as rotas públicas com Nav e Footer estão sob `(main)`.

### `components/`

Componentes React compartilhados, organizados em dois grupos:

| Grupo | Localização | Padrão |
|-------|-------------|--------|
| Site público | `components/*.tsx` | Maioria Server Components ou sem estado |
| Painel interno | `components/flow/*.jsx` | Todos Client Components com estado |

### `crm/`

Diretório da SPA legada. **Não é parte do App Router** — o Next.js a enxerga apenas através do entry point `app/crm/[[...slug]]/page.jsx`. Todo o roteamento interno é feito pelo React Router DOM.

### `sanity/`

Configuração completa do Sanity CMS. Dividido em: cliente de fetch, variáveis de ambiente, queries GROQ, e definições de schema. O Sanity Studio é servido diretamente via `app/studio/`.

### `data/`

Dados estáticos em TypeScript. Atualmente contém apenas `projetos.ts` com o array de cases do portfólio. Não há conexão com banco de dados — alterações requerem edição de código.

### `lib/`

Utilitários e configurações de serviços externos. Contém apenas `supabase.js`. Deveria conter outros serviços (Sanity já está em `sanity/`, o que é inconsistente — idealmente ambos estariam em `lib/`).

### `public/`

Assets estáticos servidos sem processamento. Além das imagens em `img/`, contém três ferramentas HTML internas (com `noindex`) acessíveis por URL direta.

---

## 4.3 Arquivos de Configuração

| Arquivo | Responsabilidade |
|---------|-----------------|
| `next.config.ts` | Configuração do Next.js — permite imagens de `cdn.sanity.io` |
| `tailwind.config.ts` | Tokens de cor, tipografia e espaçamento do design system |
| `tsconfig.json` | TypeScript — `allowJs: true`, alias `@/*`, `strict: true` |
| `postcss.config.mjs` | Pipeline CSS: Tailwind → Autoprefixer |
| `vercel.json` | Rewrites para `/servicos` e `/conteudos` (HTML estáticos) |
| `package.json` | Dependências e scripts npm |
| `supabase-schema.sql` | Schema do banco — deve ser rodado manualmente no Supabase |
| `.gitignore` | Exclusões do Git |
| `.claude/settings.local.json` | Configurações locais do Claude Code |
| `middleware.ts` | Autenticação no Edge (não é configuração, mas age como tal) |

---

## 4.4 Rotas e Páginas

### Site Público (`app/(main)/`)

| Arquivo | URL | Tipo |
|---------|-----|------|
| `page.tsx` | `/` | Server Component |
| `blog/page.tsx` | `/blog` | Server Component + ISR (60s) |
| `blog/[slug]/page.tsx` | `/blog/:slug` | Server Component + ISR (60s) |
| `projetos/page.tsx` | `/projetos` | Server Component |
| `projetos/[slug]/page.tsx` | `/projetos/:slug` | Server Component |
| `presenca-digital/page.tsx` | `/presenca-digital` | Server Component (metadata) |
| `presenca-digital/PresencaDigitalClient.tsx` | — | Client Component (importado) |

### Páginas Especiais

| Arquivo | URL | Tipo |
|---------|-----|------|
| `bio/page.tsx` | `/bio` | Client Component |
| `login/page.jsx` | `/login` | Client Component |
| `diagnostico/page.jsx` | `/diagnostico` | Client Component |
| `studio/[[...tool]]/page.tsx` | `/studio/*` | Sanity Studio |
| `crm/[[...slug]]/page.jsx` | `/crm/*` | SPA (React Router) |

### Painel Interno (`app/flow/`)

| Arquivo | URL | Linhas |
|---------|-----|--------|
| `page.jsx` | `/flow` | 328 |
| `clientes/page.jsx` | `/flow/clientes` | 391 |
| `clientes/[id]/page.jsx` | `/flow/clientes/:id` | **1.384** 🔴 |
| `leads/page.jsx` | `/flow/leads` | 405 |
| `contratos/page.jsx` | `/flow/contratos` | **1.129** 🔴 |
| `aprovacoes/page.jsx` | `/flow/aprovacoes` | 424 |
| `calendario/page.jsx` | `/flow/calendario` | 248 |
| `conteudos/page.jsx` | `/flow/conteudos` | 399 |
| `performance/page.jsx` | `/flow/performance` | 386 |
| `relatorios/page.jsx` | `/flow/relatorios` | 435 |
| `workflow/page.jsx` | `/flow/workflow` | 173 |
| `configuracoes/page.jsx` | `/flow/configuracoes` | 457 |
| `biblioteca/page.jsx` | `/flow/biblioteca` | 583 |
| `biblioteca/[clientSlug]/page.jsx` | `/flow/biblioteca/:slug` | — |
| `biblioteca/[clientSlug]/[subfolderSlug]/page.jsx` | `/flow/biblioteca/:slug/:sub` | — |

---

## 4.5 Estilos

| Arquivo | Escopo | Linhas | Observação |
|---------|--------|--------|------------|
| `app/globals.css` | Global | 44 | Reset, tokens, `.section-tag`, `.section-title`, `.reveal` |
| `app/flow/flow.css` | Painel `/flow` | **1.785** ⚠️ | CSS completo do painel — muito extenso para um único arquivo |
| `app/diagnostico/diagnostico.css` | Página diagnóstico | — | Estilos isolados da página |
| `crm/styles/crm.css` | CRM legado | — | Estilos do CRM legado |
| `style.css` (raiz) | **Não usado** | 981 | CSS do site estático anterior — legado ⚠️ |

---

## 4.6 Assets

| Localização | Conteúdo |
|-------------|----------|
| `public/img/LOGO-PRINCIPAL.svg` | Logo principal da BBold |
| `public/img/foto-site.jpg` | Foto do Bruno Chaves (seção Sobre) |
| `public/img/icone ID. VISUAL.svg` | Ícone de identidade visual — **nome com espaços e ponto** ⚠️ |
| `public/img/.gitkeep` | Arquivo para manter a pasta no Git |

Não há pasta `public/img/projetos/` — imagens dos cases referenciadas em `data/projetos.ts` não estão no repositório.

---

## 4.7 Banco de Dados e Schema

| Arquivo | Localização | Descrição |
|---------|-------------|-----------|
| `supabase-schema.sql` | Raiz | DDL completo: 5 tabelas, triggers, extensão uuid-ossp |
| `lib/supabase.js` | `lib/` | Cliente browser (singleton) |
| `crm/lib/supabase.js` | `crm/lib/` | Cliente do CRM legado (independente) |

Não existem:
- Arquivos de migration versionados
- Seed files
- Scripts de rollback
- Tipos TypeScript gerados a partir do schema Supabase

---

## 4.8 Testes

**Nenhum arquivo de teste encontrado** no projeto. Não há configuração de Jest, Vitest, Playwright, Cypress ou qualquer outro framework de testes.

---

## 4.9 Documentação Existente

| Localização | Tipo | Status |
|-------------|------|--------|
| `docs/bbold/01-visao-geral.md` | Documentação técnica | Criado nesta série |
| `docs/bbold/02-tecnologias-e-dependencias.md` | Documentação técnica | Criado nesta série |
| `docs/bbold/03-arquitetura.md` | Documentação técnica | Criado nesta série |
| `docs/bbold/04-estrutura-de-pastas.md` | Documentação técnica | Este arquivo |
| `public/estrategia/index.html` | Estratégia de crescimento | Documento interno |
| `public/servicos/index.html` | Tabela de preços | Documento interno |
| `public/conteudos/index.html` | Roteiros de conteúdo | Documento interno |
| `estrategia-instagram.html` | Estratégia pessoal do Bruno | Documento interno |

Não existe README no repositório.

---

## 4.10 Arquivos com Múltiplas Responsabilidades

| Arquivo | Responsabilidades acumuladas |
|---------|------------------------------|
| `app/flow/clientes/[id]/page.jsx` **(1.384 linhas)** | Detalhe do cliente + aba Performance + aba Grid Instagram + geração de PDF + lógica de upload de imagem + Canvas API + múltiplos sub-formulários |
| `app/flow/contratos/page.jsx` **(1.129 linhas)** | Formulário de criação + minuta em PDF + lista de contratos + `ContractRow` + `CreateModal` + todas as máscaras de moeda + lógica de parcelas |
| `app/flow/layout.jsx` | FlowContext Provider + 5 subscriptions Realtime + persistência de notificações no localStorage + aplicação de tema e fonte |
| `app/flow/flow.css` **(1.785 linhas)** | Estilos de todos os 13 módulos do painel num único arquivo |

---

## 4.11 Duplicações Identificadas

| Duplicação | Arquivos envolvidos | Impacto |
|-----------|---------------------|---------|
| **Dois clientes Supabase** | `lib/supabase.js` + `crm/lib/supabase.js` | Configurações independentes — bugs resolvidos num podem não ser propagados para o outro |
| **CRM duplicado** | `app/flow/` + `app/crm/` + `crm/` | Funcionalidades equivalentes (clientes, contratos, financeiro) implementadas duas vezes com stacks diferentes |
| **Página link-in-bio** | `app/bio/page.tsx` + `bio/index.html` | Mesma página em duas implementações |
| **Tabela de preços** | `valores/index.html` + `public/servicos/index.html` | Conteúdo similar, arquivos distintos |
| **Imagens de logo** | Usada diretamente via path em múltiplos componentes — sem constante centralizada |

---

## 4.12 Nomes Pouco Claros ou Problemáticos

| Item | Localização | Problema |
|------|-------------|----------|
| `Demandas.jsx` | `crm/pages/` | "Demanda" é ambíguo — não está claro se são tarefas, pedidos ou requisições |
| `Entregas.jsx` | `crm/pages/` | Poderia ser "deliveries" ou "milestones" — não documentado |
| `FlowIcons.jsx` | `components/flow/` | Não é um componente; é uma coleção de definições SVG — `icons.jsx` seria mais preciso |
| `icone ID. VISUAL.svg` | `public/img/` | Espaços e ponto no nome do arquivo causam problemas em alguns sistemas e URLs |
| `PresencaDigitalClient.tsx` | `app/(main)/presenca-digital/` | Sufixo `Client` é convenção informal — a nomenclatura não segue padrão do restante do projeto |
| `CustomProjects.tsx` | `components/` | Nomeclatura em inglês inconsistente com o resto dos componentes em português |

---

## 4.13 Trechos que Merecem Reorganização Futura

| Área | Sugestão |
|------|----------|
| `app/flow/clientes/[id]/page.jsx` | Extrair `GridInstagramTab`, `PerformanceTab` e `buildPDF` para arquivos próprios |
| `app/flow/contratos/page.jsx` | Extrair `CreateModal`, `ContractRow` e `buildPDF` para componentes separados |
| `app/flow/flow.css` | Dividir por módulo: `clientes.css`, `leads.css`, `contratos.css`, etc. |
| `crm/` inteiro | Avaliar descontinuação ou fusão com `/flow` |
| `lib/` | Centralizar todos os clientes de serviços externos (Supabase e Sanity) no mesmo diretório |
| Arquivos legados na raiz | Mover ou remover `style.css`, `script.js`, `bio/index.html`, `conteudos/`, `valores/`, `estrategia-instagram.html` |
| `data/projetos.ts` | Migrar para tabela no Supabase e criar interface de gestão no `/flow` |
| Sem `.env.example` | Criar arquivo de referência para variáveis de ambiente |
| Sem `README.md` | Criar README básico com instruções de setup |

---

*Arquivos analisados: estrutura completa do repositório via `find` · contagem de linhas via `wc -l` em todos os arquivos relevantes · leitura de arquivos de configuração citados nas etapas anteriores*
