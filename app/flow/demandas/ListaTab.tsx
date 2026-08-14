"use client";

import { useMemo, useState } from "react";
import { Select } from "@/components/flow/ui";
import type { Task } from "@/modules/tasks/domain/types";
import TaskTable from "./TaskTable";

type SortKey = "due" | "priority" | "client" | "status";

const priorityWeight: Record<Task["priority"], number> = { urgent: 0, high: 1, normal: 2, none: 3 };

export default function ListaTab({
  tasks,
  onEdit,
  onChangeStatus,
}: {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onChangeStatus: (task: Task, status: Task["status"]) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("due");

  const sorted = useMemo(() => {
    const copy = [...tasks];
    switch (sortKey) {
      case "priority":
        return copy.sort((a, b) => priorityWeight[a.priority] - priorityWeight[b.priority]);
      case "client":
        return copy.sort((a, b) => a.clientName.localeCompare(b.clientName));
      case "status":
        return copy.sort((a, b) => a.status.localeCompare(b.status));
      case "due":
      default:
        return copy.sort((a, b) => (a.dueDate ?? "9999-99-99").localeCompare(b.dueDate ?? "9999-99-99"));
    }
  }, [tasks, sortKey]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs text-flow-text-muted">Ordenar por</span>
        <Select
          aria-label="Ordenar por"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="w-40"
        >
          <option value="due">Prazo</option>
          <option value="priority">Prioridade</option>
          <option value="client">Cliente</option>
          <option value="status">Status</option>
        </Select>
      </div>
      <TaskTable
        tasks={sorted}
        emptyMessage="Nenhuma demanda encontrada com os filtros atuais."
        onEdit={onEdit}
        onChangeStatus={onChangeStatus}
      />
    </div>
  );
}
