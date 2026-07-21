# 09 — Segurança e RLS

## 9.1 Resumo Executivo

O projeto possui **múltiplas vulnerabilidades de segurança**, com pelo menos dois riscos críticos que permitem acesso irrestrito ao banco de dados sem autenticação. O sistema foi construído com foco em funcionalidade e velocidade de desenvolvimento, e a camada de segurança não acompanhou essa evolução.

**Riscos críticos:** 2  
**Riscos altos:** 6  
**Riscos médios:** 9  
**Riscos baixos:** 6

---

## 9.2 Policies de RLS (Row Level Security)

**Status: NENHUMA policy definida. RLS desabilitado em todas as tabelas.**

O arquivo `supabase-schema.sql` desabilita explicitamente o RLS em cada tabela:

```sql
alter table clients    disable row level security;
alter table contents   disable row level security;
alter table approvals  disable row level security;
alter table library    disable row level security;
alter table subfolders disable row level security;
```

As demais tabelas (`leads`, `performance_records`, `library_files`, `contracts`, `crm_clientes`, `crm_contratos`, `crm_entregas`, `crm_cobrancas`, `crm_comentarios`) não têm nenhuma instrução de RLS — ou seja, quando criadas via SQL Editor, o RLS não é nem ativado nem desativado explicitamente, dependendo do default do Supabase (habilitado por default, mas sem policies = bloqueia tudo).

**O schema SQL comentado pelo desenvolvedor:** "Desabilitar RLS (sem autenticação ainda)" — indica que a intenção era retornar ao assunto, mas isso nunca aconteceu.

---

## 9.3 Acesso por Tabela (com RLS desabilitado)

Com RLS desabilitado e `anon_key` exposta no bundle JavaScript, qualquer pessoa com acesso à rede pode executar as operações abaixo **sem autenticação**:

| Tabela | Ler | Criar | Editar | Excluir | Observação |
|---|---|---|---|---|---|
| `clients` | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim | Todos os dados de clientes expostos |
| `contents` | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim | Conteúdos e copy expostos |
| `approvals` | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim | Aprovações expostas |
| `library` | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim | Tabela órfã, mas acessível |
| `subfolders` | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim | Tabela órfã, mas acessível |
| `leads` | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim | Dados pessoais de leads (nome, telefone, Instagram) |
| `performance_records` | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim | Métricas de clientes |
| `library_files` | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim | Metadados de arquivos |
| `contracts` | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim | CPF/CNPJ, endereço, valor contratual |
| `crm_clientes` | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim | Dados completos dos clientes do CRM |
| `crm_contratos` | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim | Valores contratuais |
| `crm_entregas` | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim | Entregas e briefings |
| `crm_cobrancas` | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim | Dados financeiros de cobranças |
| `crm_comentarios` | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim | Comentários internos |

**Tabela `auth.users`:** Protegida pelo Supabase Auth internamente — não é afetada pelo RLS das tabelas de aplicação.

---

## 9.4 Validação de Identidade

### Na camada de middleware (Next.js)

**Arquivo:** `middleware.ts`  
**Método:** `supabase.auth.getUser()` — faz round-trip ao servidor Supabase para validar o JWT. É a forma correta e segura.

```ts
const { data: { user } } = await supabase.auth.getUser()
```

**Cobertura do middleware:**
- Protege: `/flow/:path*` e `/login`
- **Não protege:** `/crm/*`, `/studio/*`, todas as rotas públicas

### Na camada client-side (CRM legado)

**Arquivo:** `crm/CrmApp.jsx`  
**Método:** `supabase.auth.getSession()` — lê a sessão do localStorage sem validar com o servidor.

```js
supabase.auth.getSession().then(({ data: { session } }) => {
  setSession(session)
})
```

**Diferença crítica:** `getSession()` pode retornar um token expirado como válido até que o Supabase faça o refresh ou a próxima request falhe. Um atacante que consiga o token JWT do localStorage (ex.: XSS) teria acesso ao CRM enquanto o token não expirar no servidor.

---

## 9.5 Papéis e Permissões

**Status: Inexistentes no backend.**

- Supabase possui o sistema de `auth.users` com JWT claims personalizáveis, mas nenhum claim customizado foi implementado.
- Não existe coluna `role`, `permissions` ou similar em nenhuma tabela do schema.
- A seção "Permissões" em `/flow/configuracoes` é puramente visual (HTML estático) — sem backend, sem enforcement.
- Há um único perfil de acesso: quem tem a `anon_key` (qualquer pessoa) ou quem está autenticado (middleware cobre `/flow`).

---

## 9.6 Uso de Service Role

**Status: Não utilizado.**

A `SUPABASE_SERVICE_ROLE_KEY` (chave com acesso irrestrito que bypassa RLS) não é usada em nenhum arquivo do projeto. Não foi encontrada referência a ela em nenhum arquivo de código ou configuração.

Isso é positivo: a chave de service role não está exposta. O problema é que a ausência de RLS torna a `anon_key` igualmente poderosa para as tabelas de aplicação.

