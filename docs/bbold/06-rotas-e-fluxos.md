# 06 — Rotas e Fluxos

## Mapa Completo de Rotas

---

## 6.1 Infraestrutura Global

### Root Layout

**Arquivo:** `app/layout.tsx`  
**Tipo:** Server Component (sem `"use client"`)  
**Responsabilidades:**
- Carrega fontes via `next/font/google`: `Bebas_Neue`, `Barlow`, `Inter`
- Injeta Google Analytics (`G-QXQ4ZWWBSG`) via `<Script strategy="afterInteractive">`
- Define metadata global: `"BBOLD — Posicionamento Digital Empresarial"`
- Aplica body class: `bg-cream text-black` (`cream` não definido no Tailwind — sem efeito)

### Middleware de Autenticação

**Arquivo:** `middleware.ts`  
**Matcher:** `['/flow/:path*', '/login']`  
**Biblioteca:** `@supabase/ssr` — `createServerClient`  
**Lógica:**
- Qualquer `/flow/*` sem sessão autenticada → redireciona para `/login`
- `/login` com sessão autenticada → redireciona para `/flow`
- Todas as demais rotas: sem interceptação

---

## 6.2 Grupo: Site Público

Layout aplicado: `app/(main)/layout.tsx` — Server Component; renderiza `<Nav />` + `<Footer />` ao redor de `{children}`.

---

### `/` — Homepage

| Campo | Valor |
|---|---|
| Arquivo | `app/(main)/page.tsx` |
| Tipo | Server Component |
| Visibilidade | Pública |
| Usuário | Visitante |
| Layout | `(main)` — com Nav e Footer |
| Dados carregados | Nenhum (delegado a componentes filhos) |
| Componentes principais | `Hero`, `Numbers`, `Services`, `MetodoBBold`, `HowWeWork`, `CustomProjects`, `ProjectsPreview`, `About`, `BlogPreview`, `CtaBand`, `Contact`, `RevealInit` |
| Ações possíveis | Scroll entre seções, clicar em CTAs internos, enviar formulário de contato (monta URL `wa.me`) |
| Redirecionamentos | CTAs → `/#contato`, `/#metodo`, `wa.me/5527997341557` |
| Parâmetros dinâmicos | Nenhum |
| Dependências | `BlogPreview` busca dados do Sanity; `ProjectsPreview` importa `data/projetos.ts` |
| Estados de erro | Sem tratamento explícito |
| Estados vazios | `BlogPreview` retorna `null` se não há posts no Sanity |
| Destino após ação | CTA WhatsApp → app externo; formulário de contato → WhatsApp externo |

---

### `/blog` — Listagem do Blog

| Campo | Valor |
|---|---|
| Arquivo | `app/(main)/blog/page.tsx` |
| Tipo | Server Component async |
| Visibilidade | Pública |
| Usuário | Visitante |
| Layout | `(main)` |
| Dados carregados | `client.fetch(allPostsQuery)` — Sanity CMS; `.catch(() => [])` |
| Revalidação | ISR: `export const revalidate = 60` (60 segundos) |
| Componentes principais | `next/image`, `next/link` |
| Ações possíveis | Clicar em post → navega para `/blog/[slug]` |
| Redirecionamentos | Cada card → `/blog/${post.slug.current}` |
| Parâmetros dinâmicos | Nenhum |
| Dependências | Sanity (`allPostsQuery` de `@/sanity/queries`) |
| Estados de erro | Erro na fetch retorna array vazio (`.catch`) |
| Estados vazios | Exibe mensagem "EM BREVE" quando `posts.length === 0` |
| Destino após ação | `/blog/[slug]` |
| Metadata | `title: "Blog — Agência BBold"` |

---

### `/blog/[slug]` — Post Individual

| Campo | Valor |
|---|---|
| Arquivo | `app/(main)/blog/[slug]/page.tsx` |
| Tipo | Server Component async |
| Visibilidade | Pública |
| Usuário | Visitante |
| Layout | `(main)` |
| Parâmetros dinâmicos | `slug` (string) |
| Dados carregados | `client.fetch(postBySlugQuery, { slug })` — Sanity |
| Revalidação | ISR: `export const revalidate = 60` |
| Geração estática | `generateStaticParams` busca todos os slugs do Sanity; erro → retorna `[]` |
| Metadata dinâmica | `generateMetadata` usa título do post; fallback: `"Post não encontrado"` |
| Componentes principais | `PortableText` (`@portabletext/react`), `next/image` |
| Ações possíveis | Leitura do post, clicar em CTA de contato |
| Redirecionamentos | Link voltar → `/blog`; CTA → `/#contato` |
| Dependências | Sanity, `@portabletext/react`, `@sanity/image-url` |
| Estados de erro | `if (!post) notFound()` → 404 do Next.js |
| Estados vazios | N/A (post existe ou 404) |
| Destino após ação | `/blog` (voltar) ou `/#contato` |

---

### `/projetos` — Listagem de Projetos

| Campo | Valor |
|---|---|
| Arquivo | `app/(main)/projetos/page.tsx` |
| Tipo | Server Component |
| Visibilidade | Pública |
| Usuário | Visitante |
| Layout | `(main)` |
| Dados carregados | `import { projetos } from "@/data/projetos"` — dados estáticos em TypeScript |
| Componentes principais | `next/image`, `next/link` |
| Ações possíveis | Clicar em projeto → `/projetos/[slug]` |
| Redirecionamentos | CTA → `/#contato` |
| Parâmetros dinâmicos | Nenhum |
| Dependências | `data/projetos.ts` (local) |
| Estados de erro | Nenhum (dados nunca falham) |
| Estados vazios | Nenhum tratamento (array sempre existe) |
| Destino após ação | `/projetos/[slug]` |
| Limitação | Imagens referenciadas em `/img/projetos/*.jpg` **não existem** no `public/` |
| Metadata | `title: "Projetos — Agência BBold"` |

