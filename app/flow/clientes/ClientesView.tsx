"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MoreHorizontal, Plus, Users } from "lucide-react";
import PageHeader from "@/components/flow/PageHeader";
import {
  Button,
  DropdownMenu,
  EmptyState,
  IconButton,
  MetricCard,
  Modal,
  PageContainer,
  SearchInput,
  Select,
  StatusBadge,
  Table,
  type TableColumn,
} from "@/components/flow/ui";
import {
  CLIENT_STATUS_ACTIONS,
  CLIENT_STATUS_LABEL,
  type Client,
  type ClientStatus,
} from "@/modules/clients/domain/types";
import type { Service } from "@/modules/services/domain/types";
import { changeClientStatusAction } from "./actions";
import ClientDrawer from "./ClientDrawer";
import { formatDocument, formatStartDate } from "./format";

const filters: { key: "all" | ClientStatus; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "active", label: "Ativos" },
  { key: "paused", label: "Pausados" },
  { key: "prospect", label: "Prospects" },
  { key: "closed", label: "Encerrados" },
];

export default function ClientesView({
  clients,
  services,
  totalCount,
}: {
  clients: Client[];
  services: Service[];
  totalCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [closingClient, setClosingClient] = useState<Client | null>(null);
  const [closing, setClosing] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");

  const activeStatus = (searchParams.get("status") as ClientStatus | null) ?? "all";
  const activeService = searchParams.get("service") ?? "all";

  function updateQuery(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value && value !== "all") params.set(key, value);
      else params.delete(key);
    }
    startTransition(() => {
      router.push(`/flow/clientes?${params.toString()}`);
    });
  }

  function handleSearchSubmit(value: string) {
    setSearchInput(value);
    updateQuery({ search: value || null });
  }

  const counts = useMemo(
    () => ({
      total: totalCount,
      active: clients.filter((c) => c.status === "active").length,
    }),
    [clients, totalCount]
  );

  async function handleStatusChange(client: Client, status: ClientStatus) {
    await changeClientStatusAction(client.id, status);
    router.refresh();
  }

  async function confirmClose() {
    if (!closingClient) return;
    setClosing(true);
    await changeClientStatusAction(closingClient.id, "closed");
    setClosing(false);
    setClosingClient(null);
    router.refresh();
  }

  const columns: TableColumn<Client>[] = [
    {
      key: "name",
      header: "Cliente",
      render: (c) => (
        <button
          type="button"
          onClick={() => {
            setEditingClient(c);
            setDrawerOpen(true);
          }}
          className="text-left font-medium text-flow-text-primary hover:text-flow-yellow"
        >
          {c.name}
        </button>
      ),
    },
    { key: "start", header: "Entrou", render: (c) => formatStartDate(c.startDate) },
    { key: "team", header: "Equipe", render: () => <span className="text-flow-text-muted">—</span> },
    {
      key: "services",
      header: "Serviços",
      render: (c) => (c.services.length > 0 ? c.services.map((s) => s.serviceName).join(", ") : "—"),
    },
    { key: "deliveries", header: "Entregas", render: () => <span className="text-flow-text-muted">—</span> },
    { key: "status", header: "Situação", render: (c) => <StatusBadge status={c.status} /> },
    { key: "document", header: "Documento", render: (c) => formatDocument(c) },
    {
      key: "actions",
      header: "",
      className: "w-10",
      render: (c) => (
        <DropdownMenu
          trigger={
            <IconButton icon={<MoreHorizontal size={16} strokeWidth={1.75} />} aria-label="Ações" size="sm" />
          }
          items={[
            {
              key: "edit",
              label: "Editar",
              onSelect: () => {
                setEditingClient(c);
                setDrawerOpen(true);
              },
            },
            ...CLIENT_STATUS_ACTIONS[c.status]
              .filter((status) => status !== "closed")
              .map((status) => ({
                key: status,
                label: status === "active" ? "Ativar" : "Pausar",
                onSelect: () => handleStatusChange(c, status),
              })),
            ...(CLIENT_STATUS_ACTIONS[c.status].includes("closed")
              ? [{ key: "close", label: "Encerrar", danger: true, onSelect: () => setClosingClient(c) }]
              : []),
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle="Gestão da carteira da agência"
        actions={
          <Button
            icon={<Plus size={16} strokeWidth={2} />}
            onClick={() => {
              setEditingClient(null);
              setDrawerOpen(true);
            }}
          >
            Cliente
          </Button>
        }
      />

      <PageContainer>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Clientes cadastrados" value={String(counts.total)} />
          <MetricCard label="Ativos" value={String(counts.active)} tone="success" />
          <MetricCard label="Com trabalho em aberto" value="—" helperText="Disponível após Demandas" />
          <MetricCard label="Contratos recorrentes" value="—" helperText="Disponível após Contratos" />
          <MetricCard label="Sem contrato" value="—" helperText="Disponível após Contratos" />
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {filters.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => updateQuery({ status: item.key === "all" ? null : item.key })}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeStatus === item.key
                    ? "border-flow-yellow bg-flow-yellow text-black"
                    : "border-flow-border text-flow-text-secondary hover:border-flow-border-strong"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select
              aria-label="Filtrar por serviço"
              value={activeService}
              onChange={(e) => updateQuery({ service: e.target.value === "all" ? null : e.target.value })}
              className="w-48"
            >
              <option value="all">Todos os serviços</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </Select>
            <div className="w-full sm:w-64">
              <SearchInput
                placeholder="Buscar cliente..."
                defaultValue={searchInput}
                onBlur={(e) => handleSearchSubmit(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearchSubmit((e.target as HTMLInputElement).value);
                }}
              />
            </div>
          </div>
        </div>

        <div className={`mt-4 transition-opacity ${isPending ? "opacity-60" : ""}`}>
          {clients.length === 0 ? (
            <EmptyState
              icon={Users}
              title={totalCount === 0 ? "Nenhum cliente cadastrado" : "Nenhum cliente encontrado"}
              description={
                totalCount === 0
                  ? "Adicione o primeiro cliente da BBOLD para começar a organizar contratos, demandas e financeiro."
                  : "Ajuste os filtros para encontrar o que procura."
              }
              action={
                <Button
                  onClick={() => {
                    setEditingClient(null);
                    setDrawerOpen(true);
                  }}
                >
                  + Cliente
                </Button>
              }
            />
          ) : (
            <Table columns={columns} rows={clients} rowKey={(row) => row.id} />
          )}
        </div>
      </PageContainer>

      <ClientDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => {
          setDrawerOpen(false);
          router.refresh();
        }}
        services={services}
        client={editingClient}
      />

      <Modal
        open={closingClient !== null}
        onClose={() => setClosingClient(null)}
        title="Encerrar cliente"
        footer={
          <>
            <Button variant="secondary" onClick={() => setClosingClient(null)} disabled={closing}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmClose} disabled={closing}>
              {closing ? "Encerrando..." : "Encerrar cliente"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-flow-text-secondary">
          Tem certeza que deseja encerrar{" "}
          <span className="font-medium text-flow-text-primary">{closingClient?.name}</span>? O cliente
          passará para o status <strong>{CLIENT_STATUS_LABEL.closed}</strong>. Nenhum dado é apagado — o
          registro continua acessível pelo filtro &quot;Encerrados&quot;.
        </p>
      </Modal>
    </>
  );
}