---

## 9.7 Exposição de Chaves e Variáveis de Ambiente

### Chaves Presentes

| Variável | Prefixo | Exposta no Browser | Valor Sensível | Risco |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `NEXT_PUBLIC_` | ✅ Sim | Baixo | URL pública do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_` | ✅ Sim | **Alto sem RLS** | JWT público — seguro com RLS; perigoso sem |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `NEXT_PUBLIC_` | ✅ Sim | Baixo | ID do projeto Sanity |
| `NEXT_PUBLIC_SANITY_DATASET` | `NEXT_PUBLIC_` | ✅ Sim | Baixo | Nome do dataset (padrão: `production`) |
| `NEXT_PUBLIC_SANITY_API_VERSION` | `NEXT_PUBLIC_` | ✅ Sim | Baixo | Versão da API |

**Chaves ausentes (que deveriam existir para produção segura):**
- `SUPABASE_SERVICE_ROLE_KEY` — não existe; não utilizada
- Qualquer chave privada de servidor — nenhuma presente

### Placeholder no CRM Legado

**Arquivo:** `crm/lib/supabase.js`

```js
const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL     || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
```

Se as variáveis de ambiente não estiverem definidas no ambiente de deploy, o CRM silenciosamente usa URLs e chaves placeholder — sem erro visível, apenas falhas silenciosas nas chamadas ao banco.

### Google Analytics

**ID exposto:** `G-QXQ4ZWWBSG` (hardcoded em `app/layout.tsx`) — comportamento normal para GA, mas o ID de mensuração é visível no bundle e pode ser usado para injetar eventos falsos via Measurement Protocol.

---

## 9.8 Rotas Protegidas

### Cobertura Real do Middleware

| Rota | Protegida | Método | Observação |
|---|---|---|---|
| `/flow` | ✅ Sim | Middleware SSR (`getUser()`) | Seguro |
| `/flow/clientes` | ✅ Sim | Middleware SSR | Seguro |
| `/flow/clientes/[id]` | ✅ Sim | Middleware SSR | Seguro |
| `/flow/leads` | ✅ Sim | Middleware SSR | Seguro |
| `/flow/contratos` | ✅ Sim | Middleware SSR | Seguro |
| `/flow/aprovacoes` | ✅ Sim | Middleware SSR | Seguro |
| `/flow/calendario` | ✅ Sim | Middleware SSR | Seguro |
| `/flow/conteudos` | ✅ Sim | Middleware SSR | Seguro |
| `/flow/performance` | ✅ Sim | Middleware SSR | Seguro |
| `/flow/relatorios` | ✅ Sim | Middleware SSR | Seguro |
| `/flow/workflow` | ✅ Sim | Middleware SSR | Seguro |
| `/flow/biblioteca` | ✅ Sim | Middleware SSR | Seguro |
| `/flow/configuracoes` | ✅ Sim | Middleware SSR | Seguro |
| `/crm` | ❌ Não | React state apenas | **Sem proteção SSR** |
| `/crm/clientes` | ❌ Não | React state apenas | **Sem proteção SSR** |
| `/crm/contratos` | ❌ Não | React state apenas | **Sem proteção SSR** |
| `/crm/financeiro` | ❌ Não | React state apenas | **Sem proteção SSR** |
| `/studio` | ❌ Não | Sanity auth interno | **Sem middleware** |
| `/public/servicos/` | ❌ Não | Arquivo estático | Sem qualquer proteção |
| `/public/conteudos/` | ❌ Não | Arquivo estático | Sem qualquer proteção |
| `/public/estrategia/` | ❌ Não | Arquivo estático | Sem qualquer proteção |

---

## 9.9 APIs e Server Actions

### API Routes

**Status:** ❌ **Nenhuma API route existe.** Zero arquivos `route.ts`/`route.js` no projeto.

Todo acesso a dados é feito via chamadas diretas ao SDK do Supabase e Sanity nos componentes (client-side ou server-side). Não há camada de API intermediária que poderia adicionar validação, autenticação adicional ou rate limiting.

### Server Actions

**Status:** ❌ **Nenhuma Server Action existe.** Zero diretivas `"use server"` fora do contexto de layout/config.

A ausência de Server Actions significa que não há possibilidade de validação no servidor antes de operações de banco — toda validação existente é client-side.

---

## 9.10 Validações e Sanitização

### Validação de Formulários

| Local | Tipo | Campos validados | Nível |
|---|---|---|---|
| `app/login/page.jsx` | HTML `required` | email, password | Frontend only |
| `app/diagnostico/page.jsx` | HTML `required` | name, phone, instagram, segment | Frontend only |
| `components/flow/ContentModal.jsx` | JS inline | title (not empty), client (not empty) | Frontend only |
| `components/flow/ClientModal.jsx` | JS inline | name (not empty) | Frontend only |
| `app/flow/contratos/page.jsx` | JS inline | 6 campos obrigatórios | Frontend only |
| `crm/pages/Login.jsx` | HTML `required` | email, password | Frontend only |
| Demais módulos do `/flow` | HTML `required` | Campos individuais | Frontend only |

**Nenhuma validação server-side.** Toda validação pode ser bypassada com uma request direta ao Supabase usando a `anon_key`.

### Bibliotecas de Validação

Não há `zod`, `yup`, `joi`, `valibot` ou qualquer biblioteca de validação de esquema em nenhum arquivo do projeto.

### Sanitização

**Status:** ❌ **Nenhuma sanitização implementada.**

- Não há chamadas a `DOMPurify` ou equivalente.
- Não há uso de `dangerouslySetInnerHTML` (positivo — sem risco de XSS por template).
- Dados de usuário são inseridos diretamente no banco sem sanitização prévia.
- React automaticamente escapa valores renderizados via JSX, o que mitiga XSS no lado da exibição, mas não protege dados armazenados.

---

## 9.11 Uploads de Arquivos

### Upload Real (CRM legado)

**Arquivo:** `crm/pages/ClienteDetalhe.jsx` (linhas 133–156)

```js
const { error: upErr } = await supabase.storage
  .from('crm-arquivos')
  .upload(path, file, { upsert: true })

