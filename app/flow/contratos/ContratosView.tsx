"use client";

import { useState } from "react";
import { FileSignature, Plus } from "lucide-react";
import PageHeader from "@/components/flow/PageHeader";
import {
  Button,
  EmptyState,
  MetricCard,
  Modal,
  PageContainer,
  StatusBadge,
  Table,
  type TableColumn,
} from "@/components/flow/ui";
import { demoContracts, type DemoContract } from "@/data/flow-demo/contracts";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function ContratosView() {
  const [modalOpen, setModalOpen] = useState(false);

  const monthValue = demoContracts
    .filter((c) => c.status === "signed")
    .reduce((sum, c) => sum + c.value, 0);
  const drafts = demoContracts.filter((c) => c.status === "draft").length;
  const sent = demoContracts.filter((c) => c.status === "sent").length;
  const signed = demoContracts.filter((c) => c.status === "signed").length;

  const columns: TableColumn<DemoContract>[] = [
    { key: "client", header: "Cliente", render: (c) => <span className="font-medium text-flow-text-primary">{c.clientName}</span> },
    { key: "service", header: "Serviço", render: (c) => c.service },
    { key: "value", header: "Valor", render: (c) => currency.format(c.value) },
    { key: "status", header: "Status", render: (c) => <StatusBadge status={c.status} /> },
    { key: "createdAt", header: "Criado em", render: (c) => c.createdAt },
  ];

  return (
    <>
      <PageHeader
        title="Contratos"
        subtitle="Gestão de contratos da agência"
        actions={
          <Button icon={<Plus size={16} strokeWidth={2} />} onClick={() => setModalOpen(true)}>
            Novo contrato
          </Button>
        }
      />

      <PageContainer>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Valor no mês" value={currency.format(monthValue)} tone="success" />
          <MetricCard label="Rascunhos" value={String(drafts)} tone="neutral" />
          <MetricCard label="Enviados" value={String(sent)} tone="waiting" />
          <MetricCard label="Assinados" value={String(signed)} tone="success" />
        </div>

        <div className="mt-6">
          {demoContracts.length === 0 ? (
            <EmptyState
              icon={FileSignature}
              title="Nenhum contrato ainda"
              description="Crie o primeiro contrato da agência."
              action={<Button onClick={() => setModalOpen(true)}>+ Novo contrato</Button>}
            />
          ) : (
            <Table columns={columns} rows={demoContracts} rowKey={(row) => row.id} />
          )}
        </div>
      </PageContainer>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Novo contrato"
        footer={
          <Button variant="secondary" onClick={() => setModalOpen(false)}>
            Fechar
          </Button>
        }
      >
        <p className="text-sm text-flow-text-muted">
          O editor com formulário e preview ao vivo chega na fase 6 do BBOLD Flow.
        </p>
      </Modal>
    </>
  );
}
