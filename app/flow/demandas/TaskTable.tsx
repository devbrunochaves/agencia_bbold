"use client";

import { MoreHorizontal } from "lucide-react";
import { Avatar, Badge, DropdownMenu, IconButton, StatusBadge, Table, type TableColumn } from "@/components/flow/ui";
import { TASK_PRIORITY_MAP, TASK_STATUSES, type Task, type TaskStatus } from "@/modules/tasks/domain/types";
import { formatDueDate, isOverdue } from "./format";

export default function TaskTable({
  tasks,
  emptyMessage,
  onEdit,
  onChangeStatus,
}: {
  tasks: Task[];
  emptyMessage?: string;
  onEdit: (task: Task) => void;
  onChangeStatus: (task: Task, status: TaskStatus) => void;
}) {
  const columns: TableColumn<Task>[] = [
    {
      key: "title",
      header: "Demanda",
      render: (t) => (
        <button
          type="button"
          onClick={() => onEdit(t)}
          className="text-left font-medium text-flow-text-primary hover:text-flow-yellow"
        >
          {t.title}
        </button>
      ),
    },
    {
      key: "client",
      header: "Cliente",
      render: (t) => <Badge tone="neutral">{t.clientName}</Badge>,
    },
    {
      key: "assignee",
      header: "Responsável",
      render: (t) =>
        t.assignee ? (
          <div className="flex items-center gap-2">
            <Avatar name={t.assignee.name} size="sm" />
            <span>{t.assignee.name}</span>
          </div>
        ) : (
          <span className="text-flow-text-muted">—</span>
        ),
    },
    {
      key: "due",
      header: "Data",
      render: (t) => (
        <span className={isOverdue(t) ? "font-medium text-flow-danger" : ""}>
          {formatDueDate(t.dueDate)}
        </span>
      ),
    },
    {
      key: "priority",
      header: "Prioridade",
      render: (t) => <Badge tone={TASK_PRIORITY_MAP[t.priority].color}>{TASK_PRIORITY_MAP[t.priority].label}</Badge>,
    },
    { key: "status", header: "Status", render: (t) => <StatusBadge status={t.status} /> },
    {
      key: "actions",
      header: "",
      className: "w-10",
      render: (t) => (
        <DropdownMenu
          trigger={
            <IconButton icon={<MoreHorizontal size={16} strokeWidth={1.75} />} aria-label="Ações" size="sm" />
          }
          items={[
            { key: "edit", label: "Editar", onSelect: () => onEdit(t) },
            ...TASK_STATUSES.filter((s) => s.value !== t.status && s.value !== "cancelled").map((s) => ({
              key: s.value,
              label: `Mover para: ${s.label}`,
              onSelect: () => onChangeStatus(t, s.value),
            })),
            ...(t.status !== "cancelled"
              ? [{ key: "cancel", label: "Cancelar", danger: true, onSelect: () => onChangeStatus(t, "cancelled" as TaskStatus) }]
              : []),
          ]}
        />
      ),
    },
  ];

  return <Table columns={columns} rows={tasks} rowKey={(row) => row.id} emptyMessage={emptyMessage} />;
}
