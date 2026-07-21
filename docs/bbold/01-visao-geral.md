# 01 — Visão Geral

## 1.1 Nome e Finalidade

**Nome:** Agência BBold  
**Repositório:** `agencia_bbold`  
**URL pública (inferida):** domínio Vercel configurado via `vercel.json`

A aplicação é uma plataforma dupla: um **site institucional público** para captação de clientes e um **painel operacional interno** (`/flow`) para gestão da agência. Ambos vivem no mesmo repositório Next.js e compartilham a mesma base de código.

**Evidência:** `app/(main)/` (site público) · `app/flow/` (painel interno) · `vercel.json`

---

## 1.2 Problema que Resolve

A BBold — agência de design e marketing digital comandada por Bruno Chaves — precisava de:

1. Uma vitrine profissional online que comunicasse autoridade e atraísse PMEs como clientes.
2. Uma ferramenta interna para gerenciar clientes, conteúdos, aprovações, contratos e métricas sem depender de planilhas ou ferramentas externas desconectadas.

**Evidência:** `app/(main)/page.tsx` · `app/flow/` · `public/estrategia/index.html` (documento interno de estratégia de crescimento)

---

## 1.3 Público-Alvo Aparente

| Perfil | Área | Descrição |
|--------|------|-----------|
| Donos de PME | Site público | Empresários de 28–50 anos, região da Grande Vitória/ES, que buscam presença digital |
| Bruno Chaves (operador) | `/flow` | Único usuário do painel interno; gestão completa da agência |

**Evidência:** `public/estrategia/index.html` · `app/(main)/presenca-digital/PresencaDigitalClient.tsx` · `middleware.ts` (apenas um perfil de autenticação, sem multi-tenant)

---

## 1.4 Áreas Públicas e Privadas

### Área Pública (sem autenticação)

| Rota | Descrição |
|------|-----------|
| `/` | Homepage com todas as seções institucionais |
| `/blog` | Listagem de posts do blog (Sanity CMS) |
| `/blog/[slug]` | Post individual |
| `/projetos` | Portfólio (dados estáticos) |
| `/projetos/[slug]` | Detalhe do projeto |
| `/bio` | Página link-in-bio (Instagram) |
| `/presenca-digital` | Landing page de posicionamento |
| `/diagnostico` | Quiz diagnóstico público |

### Área Privada (autenticação obrigatória)

| Rota | Descrição |
|------|-----------|
| `/login` | Autenticação via Supabase |
| `/flow` | Dashboard principal |
| `/flow/clientes` | Gestão de clientes |
| `/flow/clientes/[id]` | Detalhe do cliente |
| `/flow/leads` | Kanban de leads |
| `/flow/contratos` | Geração de contratos em PDF |
| `/flow/aprovacoes` | Fluxo de aprovação de conteúdo |
| `/flow/calendario` | Calendário de publicações |
| `/flow/conteudos` | Gestão de conteúdos |
| `/flow/performance` | Métricas e gráficos |
| `/flow/relatorios` | Relatórios |
| `/flow/workflow` | Gestão de tarefas |
| `/flow/biblioteca` | Biblioteca de arquivos por cliente |
| `/flow/configuracoes` | Configurações do sistema |

**Área especial (sem autenticação, acessível por URL direta):**

| Rota | Descrição |
|------|-----------|
| `/studio` | Sanity Studio (CMS) |
| `/public/servicos/` | Tabela interna de preços (HTML estático, `noindex`) |
| `/public/conteudos/` | Roteiros de Instagram (HTML estático, `noindex`) |
| `/public/estrategia/` | Estratégia de crescimento (HTML estático, `noindex`) |

**Evidência:** `middleware.ts` · `app/` (estrutura de diretórios) · `app/studio/[[...tool]]/page.tsx`

---

## 1.5 Principais Funcionalidades

### Site Público

- Apresentação institucional com seções: hero, números, serviços, método, processo, projetos, sobre, CTA, contato
- Blog gerenciado via Sanity CMS com suporte a rich text e imagens
- Portfólio com dados estáticos (TypeScript)
- Landing page `/presenca-digital` com 9 seções e quiz interativo
- Quiz diagnóstico público com resultado personalizado
- Página link-in-bio para Instagram (`/bio`)
- Animações via IntersectionObserver (`.reveal`) e Framer Motion

### Painel Interno (/flow)

