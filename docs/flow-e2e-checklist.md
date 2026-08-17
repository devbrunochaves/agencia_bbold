# BBOLD Flow — checklist de testes E2E (pendente de banco real)

Nenhum destes cenários foi executado. Esta sessão nunca teve acesso a um
projeto Supabase real do `agencia-bbold` (ver `supabase/README.md` —
reconfirmado em toda fase, a mais recente sendo a fase 9). Este documento é o roteiro
completo para quando um banco real estiver conectado, escrito enquanto o
código ainda está fresco na cabeça de quem implementou.

Convenção: `[ ]` pendente, execute em ordem dentro de cada seção (algumas
dependem do estado deixado pela anterior). "Owner"/"Admin"/"Member" referem-se
aos papéis de sistema; "Member restricted" é um Member com
`client_access_mode = 'restricted'`.

## 1. Auth

- [ ] Login com credenciais válidas → redireciona para `getDefaultRoute()` do usuário (não sempre `/flow`)
- [ ] Login com credenciais inválidas → mensagem de erro genérica, sem detalhe do Supabase
- [ ] Usuário autenticado sem nenhuma membership → `/flow` mostra tela "sem organização", não um erro cru
- [ ] Membership `suspended` → login funciona, mas `/flow/*` mostra `FullScreenMessage` de suspenso em toda rota, não só na Dashboard
- [ ] Membership `invited` (nunca fez login) → após aceitar convite/logar, `accountStatus = invited_only` tratado corretamente
- [ ] Owner → acessa todos os módulos
- [ ] Member restricted → sidebar e cada página refletem só os módulos/clientes permitidos
- [ ] Usuário com 2 memberships ativas em organizações diferentes → `currentMembership` deve ser sempre a membership mais antiga (`order("created_at")`, corrigido na fase 9 — antes não havia `order()` e a escolha dependia da ordem arbitrária do Postgres); confirmar que o mesmo usuário sempre cai na mesma organização entre requisições

## 2. Clientes

- [ ] Criar cliente (campos obrigatórios, documento, endereço)
- [ ] Editar cliente
- [ ] Pausar cliente (`status = paused`) e confirmar reflexo no Dashboard/Kanban
- [ ] Reativar cliente pausado
- [ ] Encerrar cliente (`status = closed`) — confirmar que não há DELETE físico disponível em nenhum caminho da UI
- [ ] Vincular/desvincular serviços a um cliente
- [ ] Filtro por status, busca por nome/documento
- [ ] Refresh da página após mutação — dado permanece consistente (`revalidatePath`)

## 3. Demandas

- [ ] Criar demanda (cliente, serviço opcional, responsável, prazo)
- [ ] Editar demanda
- [ ] Mudar status ao longo de todo o fluxo: `todo → in_progress → internal_review → waiting_client → changes_requested → approved → completed`
- [ ] Cancelar demanda (`cancelled`) a partir de mais de um status de origem
- [ ] Reabrir uma demanda `completed` → `completed_at` volta a `null` (trigger `sync_task_completed_at`)
- [ ] Demanda com `due_date` no passado aparece como atrasada em Demandas e no Dashboard
- [ ] Trocar responsável (assignee) — só para usuário com membership ativa na organização (trigger `check_task_consistency`)
- [ ] Filtros: overdue, hoje, próximos 7/14/30 dias, sem data, ocultar concluídas
- [ ] As três visões (overview/lista/kanban/calendário — conforme o que existir) mostram o mesmo conjunto de dados subjacente
- [ ] Cliente restricted só vê/edita demandas dos clientes permitidos, mesmo tentando trocar `clientId` no formulário

## 4. Financeiro

