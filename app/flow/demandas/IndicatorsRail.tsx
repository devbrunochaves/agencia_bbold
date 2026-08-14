import { OPEN_TASK_STATUSES, type Task } from "@/modules/tasks/domain/types";
import { currentWeekRange, isOverdue } from "./format";

export default function IndicatorsRail({ tasks }: { tasks: Task[] }) {
  const open = tasks.filter((t) => OPEN_TASK_STATUSES.includes(t.status)).length;
  const overdue = tasks.filter(isOverdue).length;
  const waitingClient = tasks.filter((t) => t.status === "waiting_client").length;

  const [weekStart, weekEnd] = currentWeekRange();
  const dueThisWeek = tasks.filter((t) => t.dueDate && t.dueDate >= weekStart && t.dueDate <= weekEnd).length;

  const workload = new Map<string, number>();
  for (const task of tasks) {
    if (!task.assignee || !OPEN_TASK_STATUSES.includes(task.status)) continue;
    workload.set(task.assignee.name, (workload.get(task.assignee.name) ?? 0) + 1);
  }
  const workloadEntries = [...workload.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-6 border-l border-flow-border px-5 py-5 xl:flex">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-flow-border bg-flow-panel p-3">
          <p className="text-lg font-semibold text-flow-text-primary">{open}</p>
          <p className="text-xs text-flow-text-muted">Abertas</p>
        </div>
        <div className="rounded-xl border border-flow-border bg-flow-panel p-3">
          <p className="text-lg font-semibold text-flow-danger">{overdue}</p>
          <p className="text-xs text-flow-text-muted">Atrasadas</p>
        </div>
        <div className="rounded-xl border border-flow-border bg-flow-panel p-3">
          <p className="text-lg font-semibold text-flow-waiting">{waitingClient}</p>
          <p className="text-xs text-flow-text-muted">Aguard. cliente</p>
        </div>
        <div className="rounded-xl border border-flow-border bg-flow-panel p-3">
          <p className="text-lg font-semibold text-flow-text-primary">{dueThisWeek}</p>
          <p className="text-xs text-flow-text-muted">Nesta semana</p>
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-flow-text-muted">
          Carga da equipe
        </p>
        {workloadEntries.length === 0 ? (
          <p className="text-xs text-flow-text-muted">Nenhuma demanda atribuída.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {workloadEntries.map(([name, count]) => (
              <div key={name} className="flex items-center justify-between text-xs">
                <span className="text-flow-text-secondary">{name}</span>
                <span className="text-flow-text-primary">
                  {count} demanda{count === 1 ? "" : "s"} aberta{count === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