---

### `/projetos/[slug]` — Detalhe de Projeto

| Campo | Valor |
|---|---|
| Arquivo | `app/(main)/projetos/[slug]/page.tsx` |
| Tipo | Server Component async |
| Visibilidade | Pública |
| Usuário | Visitante |
| Layout | `(main)` |
| Parâmetros dinâmicos | `slug` (string) |
| Dados carregados | `getProjetoBySlug(slug)` — importa de `@/data/projetos` (local) |
| Geração estática | `generateStaticParams` mapeia array `projetos` |
| Metadata dinâmica | `generateMetadata` usa nome do projeto |
| Componentes principais | `next/image` |
| Ações possíveis | Navegar de volta, clicar em CTA |
| Redirecionamentos | Voltar → `/projetos`; CTA → `/#contato` |
| Dependências | `data/projetos.ts` (local) |
| Estados de erro | `if (!projeto) notFound()` |
| Estados vazios | N/A |
| Destino após ação | `/projetos` ou `/#contato` |

---

### `/presenca-digital` — Landing Page Presença Digital

| Campo | Valor |
|---|---|
| Arquivos | `app/(main)/presenca-digital/page.tsx` (Server) + `PresencaDigitalClient.tsx` (Client) |
| Tipo | Server Component wrapper + Client Component delegado |
| Visibilidade | Pública |
| Usuário | Lead / Visitante |
| Layout | `(main)` |
| Dados carregados | Nenhum (tudo estático) |
| Componentes principais | `PresencaDigitalClient` (754 linhas), `framer-motion`, `lucide-react` |
| Ações possíveis | Abrir modal de vídeo (placeholder), iniciar quiz, clicar em CTAs WhatsApp |
| Seções (9) | Hero, Prova Social, Antes/Depois (4 cards), Serviços (6), Timeline (5 etapas), Portfólio, Sobre Bruno, Manifesto, Quiz diagnóstico |
| Quiz | 5 perguntas sim/não → 3 níveis de resultado (Urgente/Em Desenvolvimento/Bom Caminho) |
| Redirecionamentos | Todos CTAs → `wa.me/5527997341557` |
| Parâmetros dinâmicos | Nenhum |
| Dependências | `framer-motion`, `lucide-react` |
| Estados de erro | Nenhum |
| Estados vazios | Vídeo exibe placeholder "Vídeo em breve" (URL não configurada) |
| Destino após ação | WhatsApp externo |
| Metadata | `title: "Posicionamento de Marca | Bruno Chaves"`, OG tags completos |

---

### `/bio` — Link-in-Bio (Instagram)

| Campo | Valor |
|---|---|
| Arquivo | `app/bio/page.tsx` |
| Tipo | Server Component |
| Visibilidade | Pública |
| Usuário | Seguidor do Instagram |
| Layout | **Nenhum** — fora do grupo `(main)`, sem Nav/Footer |
| Dados carregados | Nenhum |
| Componentes principais | CSS inline via `<style>` tag; todos os links hardcoded |
| Ações possíveis | Clicar nos links |
| Links externos | WhatsApp (`wa.me/5527997341557`), site, portfólio, Instagram, LinkedIn, e-mail |
| Parâmetros dinâmicos | Nenhum |
| Dependências | Nenhuma |
| Estados de erro | Nenhum |
| Destino após ação | Destinos externos |
| Metadata | `title: "Agência BBold — Links"` |
| Anomalia | Tema escuro diferente do site público; CSS inline acopla estilos ao HTML |

---

### `/diagnostico` — Quiz de Diagnóstico Público

| Campo | Valor |
|---|---|
| Arquivo | `app/diagnostico/page.jsx` |
| Tipo | Client Component (`'use client'`) |
| Visibilidade | Pública |
| Usuário | Lead |
| Layout | **Nenhum** — fora do grupo `(main)`, sem Nav/Footer |
| Dados carregados | Nenhum no carregamento |
| Ação ao submeter | `supabase.from('leads').insert({ name, phone, instagram, segment })` |
| Estado após submit | `formState = 'success'` → exibe botão WhatsApp com mensagem pré-preenchida |
| CTA inferior | Formulário simplificado nome+telefone → abre WhatsApp via `window.open` |
| Links externos | `wa.me/5527997341557`, `agenciabbold.com.br`, `instagram.com/agencia.bbold` |
| Parâmetros dinâmicos | Nenhum |
| Dependências | Supabase (`leads` table: `name`, `phone`, `instagram`, `segment`), `./diagnostico.css` |
| Estados de erro | Sem tratamento de erro na inserção |
| Estados vazios | Estado inicial = formulário |
| Destino após ação | WhatsApp externo (link gerado dinamicamente com dados do formulário) |

---

## 6.3 Grupo: Autenticação

### `/login` — Página de Login

