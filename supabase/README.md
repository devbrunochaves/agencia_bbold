# BBOLD Flow — banco de dados

Migrations versionadas em `supabase/migrations/`, aplicadas em ordem pelo nome
(timestamp prefix). Nenhuma alteração deve ser feita manualmente no painel do
Supabase fora desse fluxo.

## Aplicar as migrations

Esta sessão não tem acesso ao projeto Supabase de produção do
`agencia-bbold` (as credenciais/URL só existem como env var na Vercel). Reconfirmado
na fase 3: `mcp__Supabase__list_projects` só enxerga dois projetos da conta —
`css-marketing-hub` (INACTIVE) e `Gabriel Reparo` (ACTIVE, projeto de outro
cliente) — nenhum dos dois é o `agencia-bbold`, então nenhuma migration foi
aplicada a nenhum deles. As migrations abaixo foram escritas e versionadas,
mas **ainda não foram aplicadas** ao banco remoto correto. Para aplicar:

```bash
# via Supabase CLI, com o projeto já linkado
supabase db push

# ou, manualmente, colando o conteúdo de cada arquivo em ordem no
# SQL Editor do dashboard (https://supabase.com/dashboard/project/<id>/sql/new)
```

Ordem:
1. `20260814120000_identity_foundation.sql` — tabelas `organizations`, `users`, `roles`, `permissions`, `role_permissions`, `memberships`, `member_client_access`
2. `20260814120100_identity_rls.sql` — RLS + funções `is_member_of` / `has_permission`
3. `20260814120200_identity_seed_permissions.sql` — catálogo de permissões e papéis de sistema (owner/admin/member) — parte da migration, não é dado de demonstração
4. `20260814130000_clients_and_services.sql` — tabelas `clients`, `services`, `client_services`, RLS, FK real em `member_client_access.client_id`

## Dados de demonstração

`supabase/seed.sql` cria organizações de exemplo (BBOLD, Padaria Diplomata
demo), o catálogo de serviços da BBOLD e alguns clientes demo já vinculados a
serviços. **Nunca rode esse arquivo em produção.** Depois de rodá-lo em um
ambiente de dev, crie um usuário via Supabase Auth e vincule-o a uma
organização inserindo uma linha em `memberships` (o próprio arquivo traz o
comando de exemplo) — só assim `clients.view`/`clients.manage` resolvem via
RLS e a tela `/flow/clientes` passa a mostrar dados.

Dados antigos (`clients`, `crm_clientes`, `contracts`, `tasks` do Flow/CRM
removidos) não são migrados — o novo Flow começa com banco limpo.

## Testes de RLS/permissão

`supabase/tests/clients_rls.sql` documenta (comentado, para rodar manualmente
no SQL Editor com impersonation de usuário) os quatro cenários de maior
risco: isolamento multi-tenant, bloqueio por falta de `clients.manage`,
tentativa de escrita cross-tenant, e consistência de organização entre
`clients` e `services` em `client_services`. Não há framework de teste JS
configurado no projeto (nenhum script `test` no `package.json`) — decisão
mantida por não haver ainda superfície que justifique a máquina extra.
