import { StatusBadge } from "@/components/flow/ui";
import type { Task } from "@/modules/tasks/domain/types";

export default function CalendarioTab({ tasks, onEdit }: { tasks: Task[]; onEdit: (task: Task) => void }) {
  const withDate = tasks.filter((t): t is Task & { dueDate: string } => Boolean(t.dueDate));

  const grouped = withDate.reduce<Record<string, Task[]>>((acc, task) => {
    const key = task.dueDate;
    acc[key] = acc[key] ? [...acc[key], task] : [task];
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  if (sortedDates.length === 0) {
    return <p className="text-sm text-flow-text-muted">Nenhuma demanda com data de entrega no filtro atual.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {sortedDates.map((date) => (
        <div key={date} className="rounded-xl border border-flow-border bg-flow-panel p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-flow-text-muted">
            {new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" })
              .format(new Date(`${date}T00:00:00`))
              .replace(".", "")}
          </p>
          <div className="flex flex-col divide-y divide-flow-border/60">
            {grouped[date].map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => onEdit(task)}
                className="flex items-center justify-between gap-4 py-2.5 text-left"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-flow-text-primary">{task.title}</p>
                  <p className="text-xs text-flow-text-muted">
                    {task.clientName}
                    {task.assignee ? ` — ${task.assignee.name}` : ""}
                  </p>
                </div>
                <StatusBadge status={task.status} />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