- [ ] Criar entrada (receita)
- [ ] Marcar entrada como recebida (`paid_at` preenchido)
- [ ] Criar saída (despesa) e marcar como paga
- [ ] Criar recorrência mensal e gerar lançamentos do mês
- [ ] Gerar o mesmo mês duas vezes seguidas → segunda geração é bloqueada (idempotência via `financial_entries_recurrence_competence_uidx`)
- [ ] Trocar de mês na competência e confirmar que os valores exibidos mudam corretamente
- [ ] Configurar meta mensal e saldo inicial em Configurações → conferir progresso de meta e saldo em caixa no Financeiro
- [ ] Emitir/reverter nota fiscal (`invoice_status`) e confirmar consistência com `requires_invoice`/`invoice_issued_at`
- [ ] Usuário sem `finance.view` não vê o módulo nem o bloco financeiro do Dashboard (nenhuma query deve ser feita)

## 5. Contratos

- [ ] Bloqueio ao criar contrato quando dados jurídicos da BBOLD estão incompletos (fase 9, `getMissingContractorFields`) — preencher os dados e confirmar que o bloqueio desaparece
- [ ] Criar contrato (one_time, installment, recurring) a partir de um cliente e, opcionalmente, um template
- [ ] Preview do conteúdo renderizado (`content_snapshot`)
- [ ] Baixar PDF — nome de arquivo sanitizado, acentuação pt-BR correta
- [ ] Editar contrato em `draft` → `content_snapshot` muda; editar o cliente depois NÃO altera `client_snapshot` do contrato já criado
- [ ] Marcar como enviado (`sent`) → `sent_at` preenchido
- [ ] Marcar como assinado (`signed`) → `signed_at` preenchido; transição inválida (`draft → signed` pulando `sent`) é bloqueada na application layer
- [ ] Gerar financeiro a partir do contrato assinado — parcelas ou recorrência corretas
- [ ] Tentar gerar financeiro duas vezes no mesmo contrato → segunda tentativa é bloqueada (application count-check e, como backstop, `financial_entries_contract_due_date_uidx`/`financial_recurrences_contract_id_uidx` da fase 9)
- [ ] Cancelar contrato
- [ ] Contrato com `end_date` nos próximos 30 dias aparece no bloco "Contratos que precisam de atenção" do Dashboard

## 6. Acessos

- [ ] Convidar membro (cria membership `invited`; e-mail via Supabase Auth é best-effort — confirmar `emailSent` no retorno)
- [ ] Trocar papel de um membro
- [ ] Criar papel customizado da organização e atribuir permissões
- [ ] Definir `client_access_mode = restricted` e selecionar clientes específicos — confirmar leak zero em clientes/demandas/contratos/Dashboard
- [ ] Suspender um membro → login dele resulta em `FullScreenMessage` de suspenso em toda rota
- [ ] Remover um membro (`removed`, nunca DELETE) → confirmar que a linha da membership continua existindo no banco, só com status alterado
- [ ] Tentar suspender/remover/trocar o papel do último Owner ativo → bloqueado (application + trigger `prevent_last_owner_removal`); testar também a autoedição (Owner tentando suspender a si mesmo sendo o único Owner)
- [ ] Acessar uma URL de módulo sem ter a permissão correspondente (digitando a URL diretamente) → `AccessDenied`/redirect, nunca o conteúdo protegido
- [ ] Chamar uma Server Action diretamente (via devtools) depois de ter uma permissão revogada no meio da sessão → falha imediatamente, sem cache de permissão obsoleta

## 7. Dashboard

- [ ] Organização vazia (zero clientes) → empty state "Cadastre o primeiro cliente"
- [ ] Trocar o mês no seletor (`?month=YYYY-MM`) e confirmar que Receita do mês/Receitas do ano/Clientes em produção mudam, mas Em produção/Pendências/Próximas entregas (que não dependem de competência) não
- [ ] Usuário sem `finance.view` → bloco financeiro inteiro ausente do layout, grid se reorganiza (nunca um card "Sem acesso")
- [ ] Member restricted → todos os cards (Em produção, Clientes ativos, Distribuição, Próximas entregas, Clientes em produção) refletem só o universo de clientes permitido — nunca um número maior que o que a lista real mostra
