# 07 — Autenticação e Usuários

## 7.1 Provedor de Autenticação

**Provedor:** Supabase Auth  
**Pacotes utilizados:**

| Pacote | Versão | Uso |
|---|---|---|
| `@supabase/supabase-js` | ^2.106.2 | SDK base — CRM legado |
| `@supabase/ssr` | ^0.10.3 | Cliente SSR para middleware e browser client principal |

**Métodos de autenticação disponíveis no Supabase:**
- Email + senha: ✅ **implementado**
- OAuth (Google, GitHub, etc.): ❌ não configurado
- Magic Link (e-mail): ❌ não configurado
- OTP por telefone: ❌ não configurado

---

## 7.2 Dois Clientes Supabase — Importante

O projeto possui **dois clientes Supabase distintos e independentes**, que tratam sessões de forma diferente:

### Cliente Principal — `/flow`

**Arquivo:** `lib/supabase.js`

```js
import { createBrowserClient } from '@supabase/ssr'
export const supabase = createBrowserClient(supabaseUrl, supabaseKey)
```

- Usa `createBrowserClient` do `@supabase/ssr`
- Sessão armazenada em **cookies** (acessíveis pelo middleware Next.js)
- Singleton — mesma instância em toda a aplicação `/flow`
- Compatível com o middleware SSR

### Cliente Legado — `/crm`

**Arquivo:** `crm/lib/supabase.js`

