"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ListChecks, Plus } from "lucide-react";
import PageHeader from "@/components/flow/PageHeader";
import { Button, Checkbox, EmptyState, Select, Tabs } from "@/components/flow/ui";
import type { Task, TaskStatus } from "@/modules/tasks/domain/types";
import { TASK_STATUSES } from "@/modules/tasks/domain/types";
import type { Client } from "@/modules/clients/domain/types";
import type { OrganizationMember } from "@/modules/identity/domain/member";
import { changeTaskStatusAction } from "./actions";
import FolderPanel from "./FolderPanel";
import IndicatorsRail from "./IndicatorsRail";
import OverviewTab from "./OverviewTab";
import ListaTab from "./ListaTab";
import QuadroTab from "./QuadroTab";
import CalendarioTab from "./CalendarioTab";
import TaskDrawer from "./TaskDrawer";

const rangeOptions = [
  { value: "7", label: "7 dias" },
  { value: "14", label: "14 dias" },
  { value: "30", label: "30 dias" },
];

export default function DemandasView({
  tasks,
  clients,
  members,
}: {
  tasks: Task[];
  clients: Client[];
  members: OrganizationMember[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const range = Number(searchParams.get("range") ?? "14");
  const activeStatus = searchParams.get("status") ?? "";
  const activeAssignee = searchParams.get("assignee") ?? "";
  const activeClient = searchParams.get("client");
  const showCompleted = searchParams.get("completed") === "1";

  function selectFolder(clientId: string | null) {
    // Selecting a client folder shows all of their demandas regardless of
    // service — clear any leftover `service` filter (e.g. from a direct
    // link) so it doesn't silently narrow the folder's own view.
    updateQuery({ client: clientId, service: null });
  }

  function updateQuery(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    startTransition(() => {
      router.push(`/flow/demandas?${params.toString()}`);
    });
  }

  function openCreateDrawer() {
    setEditingTask(null);
    setDrawerOpen(true);
  }

  function openEditDrawer(task: Task) {
    setEditingTask(task);
    setDrawerOpen(true);
  }

  async function handleChangeStatus(task: Task, status: TaskStatus) {
    await changeTaskStatusAction(task.id, status);
    router.refresh();
  }

  return (
    <>
      <PageHeader
        title="Demandas"
        subtitle="Operação e produção de conteúdo da agência"
        actions={
          <Button icon={<Plus size={16} strokeWidth={2} />} onClick={openCreateDrawer}>
            Nova demanda
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 border-b border-flow-border px-6 py-3 lg:px-8">
        <div className="flex overflow-hidden rounded-lg border border-flow-border">
          {rangeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateQuery({ range: option.value })}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                String(range) === option.value
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
          value={activeAssignee}
          onChange={(e) => updateQuery({ assignee: e.target.value || null })}
          className="w-44"
        >
          <option value="">Todos os responsáveis</option>
          {members.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.name}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Status"
          value={activeStatus}
          onChange={(e) => updateQuery({ status: e.target.value || null })}
          className="w-44"
        >
          <option value="">Todos os status</option>
          {TASK_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>

        <Checkbox
          id="show-completed"
          label="Mostrar concluídas"
          checked={showCompleted}
          onChange={(e) => updateQuery({ completed: e.target.checked ? "1" : null })}
        />
      </div>

      <div className="flex">
        <FolderPanel
          clients={clients}
          tasks={tasks}
          activeClientId={activeClient}
          onSelectClient={selectFolder}
        />

        <div className="min-w-0 flex-1">
          {tasks.length === 0 ? (
            <div className="px-6 py-10 lg:px-8">
              <EmptyState
                icon={ListChecks}
                title="Nenhuma demanda por aqui"
                description="Crie a primeira demanda para começar a organizar a produção da agência."
                action={<Button onClick={openCreateDrawer}>+ Nova demanda</Button>}
              />
            </div>
          ) : (
            <Tabs
              items={[
                {
                  key: "overview",
                  label: "Overview",
                  content: (
                    <div className="px-6 py-6 lg:px-8">
                      <OverviewTab
                        tasks={tasks}
                        rangeDays={range}
                        onEdit={openEditDrawer}
                        onChangeStatus={handleChangeStatus}
                      />
                    </div>
                  ),
                },
                {
                  key: "lista",
                  label: "Lista",
                  content: (
                    <div className="px-6 py-6 lg:px-8">
                      <ListaTab tasks={tasks} onEdit={openEditDrawer} onChangeStatus={handleChangeStatus} />
                    </div>
                  ),
                },
                {
                  key: "quadro",
                  label: "Quadro",
                  content: (
                    <div className="px-6 py-6 lg:px-8">
                      <QuadroTab tasks={tasks} onEdit={openEditDrawer} onChangeStatus={handleChangeStatus} />
                    </div>
                  ),
                },
                {
                  key: "calendario",
                  label: "Calendário",
                  content: (
                    <div className="px-6 py-6 lg:px-8">
                      <CalendarioTab tasks={tasks} onEdit={openEditDrawer} />
                    </div>
                  ),
                },
              ]}
            />
          )}
        </div>

        <IndicatorsRail tasks={tasks} />
      </div>

      <TaskDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => {
          setDrawerOpen(false);
          router.refresh();
        }}
        clients={clients}
        members={members}
        task={editingTask}
        defaultClientId={activeClient}
      />
    </>
  );
}
