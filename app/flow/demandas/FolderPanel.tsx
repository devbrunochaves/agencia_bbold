"use client";

import { useMemo, useState } from "react";
import { Folder, LayoutGrid } from "lucide-react";
import { SearchInput } from "@/components/flow/ui";
import type { Client } from "@/modules/clients/domain/types";
import { OPEN_TASK_STATUSES, type Task } from "@/modules/tasks/domain/types";

/**
 * One folder per client — not per service. Services still drive task
 * creation, filtering elsewhere, and detail views; they just don't
 * structure this navigation panel anymore (see the refactor that replaced
 * the previous service → client grouping). No new table backs this: a
 * folder is purely `clients` plus an open-task count derived from `tasks`,
 * both already fetched for the page.
 */
export default function FolderPanel({
  clients,
  tasks,
  activeClientId,
  onSelectClient,
}: {
  clients: Client[];
  tasks: Task[];
  activeClientId: string | null;
  onSelectClient: (clientId: string | null) => void;
}) {
  const [search, setSearch] = useState("");

  const openCountByClient = useMemo(() => {
    const counts = new Map<string, number>();
    for (const task of tasks) {
      if (!OPEN_TASK_STATUSES.includes(task.status)) continue;
      counts.set(task.clientId, (counts.get(task.clientId) ?? 0) + 1);
    }
    return counts;
  }, [tasks]);

  const totalOpen = tasks.filter((t) => OPEN_TASK_STATUSES.includes(t.status)).length;

  const folders = useMemo(
    () =>
      clients
        .map((client) => ({ client, count: openCountByClient.get(client.id) ?? 0 }))
        .sort((a, b) => {
          if (a.count > 0 && b.count === 0) return -1;
          if (a.count === 0 && b.count > 0) return 1;
          return a.client.name.localeCompare(b.client.name, "pt-BR");
        }),
    [clients, openCountByClient]
  );

  const filteredFolders = folders.filter(
    (folder) => search === "" || folder.client.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-flow-border px-4 py-5 lg:flex">
      <SearchInput
        placeholder="Buscar cliente..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-5"
      />

      <div className="flex flex-col gap-0.5 overflow-y-auto">
        <button
          type="button"
          onClick={() => onSelectClient(null)}
          className={`mb-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium transition-colors ${
            activeClientId === null
              ? "bg-flow-panel-alt text-flow-yellow-ink"
              : "text-flow-text-secondary hover:bg-flow-panel-alt hover:text-flow-text-primary"
          }`}
        >
          <LayoutGrid size={14} strokeWidth={1.75} />
          Todas as demandas
          <span className="ml-auto rounded-full border border-flow-border px-1.5 py-0.5 text-[10px] text-flow-text-muted">
            {totalOpen}
          </span>
        </button>

        <ul className="flex flex-col gap-0.5">
          {filteredFolders.map(({ client, count }) => {
            const isActive = activeClientId === client.id;
            return (
              <li key={client.id}>
                <button
                  type="button"
                  onClick={() => onSelectClient(isActive ? null : client.id)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                    isActive
                      ? "bg-flow-panel-alt text-flow-yellow-ink"
                      : "text-flow-text-secondary hover:bg-flow-panel-alt hover:text-flow-text-primary"
                  }`}
                >
                  <Folder size={14} strokeWidth={1.75} />
                  <span className="truncate">{client.name}</span>
                  <span className="ml-auto rounded-full border border-flow-border px-1.5 py-0.5 text-[10px] text-flow-text-muted">
                    {count}
                  </span>
                </button>
              </li>
            );
          })}
          {filteredFolders.length === 0 && (
            <li className="px-2 py-1 text-xs text-flow-text-muted">Nenhum cliente encontrado</li>
          )}
        </ul>
      </div>
    </aside>
  );
}
