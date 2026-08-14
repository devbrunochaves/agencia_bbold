import type { Metadata } from "next";
import { getCurrentUserContext } from "@/modules/identity";
import PageHeader from "@/components/flow/PageHeader";
import Card from "@/components/flow/Card";

export const metadata: Metadata = {
  title: "Dashboard — BBOLD Flow",
  robots: { index: false, follow: false },
};

const placeholderMetrics = [
  { label: "Em produção" },
  { label: "Receita do mês" },
  { label: "Pendências" },
  { label: "Clientes ativos" },
];

export default async function FlowDashboardPage() {
  const context = await getCurrentUserContext();
  const organizationName = context?.currentMembership?.organization.name ?? "";

  return (
    <>
      <PageHeader
        title="Panorama da agência"
        subtitle={`Visão geral da operação — ${organizationName}`}
      />

      <div className="px-8 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {placeholderMetrics.map((metric) => (
            <Card key={metric.label}>
              <p className="text-sm text-flow-text-muted">{metric.label}</p>
              <p className="mt-3 text-2xl font-semibold text-flow-text-primary">—</p>
              <p className="mt-1 text-xs text-flow-text-muted">
                Conectado ao módulo real na fase 8
              </p>
            </Card>
          ))}
        </div>

        <Card className="mt-4">
          <p className="text-sm text-flow-text-muted">
            Os indicadores completos (faturamento do ano, próximas entregas, distribuição,
            carga da equipe, o mês em dinheiro e clientes em produção) serão conectados aos
            dados reais de Clientes, Demandas e Financeiro à medida que esses módulos forem
            implementados.
          </p>
        </Card>
      </div>
    </>
  );
}
