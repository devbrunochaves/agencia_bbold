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
