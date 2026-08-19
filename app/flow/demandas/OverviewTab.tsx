import { OPEN_TASK_STATUSES, type Task } from "@/modules/tasks/domain/types";
import { currentWeekRange, isDueToday, isOverdue } from "./format";
import TaskTable from "./TaskTable";

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function OverviewTab({
  tasks,
  rangeDays,
  onEdit,
  onChangeStatus,
}: {
  tasks: Task[];
  rangeDays: number;
  onEdit: (task: Task) => void;
  onChangeStatus: (task: Task, status: Task["status"]) => void;
}) {
  const today = todayISODate();
  const rangeEnd = new Date();
  rangeEnd.setDate(rangeEnd.getDate() + rangeDays);
  const rangeEndISO = rangeEnd.toISOString().slice(0, 10);

  const overdue = tasks.filter(isOverdue);
  const dueToday = tasks.filter(isDueToday);
  const upcoming = tasks.filter(
    (t) => t.dueDate && !isOverdue(t) && !isDueToday(t) && t.dueDate <= rangeEndISO
  );
  const noDate = tasks.filter((t) => !t.dueDate);

  const [weekStart, weekEnd] = currentWeekRange();
  const openCount = tasks.filter((t) => OPEN_TASK_STATUSES.includes(t.status)).length;
  const dueThisWeek = tasks.filter(
    (t) => t.dueDate && t.dueDate >= weekStart && t.dueDate <= weekEnd
  ).length;

  const blocks = [
    { key: "atrasadas", label: "Atrasadas", tasks: overdue, tone: "text-flow-danger" },
    { key: "hoje", label: "Hoje", tasks: dueToday, tone: "text-flow-yellow-ink" },
    { key: "proximos", label: "Próximos dias", tasks: upcoming, tone: "text-flow-info" },
    { key: "sem-data", label: "Sem data", tasks: noDate, tone: "text-flow-text-muted" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4 text-sm text-flow-text-muted">
        <span>
          <strong className="text-flow-text-primary">{openCount}</strong> demandas abertas
        </span>
        <span>
          <strong className="text-flow-danger">{overdue.length}</strong> atrasadas
        </span>
        <span>
          <strong className="text-flow-text-primary">{dueThisWeek}</strong> entregas nesta semana
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {blocks.map((block) => (
          <div key={block.key} className="rounded-xl border border-flow-border bg-flow-panel p-4">
            <p className={`text-2xl font-semibold ${block.tone}`}>{block.tasks.length}</p>
            <p className="mt-1 text-xs text-flow-text-muted">{block.label}</p>
          </div>
        ))}
      </div>

      <TaskTable
        tasks={tasks}
        emptyMessage="Nenhuma demanda encontrada com os filtros atuais."
        onEdit={onEdit}
        onChangeStatus={onChangeStatus}
      />
    </div>
  );
}
