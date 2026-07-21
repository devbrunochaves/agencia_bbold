# Resumo Atual — Agência BBold

> Documento consolidado baseado nas Etapas 1, 2 e 14 documentadas, complementado pelo contexto da sessão de análise de Etapas 3–13.

---

## O que é a BBold

A BBold é uma agência de design e marketing digital operada por Bruno Chaves. O repositório `agencia_bbold` é uma plataforma dupla: um **site institucional público** (captação de clientes) e um **painel operacional interno** (`/flow`), ambos no mesmo projeto Next.js 15. Existe também um **CRM legado** (`/crm`) com arquitetura React Router SPA encapsulada dentro do Next.js.

Público-alvo: donos de PMEs de 28–50 anos na região da Grande Vitória/ES. O único operador interno é Bruno Chaves — não há multi-tenant nem múltiplos perfis de acesso.

---

## Tecnologias Principais

| Categoria | Tecnologia | Observação |
|-----------|-----------|-----------|
| Framework | Next.js 15.3.6 (App Router) | Server Components por padrão |
| Linguagem | TypeScript (parcial) | Módulos `/flow` e `/crm` em `.jsx` sem tipagem |
| Estilização | Tailwind CSS 3.4.1 + CSS modular | `flow.css`, `crm.css`, `diagnostico.css` separados |
| Banco/Auth | Supabase (PostgreSQL) | Auth, Realtime, Storage |
| CMS | Sanity 3.x | Blog, Studio em `/studio` |
| PDF | jsPDF 4.x | Contratos e Grid Instagram |
| Gráficos | Recharts 3.x | Apenas no CRM legado |
| Deploy | Vercel | Auto-deploy no push para `main` |
| Roteamento legado | react-router-dom 6.x | Exclusivo do `/crm` |

**Dependência morta:** `@google/generative-ai` instalada no `package.json`, mas sem nenhuma importação em todo o codebase.

---

## Estrutura Geral do Site

```
agencia_bbold/
├── app/
│   ├── (main)/          ← site público (TypeScript)
│   ├── flow/            ← painel interno (JavaScript)
│   ├── crm/             ← CRM legado SPA
│   ├── login/           ← página de autenticação
│   └── studio/          ← Sanity Studio (sem auth)
├── crm/                 ← componentes do CRM legado
├── components/          ← componentes compartilhados do site
├── lib/                 ← clientes Supabase
├── sanity/              ← config e queries do CMS
└── public/              ← assets estáticos e páginas HTML legadas
```

---

## Principais Páginas e Rotas

**Site Público (sem autenticação):**

| Rota | Finalidade |
|------|-----------|
| `/` | Homepage institucional completa |
| `/blog` e `/blog/[slug]` | Blog via Sanity CMS |
| `/projetos` e `/projetos/[slug]` | Portfólio (dados estáticos em TypeScript) |
| `/presenca-digital` | Landing page com quiz interativo |
| `/diagnostico` | Quiz diagnóstico com captura de lead |
| `/bio` | Página link-in-bio para Instagram |

**Painel Interno `/flow` (autenticação obrigatória):**

| Rota | Módulo |
|------|--------|
| `/flow` | Dashboard com KPIs |
| `/flow/leads` | Kanban de leads (4 colunas) |
| `/flow/clientes` e `/flow/clientes/[id]` | Gestão de clientes |
| `/flow/contratos` | Geração de contratos em PDF |
| `/flow/aprovacoes` | Fluxo de aprovação de conteúdo |
| `/flow/calendario` | Calendário de publicações |
| `/flow/conteudos` | Biblioteca de conteúdos |
| `/flow/performance`, `/flow/relatorios`, `/flow/workflow` | Métricas e gestão |
| `/flow/biblioteca` | Arquivos organizados por cliente |
| `/flow/configuracoes` | Configurações gerais |

**Acessíveis sem autenticação por URL direta (risco):**

- `/studio` — Sanity Studio (CMS completo sem proteção)
- `/public/servicos/`, `/public/conteudos/`, `/public/estrategia/` — documentos internos em HTML estático com `noindex`

---

## Funcionamento Geral do CRM

O CRM legado (`/crm`) é uma SPA React Router encapsulada em uma catch-all route do Next.js (`app/crm/[[...slug]]/page.jsx`). Possui 7 módulos:

1. **Dashboard** — KPI cards (faturamento, clientes ativos, entregas pendentes) e gráfico MRR por serviço (Recharts)
2. **Clientes** — CRUD completo com nicho, status, avatar colorido; detalhe por aba (Geral, Arquivos, Entregas)
3. **Contratos** — listagem de contratos por cliente, serviços vinculados, valor mensal
4. **Entregas (Kanban)** — colunas por status, tipos hierárquicos por serviço (`TIPOS_POR_SERVICO`)
5. **Demandas** — tabela agrupada por serviço, dropdown de status inline, briefings, comentários
6. **Financeiro** — gestão de cobranças mensais, gráfico de receita 6 meses, geração automática de cobranças por mês
7. **Configurações** — gerenciamento de equipe, nichos e preferências

