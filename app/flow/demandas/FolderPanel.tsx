"use client";

import { useState } from "react";
import { Folder } from "lucide-react";
import { SearchInput } from "@/components/flow/ui";
import { demoFolders } from "@/data/flow-demo/tasks";

export default function FolderPanel() {
  const [search, setSearch] = useState("");

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-flow-border px-4 py-5 lg:flex">
      <SearchInput
        placeholder="Buscar pasta ou lista..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-5"
      />

      <div className="flex flex-col gap-5 overflow-y-auto">
        {demoFolders
          .filter((folder) => folder.group.toLowerCase().includes(search.toLowerCase()) || search === "")
          .map((folder) => (
            <div key={folder.group}>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-flow-text-muted">
                <Folder size={13} strokeWidth={1.75} />
                {folder.group}
                <span className="ml-auto rounded-full border border-flow-border px-1.5 py-0.5 text-[10px] normal-case tracking-normal">
                  {folder.organization}
                </span>
              </p>
              <ul className="flex flex-col gap-0.5">
                {folder.clients.map((client) => (
                  <li key={client}>
                    <button
                      type="button"
                      className="w-full rounded-md px-2 py-1.5 text-left text-sm text-flow-text-secondary transition-colors hover:bg-flow-panel-alt hover:text-flow-text-primary"
                    >
                      {client}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    </aside>
  );
}
