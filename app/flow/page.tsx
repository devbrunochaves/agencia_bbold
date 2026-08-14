import type { Metadata } from "next";
import { TrendingUp, Clock, AlertCircle, Users } from "lucide-react";
import { getCurrentUserContext } from "@/modules/identity";
import PageHeader from "@/components/flow/PageHeader";
import { MetricCard, PageContainer, ProgressBar, StatusBadge } from "@/components/flow/ui";
import { getFinancialOverview } from "@/modules/finance";
import { currentCompetenceMonth } from "@/modules/finance/domain/competence";
import { formatCentsAsBRL } from "@/modules/finance/domain/money";
import { demoTasks } from "@/data/flow-demo/tasks";
import { demoClients } from "@/data/flow-demo/clients";

export const metadata: Metadata = {
  title: "Dashboard — BBOLD Flow",
  robots: { index: false, follow: false },
};

// Dado de UI temporário — será substituído pelo cálculo real sobre
// tasks/clients/financial_entries/members na fase 8.
const upcomingDeliveries = demoTasks.filter((t) => t.dueDate && t.status !== "completed").slice(0, 4);
const clientsInProduction = demoClients.filter((c) => c.status === "active");

export default async function FlowDashboardPage() {
  const context = await getCurrentUserContext();
  const organizationName = context?.currentMembership?.organization.name ?? "";
  const financialOverview = await getFinancialOverview(currentCompetenceMonth());

  return (
    <>
      <PageHeader
        title="Panorama da agência"
        subtitle={`Visão geral da operação — ${organizationName}`}
      />

      <PageContainer>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={TrendingUp} label="Em produção" value="4" tone="info" helperText="demandas ativas" />
          <MetricCard
            icon={TrendingUp}
            label="Receita do mês"
            value={financialOverview ? formatCentsAsBRL(financialOverview.receivedCents) : "—"}
            tone="success"
            helperText="recebido, realizado"
          />
          <MetricCard icon={AlertCircle} label="Pendências" value="3" tone="warning" helperText="aguardando ação" />
          <MetricCard icon={Users} label="Clientes ativos" value={String(clientsInProduction.length)} tone="neutral" />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="rounded-2xl border border-flow-border bg-flow-panel p-6 xl:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-flow-text-primary">Faturamento do ano</h2>
              <span className="text-xs text-flow-text-muted">dado ilustrativo</span>
            </div>
            <div className="mt-6 flex h-40 items-end gap-2">
              {[40, 55, 48, 62, 58, 70, 65, 80, 74, 60, 0, 0].map((value, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className={`w-full rounded-t-md ${value === 0 ? "bg-flow-panel-alt" : "bg-flow-yellow/80"}`}
                    style={{ height: `${Math.max(value, 4)}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-flow-border bg-flow-panel p-6">
            <h2 className="text-sm font-semibold text-flow-text-primary">Distribuição</h2>
            <p className="mt-1 text-xs text-flow-text-muted">Serviços em produção</p>
            <div className="mt-5 flex flex-col gap-3">
              {[
                { label: "Social Media", value: 50, tone: "yellow" as const },
                { label: "Website", value: 25, tone: "info" as const },
                { label: "Identidade Visual", value: 15, tone: "success" as const },
                { label: "Tráfego Pago", value: 10, tone: "danger" as const },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-1.5 flex justify-between text-xs text-flow-text-secondary">
                    <span>{item.label}</span>
                    <span>{item.value}%</span>
                  </div>
                  <ProgressBar value={item.value} tone={item.tone} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="rounded-2xl border border-flow-border bg-flow-panel p-6 xl:col-span-2">
            <h2 className="text-sm font-semibold text-flow-text-primary">Próximas entregas</h2>
            <ul className="mt-4 flex flex-col divide-y divide-flow-border/60">
              {upcomingDeliveries.map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-flow-text-primary">{task.title}</p>
                    <p className="text-xs text-flow-text-muted">{task.client}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-flow-text-muted">{task.dueDate}</span>
                    <StatusBadge status={task.status} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-flow-border bg-flow-panel p-6">
            <h2 className="text-sm font-semibold text-flow-text-primary">Carga da equipe</h2>
            <div className="mt-4 flex flex-col gap-4">
              {[
                { name: "Aline", load: 70 },
                { name: "Gabriel", load: 45 },
                { name: "Bruno", load: 30 },
              ].map((member) => (
                <div key={member.name}>
                  <div className="mb-1.5 flex justify-between text-xs text-flow-text-secondary">
                    <span>{member.name}</span>
                    <span>{member.load}%</span>
                  </div>
                  <ProgressBar value={member.load} tone={member.load > 65 ? "danger" : "yellow"} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="rounded-2xl border border-flow-border bg-flow-panel p-6 xl:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-flow-text-primary">Clientes em produção</h2>
              <Clock size={16} strokeWidth={1.75} className="text-flow-text-muted" />
            </div>
            <ul className="mt-4 flex flex-col divide-y divide-flow-border/60">
              {clientsInProduction.map((client) => (
                <li key={client.id} className="flex items-center justify-between gap-4 py-3">
                  <p className="text-sm text-flow-text-primary">{client.name}</p>
                  <span className="text-xs text-flow-text-muted">
                    {client.openDeliveries} entregas em aberto
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-flow-border bg-flow-panel p-6">
            <h2 className="text-sm font-semibold text-flow-text-primary">O mês em dinheiro</h2>
            <p className="mt-4 text-2xl font-semibold text-flow-success">
              {financialOverview ? formatCentsAsBRL(financialOverview.receivedCents) : "—"}
            </p>
            <p className="text-xs text-flow-text-muted">recebido até agora</p>
            <p className="mt-4 text-2xl font-semibold text-flow-danger">
              {financialOverview ? formatCentsAsBRL(financialOverview.paidExpensesCents) : "—"}
            </p>
            <p className="text-xs text-flow-text-muted">despesas do mês</p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-flow-text-muted">
          Receita e despesas do mês já usam dados reais do Financeiro. Os demais indicadores
          (faturamento do ano, distribuição, carga da equipe) permanecem ilustrativos até a fase 8.
        </p>
      </PageContainer>
    </>
  );
}
