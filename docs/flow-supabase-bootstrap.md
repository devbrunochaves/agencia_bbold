# BBOLD Flow — como conectar um Supabase novo

Nenhum destes passos foi executado nesta sessão — nunca houve acesso ao
projeto Supabase real do `agencia-bbold` (ver `supabase/README.md`). Este é
o procedimento para quando alguém com acesso ao projeto real (ou a um
projeto novo) for ligar o Flow a um banco de verdade.

## 1. Variáveis de ambiente

No `.env.local` (nunca commitado) ou nas env vars da Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # server-only — nunca prefixo NEXT_PUBLIC_
```

A `SUPABASE_SERVICE_ROLE_KEY` só é lida por `lib/supabase/admin.ts`
(instanciação preguiçosa, nunca no carregamento do módulo) e usada
exclusivamente por `modules/identity/infrastructure/auth-invite.ts` para o
convite por e-mail via Supabase Auth. Sem ela, convites continuam
funcionando (criam a membership `invited` normalmente) mas o e-mail não é
enviado — reportado honestamente pela UI, nunca fingido.

## 2. Ordem de aplicação das migrations

Ver `supabase/README.md` para a lista completa e comentada. Resumo da ordem
(por timestamp do nome do arquivo, `supabase db push` já respeita isso):

```
20260814120000_identity_foundation.sql
20260814120100_identity_rls.sql
20260814120200_identity_seed_permissions.sql
20260814130000_clients_and_services.sql
20260814140000_tasks.sql
20260814150000_finance.sql
20260814160000_contracts.sql
20260814170000_access_control.sql
20260817000000_audit_hardening.sql
```

Cada uma foi auditada na fase 9 para simular aplicação sequencial contra um
banco vazio — nenhuma referência antecipada a tabela/função/coluna
encontrada. Aplique com `supabase db push` (projeto já linkado via
`supabase link --project-ref <ref>`) ou colando cada arquivo em ordem no SQL
Editor do dashboard.

## 3. Seed (apenas ambiente de desenvolvimento)

`supabase/seed.sql` — **nunca rodar em produção**. Cria a organização BBOLD
de exemplo, catálogo de serviços, clientes/demandas/financeiro demo, e dados
jurídicos **placeholder** da BBOLD (CNPJ/endereço fake, claramente marcados
como tal no próprio arquivo e no README). Substitua esses dados pelos reais
antes de gerar qualquer contrato de verdade — a fase 9 adicionou um bloqueio
em `createContract()` que impede criar contrato se algum desses campos
estiver vazio, mas não detecta um CNPJ placeholder tecnicamente preenchido,
então essa substituição continua sendo responsabilidade manual.

## 4. Criar o primeiro usuário e fazer o bootstrap do Owner

RLS está ativa em toda tabela de negócio desde a primeira migration — isso
inclui `memberships`, então não existe um jeito de criar a primeira
membership Owner *através da aplicação* (ela exigiria já ter uma membership
com `members.manage` para passar pela RLS). O bootstrap inicial precisa ser
feito com privilégio elevado, uma única vez, fora do fluxo normal do app:

1. **`auth.users`** — crie o usuário via Supabase Dashboard (Authentication →
   Add user) ou API Admin. Isso já dispara o trigger `handle_new_auth_user()`
   (migration 1), que cria a linha correspondente em `public.users`
   automaticamente — não crie essa linha manualmente.
2. **`organization`** — se ainda não existir (o seed já cria a organização
   BBOLD de exemplo com um UUID fixo), insira via SQL Editor com a
   `service_role` (ou como superusuário do projeto, que ignora RLS):
   ```sql
   insert into public.organizations (id, name, slug)
   values ('<uuid>', 'BBOLD', 'bbold');
   ```
3. **Role Owner** — já existe como role de sistema (`organization_id is
   null`, `key = 'owner'`), criada pela migration de seed de permissões.
   Não crie uma nova.
4. **Membership** — a única linha que precisa ser inserida manualmente,
   também via SQL Editor/service role (contornando a RLS deliberadamente,
   só nesta vez):
   ```sql
   insert into public.memberships (organization_id, user_id, role_id, status, client_access_mode)
   select '<organization-id>', '<auth-user-id>', r.id, 'active', 'all'
   from public.roles r where r.key = 'owner' and r.organization_id is null;
   ```
   (`supabase/seed.sql` já traz esse exato comando como exemplo comentado.)

A partir daqui, esse usuário loga normalmente e — sendo Owner — tem acesso
a `/flow/acessos` para convidar o resto da equipe pela UI, sem precisar de
mais nenhum bootstrap manual.

## 5. Verificação de RLS pós-bootstrap

Depois do bootstrap, rode pelo menos:
- `select * from public.clients;` autenticado como o novo Owner → deve
  retornar vazio (organização nova) sem erro de permissão.
- Os cenários documentados em `supabase/tests/access_rls.sql`,
  `clients_rls.sql`, `tasks_rls.sql`, `finance_rls.sql`, `contracts_rls.sql`
  — todos escritos para rodar via impersonation (`set local
  request.jwt.claim.sub`), nenhum executado ainda contra um banco real.

## 6. Tipos gerados do Supabase

Ainda não adotado — os `domain/types.ts` de cada módulo continuam sendo a
fonte da aplicação, escritos à mão para casar com as migrations. Uma vez que
o banco real existir e estiver estável, avaliar `supabase gen types
typescript` como um passo de CI (não obrigatório para a V1 funcionar).