| Campo | Valor |
|---|---|
| Arquivo | `app/login/page.jsx` |
| Tipo | Client Component (`'use client'`) |
| Visibilidade | Pública (middleware redireciona usuários já autenticados) |
| Usuário | Operador (Bruno Chaves) |
| Layout | Nenhum (CSS inline próprio, fundo escuro `#181818`) |
| Dados carregados | Nenhum |
| Ação principal | `supabase.auth.signInWithPassword({ email, password })` |
| Sucesso | `router.push('/flow'); router.refresh()` |
| Erro | Define `error = 'E-mail ou senha incorretos.'` — mensagem genérica |
| Estado de loading | Botão desabilitado + texto "Entrando…" |
| Campos | E-mail (required, type=email), Senha (required, type=password) |
| Redirecionamentos | Após login bem-sucedido → `/flow`; usuário já autenticado → middleware redireciona para `/flow` |
| Parâmetros dinâmicos | Nenhum |
| Dependências | Supabase auth (`@/lib/supabase`) |
| Funcionalidades ausentes | Sem link de cadastro; sem link de "esqueci minha senha"; sem Google OAuth; sem magic link |
| Destino após ação | `/flow` |

---

## 6.4 Grupo: CRM (Legado)

### `/crm/[[...slug]]` — CRM App (catch-all)

| Campo | Valor |
|---|---|
| Arquivo | `app/crm/[[...slug]]/page.jsx` |
| Tipo | Client Component (`'use client'`) |
| Visibilidade | **Não protegida pelo middleware** (middleware cobre apenas `/flow/*` e `/login`) |
| Usuário | Operador (Bruno Chaves) |
| Layout | Gerenciado internamente pelo `CrmApp` / `crm/components/Layout.jsx` |
| Parâmetros dinâmicos | `...slug` (catch-all) |
| Dependências | `react-router-dom` (`BrowserRouter`), `crm/CrmApp.jsx` (fora do diretório `app/`) |
| Roteamento interno | React Router v6 com `BrowserRouter` aninhado dentro do Next.js App Router |
| Rotas internas | `/crm/login`, `/crm/` (dashboard), `/crm/clientes`, `/crm/clientes/:id`, `/crm/demandas`, `/crm/contratos`, `/crm/entregas`, `/crm/financeiro` |
| Proteção interna | `ProtectedRoute` com `session` do estado React — baseado em `supabase.auth.getSession()` |
| Cliente Supabase | `crm/lib/supabase.js` — usa `createClient` (não SSR); ignora o middleware do Next.js |
| Ações possíveis | Login próprio, CRUD de clientes/contratos/demandas/entregas/financeiro |
| Estados de erro | Erro de login: "E-mail ou senha incorretos." |
| Anomalias | (1) Sem proteção via middleware; (2) cliente Supabase diferente do restante do app; (3) routing híbrido (React Router dentro do Next.js) |

---

## 6.5 Grupo: /flow — Painel Interno

**Proteção:** Todas as rotas `/flow/*` são protegidas pelo middleware. Sessão inválida → redireciona para `/login`.  
**Layout:** `app/flow/layout.jsx` — Client Component com `FlowContext.Provider` + `FlowSidebar` + `FlowContext`.

---

### `/flow` — Dashboard Principal

| Campo | Valor |
|---|---|
| Arquivo | `app/flow/page.jsx` |
| Tipo | Client Component |
| Dados carregados | `contents` (campos selecionados + ordenado por `pub_date`) + `clients` (nome, nicho, cor, status) via `Promise.all` |
| Ações possíveis | Navegar para `/flow/conteudos`, `/flow/clientes`, `/flow/clientes/[id]` via `router.push` |
| Componentes principais | `FlowHeader`, `MetricCard`, `StatusBadge`, `Icon` |
| Dados derivados | Métricas (clientes ativos, em produção, aprovações pendentes, publicados no mês), tabela de workflow (8 itens), Kanban por status, calendário do mês, top 4 clientes |
| Estados vazios | "Nenhum conteúdo ativo." na tabela de workflow |
| Dependências | Supabase (`contents`, `clients`) |

---

### `/flow/clientes` — Gestão de Clientes

| Campo | Valor |
|---|---|
| Arquivo | `app/flow/clientes/page.jsx` |
| Tipo | Client Component |
| Dados carregados | `supabase.from('clients').select('*').order('created_at')` |
| CRUD | Create (insert), Update, Toggle status, Delete |
| Filtros | Status (`Todos`, `Ativos`, `Pausados`, `Em onboarding`), busca por nome/nicho/responsável/plano |
| Componentes principais | `FlowHeader`, `MetricCard`, `StatusBadge`, `Icon`, `ClientModal` |
| Ações possíveis | Criar cliente, editar, pausar/ativar, excluir, navegar para detalhe |
| Redirecionamentos | Card do cliente → `/flow/clientes/${client.id}` |
| Modais | `ClientModal` (criar/editar), `DeleteDialog` (confirmar exclusão) |
| Estados de erro | Toast de erro em falha de banco |
| Estados vazios | "Nenhum resultado" / "Nenhum cliente neste filtro" |
| Dependências | Supabase (`clients`) |

---

### `/flow/clientes/[id]` — Detalhe do Cliente

| Campo | Valor |
|---|---|
| Arquivo | `app/flow/clientes/[id]/page.jsx` |
| Tipo | Client Component |
| Parâmetros dinâmicos | `id` via `useParams()` (uuid do cliente) |
| Dados carregados | Supabase: `clients` + `performance_records` (inferido pelo Sparkline) |
| Ações possíveis | Editar dados, exportar PDF via jsPDF, visualizar Grid Instagram 3×3 |
| Componentes principais | `FlowHeader`, `StatusBadge`, `MetricCard`, `Icon`, Sparkline (SVG inline) |
| Sparkline | Renderiza gráfico SVG; exibe "Adicione mais um registro" quando `< 2` registros |
| PDF | Gerado via `jsPDF` — exportação de dados do cliente e grid Instagram |
| Dependências | Supabase (`clients`, `performance_records`), `jspdf` |