- **Dashboard:** visão consolidada dos módulos
- **Leads (Kanban):** 4 colunas (Novo / Em Contato / Proposta Enviada / Fechado)
- **Clientes:** cadastro, edição, lista com busca
- **Detalhe do Cliente:** abas Geral, Performance e Grid Instagram
- **Grid Instagram:** 9 inputs de imagem com preview 3×3 e exportação para PDF
- **Contratos:** formulário completo com geração de PDF via jsPDF (minuta oficial)
- **Aprovações:** fluxo de aprovação de conteúdo por cliente
- **Calendário:** visualização mensal de publicações
- **Conteúdos:** biblioteca de conteúdos por status
- **Performance:** gráficos via Recharts
- **Relatórios:** visualização de dados por período
- **Workflow:** gestão de tarefas e fluxo de trabalho
- **Biblioteca:** arquivos organizados por cliente e subpasta
- **Configurações:** configurações gerais do sistema

**Evidência:** `app/flow/*/page.jsx` (todos os módulos) · `app/flow/layout.jsx`

---

## 1.6 Principais Fluxos

### Fluxo de Captação (Visitante → Cliente)

```
Visitante acessa o site público
  → Navega pelas seções institucionais (/, /presenca-digital)
  → Realiza quiz diagnóstico (/diagnostico)
  → Clica em CTA → WhatsApp (wa.me/5527997341557)
  → Negociação externa → Contrato gerado em /flow/contratos
  → Cliente cadastrado em /flow/clientes
```

### Fluxo Operacional (Operador/Bruno)

```
Acessa /login → autenticação Supabase
  → Redireciona para /flow (dashboard)
  → Cadastra/atualiza clientes, leads, conteúdos
  → Gera contratos em PDF
  → Registra aprovações e acompanha calendário
  → Consulta performance e relatórios
```

**Evidência:** `middleware.ts` · `app/login/page.jsx` · `app/flow/` · `components/CtaBand.tsx` · `components/Contact.tsx`

---

## 1.7 Tecnologias Utilizadas

| Categoria | Tecnologia | Versão | Uso |
|-----------|-----------|--------|-----|
| Framework | Next.js | 15.3.6 | Base da aplicação (App Router) |
| Linguagem | TypeScript | ^5 | Tipagem (parcial — alguns arquivos são `.jsx`) |
| Estilização | Tailwind CSS | ^3.4.1 | Estilização de todos os componentes |
| Banco/Auth | Supabase | ^2.106.2 | Banco de dados e autenticação |
| CMS | Sanity | ^3.99.0 | Blog e conteúdo editorial |
| Animação | Framer Motion | (instalado) | Animações no `/presenca-digital` |
| Ícones | Lucide React | (instalado) | Ícones no `/presenca-digital` |
| PDF | jsPDF | ^4.2.1 | Geração de contratos e Grid Instagram |
| Gráficos | Recharts | ^3.8.1 | Módulo de performance |
| IA | @google/generative-ai | ^0.24.1 | Funcionalidade não totalmente rastreada |
| UI CSS | styled-components | ^6.4.2 | Presente como dependência, uso não rastreado |
| Roteamento | react-router-dom | ^6.30.3 | Usado no CRM legado em `app/crm/` |
| Deploy | Vercel | — | Hospedagem e CI/CD |

**Evidência:** `package.json` · `tailwind.config.ts` · `next.config.ts`

---

## 1.8 Integrações Identificadas

| Integração | Tipo | Status | Evidência |
|-----------|------|--------|-----------|
| Supabase | Auth + Banco de dados | ✅ Implementado | `lib/supabase.js` · `middleware.ts` · `supabase-schema.sql` |
| Sanity CMS | Headless CMS para blog | ✅ Implementado | `sanity/` · `app/(main)/blog/` |
| Vercel | Deploy e hosting | ✅ Implementado | `vercel.json` · `next.config.ts` |
| WhatsApp | Links `wa.me` (CTA) | ✅ Implementado | Múltiplos componentes |
| jsPDF | Geração de PDF | ✅ Implementado | `app/flow/contratos/page.jsx` · `app/flow/clientes/[id]/page.jsx` |
| Recharts | Gráficos de performance | ✅ Implementado | `app/flow/performance/` |
| Google Generative AI | Geração de conteúdo com IA | ⚠️ Parcial | `package.json` — uso não rastreado nos arquivos lidos |
| Canvas API | Composição de imagens (Grid) | ✅ Implementado | `app/flow/clientes/[id]/page.jsx` |

---

## 1.9 Estado Atual do Projeto

O projeto está em **produção ativa** no Vercel. O site público está funcional e o painel `/flow` é operacional para uso diário do operador.

---

## 1.10 Funcionalidades por Status

### ✅ Implementadas

