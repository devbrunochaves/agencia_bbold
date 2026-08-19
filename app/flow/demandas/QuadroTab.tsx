"use client";

import { MoreHorizontal } from "lucide-react";
import { Avatar, DropdownMenu, IconButton } from "@/components/flow/ui";
import { KANBAN_STATUSES, TASK_STATUS_MAP, type Task, type TaskStatus } from "@/modules/tasks/domain/types";
import { formatDueDate, isOverdue } from "./format";

export default function QuadroTab({
  tasks,
  onEdit,
  onChangeStatus,
}: {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onChangeStatus: (task: Task, status: TaskStatus) => void;
}) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {KANBAN_STATUSES.map((status) => {
        const config = TASK_STATUS_MAP[status];
        const columnTasks = tasks.filter((t) => t.status === status);

        return (
          <div key={status} className="w-64 shrink-0">
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-flow-text-muted">
                {config.label}
              </p>
              <span className="text-xs text-flow-text-muted">{columnTasks.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl border border-flow-border bg-flow-panel p-3 transition-colors hover:border-flow-border-strong"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(task)}
                      className="text-left text-sm text-flow-text-primary hover:text-flow-yellow-ink"
                    >
                      {task.title}
                    </button>
                    <DropdownMenu
                      trigger={
                        <IconButton
                          icon={<MoreHorizontal size={14} strokeWidth={1.75} />}
                          aria-label="Ações"
                          size="sm"
                        />
                      }
                      items={KANBAN_STATUSES.filter((s) => s !== status).map((s) => ({
                        key: s,
                        label: `Mover para: ${TASK_STATUS_MAP[s].label}`,
                        onSelect: () => onChangeStatus(task, s),
                      }))}
                    />
                  </div>
                  <p className="mt-1 text-xs text-flow-text-muted">{task.clientName}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-xs ${isOverdue(task) ? "text-flow-danger" : "text-flow-text-muted"}`}>
                      {formatDueDate(task.dueDate)}
                    </span>
                    {task.assignee && <Avatar name={task.assignee.name} size="sm" />}
                  </div>
                </div>
              ))}
              {columnTasks.length === 0 && (
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
