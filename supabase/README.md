# BBOLD Flow — banco de dados

Migrations versionadas em `supabase/migrations/`, aplicadas em ordem pelo nome
(timestamp prefix). Nenhuma alteração deve ser feita manualmente no painel do
Supabase fora desse fluxo.

## Aplicar as migrations

Esta sessão não tem acesso ao projeto Supabase de produção do
`agencia-bbold` (as credenciais/URL só existem como env var na Vercel).
Reconfirmado nas fases 3, 4 e novamente na 5 (nova tentativa explícita a cada
vez, incluindo checar se o projeto teria saído de um estado pausado):
`mcp__Supabase__list_projects` continua enxergando só os mesmos dois
projetos da conta — `css-marketing-hub` (INACTIVE) e `Gabriel Reparo`
(ACTIVE, projeto de outro cliente) — nenhum dos dois é o `agencia-bbold`, e
nenhum terceiro projeto apareceu. O projeto correto não está pausado a ponto
de precisar ser "acordado": ele simplesmente não está entre os projetos que
esta conta/sessão enxerga, então não há nada a reativar por aqui. Nenhuma
migration foi aplicada a nenhum dos dois projetos visíveis. As migrations
abaixo foram escritas e versionadas, mas **ainda não foram aplicadas** ao
banco remoto correto. Para aplicar:

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
5. `20260814140000_tasks.sql` — tabela `tasks`, triggers de `completed_at` e consistência cross-entidade, RLS (reaproveita `tasks.view`/`tasks.manage` da fase 1)
6. `20260814150000_finance.sql` — `financial_categories`, `financial_recurrences`, `financial_entries`, `organization_financial_settings`; triggers de consistência e de normalização de nota fiscal; RLS (reaproveita `finance.view`/`finance.manage` da fase 1). `financial_entries.contract_id` é `uuid` sem FK — a foreign key para `contracts` entra na migration da fase 6

## Dados de demonstração

`supabase/seed.sql` cria organizações de exemplo (BBOLD, Padaria Diplomata
demo), o catálogo de serviços da BBOLD, alguns clientes demo já vinculados a
serviços, algumas demandas demo (sem responsável — nenhum uuid de membro
real existe até o passo abaixo ser feito manualmente), o catálogo de
categorias financeiras (entradas e saídas), a meta financeira/saldo inicial
da organização, e alguns lançamentos financeiros demo (competência = mês
atual, para que o seed continue fazendo sentido sempre que for rodado).
**Nunca rode esse arquivo em produção.** Depois de rodá-lo em um
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
`clients` e `services` em `client_services`.

`supabase/tests/tasks_rls.sql` cobre o mesmo padrão para `tasks`: isolamento
multi-tenant, bloqueio sem `tasks.manage`, cliente de outra organização,
serviço de outra organização, responsável sem membership ativa na
organização, e o ciclo de vida de `completed_at` (setado ao concluir, limpo
ao reabrir). O comportamento dos filtros de data (atrasada/hoje/7-14-30
dias/sem data/ocultar concluídas) fica documentado no mesmo arquivo, mas
como cenário de teste manual de UI — a lógica vive em
`app/flow/demandas/format.ts`, fora do banco.

`supabase/tests/finance_rls.sql` cobre o financeiro: isolamento multi-tenant,
bloqueio sem `finance.manage`, categoria de tipo incompatível com o
lançamento, cliente de outra organização, normalização do trio
`requires_invoice`/`invoice_status`/`invoice_issued_at`, e prevenção de
duplicidade de recorrência (`financial_entries_recurrence_competence_uidx`).
Os cálculos puros (`modules/finance/domain/rules.ts` — lucro realizado,
saldo em caixa, progresso de meta, atraso derivado) ficam documentados no
mesmo arquivo como testes manuais de fixture, já que não há test runner.

Não há framework de teste JS configurado no projeto (nenhum script `test` no
`package.json`) — decisão mantida por não haver ainda superfície que
justifique a máquina extra.
