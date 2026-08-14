import { Badge, StatusBadge, Table, type TableColumn } from "@/components/flow/ui";
import type { DemoTask } from "@/data/flow-demo/tasks";

const priorityTone: Record<DemoTask["priority"], "neutral" | "warning" | "danger"> = {
  none: "neutral",
  normal: "neutral",
  high: "warning",
  urgent: "danger",
};

const priorityLabel: Record<DemoTask["priority"], string> = {
  none: "—",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

export default function TaskTable({ tasks, emptyMessage }: { tasks: DemoTask[]; emptyMessage?: string }) {
  const columns: TableColumn<DemoTask>[] = [
    { key: "title", header: "Demanda", render: (t) => <span className="font-medium text-flow-text-primary">{t.title}</span> },
    { key: "client", header: "Cliente", render: (t) => t.client },
    { key: "assignee", header: "Responsável", render: (t) => t.assignee },
    {
      key: "due",
      header: "Data",
      render: (t) =>
        t.dueDate ? (
          <span className={t.overdue ? "text-flow-danger" : ""}>{t.dueDate}</span>
        ) : (
          <span className="text-flow-text-muted">Sem data</span>
        ),
    },
    { key: "priority", header: "Prioridade", render: (t) => <Badge tone={priorityTone[t.priority]}>{priorityLabel[t.priority]}</Badge> },
    { key: "status", header: "Status", render: (t) => <StatusBadge status={t.status} /> },
  ];

  return <Table columns={columns} rows={tasks} rowKey={(row) => row.id} emptyMessage={emptyMessage} />;
}
