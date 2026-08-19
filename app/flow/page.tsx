import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TrendingUp, Clock, AlertCircle, Users, FileWarning, Layers } from "lucide-react";
import { requirePermission, getDefaultRoute } from "@/modules/identity";
import { getDashboardOverview } from "@/modules/dashboard";
import { computeClientProgressPercentage } from "@/modules/dashboard/domain/aggregate";
import { formatCentsAsBRL } from "@/modules/finance/domain/money";
import { formatCompetenceMonth, currentCompetenceMonth } from "@/modules/finance/domain/competence";
import { formatRelativeDueDate } from "./demandas/format";
import PageHeader from "@/components/flow/PageHeader";
import AccessDenied from "@/components/flow/AccessDenied";
import MonthSelector from "@/components/flow/MonthSelector";
import { MetricCard, PageContainer, ProgressBar, StatusBadge, EmptyState } from "@/components/flow/ui";

export const metadata: Metadata = {
  title: "Dashboard — BBOLD Flow",
  robots: { index: false, follow: false },
};

const monthParamRegex = /^\d{4}-\d{2}$/;

function toCompetenceMonth(monthParam: string): string {
  return `${monthParam}-01`;
}

function toMonthParam(competenceMonth: string): string {
  return competenceMonth.slice(0, 7);
}