**Fluxo principal do CRM:** cliente contratado → cadastro em `crm_clientes` → contratos em `crm_contratos` → entregas em `crm_entregas` → cobranças em `crm_cobrancas`.

---

## Autenticação e Usuários

**Painel `/flow`:**
- Supabase Auth por e-mail e senha
- `middleware.ts` intercepta `/flow/*` e `/login`, chama `getUser()` no edge (servidor)
- Cliente SSR via `@supabase/ssr` (`createBrowserClient` com cookies)
- Sem provedores OAuth; sem cadastro público

**CRM `/crm` (gap de segurança):**
- Usa `createClient` padrão do `@supabase/supabase-js` com localStorage
- Verificação de sessão via `getSession()` no cliente — não validada no servidor
- Não coberto pelo middleware; acesso é verificado apenas no frontend
- Possui fallback `'placeholder-key'` no cliente, silenciando erros de configuração

---

## Estrutura Resumida do Banco de Dados

**Supabase (PostgreSQL)** com RLS **desabilitado** em todas as tabelas.

**Tabelas do painel `/flow`:**

| Tabela | Função |
|--------|--------|
| `clients` | Clientes do painel Flow |
| `leads` | Leads do Kanban (4 etapas) |
| `contents` | Conteúdos por cliente |
| `approvals` | Aprovações de conteúdo |
| `library` + `subfolders` | Biblioteca de arquivos |
| `team` | Membros da equipe |
| `calendar_events` | Publicações no calendário |
| `performance_metrics` | Métricas de performance |

**Tabelas do CRM legado:**

| Tabela | Função |
|--------|--------|
| `crm_clientes` | Clientes e leads (campo `status`) |
| `crm_contratos` | Contratos com valor mensal e serviços |
| `crm_entregas` | Entregas (Kanban + Demandas) |
| `crm_cobrancas` | Cobranças mensais com status |
| `crm_comentarios` | Comentários nas demandas |

**Problema estrutural:** campos de relacionamento nos módulos `/flow` usam `text` (nome do cliente) em vez de UUID com FK — sem integridade referencial.

---

## Integrações Encontradas

| Integração | Uso Real | Estado |
|-----------|---------|--------|
| Supabase Auth | Login no `/flow` | ✅ Ativo |
| Supabase Database | Todas as operações CRUD | ✅ Ativo |
| Supabase Realtime | `flow-notif` (5 eventos) + `leads-rt` (2 eventos) | ✅ Ativo |
| Supabase Storage | Bucket `crm-arquivos` no CRM | ✅ Ativo (parcial) |
| Sanity CMS | Blog: listagem, detalhe, rich text | ✅ Ativo |
| Google Analytics 4 | `G-QXQ4ZWWBSG` em `app/layout.tsx` | ✅ Ativo (sem consentimento LGPD) |
| Google Fonts | `next/font/google` + links diretos em HTMLs estáticos | ✅ Ativo |
| jsPDF | Contratos e Grid Instagram (client-side) | ✅ Ativo |
| WhatsApp (`wa.me`) | CTAs, número `5527997341557` hardcoded | ✅ Ativo |
| Vercel | Deploy contínuo | ✅ Ativo |
| `@google/generative-ai` | Nenhum | ❌ Morta |
| E-mail transacional | Não existe | ❌ Ausente |
| Pagamento (Stripe etc.) | Não existe | ❌ Ausente |
| Webhooks | Não existe | ❌ Ausente |

---

## Funcionalidades Implementadas

- Site institucional completo com todas as seções da homepage
- Blog gerenciado via Sanity CMS (listagem, post, rich text, imagens CDN)
- Landing page `/presenca-digital` com quiz interativo (Framer Motion)
- Quiz diagnóstico público com captura de lead para banco de dados
- Autenticação Supabase com proteção por middleware no edge
- Kanban de leads no `/flow` com Realtime e campo de observação
- CRUD completo de clientes no painel `/flow`
- Geração de contrato PDF via jsPDF com minuta oficial
- Grid Instagram 3×3 com exportação PDF
- Fluxo de aprovação de conteúdo com notificações Realtime
- CRM com 7 módulos funcionais (Dashboard, Clientes, Contratos, Entregas, Demandas, Financeiro, Configurações)
- Geração automática de cobranças mensais com base em contratos ativos
- Kanban de entregas e visão alternativa por tabela agrupada
- Comentários em demandas com carregamento em duas fases
- Upload de arquivos no CRM (bucket `crm-arquivos`)

---

## Funcionalidades Parciais