```js
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- Usa `createClient` padrão (não-SSR)
- Sessão armazenada em **localStorage** (não acessível pelo middleware)
- Fallbacks hardcoded: `'https://placeholder.supabase.co'` e `'placeholder-key'`
- **Incompatível com o middleware** — sessão não é visível pelo Next.js

**Consequência prática:** Login feito via `/login` (cliente principal) não é reconhecido pelo CRM legado (`/crm`), e vice-versa. São sessões isoladas no mesmo Supabase project.

---

## 7.3 Login

**Rota:** `/login`  
**Arquivo:** `app/login/page.jsx`  
**Tipo:** Client Component (`'use client'`)

**Campos:**
- E-mail (required, `type="email"`, `autoComplete="email"`)
- Senha (required, `type="password"`, `autoComplete="current-password"`)

**Chamada à API:**
```js
supabase.auth.signInWithPassword({ email, password })
```

**Comportamento:**
- Sucesso → `router.push('/flow')` + `router.refresh()`
- Erro → `error = 'E-mail ou senha incorretos.'` (mensagem genérica — não distingue e-mail inexistente de senha errada)
- Loading → botão desabilitado + texto "Entrando…"

**Funcionalidades ausentes:**
- Link "Esqueci minha senha"
- Link de cadastro
- Google OAuth / SSO
- Magic link / login sem senha
- Limitação de tentativas (rate limiting via Supabase padrão)
- CAPTCHA

---

## 7.4 Cadastro (Registro)

**Status:** ❌ **Não implementado**

Não existe nenhuma rota ou formulário de cadastro na aplicação. O único usuário do sistema (Bruno Chaves) é presumivelmente criado diretamente no painel do Supabase ou via CLI.

Não há:
- Página `/register` ou `/signup`
- Chamada a `supabase.auth.signUp()`
- Fluxo de confirmação por e-mail pós-cadastro
- Convites para novos usuários

**Implicação:** O sistema é de usuário único. Qualquer novo operador precisaria ser adicionado manualmente pelo Supabase Dashboard.

---

## 7.5 Recuperação de Senha

**Status:** ❌ **Não implementado**

Não existe:
- Link "Esqueci minha senha" na tela de login
- Rota `/reset-password` ou similar
- Chamada a `supabase.auth.resetPasswordForEmail()`
- Rota de callback para redefinição (ex.: `/auth/callback`)

**Risco:** Se o operador perder a senha, só é possível redefinir via Supabase Dashboard diretamente.

---

## 7.6 Confirmação de E-mail

**Status:** ❌ **Não implementado / Não configurado**

Não existe:
- Rota de callback para confirmação de e-mail
- Tratamento de token de confirmação
- Chamada a `supabase.auth.verifyOtp()`

O comportamento depende das configurações do Supabase Dashboard. Se "Confirm email" estiver habilitado no Supabase, um novo usuário criado via `signUp` precisaria confirmar o e-mail, mas não há interface para isso no app.

---

## 7.7 Logout

**Implementado em dois locais:**

### FlowSidebar (painel `/flow`)

**Arquivo:** `components/flow/FlowSidebar.jsx` (linha 52–56)

```js
async function logout() {
  await supabase.auth.signOut()
  router.push('/login')
  router.refresh()
}
```

- Botão de logout no rodapé da sidebar lateral
- `supabase.auth.signOut()` → limpa cookies de sessão
- `router.push('/login')` + `router.refresh()` → força re-render com sessão nula
- Middleware intercepta próxima requisição para `/flow/*` → redireciona para `/login`

### CRM Legado

**Arquivo:** `crm/components/Layout.jsx` (linha 26–29)

```js
async function handleLogout() {
  await supabase.auth.signOut()
  navigate('/crm/login')
}
```

- Usa cliente Supabase próprio do CRM
- Redireciona para `/crm/login` via React Router

---

## 7.8 Sessão e Cookies

**Mecanismo:** Supabase SSR gerencia a sessão via **cookies HTTP** (não localStorage) no cliente principal.

**Pacote:** `@supabase/ssr` — `createBrowserClient`

**Cookies gerenciados automaticamente pelo Supabase:**
- `sb-[project-id]-auth-token` — token JWT da sessão
- `sb-[project-id]-auth-token-code-verifier` — PKCE verifier (se aplicável)

**Fluxo de cookies no middleware:**
```ts
// middleware.ts (linhas 11–23)
{
  cookies: {
    getAll() {
      return request.cookies.getAll()   // lê cookies da request
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(...)         // escreve na request
      response = NextResponse.next({ request })
      cookiesToSet.forEach(...)         // escreve na response (para o browser)
    },
  },
}
```

- O middleware lê e renova os cookies a cada requisição interceptada
- Cookies de sessão expirados são renovados automaticamente (refresh token)
- **SameSite/Secure:** Definidos pelo Supabase conforme configuração do projeto

**CRM legado:** Usa `createClient` padrão — sessão em **localStorage** do browser. Não visível pelo middleware.

---

## 7.9 Middleware de Proteção de Rotas

**Arquivo:** `middleware.ts`  
**Biblioteca:** `@supabase/ssr` — `createServerClient`  
**Matcher (rotas interceptadas):**

```ts
export const config = {
  matcher: ['/flow/:path*', '/login'],
}
```

**Lógica completa:**

```ts
const { data: { user } } = await supabase.auth.getUser()
const { pathname } = request.nextUrl

// Rota protegida sem usuário → redireciona para login
if (pathname.startsWith('/flow') && pathname !== '/login') {
  if (!user) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
}

// Login com usuário ativo → redireciona para o painel
if (pathname === '/login' && user) {
  url.pathname = '/flow'
  return NextResponse.redirect(url)
}

return response  // passa adiante
```

**`supabase.auth.getUser()`** — validação segura da sessão no servidor (não usa JWT local — faz round-trip ao Supabase para verificar validade real do token).

---

## 7.10 Proteção de Rotas — Cobertura Completa

| Rota | Protegida pelo Middleware | Observação |
|---|---|---|
| `/flow` | ✅ Sim | Redireciona para `/login` se sem sessão |
| `/flow/clientes` | ✅ Sim | Idem |
| `/flow/clientes/[id]` | ✅ Sim | Idem |
| `/flow/leads` | ✅ Sim | Idem |
| `/flow/contratos` | ✅ Sim | Idem |
| `/flow/aprovacoes` | ✅ Sim | Idem |
| `/flow/calendario` | ✅ Sim | Idem |
| `/flow/conteudos` | ✅ Sim | Idem |
| `/flow/performance` | ✅ Sim | Idem |
| `/flow/relatorios` | ✅ Sim | Idem |
| `/flow/workflow` | ✅ Sim | Idem |
| `/flow/biblioteca` | ✅ Sim | Idem |
| `/flow/biblioteca/[clientSlug]` | ✅ Sim | Idem |
| `/flow/biblioteca/[clientSlug]/[subfolderSlug]` | ✅ Sim | Idem |
| `/flow/configuracoes` | ✅ Sim | Idem |
| `/login` | ⚠️ Inverso | Redireciona para `/flow` se já autenticado |
| `/` | ❌ Não | Pública — sem interceptação |
| `/blog/*` | ❌ Não | Pública |
| `/projetos/*` | ❌ Não | Pública |
| `/presenca-digital` | ❌ Não | Pública |
| `/bio` | ❌ Não | Pública |
| `/diagnostico` | ❌ Não | Pública |
| `/crm/*` | ❌ **Não** | **Fora do matcher — sem proteção via middleware** |
| `/studio/*` | ❌ **Não** | **Fora do matcher — sem proteção via middleware** |
| `/public/*` (estáticos) | ❌ **Não** | Servidos diretamente — sem qualquer proteção |

---

## 7.11 Validação de Sessão em Tempo de Execução

Além do middleware, a sessão é verificada em dois pontos na interface:

### FlowSidebar (display de usuário)

**Arquivo:** `components/flow/FlowSidebar.jsx` (linhas 44–48)

```js
useEffect(() => {
  supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
    setUser(session?.user ?? null)
  })
  return () => subscription.unsubscribe()
}, [])
```

- Chama `getUser()` no mount → exibe nome e e-mail do usuário na sidebar
- `onAuthStateChange` → atualiza o estado em tempo real (ex.: sessão expirada externamente)
- Quando `user` é `null`: exibe `'AD'` como iniciais e `'Admin'` como nome

### CrmApp (proteção SPA)

**Arquivo:** `crm/CrmApp.jsx` (linhas 24–32)

```js
supabase.auth.getSession().then(({ data: { session } }) => {
  setSession(session)
  setLoading(false)
})
supabase.auth.onAuthStateChange((_event, session) => {
  setSession(session)
})
```

- Usa `getSession()` (não `getUser()`) — lê sessão do localStorage sem validar com o servidor
- `ProtectedRoute` checa `session !== null` para renderizar ou redirecionar para `/crm/login`

**Diferença crítica:** `getUser()` valida o token com o servidor Supabase (seguro); `getSession()` lê do storage local sem verificação (pode aceitar token expirado).

---

## 7.12 Tipos de Usuário

**Status:** Usuário único — sem multi-tenant, sem papéis dinâmicos, sem permissões configuráveis no backend.

| Perfil | Acesso | Origem |
|---|---|---|
| Operador (Bruno Chaves) | Todas as rotas `/flow/*` | Cadastrado diretamente no Supabase Dashboard |
| Visitante | Rotas públicas (`/`, `/blog`, `/projetos`, `/presenca-digital`, `/bio`, `/diagnostico`) | Sem autenticação |

---

## 7.13 Papéis e Permissões

**Status:** ❌ **Não implementado no backend**

Em `app/flow/configuracoes/page.jsx` existe uma seção "Permissões" que exibe uma matriz estática Admin/Editor/Viewer, mas:
- É puramente visual — sem persistência em banco
- Sem lógica de enforcement no código
- Sem middleware ou guards por papel
- Sem `claims` customizados no JWT do Supabase

**No banco de dados:** RLS (Row Level Security) está **desabilitado** em todas as tabelas:
```sql
alter table clients    disable row level security;
alter table contents   disable row level security;
alter table approvals  disable row level security;
alter table library    disable row level security;
alter table subfolders disable row level security;
```

Qualquer portador da `anon_key` pode ler e escrever em todas as tabelas sem restrição.

---

## 7.14 Configuração de Equipe

**Arquivo:** `app/flow/configuracoes/page.jsx` — seção "Equipe"

- CRUD de membros de equipe armazenado em `localStorage` (`bbold_flow_team`)
- Dados seed hardcoded: `Ana Lima`, `Carlos Mendes`, `Juliana K.`, `Pedro Henrique`, `Lucas Freitas`
- **Sem relação com usuários do Supabase Auth**
- Nomes da equipe são usados como dropdown de "responsável" em `/flow/conteudos` e `/flow/aprovacoes` — mas esses dropdowns têm lista **hardcoded** no código dos módulos, não lida do localStorage

---

## 7.15 Convites

**Status:** ❌ **Não implementado**

Não existe sistema de convite de novos usuários. Novos operadores devem ser adicionados diretamente no Supabase Dashboard.

---

## 7.16 Redirecionamentos de Autenticação

| Situação | Comportamento |
|---|---|
| Acessa `/flow/*` sem sessão | Middleware → redireciona para `/login` |
| Acessa `/login` com sessão ativa | Middleware → redireciona para `/flow` |
| Login bem-sucedido via `/login` | `router.push('/flow')` + `router.refresh()` |
| Logout via FlowSidebar | `router.push('/login')` + `router.refresh()` |
| Logout via CRM | `navigate('/crm/login')` (React Router) |
| Acessa `/crm/*` sem sessão | Nenhum redirect do middleware; `ProtectedRoute` redireciona para `/crm/login` via React Router |
| Sessão expirada durante uso | `onAuthStateChange` no FlowSidebar atualiza `user = null`; próxima navegação para `/flow/*` → middleware redireciona para `/login` |

---

## 7.17 Tratamento de Sessão Expirada

**Middleware:** Valida o token a cada requisição para `/flow/*` usando `supabase.auth.getUser()`. Se expirado e sem refresh token válido → `user === null` → redireciona para `/login`.

**Browser (FlowSidebar):** `onAuthStateChange` escuta mudanças de estado. Se a sessão expirar enquanto o usuário está na página, `setUser(null)` é chamado — mas não há redirect automático sem uma nova navegação.

**Comportamento real de expiração:**
1. Sessão expira enquanto usuário está em `/flow/clientes`
2. `onAuthStateChange` → `user = null` no FlowSidebar (avatar vira "AD")
3. Próxima ação que aciona `router.push` ou navegação → middleware invalida → `/login`
4. Ou: usuário tenta chamar Supabase (ex.: criar cliente) → erro `401` do Supabase, sem tratamento de erro explícito nas páginas

---

## 7.18 Ações Administrativas

Não há interface administrativa separada. O único "admin" é o operador autenticado. Ações administrativas disponíveis:

| Ação | Local | Mecanismo |
|---|---|---|
| Criar/editar/excluir clientes | `/flow/clientes` | Supabase CRUD direto |
| Gerenciar conteúdos | `/flow/conteudos` | Supabase CRUD direto |
| Aprovar/reprovar materiais | `/flow/aprovacoes` | Supabase update |
| Gerar contratos PDF | `/flow/contratos` | jsPDF (sem persistência) |
| Gerenciar equipe | `/flow/configuracoes` | localStorage |
| Alterar tema/fonte | `/flow/configuracoes` | localStorage |
| Criar posts no blog | `/studio` | Sanity CMS |
| Gerenciar usuários | Supabase Dashboard (externo) | Fora do app |

---

## 7.19 Pontos Onde a Autenticação é Validada

| Ponto | Arquivo | Método | Tipo de Validação |
|---|---|---|---|
| Middleware (toda requisição `/flow/*`) | `middleware.ts` | `supabase.auth.getUser()` | Server-side, round-trip ao Supabase |
| FlowSidebar (mount e state change) | `components/flow/FlowSidebar.jsx` | `getUser()` + `onAuthStateChange` | Client-side, com verificação de servidor |
| CrmApp (mount e state change) | `crm/CrmApp.jsx` | `getSession()` + `onAuthStateChange` | Client-side, SEM verificação de servidor |
| Login page | `app/login/page.jsx` | `signInWithPassword()` | Server round-trip |

---

## 7.20 Possíveis Falhas

### 1. Sem tratamento de erro nas chamadas Supabase dos módulos `/flow`

As páginas do painel (ex.: `flow/clientes/page.jsx`) chamam o Supabase diretamente sem capturar erros de autenticação. Se o token expirar durante uma operação CRUD:
- O Supabase retorna erro `401`
- A maioria dos módulos não trata esse erro → a página pode travar ou exibir estado vazio silenciosamente

**Arquivo-exemplo:** `app/flow/clientes/page.jsx` — `supabase.from('clients').insert(...)` sem verificar `error.status === 401`

### 2. CRM usa `getSession()` em vez de `getUser()`

`getSession()` lê a sessão do localStorage sem validar com o servidor. Um token expirado ainda passa pela `ProtectedRoute` do CRM até o Supabase retornar erro na primeira chamada de dados.

### 3. `/crm` não está no matcher do middleware

Qualquer pessoa com a URL pode acessar a interface do CRM. A proteção depende exclusivamente do estado React (`session !== null`), que é inicializado de forma assíncrona — há uma janela de loading onde a proteção não está ativa.

### 4. `/studio` exposto publicamente

O Sanity Studio não está protegido pelo middleware. Qualquer pessoa pode acessar `/studio` e tentar usar o CMS. A proteção depende do auth interno do Sanity (configuração do projeto Sanity).

### 5. Sem CSRF Protection explícita

Não há tokens CSRF nas chamadas à API. O `anon_key` do Supabase está exposto no cliente (prefixo `NEXT_PUBLIC_`) — comportamento normal e esperado pelo Supabase, que usa RLS para proteger dados, mas o RLS está desabilitado.

### 6. Mensagem de erro genérica no login

`'E-mail ou senha incorretos.'` não distingue entre e-mail inexistente e senha errada. Adequado para segurança, mas impede autodiagnóstico pelo usuário.

---

## 7.21 Riscos de Acesso Indevido

| Risco | Severidade | Descrição |
|---|---|---|
| RLS desabilitado em todas as tabelas | 🔴 Alta | Qualquer usuário com a `anon_key` pode ler e escrever dados via Supabase REST API sem autenticação |
| `anon_key` exposta no cliente | 🟡 Média | `NEXT_PUBLIC_SUPABASE_ANON_KEY` visível no bundle JavaScript — esperado pelo Supabase, mas perigoso sem RLS |
| `/crm` sem proteção de middleware | 🟡 Média | Interface do CRM acessível sem middleware; proteção por estado React pode ser bypassada |
| `/studio` sem proteção de middleware | 🟡 Média | Sanity Studio acessível publicamente |
| HTML estáticos sem autenticação | 🟡 Média | `/public/servicos/`, `/public/conteudos/`, `/public/estrategia/` — arquivos internos acessíveis por URL |
| Biblioteca (sub-rotas) em localStorage | 🟢 Baixa | Dados perdidos ao trocar dispositivo/browser; sem backup em servidor |
| Sessão expira sem redirect automático | 🟢 Baixa | Usuário continua na tela mas próxima operação falha silenciosamente |

---

## 7.22 Inconsistências entre Frontend e Backend

| Inconsistência | Descrição |
|---|---|
| **RLS desabilitado** | O frontend assume proteção por autenticação, mas o banco aceita qualquer operação da `anon_key` sem verificar sessão |
| **Dois clientes Supabase** | `/login` usa cliente SSR (cookies); `/crm/login` usa cliente padrão (localStorage) — sessões não compartilhadas |
| **`getSession()` vs `getUser()`** | CRM usa `getSession()` (não valida com servidor); restante usa `getUser()` (validação real) |
| **Equipe no localStorage vs Auth** | Nomes de responsáveis em `configuracoes` (localStorage) não correspondem a usuários reais do Supabase |
| **Responsáveis hardcoded nos módulos** | `flow/conteudos` e `flow/aprovacoes` têm lista hardcoded de responsáveis (`Bruno`, `Ana Lima`, `Rafael Souza`, `Camila Rocha`) — diferente dos dados do `bbold_flow_team` no localStorage |
| **Sem tabela `contratos`** | Frontend gera PDFs, mas nenhum contrato é persistido no banco — inconsistência entre funcionalidade e modelo de dados |
| **Biblioteca raiz vs sub-rotas** | `/flow/biblioteca` usa Supabase (`library_files`); `/flow/biblioteca/[clientSlug]` e sub-rotas usam localStorage — mesma feature com storages diferentes |

---

## 7.23 Fluxo Completo: Login até Acesso ao Painel

```
PASSO 1 — Usuário acessa /login
────────────────────────────────────────────────────────────
Browser                          Next.js Middleware
  │                                      │
  │── GET /login ──────────────────────► │
  │                                      │
  │          middleware.ts intercepta:   │
  │          matcher: ['/login']         │
  │          createServerClient(url, key, cookies)
  │          supabase.auth.getUser()     │
  │          → user = null (sem sessão)  │
  │          pathname === '/login' && !user → NextResponse.next()
  │                                      │
  │◄─ HTML da página de login ──────────┤
  │                                      │

PASSO 2 — Usuário preenche e-mail + senha, clica "Entrar"
────────────────────────────────────────────────────────────
Browser (LoginPage)               Supabase Auth
  │                                      │
  │ supabase.auth.signInWithPassword     │
  │ ({ email, password }) ─────────────► │
  │                                      │
  │          Supabase valida credenciais │
  │          Gera JWT + refresh token    │
  │          Retorna session object      │
  │                                      │
  │◄─ { data: { session }, error: null } ┤
  │                                      │
  │ createBrowserClient define cookies:  │
  │ sb-[id]-auth-token = JWT             │
  │ sb-[id]-auth-token-refresh = ...     │

PASSO 3 — Credenciais erradas
────────────────────────────────────────────────────────────
  │◄─ { error: { message: 'Invalid...' } }
  │ setError('E-mail ou senha incorretos.')
  │ → Exibe mensagem de erro na tela
  │ → Permanece em /login

PASSO 4 — Sucesso: redirecionamento para /flow
────────────────────────────────────────────────────────────
  │ router.push('/flow')
  │ router.refresh()
  │── GET /flow ──────────────────────── ►│
  │                                       │
  │          middleware.ts intercepta:    │
  │          matcher: ['/flow/:path*']    │
  │          createServerClient lê cookies│
  │          supabase.auth.getUser()      │
  │          → user = { id, email, ... } │
  │          pathname.startsWith('/flow')  │
  │          user existe → NextResponse.next()
  │                                       │

PASSO 5 — FlowLayout renderiza
────────────────────────────────────────────────────────────
  │◄─ HTML do /flow ───────────────────── ┤
  │                                       │
  │ FlowLayout monta:                     │
  │ ├─ Carrega notifications do localStorage
  │ ├─ Aplica tema/fonte do localStorage  │
  │ ├─ Inicia supabase.channel('flow-notif')
  │ │   └─ Escuta INSERT/UPDATE em:       │
  │ │       contents, approvals, clients  │
  │ ├─ Renderiza FlowSidebar              │
  │ │   ├─ supabase.auth.getUser() → user
  │ │   ├─ Exibe nome e e-mail do usuário │
  │ │   ├─ onAuthStateChange() listener   │
  │ │   └─ Botão logout                  │
  │ └─ Renderiza {children} (/flow/page.jsx)

PASSO 6 — Dashboard /flow carrega dados
────────────────────────────────────────────────────────────
  │ Promise.all([
  │   supabase.from('contents').select(...),
  │   supabase.from('clients').select(...)
  │ ])
  │── Requests para Supabase ──────────► │
  │◄─ dados JSON ──────────────────────── ┤
  │                                       │
  │ Computa métricas, workflow, Kanban    │
  │ Renderiza dashboard completo          │

PASSO 7 — Sessão ativa durante uso
────────────────────────────────────────────────────────────
  │ Cada navegação para /flow/* →         │
  │ middleware verifica getUser() →       │
  │ token válido → NextResponse.next()   │
  │                                       │
  │ createBrowserClient renova refresh    │
  │ token automaticamente antes de expirar│

PASSO 8 — Logout
────────────────────────────────────────────────────────────
  │ Clique no botão logout (FlowSidebar) │
  │ supabase.auth.signOut() ────────────► │
  │          Revoga tokens no servidor   │
  │◄─ OK ──────────────────────────────── ┤
  │ Cookies de sessão removidos           │
  │ router.push('/login')                 │
  │ router.refresh()                      │
  │── GET /login ──────────────────────► │
  │          middleware: getUser() → null │
  │          pathname='/login' && !user → NextResponse.next()
  │◄─ HTML da página de login ──────────┤
```

---

## 7.24 Resumo das Limitações de Autenticação

1. **Usuário único, sem multi-tenant:** Adequado para o momento atual (operador solo), mas impossibilita onboarding de equipe sem refatoração.

2. **RLS desabilitado:** Principal risco de segurança — banco completamente aberto a qualquer portador da `anon_key`.

3. **Sem recuperação de senha:** Fluxo de reset não implementado — operador dependente do Supabase Dashboard.

4. **Dois sistemas de sessão paralelos:** `/flow` e `/crm` não compartilham sessão — usuário pode precisar de dois logins.

5. **CRM sem proteção de middleware:** A única proteção é client-side (React state), bypassável via manipulação de estado.

6. **Sem auditoria de ações:** Não há log de quem fez o quê (sem tabela de auditoria, sem event tracking por usuário).

7. **`/studio` e `/public/` expostos:** Documentos internos acessíveis por URL direta sem autenticação.

---

*Arquivos analisados: `middleware.ts` · `lib/supabase.js` · `crm/lib/supabase.js` · `app/login/page.jsx` · `crm/pages/Login.jsx` · `crm/CrmApp.jsx` · `crm/components/Layout.jsx` · `components/flow/FlowSidebar.jsx` · `app/flow/layout.jsx` · `app/flow/configuracoes/page.jsx` · `supabase-schema.sql`*