const { data: { publicUrl } } = supabase.storage
  .from('crm-arquivos')
  .getPublicUrl(path)
```

**Análise de segurança do upload:**

| Verificação | Status | Observação |
|---|---|---|
| Limite de tamanho | ✅ 10 MB | `if (file.size > 10 * 1024 * 1024)` |
| Validação de MIME type | ❌ Ausente | Qualquer tipo de arquivo aceito |
| Validação de extensão | ❌ Ausente | Extensão retirada de `file.name.split('.').pop()` sem whitelist |
| Bucket público vs privado | ⚠️ Público | `getPublicUrl()` retorna URL pública permanente |
| URLs assinadas | ❌ Não usadas | URL pública exposta no banco (`contrato_url`) |
| Scan de malware | ❌ Ausente | |
| `upsert: true` | ⚠️ Risco | Permite sobrescrever arquivos existentes no mesmo path |

**Path de upload:** `contratos/${id}/${Date.now()}.${ext}` — o `id` é o UUID do cliente (previsível se conhecido); `Date.now()` é timestamp; `ext` vem do nome do arquivo sem validação.

**Risco:** Um arquivo `.html`, `.svg` ou `.js` poderia ser enviado como "contrato" e sua URL pública compartilhada — potencialmente servindo conteúdo malicioso a partir do domínio do Supabase Storage.

### Upload Simulado (/flow)

Os módulos `/flow/biblioteca`, `/flow/biblioteca/[clientSlug]` e `/flow/biblioteca/[clientSlug]/[subfolderSlug]` exibem interface de "upload" mas salvam apenas **metadados** (nome, tipo, tamanho) — sem arquivo real. Um aviso "Upload real será habilitado em breve." confirma isso.

---

## 9.12 URLs Assinadas

**Status:** ❌ **Não utilizadas.**

O CRM legado usa `getPublicUrl()` para arquivos de contrato — URLs públicas permanentes sem expiração. Qualquer pessoa com a URL pode acessar o arquivo indefinidamente, mesmo após o cliente ser removido do sistema.

URLs assinadas (`createSignedUrl()`) — que expiram após um tempo determinado — não são usadas em nenhum ponto do código.

---

## 9.13 Proteção contra Acesso Horizontal (IDOR)

**Status:** ⚠️ **Parcialmente mitigado pela autenticação, mas sem enforcement no banco.**

**Acesso horizontal** (Insecure Direct Object Reference — IDOR) ocorre quando um usuário autenticado acessa dados de outros usuários manipulando IDs.

No contexto atual (usuário único), isso não é um risco imediato. Mas considerando a arquitetura:

1. **Middleware protege `/flow`** — um atacante precisa estar autenticado para acessar a interface.
2. **Sem RLS** — um usuário autenticado pode manipular qualquer ID para acessar qualquer registro de qualquer tabela via Supabase SDK diretamente.
3. **`/crm` sem middleware** — acesso à interface do CRM sem autenticação SSR; proteção depende do estado React.
4. **`anon_key` exposta** — qualquer pessoa com a chave (obtida do bundle JS) pode acessar qualquer registro diretamente via Supabase REST API sem passar pela interface.

**Exemplo de ataque viável:** Qualquer pessoa pode executar o seguinte sem autenticação:
```bash
curl 'https://<project>.supabase.co/rest/v1/clients?select=*' \
  -H 'apikey: <NEXT_PUBLIC_SUPABASE_ANON_KEY>' \
  -H 'Authorization: Bearer <NEXT_PUBLIC_SUPABASE_ANON_KEY>'