| Funcionalidade | Problema |
|----------------|---------|
| Portfólio | Dados estáticos em `data/projetos.ts`; imagens dos projetos não confirmadas |
| Diagnóstico — 2º CTA | Botão inferior abre WhatsApp sem salvar no banco; lead é perdido |
| Storage (CRM) | Remoção de arquivo exclui registro no banco mas não o arquivo no bucket |
| Geração de cobranças (`gerarMes`) | Usa estado em memória carregado na abertura da página; contratos alterados depois não são incluídos |
| Gráfico financeiro | Usa array completo de cobranças, não responde ao filtro de mês selecionado |
| `/studio` (Sanity) | Funcional, mas sem proteção por autenticação — qualquer URL direta tem acesso |
| Dois sistemas de lead paralelos | `/flow/leads` e `crm_clientes (status='lead')` não têm ponte; dados duplicados manualmente |

---

## Principais Riscos e Débitos Técnicos

1. **RLS desabilitado** — todas as tabelas do Supabase têm `disable row level security`. A `anon_key` é exposta no browser via `NEXT_PUBLIC_`. Qualquer pessoa pode ler e escrever todos os dados sem autenticação.

2. **GA4 rastreia páginas internas** — o script `G-QXQ4ZWWBSG` está no root layout e captura todas as visitas a `/flow/*` e `/crm/*` (dados da operação interna), sem consentimento LGPD.

3. **Auth do CRM sem validação de servidor** — `getSession()` é facilmente forjável no cliente. Middleware não cobre `/crm/*`.

4. **Cinco variáveis de ambiente todas `NEXT_PUBLIC_`** — não há nenhuma chave server-only; todas as credenciais estão expostas ao navegador.

5. **Pagamentos sem processador** — dropdowns de método de pagamento (Pix, Cartão, Boleto) existem apenas como texto; nenhuma integração real.

6. **Sem vencimento nem inadimplência automática** — o módulo financeiro não tem campo de data de vencimento; status `atraso` é definido manualmente.

7. **Integridade referencial ausente** — campos de cliente em `contents`, `approvals`, `library` são `text` (nome), não FK para `clients.id`.

8. **TypeScript parcial** — módulos `/flow` e `/crm` são JavaScript puro, sem tipagem; mistura de paradigmas no mesmo projeto.

---

## Oportunidades de Melhoria

- **Segurança imediata:** habilitar RLS, mover `anon_key` para uso com políticas, criar chaves server-only para server-side queries
- **Captura de lead no 2º CTA do `/diagnostico`:** inserir no banco antes de abrir o WhatsApp
- **Unificar os dois sistemas de lead:** criar ponte entre `leads` do Flow e `crm_clientes`
- **Proteger `/studio`** com autenticação Supabase ou restrição de IP
- **Deletar arquivos do Storage** ao remover registros no CRM
- **Consentimento LGPD** antes de carregar GA4; excluir `/flow/*` e `/crm/*` do tracking
- **Automatizar inadimplência:** cronjob ou trigger para marcar cobranças vencidas como `atraso`
- **Integração de pagamento real** (Stripe, Pagar.me) para cobranças recorrentes
- **Migrar CRM legado para App Router** eliminando react-router-dom e dois clientes Supabase

---

## Informações Relevantes para Compreender a Operação

- **Bruno Chaves** é o único usuário operacional do sistema. Toda a arquitetura é single-tenant.
- **WhatsApp é o canal de fechamento:** o sistema não fecha contratos automaticamente; todo lead converte via conversa no WhatsApp.
- **Fluxo completo real:** visitante → quiz `/diagnostico` → WhatsApp → negociação externa → contrato PDF no `/flow/contratos` → cliente cadastrado no `/flow/clientes` e no CRM.
- **O CRM e o `/flow` são sistemas paralelos**, não integrados. Clientes podem existir em ambos sem sincronia.
- **Todas as integrações são read-heavy com Supabase** — sem Server Actions, sem API routes, sem webhooks. Toda lógica é client-side com chamadas diretas ao SDK.
- **Blog é o único conteúdo editorial** gerenciado externamente (Sanity); todo o resto é operacional interno.
- **Realtime está ativo** mas apenas para notificações de conteúdos/aprovações/clientes no layout do `/flow` e para atualizações de leads.

---

*Fontes utilizadas: `docs/bbold/01-visao-geral.md` · `docs/bbold/02-tecnologias-e-dependencias.md` · `docs/bbold/14-apis-acoes-e-integracoes.md` (não commitado) · contexto de análise das Etapas 3–13 da sessão anterior*

*Não documentado ainda: schema SQL detalhado (Etapa 3), rotas e componentes do site público (Etapas 4–6), módulos `/flow` em detalhe (Etapas 7–8), análise de segurança detalhada (Etapa 9). Os arquivos dessas etapas não foram persistidos no repositório.*
