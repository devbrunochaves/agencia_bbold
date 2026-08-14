"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileSignature, MoreHorizontal, Plus } from "lucide-react";
import PageHeader from "@/components/flow/PageHeader";
import {
  Badge,
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
  CONTRACT_STATUS_TRANSITIONS,
  BILLING_TYPE_LABEL,
  type Contract,
  type ContractStatus,
} from "@/modules/contracts/domain/types";
import { getDisplayContractStatus, sumSignedValueForMonth } from "@/modules/contracts/domain/rules";
import { formatCentsAsBRL } from "@/modules/finance/domain/money";
import { currentCompetenceMonth, formatCompetenceMonth } from "@/modules/finance/domain/competence";
import type { Client } from "@/modules/clients/domain/types";
import type { Service } from "@/modules/services/domain/types";
import { changeContractStatusAction, createFinanceFromContractAction } from "./actions";
import { formatDateBR } from "./format";
import DownloadPdfButton from "./pdf/DownloadPdfButton";

const statusFilters: { key: "all" | ContractStatus; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "draft", label: "Rascunhos" },
  { key: "sent", label: "Enviados" },
  { key: "signed", label: "Assinados" },
  { key: "cancelled", label: "Cancelados" },
];

export default function ContratosView({
  contracts,
  allContracts,
  clients,
  services,
}: {
  contracts: Contract[];
  allContracts: Contract[];
  clients: Client[];
  services: Service[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [statusConfirm, setStatusConfirm] = useState<{ contract: Contract; status: ContractStatus } | null>(null);
  const [financeConfirm, setFinanceConfirm] = useState<Contract | null>(null);
  const [pdfPreview, setPdfPreview] = useState<Contract | null>(null);
  const [busy, setBusy] = useState(false);
  const [financeMessage, setFinanceMessage] = useState<string | null>(null);

  const activeStatus = (searchParams.get("status") as ContractStatus | null) ?? "all";
  const activeClient = searchParams.get("client") ?? "";
  const activeService = searchParams.get("service") ?? "";
  const search = searchParams.get("search") ?? "";

  function updateQuery(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/flow/contratos?${params.toString()}`);
  }

  const monthValueCents = useMemo(
    () => sumSignedValueForMonth(allContracts, currentCompetenceMonth()),
    [allContracts]
  );
  const drafts = allContracts.filter((c) => c.status === "draft").length;
  const sent = allContracts.filter((c) => c.status === "sent").length;
  const signed = allContracts.filter((c) => c.status === "signed").length;

  async function confirmStatusChange() {
    if (!statusConfirm) return;
    setBusy(true);
    const result = await changeContractStatusAction(statusConfirm.contract.id, statusConfirm.status);
    setBusy(false);
    const wasSigning = statusConfirm.status === "signed";
    const changedContract = statusConfirm.contract;
    setStatusConfirm(null);
    router.refresh();

    if (result.ok && wasSigning) {
      setFinanceConfirm(changedContract);
    }
  }

  async function confirmCreateFinance() {
    if (!financeConfirm) return;
    setBusy(true);
    const result = await createFinanceFromContractAction(financeConfirm.id);
    setBusy(false);
    setFinanceMessage(result.ok ? result.data.message : result.message);
  }

  const columns: TableColumn<Contract>[] = [
    {
      key: "title",
      header: "Contrato",
      render: (c) => (
        <button
          type="button"
          onClick={() => router.push(`/flow/contratos/novo?id=${c.id}`)}
          className="text-left font-medium text-flow-text-primary hover:text-flow-yellow"
        >
          {c.title}
        </button>
      ),
    },
    { key: "client", header: "Cliente", render: (c) => c.clientName },
    { key: "service", header: "Serviço", render: (c) => c.serviceName ?? "—" },
    {
      key: "term",
      header: "Vigência",
      render: (c) => `${formatDateBR(c.startDate)} — ${c.endDate ? formatDateBR(c.endDate) : "sem fim"}`,
    },
    {
      key: "value",
      header: "Valor",
      render: (c) => (
        <span>
          {formatCentsAsBRL((c.billingType === "recurring" ? c.recurringAmountCents : c.totalAmountCents) ?? 0)}
          {c.billingType === "recurring" && <span className="text-flow-text-muted">/mês</span>}
        </span>
      ),
    },
    { key: "status", header: "Status", render: (c) => <StatusBadge status={getDisplayContractStatus(c)} /> },
    { key: "createdAt", header: "Criado em", render: (c) => formatDateBR(c.createdAt.slice(0, 10)) },
    {
      key: "actions",
      header: "",
      className: "w-10",
      render: (c) => {
        const transitions = CONTRACT_STATUS_TRANSITIONS[c.status];
        return (
          <DropdownMenu
            trigger={<IconButton icon={<MoreHorizontal size={16} strokeWidth={1.75} />} aria-label="Ações" size="sm" />}
            items={[
              ...(c.status === "draft"
                ? [{ key: "edit", label: "Editar", onSelect: () => router.push(`/flow/contratos/novo?id=${c.id}`) }]
                : []),
              { key: "pdf", label: "Gerar PDF", onSelect: () => setPdfPreview(c) },
              ...transitions
                .filter((s) => s !== "cancelled")
                .map((s) => ({
                  key: s,
                  label: s === "sent" ? "Marcar enviado" : "Marcar assinado",
                  onSelect: () => setStatusConfirm({ contract: c, status: s }),
                })),
              ...(c.status === "signed"
                ? [{ key: "finance", label: "Gerar financeiro", onSelect: () => setFinanceConfirm(c) }]
                : []),
              ...(transitions.includes("cancelled")
                ? [{ key: "cancel", label: "Cancelar", danger: true, onSelect: () => setStatusConfirm({ contract: c, status: "cancelled" as ContractStatus }) }]
                : []),
            ]}
          />
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Contratos"
        subtitle="Gestão de contratos da agência"
        actions={
          <Button icon={<Plus size={16} strokeWidth={2} />} onClick={() => router.push("/flow/contratos/novo")}>
            Novo contrato
          </Button>
        }
      />

      <PageContainer>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Valor do mês"
            value={formatCentsAsBRL(monthValueCents)}
            tone="success"
            helperText={`assinados em ${formatCompetenceMonth(currentCompetenceMonth())}`}
          />
          <MetricCard label="Rascunhos" value={String(drafts)} tone="neutral" />
          <MetricCard label="Enviados" value={String(sent)} tone="waiting" />
          <MetricCard label="Assinados" value={String(signed)} tone="success" />
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {statusFilters.map((item) => (
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
              aria-label="Filtrar por cliente"
              value={activeClient}
              onChange={(e) => updateQuery({ client: e.target.value || null })}
              className="w-44"
            >
              <option value="">Todos os clientes</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Filtrar por serviço"
              value={activeService}
              onChange={(e) => updateQuery({ service: e.target.value || null })}
              className="w-44"
            >
              <option value="">Todos os serviços</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            <div className="w-full sm:w-56">
              <SearchInput
                placeholder="Buscar contrato..."
                defaultValue={search}
                onBlur={(e) => updateQuery({ search: e.target.value || null })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") updateQuery({ search: (e.target as HTMLInputElement).value || null });
                }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          {contracts.length === 0 ? (
            <EmptyState
              icon={FileSignature}
              title="Nenhum contrato ainda"
              description="Crie o primeiro contrato da BBOLD e acompanhe todo o ciclo de negociação até assinatura."
              action={<Button onClick={() => router.push("/flow/contratos/novo")}>+ Novo contrato</Button>}
            />
          ) : (
            <Table columns={columns} rows={contracts} rowKey={(row) => row.id} />
          )}
        </div>
      </PageContainer>

      <Modal
        open={statusConfirm !== null}
        onClose={() => setStatusConfirm(null)}
        title={statusConfirm?.status === "cancelled" ? "Cancelar contrato" : "Alterar status"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setStatusConfirm(null)} disabled={busy}>
              Voltar
            </Button>
            <Button
              variant={statusConfirm?.status === "cancelled" ? "danger" : "primary"}
              onClick={confirmStatusChange}
              disabled={busy}
            >
              {busy ? "Salvando..." : "Confirmar"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-flow-text-secondary">
          {statusConfirm?.status === "cancelled" && (
            <>Cancelar o contrato de <strong>{statusConfirm.contract.clientName}</strong>? Ele não é excluído — fica marcado como cancelado.</>
          )}
          {statusConfirm?.status === "sent" && <>Marcar contrato como enviado ao cliente?</>}
          {statusConfirm?.status === "signed" && (
            <>Marcar contrato de <strong>{statusConfirm.contract.clientName}</strong> como assinado?</>
          )}
        </p>
      </Modal>

      <Modal
        open={financeConfirm !== null}
        onClose={() => {
          setFinanceConfirm(null);
          setFinanceMessage(null);
        }}
        title="Contrato assinado"
        footer={
          financeMessage ? (
            <Button
              onClick={() => {
                setFinanceConfirm(null);
                setFinanceMessage(null);
              }}
            >
              Fechar
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setFinanceConfirm(null);
                  setFinanceMessage(null);
                }}
                disabled={busy}
              >
                Agora não
              </Button>
              <Button onClick={confirmCreateFinance} disabled={busy}>
                {busy ? "Criando..." : "Criar"}
              </Button>
            </>
          )
        }
      >
        {financeMessage ? (
          <p className="text-sm text-flow-text-secondary">{financeMessage}</p>
        ) : (
          <p className="text-sm text-flow-text-secondary">
            Deseja criar a{" "}
            {financeConfirm?.billingType === "recurring" ? "recorrência" : "cobrança"} financeira (
            {financeConfirm && BILLING_TYPE_LABEL[financeConfirm.billingType]}) referente a este contrato agora?
          </p>
        )}
      </Modal>

      <Modal open={pdfPreview !== null} onClose={() => setPdfPreview(null)} title="Gerar PDF">
        <p className="mb-4 text-sm text-flow-text-secondary">
          O PDF é gerado localmente com o conteúdo salvo deste contrato.
        </p>
        {pdfPreview && <DownloadPdfButton contract={pdfPreview} />}
      </Modal>
    </>
  );
}
