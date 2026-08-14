"use client";

import { useState } from "react";
import { Button, Drawer, EmptyState, StatusBadge, Table, type TableColumn } from "@/components/flow/ui";
import { FileText } from "lucide-react";
import type { FinancialEntry } from "@/modules/finance/domain/types";
import { formatCentsAsBRL } from "@/modules/finance/domain/money";
import { formatCompetenceMonth } from "@/modules/finance/domain/competence";
import { markInvoiceIssuedAction } from "./actions";

export default function InvoiceQueueDrawer({
  open,
  onClose,
  onChanged,
  entries,
}: {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
  entries: FinancialEntry[];
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleMarkIssued(id: string) {
    setPendingId(id);
    await markInvoiceIssuedAction(id);
    setPendingId(null);
    onChanged();
  }

  const columns: TableColumn<FinancialEntry>[] = [
    { key: "client", header: "Cliente", render: (e) => e.clientName ?? "—" },
    { key: "competence", header: "Competência", render: (e) => formatCompetenceMonth(e.competenceMonth) },
    { key: "description", header: "Descrição", render: (e) => e.description },
    { key: "amount", header: "Valor", render: (e) => formatCentsAsBRL(e.amountCents) },
    { key: "paidAt", header: "Recebido em", render: (e) => e.paidAt ?? "—" },
    { key: "invoice", header: "Status NF", render: (e) => <StatusBadge status={e.invoiceStatus} /> },
    {
      key: "action",
      header: "",
      render: (e) => (
        <Button size="sm" variant="secondary" onClick={() => handleMarkIssued(e.id)} disabled={pendingId === e.id}>
          {pendingId === e.id ? "Marcando..." : "Marcar emitida"}
        </Button>
      ),
    },
  ];

  return (
    <Drawer open={open} onClose={onClose} title="Notas pendentes">
      {entries.length === 0 ? (
        <EmptyState icon={FileText} title="Nenhuma nota fiscal pendente." />
      ) : (
        <Table columns={columns} rows={entries} rowKey={(row) => row.id} />
      )}
    </Drawer>
  );
}
