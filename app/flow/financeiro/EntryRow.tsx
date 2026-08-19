"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, IconButton, StatusBadge } from "@/components/flow/ui";
import type { FinancialEntry } from "@/modules/finance/domain/types";
import { getDisplayStatus } from "@/modules/finance/domain/rules";
import { formatCentsAsBRL } from "@/modules/finance/domain/money";
import { markEntryAsPaidAction, cancelEntryAction } from "./actions";

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function EntryRow({
  entry,
  onEdit,
  onChanged,
}: {
  entry: FinancialEntry;
  onEdit: (entry: FinancialEntry) => void;
  onChanged: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const displayStatus = getDisplayStatus(entry);

  async function handleMarkPaid() {
    setLoading(true);
    await markEntryAsPaidAction(entry.id, todayISODate());
    setLoading(false);
    onChanged();
  }

  async function handleCancel() {
    setLoading(true);
    await cancelEntryAction(entry.id);
    setLoading(false);
    onChanged();
  }

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 py-2.5 text-sm">
      <button type="button" onClick={() => onEdit(entry)} className="min-w-0 text-left">
        <p className="truncate text-flow-text-primary hover:text-flow-yellow-ink">{entry.description}</p>
        <p className="truncate text-xs text-flow-text-muted">{entry.clientName ?? entry.categoryName}</p>
      </button>
      <span className="text-xs text-flow-text-muted">
        {entry.dueDate ? `Vence ${entry.dueDate.split("-").reverse().join("/")}` : "Sem vencimento"}
      </span>
      <span className="font-medium text-flow-text-primary">{formatCentsAsBRL(entry.amountCents)}</span>
      <StatusBadge status={displayStatus} />
      <DropdownMenu
        trigger={<IconButton icon={<MoreHorizontal size={16} strokeWidth={1.75} />} aria-label="Ações" size="sm" />}
        items={[
          { key: "edit", label: "Editar", onSelect: () => onEdit(entry) },
          ...(entry.status !== "paid" && entry.status !== "cancelled"
            ? [{ key: "paid", label: entry.type === "income" ? "Marcar como recebido" : "Marcar como pago", onSelect: handleMarkPaid }]
            : []),
          ...(entry.status !== "cancelled"
            ? [{ key: "cancel", label: "Cancelar", danger: true, onSelect: handleCancel }]
            : []),
        ]}
      />
      {loading && <span className="sr-only">Salvando...</span>}
    </div>
  );
}