export default async function FlowDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const check = await requirePermission("dashboard.view");
  if (!check.ok) {
    if (check.reason === "forbidden" && check.context?.currentMembership) {
      redirect(getDefaultRoute(check.context.currentMembership.permissions));
    }
    return <AccessDenied />;
  }

  const { context } = check;
  const params = await searchParams;
  const monthParam = monthParamRegex.test(params.month ?? "") ? (params.month as string) : toMonthParam(currentCompetenceMonth());
  const competenceMonth = toCompetenceMonth(monthParam);

  const overview = await getDashboardOverview(competenceMonth);
  if (!overview) return <AccessDenied />;

  const { operational, financial, contracts, clients, team } = overview;
  const isEmptyOrg = (clients?.activeClientCount ?? 0) === 0;

  return (
    <>
      <PageHeader
        title="Panorama da agência"
        subtitle={`Visão geral da operação — ${overview.organizationName}`}
        actions={<MonthSelector month={monthParam} />}
      />

      <PageContainer>
        {isEmptyOrg && !operational?.upcomingDeliveries.length ? (
          <EmptyState
            title="Seu Flow está pronto."
            description="Cadastre o primeiro cliente para começar a acompanhar a operação da agência."
            action={
              <Link
                href="/flow/clientes"
                className="inline-flex items-center rounded-lg bg-flow-yellow px-4 py-2 text-sm font-medium text-flow-bg hover:bg-flow-yellow/90"
              >
                Adicionar cliente
              </Link>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {operational && (
                <Link href="/flow/demandas">
                  <MetricCard
                    icon={Layers}
                    label="Em produção"
                    value={String(operational.inProductionCount)}
                    tone="info"
                    helperText="demandas em criação/revisão"
                  />
                </Link>
              )}

              {financial ? (
                <Link href={`/flow/financeiro?competence=${competenceMonth}`}>
                  <MetricCard
                    icon={TrendingUp}
                    label="Receita do mês"
                    value={formatCentsAsBRL(financial.receivedCents)}
                    tone="success"
                    helperText={financial.receivableCents > 0 ? `${formatCentsAsBRL(financial.receivableCents)} a receber` : "recebido, realizado"}
                  />
                </Link>
              ) : null}

              {operational && (
                <Link href="/flow/demandas?overdue=true">
                  <MetricCard
                    icon={AlertCircle}
                    label="Pendências"
                    value={String(operational.overdueCount)}
                    tone={operational.overdueCount > 0 ? "danger" : "neutral"}
                    helperText={`${operational.waitingClientCount} aguardando cliente`}
                  />
                </Link>
              )}

              {clients && (
                <Link href="/flow/clientes?status=active">
                  <MetricCard
                    icon={Users}
                    label="Clientes ativos"
                    value={String(clients.activeClientCount)}
                    tone="neutral"
                    helperText={`${clients.clientsInProduction.length} em produção`}
                  />
                </Link>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
              {financial && (
                <div className="rounded-2xl border border-flow-border bg-flow-panel p-6 xl:col-span-2">
                  <h2 className="text-sm font-semibold text-flow-text-primary">Receitas do ano</h2>
                  <p className="mt-1 text-xs text-flow-text-muted">Receita recebida por competência, últimos 12 meses</p>
                  <div className="mt-6 flex h-40 items-end gap-2">
                    {(() => {
                      const maxCents = Math.max(1, ...financial.yearlyReceived.map((p) => p.receivedCents));
                      return financial.yearlyReceived.map((point) => {
                        const pct = Math.max(4, Math.round((point.receivedCents / maxCents) * 100));
                        return (
                          <div key={point.competenceMonth} className="flex flex-1 flex-col items-center gap-2">
                            <div
                              className={`w-full rounded-t-md ${point.receivedCents === 0 ? "bg-flow-panel-alt" : "bg-flow-yellow/80"}`}
                              style={{ height: `${pct}%` }}
                              title={`${formatCompetenceMonth(point.competenceMonth)}: ${formatCentsAsBRL(point.receivedCents)}`}
                            />
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {operational && (
                <div className={`rounded-2xl border border-flow-border bg-flow-panel p-6 ${financial ? "" : "xl:col-span-3"}`}>
                  <h2 className="text-sm font-semibold text-flow-text-primary">Distribuição</h2>
                  <p className="mt-1 text-xs text-flow-text-muted">{operational.distribution.total} demandas abertas</p>
                  <div className="mt-5 flex flex-col gap-3">
                    {[
                      { label: "Atrasadas", value: operational.distribution.overdue, tone: "danger" as const },
                      { label: "Aguardando cliente", value: operational.distribution.waitingClient, tone: "info" as const },
                      { label: "Em produção", value: operational.distribution.inProduction, tone: "yellow" as const },
                      { label: "Próximos 7 dias", value: operational.distribution.upcoming7Days, tone: "success" as const },
                      { label: "Sem previsão", value: operational.distribution.noSchedule, tone: "info" as const },
                    ].map((item) => {
                      const pct = operational.distribution.total > 0 ? Math.round((item.value / operational.distribution.total) * 100) : 0;
                      return (
                        <div key={item.label}>
                          <div className="mb-1.5 flex justify-between text-xs text-flow-text-secondary">
                            <span>{item.label}</span>
                            <span>{item.value}</span>
                          </div>
                          <ProgressBar value={pct} tone={item.tone} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
              {operational && (
                <div className="rounded-2xl border border-flow-border bg-flow-panel p-6 xl:col-span-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-flow-text-primary">Próximas entregas</h2>
                    <Link href="/flow/demandas" className="text-xs text-flow-text-muted hover:text-flow-text-primary">
                      Ver todas
                    </Link>
                  </div>
                  {operational.upcomingDeliveries.length === 0 ? (
                    <p className="mt-4 text-sm text-flow-text-muted">Nenhuma demanda com prazo definido.</p>
                  ) : (
                    <ul className="mt-4 flex flex-col divide-y divide-flow-border/60">
                      {operational.upcomingDeliveries.map((task) => (
                        <li key={task.id} className="flex items-center justify-between gap-4 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm text-flow-text-primary">{task.title}</p>
                            <p className="text-xs text-flow-text-muted">
                              {task.clientName}
                              {task.assigneeName ? ` · ${task.assigneeName}` : ""}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span
                              className={`text-xs ${task.isOverdue ? "font-medium text-flow-danger" : "text-flow-text-muted"}`}
                              title={task.dueDate ?? undefined}
                            >
                              {formatRelativeDueDate(task.dueDate, task.isOverdue)}
                            </span>
                            <StatusBadge status={task.status} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {team && team.workload.length > 0 && (
                <div className="rounded-2xl border border-flow-border bg-flow-panel p-6">
                  <h2 className="text-sm font-semibold text-flow-text-primary">Distribuição de demandas</h2>
                  <p className="mt-1 text-xs text-flow-text-muted">Carga da equipe</p>
                  <div className="mt-4 flex flex-col gap-4">
                    {team.workload.map((member) => (
                      <div key={member.userId}>
                        <div className="mb-1.5 flex justify-between text-xs text-flow-text-secondary">
                          <span>{member.name}</span>
                          <span>{member.openTaskCount} demandas</span>
                        </div>
                        <ProgressBar value={member.relativeLoad} tone={member.relativeLoad > 80 ? "danger" : "yellow"} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
              {clients && (
                <div className="rounded-2xl border border-flow-border bg-flow-panel p-6 xl:col-span-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-flow-text-primary">Clientes em produção</h2>
                    <Clock size={16} strokeWidth={1.75} className="text-flow-text-muted" />
                  </div>
                  {clients.clientsInProduction.length === 0 ? (
                    <p className="mt-4 text-sm text-flow-text-muted">Nenhum cliente ativo com demandas em aberto.</p>
                  ) : (
                    <ul className="mt-4 flex flex-col divide-y divide-flow-border/60">
                      {clients.clientsInProduction.map((client) => (
                        <li key={client.clientId} className="flex flex-col gap-1.5 py-3">
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-sm text-flow-text-primary">{client.clientName}</p>
                            <div className="flex items-center gap-3">
                              {client.competenceTaskCount > 0 && (
                                <span className="text-xs text-flow-text-muted">
                                  {client.competenceCompletedCount} de {client.competenceTaskCount} concluídas no mês
                                </span>
                              )}
                              <span className="text-xs text-flow-text-muted">{client.openTaskCount} em aberto</span>
                            </div>
                          </div>
                          {client.competenceTaskCount > 0 && (
                            <ProgressBar
                              value={computeClientProgressPercentage(client.competenceCompletedCount, client.competenceTaskCount)}
                              tone="success"
                            />
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {financial ? (
                <div className="rounded-2xl border border-flow-border bg-flow-panel p-6">
                  <h2 className="text-sm font-semibold text-flow-text-primary">O mês em dinheiro</h2>
                  <p className="mt-4 text-2xl font-semibold text-flow-success">{formatCentsAsBRL(financial.receivedCents)}</p>
                  <p className="text-xs text-flow-text-muted">recebido</p>
                  <p className="mt-4 text-2xl font-semibold text-flow-danger">{formatCentsAsBRL(financial.paidExpensesCents)}</p>
                  <p className="text-xs text-flow-text-muted">despesas pagas</p>
                  <p className="mt-4 text-lg font-semibold text-flow-text-primary">{formatCentsAsBRL(financial.resultCents)}</p>
                  <p className="text-xs text-flow-text-muted">resultado (recebido − despesas pagas)</p>
                  {financial.pendingInvoiceCount > 0 && (
                    <p className="mt-4 flex items-center gap-1.5 text-xs text-flow-warning">
                      <FileWarning size={13} strokeWidth={1.75} />
                      {financial.pendingInvoiceCount} NFs pendentes
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            {contracts && (contracts.awaitingSignatureCount > 0 || contracts.endingSoon.length > 0) && (
              <div className="mt-4 rounded-2xl border border-flow-border bg-flow-panel p-6">
                <h2 className="text-sm font-semibold text-flow-text-primary">Contratos que precisam de atenção</h2>
                <div className="mt-3 flex flex-col gap-2 text-sm text-flow-text-secondary">
                  {contracts.awaitingSignatureCount > 0 && (
                    <p>
                      {contracts.awaitingSignatureCount} enviados aguardando assinatura —{" "}
                      <Link href="/flow/contratos?status=sent" className="text-flow-yellow-ink hover:underline">
                        ver contratos
                      </Link>
                    </p>
                  )}
                  {contracts.endingSoon.map((c) => (
                    <p key={c.id}>
                      {c.clientName} vence em {c.daysRemaining} {c.daysRemaining === 1 ? "dia" : "dias"}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </PageContainer>
    </>
  );
}
