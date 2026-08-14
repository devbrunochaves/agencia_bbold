import { StatusBadge } from "@/components/flow/ui";
import { demoTasks } from "@/data/flow-demo/tasks";

export default function CalendarioTab() {
  const withDate = demoTasks.filter((t) => t.dueDate);
  const grouped = withDate.reduce<Record<string, typeof withDate>>((acc, task) => {
    const key = task.dueDate as string;
    acc[key] = acc[key] ? [...acc[key], task] : [task];
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(grouped).map(([date, tasks]) => (
        <div key={date} className="rounded-xl border border-flow-border bg-flow-panel p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-flow-text-muted">{date}</p>
          <div className="flex flex-col divide-y divide-flow-border/60">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between gap-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm text-flow-text-primary">{task.title}</p>
                  <p className="text-xs text-flow-text-muted">{task.client} — {task.assignee}</p>
                </div>
                <StatusBadge status={task.status} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
