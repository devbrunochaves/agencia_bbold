import type { Task } from "@/modules/tasks";

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === "completed" || task.status === "cancelled") return false;
  return task.dueDate < todayISODate();
}

export function isDueToday(task: Task): boolean {
  return task.dueDate === todayISODate();
}

export function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return "Sem data";
  const date = new Date(`${dueDate}T00:00:00`);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date).replace(".", "");
}

/**
 * Human label for a due date relative to today — "Atrasada"/"Hoje"/"Amanhã"/
 * "Em N dias", falling back to the absolute short date beyond that window.
 * The absolute ISO date should still be surfaced (title/tooltip) by callers
 * that need it for accessibility — this is a display label only.
 */
export function formatRelativeDueDate(dueDate: string | null, overdue: boolean): string {
  if (!dueDate) return "Sem data";
  if (overdue) return "Atrasada";

  const today = new Date(`${todayISODate()}T00:00:00`);
  const due = new Date(`${dueDate}T00:00:00`);
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Amanhã";
  if (diffDays > 1 && diffDays <= 7) return `Em ${diffDays} dias`;
  return formatDueDate(dueDate);
}

/** Monday → Sunday week containing `date`, as [start, end] ISO date strings. No per-user timezone handling. */
export function currentWeekRange(date = new Date()): [string, string] {
  const day = date.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  return [toISO(monday), toISO(sunday)];
}