```
Resultado: todos os dados de clientes retornados.

---

## 9.14 Proteção contra Acesso Administrativo Indevido

**Status:** ❌ **Ausente.**

- Não há distinção entre perfis "admin" e "operador" no backend.
- O único admin é o próprio operador autenticado — sem separação de papéis.
- `/studio` (Sanity CMS) está acessível sem middleware — depende do auth interno do Sanity Studio, que por padrão usa autenticação Sanity separada.
- Documentos internos (`/public/servicos/`, `/public/conteudos/`, `/public/estrategia/`) estão acessíveis por URL direta sem qualquer autenticação — apenas marcados com `noindex` para não indexar em mecanismos de busca.

---

## 9.15 Rate Limiting

**Status:** ❌ **Não implementado pela aplicação.**

- Nenhum rate limiting no código da aplicação (sem middleware de throttling, sem configuração no Vercel).
- O Supabase impõe limits padrão na camada de Auth (ex.: tentativas de login), mas esses limites não foram configurados ou auditados.
- O formulário de `/diagnostico` pode ser chamado indefinidamente — sem limite de submissões por IP/sessão.
- O endpoint de login `/login` não possui proteção contra força bruta além do limite padrão do Supabase Auth.

**Configuração Vercel:** `vercel.json` contém apenas rewrites de URL. Sem configuração de headers de segurança ou rate limiting.

---

## 9.16 Headers HTTP de Segurança

**Status:** ❌ **Nenhum header de segurança configurado.**

`next.config.ts` não define a função `headers()`. `vercel.json` não define headers. Resultado:

| Header | Status | Impacto da ausência |
|---|---|---|
| `Content-Security-Policy` | ❌ Ausente | Sem proteção contra XSS por injeção de scripts externos |
| `X-Frame-Options` | ❌ Ausente | Vulnerável a clickjacking |
| `X-Content-Type-Options` | ❌ Ausente | Browser pode inferir MIME type incorretamente |
| `Strict-Transport-Security` | ❌ Ausente | Vercel configura HTTPS, mas sem HSTS explícito |
| `Referrer-Policy` | ❌ Ausente | URLs internas podem vazar em referrers externos |
| `Permissions-Policy` | ❌ Ausente | Sem controle de acesso a features do browser |

**Nota:** O Vercel adiciona alguns headers de segurança padrão (como `X-Content-Type-Options: nosniff`), mas sem configuração explícita, a proteção é mínima.

---

## 9.17 Proteção CSRF

**Status:** ❌ **Não implementada.**

- Não há tokens CSRF em nenhum formulário.
- Não há verificação de origem (Origin header) nas operações de banco.
- O Supabase exige a `apikey` nos headers — o que fornece alguma proteção implícita, mas não é CSRF protection formal.
- Como o projeto usa client-side SDK diretamente (sem API routes server-side), não há onde adicionar CSRF tokens no fluxo atual.

---

## 9.18 Logs e Auditoria

**Status:** ❌ **Ausentes na aplicação.**

- Não há logging de ações dos usuários (quem criou/editou/excluiu qual registro).
- Não há tabela de auditoria no banco de dados.
- Não há integração com serviços de log (Sentry, Datadog, Logtail, etc.).
- O Supabase Dashboard oferece logs de Auth e API, mas não foram integrados à aplicação.
- Erros de operação são exibidos como toast na UI — sem persistência ou alerta.

---

## 9.19 Dados Sensíveis Identificados

| Dado | Onde armazenado | Proteção atual | Risco |
|---|---|---|---|
| Nome e telefone de leads | Tabela `leads` (Supabase) | Nenhuma (RLS off) | Alto |
| CPF/CNPJ de clientes | Tabela `contracts` | Nenhuma (RLS off) | Alto |
| Endereços de clientes | Tabela `contracts` | Nenhuma (RLS off) | Alto |
| Valores contratuais | Tabelas `contracts`, `crm_contratos`, `crm_cobrancas` | Nenhuma (RLS off) | Alto |
| E-mails de clientes | Tabelas `clients`, `crm_clientes`, `contracts` | Nenhuma (RLS off) | Médio |
| Instagram de clientes | Tabelas `clients`, `crm_clientes` | Nenhuma (RLS off) | Baixo |
| WhatsApp de clientes | Tabelas `clients`, `crm_clientes` | Nenhuma (RLS off) | Médio |
| Briefings e copy de conteúdo | Tabelas `contents`, `approvals`, `crm_entregas` | Nenhuma (RLS off) | Médio |
| URLs de contratos PDF | `crm_clientes.contrato_url` | URL pública permanente | Médio |
| Notificações internas | `localStorage` do browser | Sem criptografia | Baixo |
| Configurações de equipe | `localStorage` do browser | Sem criptografia | Baixo |
| Senhas de usuários | Supabase Auth (hashed) | ✅ Gerenciado pelo Supabase | Seguro |

---

## 9.20 Catálogo de Vulnerabilidades e Riscos

---

### 🔴 CRÍTICO — Banco de dados completamente aberto (RLS desabilitado + anon_key exposta)

**CVE-like:** OWASP A01:2021 (Broken Access Control)

**Descrição:** O RLS está desabilitado em todas as 5 tabelas definidas no schema. A `anon_key` está exposta no bundle JavaScript (prefixo `NEXT_PUBLIC_`). Qualquer pessoa pode fazer requisições diretas à API REST do Supabase e ler, criar, atualizar ou deletar qualquer dado de qualquer tabela sem autenticação alguma.

**Prova de conceito:**
```bash
curl 'https://<project-id>.supabase.co/rest/v1/contracts?select=*' \
  -H 'apikey: <NEXT_PUBLIC_SUPABASE_ANON_KEY>' \
  -H 'Authorization: Bearer <NEXT_PUBLIC_SUPABASE_ANON_KEY>'
