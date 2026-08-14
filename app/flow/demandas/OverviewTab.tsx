"use client";

import { useMemo, useState } from "react";
import { Checkbox, Select } from "@/components/flow/ui";
import { demoTasks } from "@/data/flow-demo/tasks";
import TaskTable from "./TaskTable";

const rangeOptions = [
  { value: "7", label: "7 dias" },
  { value: "14", label: "14 dias" },
  { value: "30", label: "30 dias" },
];

export default function OverviewTab() {
  const [range, setRange] = useState("14");
  const [assignee, setAssignee] = useState("all");
  const [status, setStatus] = useState("all");
  const [showCompleted, setShowCompleted] = useState(false);

  const assignees = Array.from(new Set(demoTasks.map((t) => t.assignee)));

  const filtered = useMemo(() => {
    return demoTasks.filter((task) => {
      if (!showCompleted && task.status === "completed") return false;
      if (assignee !== "all" && task.assignee !== assignee) return false;
      if (status !== "all" && task.status !== status) return false;
      return true;
    });
  }, [assignee, status, showCompleted]);

  const overdue = filtered.filter((t) => t.overdue);
  const today = filtered.filter((t) => t.dueToday);
  const upcoming = filtered.filter((t) => t.dueDate && !t.overdue && !t.dueToday);
  const noDate = filtered.filter((t) => !t.dueDate);

  const blocks = [
    { key: "atrasadas", label: "Atrasadas", tasks: overdue, tone: "text-flow-danger" },
    { key: "hoje", label: "Hoje", tasks: today, tone: "text-flow-yellow" },
    { key: "proximos", label: "Próximos dias", tasks: upcoming, tone: "text-flow-info" },
    { key: "sem-data", label: "Sem data", tasks: noDate, tone: "text-flow-text-muted" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-lg border border-flow-border">
          {rangeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRange(option.value)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                range === option.value
                  ? "bg-flow-yellow text-black"
                  : "text-flow-text-secondary hover:bg-flow-panel-alt"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <Select
          aria-label="Responsável"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          className="w-40"
        >
          <option value="all">Todos os responsáveis</option>
          {assignees.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>

        <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
          <option value="all">Todos os status</option>
          <option value="in_progress">Criando</option>
          <option value="waiting_client">Aguardando cliente</option>
          <option value="internal_review">Revisão interna</option>
          <option value="changes_requested">Alteração</option>
          <option value="approved">Aprovado</option>
        </Select>

        <Checkbox
          id="show-completed"
          label="Mostrar concluídas"
          checked={showCompleted}
          onChange={(e) => setShowCompleted(e.target.checked)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {blocks.map((block) => (
          <div key={block.key} className="rounded-xl border border-flow-border bg-flow-panel p-4">
            <p className={`text-2xl font-semibold ${block.tone}`}>{block.tasks.length}</p>
            <p className="mt-1 text-xs text-flow-text-muted">{block.label}</p>
          </div>
        ))}
      </div>

      <TaskTable tasks={filtered} emptyMessage="Nenhuma demanda no período selecionado." />
    </div>
  );
}