---

### `/flow/leads` — Pipeline de Leads (Kanban)

| Campo | Valor |
|---|---|
| Arquivo | `app/flow/leads/page.jsx` |
| Tipo | Client Component |
| Dados carregados | `supabase.from('leads').select('*').order('created_at', { ascending: false })` |
| Realtime | `supabase.channel('leads-rt')` — escuta `INSERT` e `UPDATE` na tabela `leads` |
| Colunas Kanban | `em_aberto`, `contato_feito`, `reuniao_agendada`, `stand_by` |
| CRUD | Delete, mover card (atualiza `status`), salvar observação (`observations`) |
| Links por card | WhatsApp `wa.me/55${phone}`, Instagram `instagram.com/${handle}` |
| Estados de erro | Sem tratamento explícito |
| Estados vazios | "Vazio" por coluna vazia |
| Dependências | Supabase (`leads`: `id`, `name`, `phone`, `instagram`, `segment`, `status`, `observations`, `created_at`) |

---

### `/flow/contratos` — Gerador de Contratos PDF

| Campo | Valor |
|---|---|
| Arquivo | `app/flow/contratos/page.jsx` |
| Tipo | Client Component |
| Dados carregados | `supabase.from('clients')` — lista de clientes para seleção do contratante |
| Ação principal | Gera contrato em PDF via `jsPDF` (nenhum registro salvo no banco) |
| Dados hardcoded | CNPJ BBold: `59.676.407/0001-86`, endereço, 8 serviços com escopo e limites |
| Métodos de pagamento | Pix, Cartão de Crédito, Boleto |
| Dependências | Supabase (`clients`), `jspdf` |
| Limitação | Contratos não são persistidos em banco; sem tabela `contratos` no schema SQL |

---

### `/flow/aprovacoes` — Fluxo de Aprovação de Conteúdo

| Campo | Valor |
|---|---|
| Arquivo | `app/flow/aprovacoes/page.jsx` |
| Tipo | Client Component |
| Dados carregados | `Promise.all`: `approvals` (select *) + `clients` (select name) |
| CRUD | Create, Update status, Approve, Liberar p/ cliente, Solicitar ajuste, Reprovar |
| Statuses possíveis | `Aguardando revisão`, `Ajustes solicitados`, `Liberado p/ cliente`, `Aprovado`, `Reprovado` |
| Filtros | Por status, busca por texto |
| Métricas | Pendentes, urgentes, aprovados hoje, reprovados |
| Modais | `ApprovalModal`, `ApprovalDetailModal`, `MiniModal` (ajuste/reprovação com nota) |
| Estados de erro | Toast de erro |
| Estados vazios | "Nenhuma aprovação encontrada" |
| Dependências | Supabase (`approvals`, `clients`) |

---

### `/flow/calendario` — Calendário Editorial

| Campo | Valor |
|---|---|
| Arquivo | `app/flow/calendario/page.jsx` |
| Tipo | Client Component |
| Dados carregados | `Promise.all`: `contents` (com `pub_date` não nulo) + `clients` (nomes) |
| Exibe | Grade mensal com dots coloridos por formato; lista "Próximas Publicações" (8 itens) |
| Navegação | Seletor de mês/ano |
| Filtros | Por cliente, por formato |
| Ações possíveis | Navegar meses, filtrar — botão "Novo Agendamento" presente mas **sem handler** |
| Estados de erro | Sem tratamento |
| Estados vazios | "Nenhum conteúdo agendado para [mês]." / "Nenhuma publicação próxima." |
| Dependências | Supabase (`contents`, `clients`) |

---

### `/flow/conteudos` — Gestão de Conteúdos

| Campo | Valor |
|---|---|
| Arquivo | `app/flow/conteudos/page.jsx` |
| Tipo | Client Component |
| Dados carregados | `Promise.all`: `contents` (select *) + `clients` (nomes) |
| CRUD | Create, Update, Duplicate (`'Cópia — ...'`), Delete, Status change |
| Statuses | `Briefing`, `Produção`, `Revisão`, `Aguardando Aprovação`, `Agendado`, `Publicado`, `Atrasado` |
| Formatos | `Reels`, `Feed`, `Stories`, `Carrossel`, `Blog`, `Landing Page` |
| Responsáveis (hardcoded) | `Bruno`, `Ana Lima`, `Rafael Souza`, `Camila Rocha` |
| Filtros | Cliente, status, formato, responsável, busca por texto |
| Modais | `ContentDetailModal`, `ContentModal`, confirm delete inline |
| Estados de erro | Toast de erro |
| Estados vazios | "Nenhum conteúdo encontrado" |
| Dependências | Supabase (`contents`, `clients`) |

---

### `/flow/performance` — Dashboard de Performance

| Campo | Valor |
|---|---|
| Arquivo | `app/flow/performance/page.jsx` |
| Tipo | Client Component |
| Dados carregados | `Promise.all` por período selecionado: `performance_records` (join `clients`), `contents` publicados, publicações 6 meses |
| Selector de período | Dropdown de YYYY-MM (últimos 12 meses) |
| Métricas exibidas | Alcance total, interações médias, publicações, melhor interação |
| Gráficos | Barras por cliente (alcance e engajamento); barras 6 meses (publicações); tabela top 5 |
| Estados de erro | Sem tratamento |
| Estados vazios | "Sem dados neste período" |
| Dependências | Supabase (`performance_records` com JOIN em `clients`, `contents`) |

