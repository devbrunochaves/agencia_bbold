import { demoTasks } from "@/data/flow-demo/tasks";
import { ProgressBar } from "@/components/flow/ui";

export default function IndicatorsRail() {
  const open = demoTasks.filter((t) => t.status !== "completed").length;
  const overdue = demoTasks.filter((t) => t.overdue).length;
  const waitingClient = demoTasks.filter((t) => t.status === "waiting_client").length;
  const dueThisWeek = demoTasks.filter((t) => t.dueDate && t.status !== "completed").length;

  const workload = [
    { name: "Aline", load: 70 },
    { name: "Gabriel", load: 45 },
    { name: "Bruno", load: 30 },
  ];

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
        <div className="flex flex-col gap-3">
          {workload.map((member) => (
            <div key={member.name}>
              <div className="mb-1.5 flex justify-between text-xs text-flow-text-secondary">
                <span>{member.name}</span>
                <span>{member.load}%</span>
              </div>
              <ProgressBar value={member.load} tone={member.load > 65 ? "danger" : "yellow"} />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
