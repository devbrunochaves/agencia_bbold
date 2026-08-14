# BBOLD Flow — banco de dados

Migrations versionadas em `supabase/migrations/`, aplicadas em ordem pelo nome
(timestamp prefix). Nenhuma alteração deve ser feita manualmente no painel do
Supabase fora desse fluxo.

## Aplicar as migrations

Esta sessão não tinha acesso ao projeto Supabase de produção do
`agencia-bbold` (as credenciais/URL só existem como env vars na Vercel), então
as migrations abaixo foram escritas e versionadas, mas **ainda não foram
aplicadas** ao banco remoto. Para aplicar:

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

## Dados de demonstração

`supabase/seed.sql` cria organizações de exemplo (BBOLD, Padaria Diplomata
demo). **Nunca rode esse arquivo em produção.** Depois de rodá-lo em um
ambiente de dev, crie um usuário via Supabase Auth e vincule-o a uma
organização inserindo uma linha em `memberships` (o próprio arquivo traz o
comando de exemplo).

Dados antigos (`clients`, `crm_clientes`, `contracts`, `tasks` do Flow/CRM
removidos) não são migrados — o novo Flow começa com banco limpo.
