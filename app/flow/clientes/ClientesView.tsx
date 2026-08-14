"use client";

import { useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";
import PageHeader from "@/components/flow/PageHeader";
import {
  Button,
  Drawer,
  EmptyState,
  MetricCard,
  PageContainer,
  SearchInput,
  StatusBadge,
  Table,
  type TableColumn,
} from "@/components/flow/ui";
import { demoClients, type DemoClient } from "@/data/flow-demo/clients";

const filters: { key: "all" | DemoClient["status"]; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "active", label: "Ativos" },
  { key: "paused", label: "Pausados" },
  { key: "prospect", label: "Prospects" },
  { key: "closed", label: "Encerrados" },
];

export default function ClientesView() {
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("all");
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(() => {
    return demoClients.filter((client) => {
      const matchesFilter = filter === "all" || client.status === filter;
      const matchesSearch = client.name.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [filter, search]);

  const counts = {
    total: demoClients.length,
    active: demoClients.filter((c) => c.status === "active").length,
    withOpenWork: demoClients.filter((c) => c.openDeliveries > 0).length,
    recurring: demoClients.filter((c) => c.status === "active").length - 1,
    noContract: demoClients.filter((c) => c.status === "prospect").length,
  };

  const columns: TableColumn<DemoClient>[] = [
    { key: "name", header: "Cliente", render: (c) => <span className="font-medium text-flow-text-primary">{c.name}</span> },
    { key: "start", header: "Entrou", render: (c) => c.startDate },
    {
      key: "team",
      header: "Equipe",
      render: (c) => (c.team.length > 0 ? c.team.join(", ") : "—"),
    },
    {
      key: "services",
      header: "Serviços",
      render: (c) => (c.services.length > 0 ? c.services.join(", ") : "—"),
    },
    { key: "deliveries", header: "Entregas", render: (c) => c.openDeliveries },
    { key: "status", header: "Situação", render: (c) => <StatusBadge status={c.status} /> },
    { key: "document", header: "Documento", render: (c) => c.document },
  ];

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle="Gestão da carteira da agência"
        actions={
          <Button icon={<Plus size={16} strokeWidth={2} />} onClick={() => setDrawerOpen(true)}>
            Cliente
          </Button>
        }
      />

      <PageContainer>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Clientes cadastrados" value={String(counts.total)} />
          <MetricCard label="Ativos" value={String(counts.active)} tone="success" />
          <MetricCard label="Com trabalho em aberto" value={String(counts.withOpenWork)} tone="info" />
          <MetricCard label="Contratos recorrentes" value={String(counts.recurring)} tone="warning" />
          <MetricCard label="Sem contrato" value={String(counts.noContract)} tone="neutral" />
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {filters.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === item.key
                    ? "border-flow-yellow bg-flow-yellow text-black"
                    : "border-flow-border text-flow-text-secondary hover:border-flow-border-strong"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="w-full sm:w-64">
            <SearchInput
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nenhum cliente encontrado"
              description="Ajuste os filtros ou cadastre um novo cliente para começar."
              action={<Button onClick={() => setDrawerOpen(true)}>+ Cliente</Button>}
            />
          ) : (
            <Table columns={columns} rows={filtered} rowKey={(row) => row.id} />
          )}
        </div>
      </PageContainer>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Novo cliente"
        description="O cadastro completo chega na fase 3 do BBOLD Flow."
        footer={
          <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
            Fechar
          </Button>
        }
      >
        <p className="text-sm text-flow-text-muted">
          Este formulário ainda não está conectado ao banco — a Fase 2 entrega apenas a
          estrutura visual do shell e do design system.
        </p>
      </Drawer>
    </>
  );
}