---

### `/flow/relatorios` — Gerador de Relatórios

| Campo | Valor |
|---|---|
| Arquivo | `app/flow/relatorios/page.jsx` |
| Tipo | Client Component |
| Dados carregados | `clients` no mount; `performance_records` + `contents` + `approvals` ao gerar |
| Ação principal | Gera relatório por cliente e período selecionados; impressão via `window.print()` |
| Print CSS | Oculta sidebar/header, ajusta margens para PDF/impressão |
| Estados de erro | Sem tratamento |
| Estados vazios | "Nenhum relatório gerado" — selecionar cliente primeiro |
| Dependências | Supabase (`clients`, `performance_records`, `contents`, `approvals`) |

---

### `/flow/workflow` — Kanban de Workflow

| Campo | Valor |
|---|---|
| Arquivo | `app/flow/workflow/page.jsx` |
| Tipo | Client Component |
| Dados carregados | `Promise.all`: `contents` (campos selecionados) + `clients` (nomes) |
| Colunas Kanban | `Briefing`, `Produção`, `Revisão`, `Aguardando Aprovação`, `Agendado`, `Publicado`, `Atrasado` (7 colunas) |
| Filtro | Por cliente (dropdown) |
| Chips de stats | Total, Em Atraso, Urgentes, Publicados |
| CRUD | **Somente leitura** — sem ações de criação/edição no Kanban |
| Estados de erro | Sem tratamento |
| Estados vazios | "Vazio" por coluna |
| Dependências | Supabase (`contents`, `clients`) |

---

### `/flow/biblioteca` — Biblioteca de Arquivos (raiz)

| Campo | Valor |
|---|---|
| Arquivo | `app/flow/biblioteca/page.jsx` |
| Tipo | Client Component |
| Dados carregados | `supabase.from('library_files').select('*')` + `clients` (nomes) |
| CRUD | Create, Update, Delete de registros de arquivo |
| Tipos de arquivo | `Logo`, `Brandbook`, `Foto`, `Vídeo`, `Contrato`, `Briefing`, `Campanha` |
| Ordenação | Mais recentes, Mais antigos, Nome A-Z, Nome Z-A, Maior/Menor tamanho |
| Download | Função `handleDownload` exibe toast — **sem download real implementado** |
| Estados de erro | Se tabela `library_files` não existir → exibe DDL SQL para criação |
| Estados vazios | Lista vazia |
| Dependências | Supabase (`library_files`, `clients`) — nota: tabela `library_files` diferente de `library` no schema SQL |

---

### `/flow/biblioteca/[clientSlug]` — Pasta por Cliente

| Campo | Valor |
|---|---|
| Arquivo | `app/flow/biblioteca/[clientSlug]/page.jsx` |
| Tipo | Client Component |
| Parâmetros dinâmicos | `clientSlug` (URL-decoded via `useParams`) |
| **Storage** | **`localStorage`** — `bbold_flow_library`, `bbold_flow_clients`, `bbold_flow_subfolders` |
| Ações possíveis | Adicionar arquivo (metadados), criar subpasta, renomear subpasta, excluir subpasta, compartilhar link |
| Link de compartilhamento | `navigator.clipboard.writeText(url)` — URL `/flow/biblioteca/${clientSlug}/${subfolderSlug}` |
| Navegação | Voltar → `/flow/biblioteca`; entrar em subpasta → `/flow/biblioteca/${clientSlug}/${subfolderSlug}` |
| Modais | `RenameFolderModal`, `NewSubfolderModal`, `FileFormModal`, `FileDetailModal`, confirm delete |
| Nota de upload | Exibe "Upload real será habilitado em breve." |
| Estados de erro | Sem tratamento |
| Estados vazios | "Pasta vazia" |
| Dependências | localStorage — **sem Supabase** |

---

### `/flow/biblioteca/[clientSlug]/[subfolderSlug]` — Subpasta do Cliente

| Campo | Valor |
|---|---|
| Arquivo | `app/flow/biblioteca/[clientSlug]/[subfolderSlug]/page.jsx` |
| Tipo | Client Component |
| Parâmetros dinâmicos | `clientSlug`, `subfolderSlug` (ambos URL-decoded) |
| **Storage** | **`localStorage`** — `bbold_flow_library`, `bbold_flow_subfolders` |
| Breadcrumb | `Biblioteca / [clientName] / [subfolderName]` |
| Ações possíveis | Upload de arquivo (metadados), editar, excluir |
| Cor da subpasta | Carregada de `bbold_flow_subfolders` no localStorage |
| Estados de erro | Sem tratamento |
| Estados vazios | "Pasta vazia" com botão "Enviar arquivo" |
| Dependências | localStorage — **sem Supabase** |

---

### `/flow/configuracoes` — Configurações

