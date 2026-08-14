export type TaskStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "internal_review"
  | "waiting_client"
  | "changes_requested"
  | "approved"
  | "completed"
  | "cancelled";

export type TaskPriority = "none" | "normal" | "high" | "urgent";

export interface TaskStatusConfig {
  value: TaskStatus;
  label: string;
  color: "neutral" | "info" | "waiting" | "danger" | "success";
  order: number;
}

/** Single source of truth for status label/color/order across the module. */
export const TASK_STATUSES: TaskStatusConfig[] = [
  { value: "backlog", label: "Backlog", color: "neutral", order: 0 },
  { value: "todo", label: "A iniciar", color: "neutral", order: 1 },
  { value: "in_progress", label: "Criando", color: "info", order: 2 },
  { value: "internal_review", label: "Revisão interna", color: "waiting", order: 3 },
  { value: "waiting_client", label: "Aguardando cliente", color: "waiting", order: 4 },
  { value: "changes_requested", label: "Alteração", color: "danger", order: 5 },
  { value: "approved", label: "Aprovado", color: "success", order: 6 },
  { value: "completed", label: "Concluído", color: "success", order: 7 },
  { value: "cancelled", label: "Cancelado", color: "neutral", order: 8 },
];

export const TASK_STATUS_MAP: Record<TaskStatus, TaskStatusConfig> = Object.fromEntries(
  TASK_STATUSES.map((s) => [s.value, s])
) as Record<TaskStatus, TaskStatusConfig>;

export interface TaskPriorityConfig {
  value: TaskPriority;
  label: string;
  color: "neutral" | "warning" | "danger";
}

export const TASK_PRIORITIES: TaskPriorityConfig[] = [
  { value: "none", label: "Sem prioridade", color: "neutral" },
  { value: "normal", label: "Normal", color: "neutral" },
  { value: "high", label: "Alta", color: "warning" },
  { value: "urgent", label: "Urgente", color: "danger" },
];

export const TASK_PRIORITY_MAP: Record<TaskPriority, TaskPriorityConfig> = Object.fromEntries(
  TASK_PRIORITIES.map((p) => [p.value, p])
) as Record<TaskPriority, TaskPriorityConfig>;

/** Statuses that count as "open" for indicators/counters. */
export const OPEN_TASK_STATUSES: TaskStatus[] = TASK_STATUSES.filter(
  (s) => s.value !== "completed" && s.value !== "cancelled"
).map((s) => s.value);

/** Kanban board columns — backlog/completed/cancelled get separate treatment. */
export const KANBAN_STATUSES: TaskStatus[] = [
  "todo",
  "in_progress",
  "internal_review",
  "waiting_client",
  "changes_requested",
  "approved",
];

export interface TaskAssignee {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  organizationId: string;
  clientId: string;
  clientName: string;
  serviceId: string | null;
  serviceName: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: TaskAssignee | null;
  dueDate: string | null;
  completedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}
