"use client";

import { useState } from "react";
import type { FinancialEntry } from "@/modules/finance/domain/types";
import EntryRow from "./EntryRow";

const VISIBLE_ROWS = 3;

export default function EntryGroupList({
  entries,
  onEdit,
  onChanged,
}: {
  entries: FinancialEntry[];
  onEdit: (entry: FinancialEntry) => void;
  onChanged: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? entries : entries.slice(0, VISIBLE_ROWS);

  if (entries.length === 0) {
    return <p className="py-2 text-sm text-flow-text-muted">Nenhum lançamento neste grupo.</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-flow-border/60">
      {visible.map((entry) => (
        <EntryRow key={entry.id} entry={entry} onEdit={onEdit} onChanged={onChanged} />
      ))}
      {entries.length > VISIBLE_ROWS && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="py-2 text-left text-xs font-medium text-flow-yellow-ink hover:underline"
        >
          {expanded ? "Ver menos" : `Ver mais (${entries.length - VISIBLE_ROWS})`}
        </button>
      )}
    </div>
  );
}