| Campo | Valor |
|---|---|
| Arquivo | `app/flow/configuracoes/page.jsx` |
| Tipo | Client Component |
| **Storage** | **Apenas `localStorage`** — sem Supabase |
| Seções | Agência, Equipe, Permissões, Status, Notificações, Aparência |
| Agência | Read-only; botão "Salvar" sem handler |
| Equipe | CRUD em `localStorage` (`bbold_flow_team`); seed: Ana Lima, Carlos Mendes, Juliana K., Pedro Henrique, Lucas Freitas |
| Permissões | Matriz Admin/Editor/Viewer — read-only, sem backend |
| Status | Lista de statuses de workflow — botões de editar/excluir sem handler |
| Notificações | Toggles persistidos em `localStorage` (`bbold_notif_settings`); consumidos pelo `FlowLayout` para filtrar Realtime |
| Aparência | Tema (5 opções: `premium`, `minimal`, `green`, `blue`, `rose`) + fonte (`Barlow`, `Inter`) → `localStorage` (`bbold_flow_theme`, `bbold_flow_font`) |
| Dependências | localStorage — **sem Supabase em nenhum ponto** |

---

## 6.6 Grupo: APIs

| Item | Status |
|---|---|
| Arquivos `route.ts` / `route.js` | **Nenhum encontrado** — zero API routes no projeto |
| Padrão de acesso a dados | Direct SDK calls nos componentes (cliente ou servidor) |
| Server Actions | **Nenhuma** — zero diretivas `"use server"` fora de `app/flow/FlowContext.js` |

---

## 6.7 Grupo: Callbacks e Auth Hooks

| Item | Status |
|---|---|
| `/auth/callback` | **Não existe** |
| `/auth/confirm` | **Não existe** |
| Redirect URI de OAuth | **Não configurado** (sem Google OAuth, sem magic link) |
| Email confirmation callback | **Não implementado** |

---

## 6.8 Outras Áreas

### `/studio/[[...tool]]` — Sanity Studio

| Campo | Valor |
|---|---|
| Arquivo | `app/studio/[[...tool]]/page.tsx` |
| Tipo | Client Component (`"use client"`) |
| Visibilidade | **Pública — sem autenticação via middleware** |
| Parâmetros dinâmicos | `...tool` (catch-all) |
| Ação | Renderiza `<NextStudio config={config} />` do pacote `next-sanity/studio` |
| Dependências | `next-sanity`, config de `@/sanity/sanity.config` |
| Risco | Acesso ao CMS sem autenticação no nível do middleware; proteção depende do auth interno do Sanity |

### HTML Estáticos em `/public/`

| Caminho | Conteúdo |
|---|---|
| `/public/servicos/index.html` | Tabela interna de preços (com `noindex`) |
| `/public/conteudos/index.html` | Roteiros de Instagram (com `noindex`) |
| `/public/estrategia/index.html` | Documento de estratégia de crescimento (com `noindex`) |

Esses arquivos são servidos diretamente pelo Next.js/Vercel como arquivos estáticos, sem proteção de autenticação. Acessíveis por URL direta.

**`vercel.json` rewrites:**
- `/servicos` → `/servicos/index.html`
- `/conteudos` → `/conteudos/index.html`

---

## 6.9 Tabela Resumo de Todas as Rotas

| Rota | Arquivo | Client | Proteção | Dados | Parâmetros | Erro/Vazio |
|---|---|---|---|---|---|---|
| `/` | `(main)/page.tsx` | Não | Pública | Nenhum direto | — | BlogPreview null |
| `/blog` | `(main)/blog/page.tsx` | Não | Pública | Sanity ISR 60s | — | "EM BREVE" |
| `/blog/[slug]` | `(main)/blog/[slug]/page.tsx` | Não | Pública | Sanity ISR 60s | `slug` | `notFound()` |
| `/projetos` | `(main)/projetos/page.tsx` | Não | Pública | Local estático | — | — |
| `/projetos/[slug]` | `(main)/projetos/[slug]/page.tsx` | Não | Pública | Local estático | `slug` | `notFound()` |
| `/presenca-digital` | `(main)/presenca-digital/page.tsx` | Client delegado | Pública | Nenhum | — | — |
| `/bio` | `bio/page.tsx` | Não | Pública | Nenhum | — | — |
| `/diagnostico` | `diagnostico/page.jsx` | Sim | Pública | Supabase insert | — | Success state |
| `/login` | `login/page.jsx` | Sim | Pública (redirect se auth) | Supabase auth | — | Mensagem de erro |
| `/flow` | `flow/page.jsx` | Sim | **Middleware** | Supabase read | — | "Nenhum conteúdo ativo" |
| `/flow/clientes` | `flow/clientes/page.jsx` | Sim | **Middleware** | Supabase CRUD | — | "Nenhum cliente" |
| `/flow/clientes/[id]` | `flow/clientes/[id]/page.jsx` | Sim | **Middleware** | Supabase read | `id` | Sparkline aviso |
| `/flow/leads` | `flow/leads/page.jsx` | Sim | **Middleware** | Supabase CRUD + Realtime | — | "Vazio" por coluna |
| `/flow/contratos` | `flow/contratos/page.jsx` | Sim | **Middleware** | Supabase read + jsPDF | — | — |
| `/flow/aprovacoes` | `flow/aprovacoes/page.jsx` | Sim | **Middleware** | Supabase CRUD | — | "Nenhuma aprovação" |
| `/flow/calendario` | `flow/calendario/page.jsx` | Sim | **Middleware** | Supabase read | — | "Nenhum conteúdo" |
| `/flow/conteudos` | `flow/conteudos/page.jsx` | Sim | **Middleware** | Supabase CRUD | — | "Nenhum conteúdo" |
| `/flow/performance` | `flow/performance/page.jsx` | Sim | **Middleware** | Supabase read (join) | — | "Sem dados" |
| `/flow/relatorios` | `flow/relatorios/page.jsx` | Sim | **Middleware** | Supabase read (on demand) | — | "Nenhum relatório" |
| `/flow/workflow` | `flow/workflow/page.jsx` | Sim | **Middleware** | Supabase read | — | "Vazio" por coluna |
| `/flow/biblioteca` | `flow/biblioteca/page.jsx` | Sim | **Middleware** | Supabase CRUD | — | DDL error display |
| `/flow/biblioteca/[clientSlug]` | `flow/biblioteca/[clientSlug]/page.jsx` | Sim | **Middleware** | localStorage | `clientSlug` | "Pasta vazia" |
| `/flow/biblioteca/[clientSlug]/[subfolderSlug]` | `flow/biblioteca/[clientSlug]/[subfolderSlug]/page.jsx` | Sim | **Middleware** | localStorage | `clientSlug`, `subfolderSlug` | "Pasta vazia" |
| `/flow/configuracoes` | `flow/configuracoes/page.jsx` | Sim | **Middleware** | localStorage | — | — |
| `/crm/[[...slug]]` | `crm/[[...slug]]/page.jsx` | Sim | **Nenhuma** (sem middleware) | React Router + CrmApp | `...slug` | Interno ao CrmApp |
| `/studio/[[...tool]]` | `studio/[[...tool]]/page.tsx` | Sim | Sanity interno | Sanity Studio | `...tool` | — |