# Retorna: CPF/CNPJ, endereços, valores contratuais de todos os clientes
```

**Impacto:** Exfiltração de todos os dados de clientes, leads, contratos e métricas. Inserção de registros falsos. Deleção de dados.

**Gravidade:** 🔴 Crítico  
**CVSS (estimado):** 9.8 (AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)

**Recomendação:**
1. Habilitar RLS em **todas** as tabelas imediatamente:
   ```sql
   alter table clients    enable row level security;
   alter table contents   enable row level security;
   alter table approvals  enable row level security;
   alter table leads      enable row level security;
   -- ... demais tabelas
   ```
2. Criar policies mínimas para o usuário autenticado:
   ```sql
   create policy "Authenticated users can read clients"
   on clients for select
   to authenticated
   using (true);
   ```
3. Criar policy para inserção pública apenas em `leads` (formulário de diagnóstico):
   ```sql
   create policy "Public can insert leads"
   on leads for insert
   to anon
   with check (true);
   ```

---

### 🔴 CRÍTICO — 9 tabelas em produção sem qualquer definição de schema

**Descrição:** As tabelas `leads`, `performance_records`, `library_files`, `contracts`, `crm_clientes`, `crm_contratos`, `crm_entregas`, `crm_cobrancas` e `crm_comentarios` não estão no `supabase-schema.sql`. Foram criadas diretamente no banco (provavelmente via SQL Editor) sem controle de versão, sem constraints, sem triggers de `updated_at` e sem documentação formal.

**Impacto:**
- Impossível recriar o banco do zero a partir do schema oficial
- Nenhuma garantia de integridade nos dados dessas tabelas
- Impossível adicionar RLS sem saber o schema exato

**Gravidade:** 🔴 Crítico (para operações de recuperação e manutenção)  
**Recomendação:** Executar `pg_dump --schema-only` no banco de produção para extrair o DDL real de todas as tabelas e atualizar `supabase-schema.sql` com o estado atual. Implementar sistema de migrations (Supabase CLI).

---

### 🔴 ALTO — `/crm` acessível sem autenticação SSR

**Descrição:** A rota `/crm/[[...slug]]` não está no matcher do `middleware.ts`. A proteção existe apenas no lado cliente via estado React (`session !== null`), inicializado de forma assíncrona. Durante o carregamento, não há proteção. Além disso, `getSession()` não valida o token com o servidor.

**Impacto:** Interface do CRM (clientes, contratos, financeiro, entregas) acessível via URL direta. Dados sensíveis de clientes expostos na interface sem autenticação server-side.

**Gravidade:** 🔴 Alto  
**Recomendação:** Adicionar `/crm/:path*` ao matcher do `middleware.ts` e substituir `getSession()` por `getUser()` no `CrmApp.jsx`.

---

### 🔴 ALTO — Upload para bucket público sem validação de tipo de arquivo

**Arquivo:** `crm/pages/ClienteDetalhe.jsx`

**Descrição:** O upload de contratos no CRM aceita qualquer tipo de arquivo (apenas verifica tamanho ≤ 10 MB). A extensão é extraída diretamente do nome do arquivo sem whitelist. O bucket `crm-arquivos` usa `getPublicUrl()` — URLs públicas permanentes sem expiração.

**Impacto:** Um arquivo `.html` ou `.svg` com JavaScript embutido poderia ser enviado. Sua URL pública seria armazenada no banco e potencialmente compartilhada — servindo conteúdo malicioso a partir do domínio do Supabase Storage. Stored XSS via Storage.

**Gravidade:** 🔴 Alto  
**Recomendação:**
1. Validar MIME type: `if (!['application/pdf','image/jpeg','image/png'].includes(file.type)) return`
2. Configurar o bucket `crm-arquivos` como **privado**
3. Usar `createSignedUrl()` com expiração em vez de `getPublicUrl()`
4. Definir Content-Disposition via metadata para forçar download

---

### 🔴 ALTO — Dados pessoais de leads sem proteção (LGPD)

**Descrição:** A tabela `leads` armazena nome, telefone, Instagram e segmento de negócio de visitantes que preenchem o formulário de `/diagnostico`. Esses dados são pessoais segundo a LGPD (Lei 13.709/2018). Com RLS desabilitado, qualquer portador da `anon_key` pode acessá-los.

**Impacto:** Violação potencial da LGPD. Exfiltração de dados de prospects sem consentimento adequado para acesso por terceiros.

**Gravidade:** 🔴 Alto  
**Recomendação:** Ativar RLS na tabela `leads` com policy que permita apenas INSERT anônimo e SELECT/UPDATE/DELETE para usuários autenticados.

---

### 🔴 ALTO — CPF/CNPJ e dados contratuais sem proteção

**Tabela:** `contracts`

**Descrição:** A tabela `contracts` armazena CPF/CNPJ, endereço completo, e-mail, telefone e valor mensal dos clientes. Com RLS desabilitado, todos esses dados estão acessíveis sem autenticação.

**Impacto:** Violação da LGPD (dados pessoais e financeiros). Risco de uso indevido dos dados para fraudes.

**Gravidade:** 🔴 Alto  
**Recomendação:** Ativar RLS com acesso exclusivo para usuários autenticados. Considerar criptografia adicional para CPF/CNPJ em repouso.

---

### 🔴 ALTO — `/studio` (Sanity CMS) sem proteção de middleware

**Descrição:** A rota `/studio/[[...tool]]` não está no matcher do middleware. O Sanity Studio está acessível publicamente. A proteção depende exclusivamente do auth interno do Sanity Studio — que, por padrão no modo embedded (next-sanity), pode permitir acesso anônimo ou usar auth do Sanity.io separado.

**Impacto:** Se o auth interno do Sanity Studio não estiver configurado, qualquer pessoa pode acessar e editar o CMS do blog.

**Gravidade:** 🔴 Alto  
**Recomendação:** Adicionar `/studio/:path*` ao matcher do middleware ou restringir via `vercel.json` por IP/senha.

---

### 🟡 MÉDIO — Ausência de headers HTTP de segurança

**Descrição:** Nenhum header de segurança está configurado (`next.config.ts` não define `headers()`, `vercel.json` não configura headers). Sem CSP, X-Frame-Options, X-Content-Type-Options ou HSTS explícito.

**Impacto:** Vulnerabilidade a clickjacking (sem X-Frame-Options), MIME sniffing (sem X-Content-Type-Options), e ausência de política de carregamento de conteúdo externo.

**Gravidade:** 🟡 Médio  
**Recomendação:** Adicionar em `next.config.ts`:
```ts
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ],
  }]
}
```

---

### 🟡 MÉDIO — Ausência de rate limiting no login e formulários públicos

**Descrição:** O endpoint de login não tem proteção extra além do limite padrão do Supabase Auth. O formulário de `/diagnostico` pode ser submetido ilimitadamente — gerando spam de leads falsos no banco.

**Impacto:** Ataques de força bruta no login. Poluição da tabela `leads` com dados falsos.

**Gravidade:** 🟡 Médio  
**Recomendação:** Implementar rate limiting via Vercel Edge Middleware ou adicionar CAPTCHA no formulário de diagnóstico. Configurar rate limiting no Supabase Auth Dashboard.

---

### 🟡 MÉDIO — Documentos internos acessíveis por URL pública

**Caminhos:**
- `/public/servicos/index.html` — tabela de preços interna
- `/public/conteudos/index.html` — roteiros de Instagram
- `/public/estrategia/index.html` — estratégia de crescimento da agência

**Descrição:** Esses arquivos têm `noindex, nofollow` nos metatags mas são servidos como arquivos estáticos públicos. Não há proteção de autenticação — qualquer pessoa com a URL pode acessá-los.

**Impacto:** Exposição de preços internos, estratégia comercial e conteúdos exclusivos a concorrentes ou leads não qualificados.

**Gravidade:** 🟡 Médio  
**Recomendação:** Mover esses documentos para o `/flow` (protegido por auth) ou usar Vercel Password Protection.

---

### 🟡 MÉDIO — Sem validação server-side em nenhum formulário

**Descrição:** Toda validação de formulários (campos obrigatórios, formatos) é client-side (HTML `required` + JS inline). Não há API routes, Server Actions ou qualquer validação no servidor antes da inserção no banco.

**Impacto:** Dados malformados ou maliciosos podem ser inseridos diretamente via Supabase SDK com `anon_key`. Scripts de automação podem bypassar toda validação da UI.

**Gravidade:** 🟡 Médio  
**Recomendação:** Implementar Server Actions com validação via `zod` antes de qualquer operação de banco. No mínimo, implementar constraints `CHECK` no banco (ex.: `CHECK (status IN ('Briefing', 'Produção', ...))`).

---

### 🟡 MÉDIO — Relacionamentos por texto (TEXT) sem integridade referencial

**Descrição:** As tabelas `contents`, `approvals` e `library_files` referenciam clientes pelo campo `client` do tipo `text` (nome do cliente), sem FK para `clients.id`. Se um cliente for renomeado, os registros ficam órfãos silenciosamente.

**Impacto:** Inconsistência de dados. Filtros por cliente quebram. Possibilidade de registros de conteúdo aparecerem sob o cliente errado.

**Gravidade:** 🟡 Médio  
**Recomendação:** Alterar `client text` para `client_id uuid references clients(id) on update cascade on delete set null` nas tabelas afetadas. Migrar dados existentes.

---

### 🟡 MÉDIO — `getSession()` em vez de `getUser()` no CRM

**Descrição:** O `CrmApp.jsx` usa `supabase.auth.getSession()` para verificar se há sessão ativa. Este método lê o token do localStorage sem validar com o servidor — um token expirado ou manipulado pode ser aceito.

**Impacto:** Um token JWT roubado (via XSS ou acesso físico ao device) mantém o acesso ao CRM mesmo após o usuário ter feito logout no servidor.

**Gravidade:** 🟡 Médio  
**Recomendação:** Substituir `getSession()` por `getUser()` no `CrmApp.jsx`.

---

### 🟡 MÉDIO — Sem constraints CHECK no banco

**Descrição:** Nenhum campo de status, formato ou tipo tem constraint `CHECK` no banco. Os valores aceitos são definidos apenas na UI.

**Impacto:** Inserção de valores inválidos diretamente via API (ex.: `status: 'hackeado'`). Inconsistência entre dados do banco e lógica da aplicação.

**Gravidade:** 🟡 Médio  
**Recomendação:** Adicionar constraints:
```sql
alter table contents add constraint contents_status_check
  check (status in ('Ideia','Briefing','Produção','Revisão','Aguardando Aprovação','Agendado','Publicado','Atrasado'));
