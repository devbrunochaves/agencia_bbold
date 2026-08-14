import { StatusBadge } from "@/components/flow/ui";
import { demoTasks, type DemoTask } from "@/data/flow-demo/tasks";

const columns: { status: DemoTask["status"]; label: string }[] = [
  { status: "todo", label: "A iniciar" },
  { status: "in_progress", label: "Criando" },
  { status: "waiting_client", label: "Aguardando cliente" },
  { status: "internal_review", label: "Revisão interna" },
  { status: "approved", label: "Aprovado" },
  { status: "completed", label: "Concluído" },
];

export default function QuadroTab() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {columns.map((column) => {
        const tasks = demoTasks.filter((t) => t.status === column.status);
        return (
          <div key={column.status} className="w-64 shrink-0">
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-flow-text-muted">
                {column.label}
              </p>
              <span className="text-xs text-flow-text-muted">{tasks.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl border border-flow-border bg-flow-panel p-3 transition-colors hover:border-flow-border-strong"
                >
                  <p className="text-sm text-flow-text-primary">{task.title}</p>
                  <p className="mt-1 text-xs text-flow-text-muted">{task.client}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-xs ${task.overdue ? "text-flow-danger" : "text-flow-text-muted"}`}>
                      {task.dueDate ?? "Sem data"}
                    </span>
                    <StatusBadge status={task.status} />
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="rounded-xl border border-dashed border-flow-border p-4 text-center text-xs text-flow-text-muted">
                  Vazio
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