---

## 6.10 Principais Fluxos do Usuário

### Fluxo 1 — Visitante → Lead (Captação via Diagnóstico)

```
1. Visitante acessa https://agenciabbold.com.br/
   └─ Homepage carrega com todas as seções institucionais

2. Navega pelas seções:
   → Hero (CTA → /#contato)
   → Método BBold (/#metodo)
   → Serviços (/#pacotes)
   → Projetos (/#projetos)

3. Acessa /presenca-digital
   └─ Lê as 9 seções da landing page

4. Faz o quiz diagnóstico embutido em /presenca-digital
   └─ 5 perguntas sim/não → resultado (Urgente/Em Dev/Bom Caminho)
   └─ CTA → WhatsApp wa.me/5527997341557

5. OU acessa /diagnostico diretamente
   └─ Preenche formulário (nome, telefone, instagram, segmento)
   └─ Supabase insere registro na tabela `leads`
   └─ Exibe botão "Falar no WhatsApp" com mensagem pré-preenchida
   └─ Abre conversa no WhatsApp externo

6. Negociação acontece externamente (WhatsApp)
```

**Evidência:** `app/(main)/page.tsx` · `app/(main)/presenca-digital/PresencaDigitalClient.tsx` · `app/diagnostico/page.jsx` · `components/Contact.tsx`

---

### Fluxo 2 — Visitante → Contato Direto (Homepage)

```
1. Visitante acessa / (homepage)

2. Clica em qualquer CTA → /#contato (âncora na seção Contact)

3. Preenche formulário: nome (required) + telefone (required)

4. Submit: JavaScript monta URL wa.me/5527997341557?text=...
   └─ NÃO envia para servidor — sem backend

5. Abre WhatsApp externo com mensagem pré-preenchida
```

**Evidência:** `components/Contact.tsx`

---

### Fluxo 3 — Operador → Login → Painel

```
1. Bruno acessa /login
   └─ Middleware verifica: sem sessão → permite acesso
   └─ Se já autenticado → middleware redireciona para /flow

2. Preenche e-mail + senha

3. Chama supabase.auth.signInWithPassword({ email, password })
   └─ Sucesso: router.push('/flow') + router.refresh()
   └─ Falha: exibe "E-mail ou senha incorretos."

4. Next.js App Router navega para /flow
   └─ middleware.ts intercepta: getUser() → usuário autenticado → NextResponse.next()
   └─ FlowLayout renderiza: FlowContext.Provider + FlowSidebar + {children}
   └─ FlowSidebar: getUser() → exibe nome/email no rodapé

5. Dashboard carrega:
   └─ Promise.all([contents, clients])
   └─ Computa métricas + workflow + Kanban + calendário

6. FlowLayout inicializa Realtime:
   └─ supabase.channel('flow-notif')
   └─ Escuta INSERT/UPDATE em contents, approvals, clients
   └─ Notificações aparecem em tempo real no sino
```

**Evidência:** `middleware.ts` · `app/login/page.jsx` · `app/flow/layout.jsx` · `app/flow/page.jsx`

---

### Fluxo 4 — Operador → Logout

```
1. Bruno clica no botão de logout no rodapé da FlowSidebar

2. Chama supabase.auth.signOut()
   └─ Supabase limpa os cookies de sessão

3. router.push('/login') + router.refresh()

4. Middleware intercepta próxima navegação para /flow:
   └─ getUser() → null → redireciona para /login
```

**Evidência:** `components/flow/FlowSidebar.jsx` · `middleware.ts`

---

### Fluxo 5 — Operador → Cadastrar Lead → Converter em Cliente

```
1. Lead chega via WhatsApp (externo)
   OU aparece no Kanban /flow/leads (se veio via /diagnostico)

2. Operador acessa /flow/leads
   └─ Visualiza cards Kanban
   └─ Move card entre colunas (atualiza status no Supabase)
   └─ Adiciona observações por card

3. Lead fechado → operador acessa /flow/clientes

4. Clica em "Novo Cliente" → modal ClientModal
   └─ Preenche: nome, nicho, plano, responsável, status, Instagram, WhatsApp, e-mail, observações

5. Salva: supabase.from('clients').insert(...)
   └─ FlowLayout recebe INSERT no Realtime → notificação "Novo cliente"

6. Operador navega para /flow/clientes/[id]
   └─ Visualiza perfil completo do cliente
```

