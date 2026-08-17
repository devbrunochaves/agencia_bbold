# BBOLD Flow — banco de dados

Migrations versionadas em `supabase/migrations/`, aplicadas em ordem pelo nome
(timestamp prefix). Nenhuma alteração deve ser feita manualmente no painel do
Supabase fora desse fluxo.

## Aplicar as migrations

Esta sessão não tem acesso ao projeto Supabase de produção do
`agencia-bbold` (as credenciais/URL só existem como env var na Vercel).
Reconfirmado nas fases 3, 4, 5, 6, 7, 8 e novamente na 9 — a última
verificação antes da auditoria completa da V1 (nova tentativa explícita a
cada vez, incluindo checar se o projeto teria saído de um estado pausado):
`mcp__Supabase__list_projects` continua enxergando só os mesmos dois
projetos da conta — `css-marketing-hub` (INACTIVE) e `Gabriel Reparo`
(ACTIVE, projeto de outro cliente) — nenhum dos dois é o `agencia-bbold`, e
nenhum terceiro projeto apareceu. O projeto correto não está pausado a ponto
de precisar ser "acordado": ele simplesmente não está entre os projetos que
esta conta/sessão enxerga, então não há nada a reativar por aqui. Nenhuma
migration foi aplicada a nenhum dos dois projetos visíveis. As migrations
abaixo foram escritas e versionadas, mas **ainda não foram aplicadas** ao
banco remoto correto. A fase 8 (Dashboard) não precisou de nenhuma migration
nova. A fase 9 (auditoria) adicionou uma única migration de hardening
(#9 abaixo) — nenhuma feature nova, apenas correções de gaps encontrados na
auditoria. Para aplicar:

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
7. `20260814160000_contracts.sql` — `contract_templates`, `contracts`, `contract_installments`; colunas incrementais de dados jurídicos em `organizations` (contratada) e endereço/representante em `clients` (contratante); FK real em `financial_entries.contract_id` e nova coluna `financial_recurrences.contract_id`; RLS (reaproveita `contracts.view`/`contracts.manage` da fase 1)
8. `20260814170000_access_control.sql` — `memberships.status` ganha `suspended`/`removed`; nova coluna `memberships.client_access_mode` (`all`/`restricted`); permissões `members.view`/`settings.view`/`settings.manage`; ativa `member_client_access` como restrição real via `can_view_client()`, aplicada em `clients`/`tasks`/`contracts` (financeiro fica de fora — ver decisão abaixo); RLS de `member_client_access` restrita à própria membership ou a quem tem `members.manage`; trigger `prevent_last_owner_removal`
9. `20260817000000_audit_hardening.sql` — fruto da auditoria completa da fase 9, corrige 4 gaps sem adicionar feature nova: (a) `memberships_manage` (`for all`, permitia hard-DELETE) trocada por `memberships_insert`/`memberships_update` — nenhuma policy de DELETE, membership nunca é apagada fisicamente; (b) trigger `contract_installments_same_org`, faltante desde a fase 6 (todas as outras 5 relações cross-entidade já tinham o trigger equivalente); (c) trigger `member_client_access_same_org`, mesma classe de gap; (d) `financial_entries_contract_due_date_uidx` e `financial_recurrences_contract_id_uidx` — backstop de idempotência no banco para a geração de financeiro a partir de contrato, que antes só era protegida por um count-check na application layer (race condition sob concorrência)

## Dados de demonstração

`supabase/seed.sql` cria organizações de exemplo (BBOLD, Padaria Diplomata
demo), o catálogo de serviços da BBOLD, alguns clientes demo já vinculados a
serviços, algumas demandas demo (sem responsável — nenhum uuid de membro
real existe até o passo abaixo ser feito manualmente), o catálogo de
categorias financeiras (entradas e saídas), a meta financeira/saldo inicial
da organização, e alguns lançamentos financeiros demo (competência = mês
atual, para que o seed continue fazendo sentido sempre que for rodado).
além de dados jurídicos placeholder da BBOLD (contratada) e quatro modelos
de contrato (Social Media, Website, Landing Page, Identidade Visual).
**Substitua os dados jurídicos placeholder pelos reais antes de gerar
qualquer contrato de verdade.** **Nunca rode esse arquivo em produção.**
Depois de rodá-lo em um
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

`supabase/tests/contracts_rls.sql` cobre contratos: isolamento multi-tenant,
bloqueio sem `contracts.manage`, cliente de outra organização, template de
outra organização, e imutabilidade do snapshot (editar o cliente depois não
altera `contracts.client_snapshot`). Transições de status inválidas
(`draft` → `signed` pulando `sent`) são bloqueadas na application layer
(`canTransition`), não no banco — documentado como teste manual do app.

`supabase/tests/access_rls.sql` cobre o controle de acesso da fase 7:
isolamento multi-tenant, bloqueio por falta de permissão de módulo
(`finance.view`), distinção entre `clients.view` e `clients.manage`, o
cenário central de restrição por cliente (`can_view_client()` aplicado a
`clients`/`tasks`), a confirmação explícita de que o Financeiro permanece em
nível de organização mesmo para uma membership restrita (decisão
deliberada, não lacuna), membership suspensa perdendo todo acesso
imediatamente, o trigger `prevent_last_owner_removal` impedindo a remoção
do último Owner ativo, e a garantia de que `member_client_access` não é
globalmente legível por um membro comum. Fecha com um bloco de comentários
listando tentativas de manipulação direta (URL, `organization_id`
forjado, Server Action com permissão revogada) e por que cada uma falha
pela própria construção do código.

A partir da fase 8, a Dashboard passou a agregar bastante lógica pura
(distribuição de demandas, ordenação de entregas, progresso por cliente,
soma de receita/despesa realizada), e isso finalmente justificou um runner
leve: `vitest` (`npm test`, config em `vitest.config.ts`, escopo restrito a
`modules/**/*.test.ts` — nenhum teste de JSX/UI). Cobre exclusivamente
regras, não Supabase nem React:
- `modules/dashboard/domain/__tests__/aggregate.test.ts` — buckets
  mutuamente exclusivos de `buildTaskDistribution` somando ao total,
  ordenação de `sortUpcomingDeliveries` (atrasadas primeiro, depois
  prazo mais próximo), e `computeClientProgressPercentage` (percentual
  real e o caso 0/0 sem gerar `NaN`)
- `modules/finance/domain/__tests__/rules.test.ts` — `sumPaidIncome`/
  `sumPaidExpenses`/`computeRealizedProfit` só contam lançamentos
  efetivamente pagos, nunca misturando previsto/pendente/cancelado

A fase 9 (auditoria) expandiu a cobertura para as regras que a própria
auditoria identificou como as mais arriscadas de quebrar silenciosamente:
- `modules/identity/domain/__tests__/permissions.test.ts` — `hasPermission`
  nunca libera por padrão (contexto nulo, chave ausente, permissão vazia)
- `modules/contracts/domain/__tests__/rules.test.ts` — transições de status
  (`canTransition`), divisão de parcelas sem perder/ganhar centavo
  (`splitAmountIntoInstallments`), o bloqueio de dados jurídicos incompletos
  (`getMissingContractorFields`, §76), e o bug de timezone corrigido nesta
  fase em `sumSignedValueForMonth` — um contrato assinado tarde da noite no
  Brasil próximo da virada do mês não pode mais cair no mês errado
- `modules/finance/domain/__tests__/competence.test.ts` — `shiftCompetenceMonth`
  na virada do ano (dezembro→janeiro e vice-versa) e `computeGoalProgress`
  (percentual/excedente/meta zerada sem divisão por zero)

O restante do projeto segue sem framework de teste JS para UI — decisão
mantida por não haver ainda superfície que justifique a máquina extra.