- Site institucional completo (todas as seções da homepage)
- Blog com Sanity CMS (listagem, detalhe, rich text)
- Landing page `/presenca-digital` com 9 seções e quiz
- Quiz diagnóstico público (`/diagnostico`)
- Página link-in-bio (`/bio`)
- Autenticação Supabase com proteção via middleware
- Dashboard `/flow` com todos os módulos de navegação
- Gestão de clientes (CRUD completo)
- Kanban de leads
- Geração de contratos com PDF (jsPDF)
- Fluxo de aprovação de conteúdos
- Calendário de publicações
- Biblioteca de arquivos por cliente
- Grid Instagram com preview 3×3 e exportação PDF
- Gráficos de performance (Recharts)
- Máscara de moeda brasileira no campo de valor
- Dropdowns de parcelas (cartão), prazo e dia de vencimento nos contratos

### ⚠️ Parcialmente Implementadas

- **Portfólio:** rota e UI implementadas, mas dados são estáticos em `data/projetos.ts` (imagens reais ausentes — `/img/projetos/*.jpg` não encontradas)
- **Módulo de Relatórios:** rota existente, profundidade funcional não verificada nos arquivos lidos
- **Módulo de Workflow:** rota existente, profundidade funcional não verificada
- **Google Generative AI:** dependência instalada (`@google/generative-ai`), mas integração não rastreada no código lido
- **Módulo CRM legado (`app/crm/`):** existe mas usa React Router dentro do Next.js — relação com `/flow` não documentada no código

### ❌ Mencionadas mas Não Concluídas / Não Encontradas

- **Vídeo no Hero de `/presenca-digital`:** botão de play exibe placeholder "Vídeo em breve" — URL de vídeo não configurada
- **Imagens do portfólio:** referenciadas em `data/projetos.ts` mas arquivos físicos não confirmados em `public/img/projetos/`
- **Foto do Bruno Chaves no `/presenca-digital`:** seção "Sobre" exibe placeholder de texto no lugar da foto
- **RLS no Supabase:** desabilitado explicitamente no `supabase-schema.sql` (`disable row level security`) — proteção de dados não implementada
- **Tabela de contratos no banco:** módulo `/flow/contratos` gera PDFs, mas nenhuma tabela `contratos` foi encontrada no schema SQL

---

## 1.11 Limitações Visíveis

1. **Sem RLS:** todas as tabelas do Supabase têm `row level security` desabilitado — qualquer usuário com a `anon_key` pode ler e escrever todos os dados.
2. **Relacionamentos por texto:** os campos `client` nas tabelas `contents`, `approvals`, `library` e `subfolders` são `text` (nome do cliente), não `uuid` com FK para `clients.id` — sem integridade referencial.
3. **TypeScript parcial:** mistura de arquivos `.tsx` (componentes públicos) e `.jsx` (módulos do `/flow`) — sem tipagem nos módulos internos.
4. **CRM duplicado:** `app/crm/` parece ser uma versão anterior do `/flow`, usando React Router dentro do Next.js — situação não documentada no código.
5. **Dados de portfólio estáticos:** impossível gerenciar projetos pelo painel; requer edição manual de código.
6. **Um único usuário:** não há múltiplos perfis, permissões ou multi-tenant — adequado para uso individual atual, limitante para crescimento.

**Evidência:** `supabase-schema.sql` · `data/projetos.ts` · `app/crm/` · `app/flow/contratos/page.jsx`

---

## 1.12 Resumo Executivo

A BBold é uma aplicação Next.js 15 em produção que combina **site institucional de captação** e **painel operacional interno** em um único repositório. O site público está completo e polido, com animações, blog via Sanity CMS e landing pages estratégicas. O painel `/flow` cobre os principais fluxos operacionais da agência (clientes, conteúdos, aprovações, contratos e performance) e é funcional para uso diário.

Os principais pontos de atenção são: ausência de RLS no banco de dados, falta de integridade referencial entre tabelas, mistura de TypeScript e JavaScript sem tipagem nos módulos internos, e a existência de um CRM legado (`app/crm/`) cuja relação com o `/flow` atual não está documentada.

O projeto está em estágio **MVP funcional** com potencial claro de evolução — especialmente na gestão de portfólio, automações e segurança do banco de dados.

---

*Arquivos analisados: `package.json` · `next.config.ts` · `middleware.ts` · `tailwind.config.ts` · `app/globals.css` · `supabase-schema.sql` · `app/(main)/page.tsx` · `app/(main)/layout.tsx` · `app/flow/layout.jsx` · `app/flow/page.jsx` · `data/projetos.ts` · `lib/supabase.js` · `sanity/queries.ts` · `sanity/schemas/post.ts` · `public/estrategia/index.html` · `vercel.json` · estrutura de diretórios completa*