**Evidência:** `app/flow/leads/page.jsx` · `app/flow/clientes/page.jsx` · `app/flow/layout.jsx`

---

### Fluxo 6 — Operador → Gerar Contrato PDF

```
1. Operador acessa /flow/contratos

2. Seleciona cliente do dropdown (carregado do Supabase)

3. Preenche dados do contrato:
   └─ Serviços, valor, método de pagamento, parcelas, prazo, dia de vencimento

4. Clica "Gerar Contrato"
   └─ jsPDF monta o documento com dados BBold + dados do cliente + cláusulas

5. PDF é baixado diretamente pelo browser
   └─ Nenhum dado é salvo no banco (sem tabela `contratos`)
```

**Evidência:** `app/flow/contratos/page.jsx`

---

### Fluxo 7 — Operador → Ciclo de Conteúdo

```
1. Operador acessa /flow/conteudos

2. Cria conteúdo: title, client, format, channel, status=Briefing, pub_date, responsible

3. Evolução de status:
   Briefing → Produção → Revisão → Aguardando Aprovação → Agendado → Publicado

4. Ao mudar status para "Aguardando Aprovação":
   └─ Operador cria item em /flow/aprovacoes

5. Em /flow/aprovacoes:
   └─ Approve / Liberado p/ cliente / Ajustes / Reprovado

6. Ao publicar (status = "Publicado"):
   └─ FlowLayout recebe UPDATE → notificação "Conteúdo publicado"

7. Visível em /flow/workflow (kanban) e /flow/calendario (grid mensal)
```

**Evidência:** `app/flow/conteudos/page.jsx` · `app/flow/aprovacoes/page.jsx` · `app/flow/workflow/page.jsx` · `app/flow/calendario/page.jsx`

---

### Fluxo 8 — Operador → Relatório do Cliente

```
1. Operador acessa /flow/relatorios

2. Seleciona cliente + período (mês/ano)

3. Clica "Gerar Relatório"
   └─ Promise.all: performance_records + contents + approvals filtrados por cliente e período

4. Relatório renderiza na tela

5. Clica "Imprimir / PDF"
   └─ window.print() abre diálogo de impressão do browser
   └─ @media print CSS oculta sidebar e header
```

**Evidência:** `app/flow/relatorios/page.jsx`

---

## 6.11 Observações Estruturais

1. **Zero API routes:** Todo acesso a dados é direto via Supabase SDK e Sanity client. Sem intermediários no servidor.

2. **Duas storages paralelas:** Supabase (dados de negócio) e localStorage (biblioteca de arquivos, configurações de equipe, notificações, tema/fonte). Dados em localStorage são perdidos ao trocar de browser ou dispositivo.

3. **Realtime em dois pontos distintos:** `flow/layout.jsx` (notificações globais — 5 eventos) e `flow/leads/page.jsx` (kanban ao vivo — 2 eventos). O layout mantém conexão persistente durante toda a sessão no `/flow`.

4. **`/crm` sem proteção:** A rota `/crm/[[...slug]]` não está no matcher do middleware. Qualquer pessoa com a URL pode acessar a interface do CRM (proteção depende do estado React interno, não do middleware SSR).

5. **404 customizado ausente:** Não existe `app/not-found.tsx`. O Next.js usa sua página 404 padrão.

6. **`/studio` exposto:** O Sanity Studio está acessível sem proteção via middleware. Depende da autenticação interna do Sanity.

7. **Biblioteca (clientSlug) vs Biblioteca (raiz):** A rota raiz usa Supabase (`library_files`); as sub-rotas dinâmicas usam localStorage — inconsistência de storage na mesma feature.

---

*Arquivos analisados: `middleware.ts` · `app/layout.tsx` · `app/(main)/layout.tsx` · `app/(main)/page.tsx` · `app/(main)/blog/page.tsx` · `app/(main)/blog/[slug]/page.tsx` · `app/(main)/projetos/page.tsx` · `app/(main)/projetos/[slug]/page.tsx` · `app/(main)/presenca-digital/page.tsx` · `app/(main)/presenca-digital/PresencaDigitalClient.tsx` · `app/bio/page.tsx` · `app/diagnostico/page.jsx` · `app/login/page.jsx` · `app/flow/layout.jsx` · `app/flow/page.jsx` · `app/flow/clientes/page.jsx` · `app/flow/clientes/[id]/page.jsx` · `app/flow/leads/page.jsx` · `app/flow/contratos/page.jsx` · `app/flow/aprovacoes/page.jsx` · `app/flow/calendario/page.jsx` · `app/flow/conteudos/page.jsx` · `app/flow/performance/page.jsx` · `app/flow/relatorios/page.jsx` · `app/flow/workflow/page.jsx` · `app/flow/biblioteca/page.jsx` · `app/flow/biblioteca/[clientSlug]/page.jsx` · `app/flow/biblioteca/[clientSlug]/[subfolderSlug]/page.jsx` · `app/flow/configuracoes/page.jsx` · `app/crm/[[...slug]]/page.jsx` · `app/studio/[[...tool]]/page.tsx` · `components/flow/FlowSidebar.jsx` · `crm/CrmApp.jsx` · `crm/components/Layout.jsx`*