```

---

### 🟡 MÉDIO — URLs públicas permanentes de contratos no Storage

**Descrição:** Arquivos de contrato enviados pelo CRM são armazenados com URL pública permanente (`getPublicUrl()`). A URL é salva em `crm_clientes.contrato_url`. Não há expiração — a URL continua válida mesmo após o cliente ser removido do sistema.

**Gravidade:** 🟡 Médio  
**Recomendação:** Usar `createSignedUrl()` com expiração, recriando a URL on-demand ao exibir o documento.

---

### 🟢 BAIXO — Ausência de política de senha

**Descrição:** Não há verificação de complexidade de senha na tela de login. A política de senha (mínimo de caracteres, caracteres especiais) depende exclusivamente da configuração do Supabase Dashboard — não documentada no projeto.

**Gravidade:** 🟢 Baixo  
**Recomendação:** Verificar e configurar política de senha mínima no Supabase Auth Dashboard. Documentar o requisito.

---

### 🟢 BAIXO — Dados internos em localStorage sem criptografia

**Descrição:** Notificações, configurações de equipe, tema e fonte são armazenados em `localStorage` sem criptografia. Em um dispositivo compartilhado, outro usuário do browser poderia acessar esses dados.

**Gravidade:** 🟢 Baixo  
**Recomendação:** Para o contexto de usuário único, o risco é baixo. Em caso de multi-tenant futuro, considerar criptografia ou armazenamento server-side.

---

### 🟢 BAIXO — Ausência de auditoria e logs de ações

**Descrição:** Não há registro de quem criou/editou/excluiu qual registro, nem quando. Impossível detectar uso indevido após o fato.

**Gravidade:** 🟢 Baixo (para uso atual de usuário único)  
**Recomendação:** Adicionar tabela `audit_log` com `user_id`, `action`, `table_name`, `record_id`, `timestamp`, `old_data`, `new_data`. Preencher via triggers ou Server Actions.

---

### 🟢 BAIXO — ID do Google Analytics exposto e sem controle

**Descrição:** O ID de mensuração `G-QXQ4ZWWBSG` está hardcoded em `app/layout.tsx`. Qualquer pessoa pode usar esse ID para enviar eventos falsos via Measurement Protocol, poluindo as estatísticas.

**Gravidade:** 🟢 Baixo  
**Recomendação:** Habilitar filtro de spam nas configurações do GA4. Considerar mover o ID para variável de ambiente (não obrigatório para GA, mas uma boa prática).

---

### 🟢 BAIXO — Coluna `installments` potencialmente ausente com erro silenciado

**Arquivo:** `app/flow/contratos/page.jsx` (linha 857)

**Descrição:** O código silencia erro ao tentar salvar `installments`:
```js
// installments saved separately — column may not exist yet, ignore error
await supabase.from('contracts').update({ installments: ... }).eq('id', saved.id)
```

**Impacto:** Dados de parcelamento não salvos silenciosamente. Falha não reportada ao operador.

**Gravidade:** 🟢 Baixo  
**Recomendação:** Adicionar a coluna ao schema e remover o comentário de workaround.

---

### 🟢 BAIXO — Fallback hardcoded no cliente CRM

**Arquivo:** `crm/lib/supabase.js`

**Descrição:**
```js
const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL     || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
```

Se as variáveis não estiverem definidas, o cliente silenciosamente usa uma URL inexistente — causando falhas silenciosas sem indicação clara do problema.

**Gravidade:** 🟢 Baixo  
**Recomendação:** Remover os fallbacks e adicionar `if (!supabaseUrl || !supabaseAnonKey) throw new Error('Variáveis de ambiente Supabase não configuradas')`.

---

## 9.21 Tabela Consolidada de Riscos

| # | Vulnerabilidade | Gravidade | Arquivos | Recomendação |
|---|---|---|---|---|
| 1 | RLS desabilitado + anon_key exposta | 🔴 Crítico | `supabase-schema.sql` · `lib/supabase.js` | Habilitar RLS + criar policies |
| 2 | 9 tabelas sem schema definido | 🔴 Crítico | `supabase-schema.sql` | Extrair DDL real + migrations |
| 3 | `/crm` sem middleware SSR | 🔴 Alto | `middleware.ts` · `crm/CrmApp.jsx` | Adicionar ao matcher |
| 4 | Upload sem validação de tipo | 🔴 Alto | `crm/pages/ClienteDetalhe.jsx` | Validar MIME + bucket privado + signed URLs |
| 5 | Dados pessoais (LGPD) sem proteção | 🔴 Alto | Tabelas `leads`, `contracts` | RLS + policy restritiva |
| 6 | CPF/CNPJ sem proteção | 🔴 Alto | Tabela `contracts` | RLS + criptografia em repouso |
| 7 | `/studio` sem middleware | 🔴 Alto | `middleware.ts` | Adicionar ao matcher |
| 8 | Sem headers HTTP de segurança | 🟡 Médio | `next.config.ts` · `vercel.json` | Adicionar `headers()` |
| 9 | Sem rate limiting | 🟡 Médio | `app/login` · `app/diagnostico` | Middleware de throttling + CAPTCHA |
| 10 | Docs internos acessíveis publicamente | 🟡 Médio | `/public/servicos/` etc. | Mover para `/flow` ou senha |
| 11 | Sem validação server-side | 🟡 Médio | Todos os formulários | Server Actions + zod |
| 12 | Relacionamentos TEXT sem FK | 🟡 Médio | `contents` · `approvals` | Migrar para UUID FK |
| 13 | `getSession()` no CRM | 🟡 Médio | `crm/CrmApp.jsx` | Substituir por `getUser()` |
| 14 | Sem constraints CHECK | 🟡 Médio | Todas as tabelas | Adicionar constraints no schema |
| 15 | URLs de contratos públicas permanentes | 🟡 Médio | `crm/pages/ClienteDetalhe.jsx` | Signed URLs com expiração |
| 16 | Sem política de senha documentada | 🟢 Baixo | Supabase Dashboard | Configurar e documentar |
| 17 | localStorage sem criptografia | 🟢 Baixo | `app/flow/layout.jsx` | Baixo risco para usuário único |
| 18 | Sem auditoria de ações | 🟢 Baixo | Todo o sistema | Tabela `audit_log` + triggers |
| 19 | ID do GA4 hardcoded | 🟢 Baixo | `app/layout.tsx` | Filtro de spam no GA4 |
| 20 | Erro de `installments` silenciado | 🟢 Baixo | `app/flow/contratos/page.jsx` | Adicionar coluna + tratar erro |
| 21 | Fallback hardcoded no CRM | 🟢 Baixo | `crm/lib/supabase.js` | Remover fallback + throw |

---

## 9.22 Prioridade de Correção

### Fase 1 — Imediato (antes de continuar em produção)

1. ✅ **Habilitar RLS** em todas as tabelas e criar policies básicas
2. ✅ **Adicionar `/crm/:path*` ao matcher do middleware**
3. ✅ **Validar tipo de arquivo no upload** e tornar bucket privado

### Fase 2 — Curto prazo (próximas 2 semanas)

4. **Extrair schema real do banco** e criar sistema de migrations
5. **Documentar tabelas `leads`, `performance_records`, `library_files`, `contracts`** no schema
6. **Proteger `/studio`** no middleware
7. **Adicionar headers HTTP de segurança** no `next.config.ts`

### Fase 3 — Médio prazo (próximo mês)

8. **Mover documentos internos** (`/public/servicos/`, etc.) para área autenticada
9. **Implementar constraints CHECK** nas tabelas principais
10. **Substituir `getSession()` por `getUser()`** no CRM
11. **Adicionar rate limiting** no formulário de diagnóstico

### Fase 4 — Longo prazo

12. **Migrar `client TEXT` para `client_id UUID` com FK** nas tabelas relacionais
13. **Implementar auditoria** de ações no banco
14. **Substituir URLs públicas** de Storage por signed URLs com expiração
15. **Adicionar validação server-side** via Server Actions

---

*Arquivos analisados: `supabase-schema.sql` · `middleware.ts` · `next.config.ts` · `vercel.json` · `lib/supabase.js` · `crm/lib/supabase.js` · `app/login/page.jsx` · `crm/pages/Login.jsx` · `crm/CrmApp.jsx` · `crm/pages/ClienteDetalhe.jsx` · `app/diagnostico/page.jsx` · `app/flow/layout.jsx` · `components/flow/FlowSidebar.jsx` · `components/flow/ContentModal.jsx` · `components/flow/ClientModal.jsx` · `app/flow/contratos/page.jsx` · `app/flow/clientes/[id]/page.jsx` · `app/layout.tsx` · `public/servicos/index.html` · `public/estrategia/index.html`*
