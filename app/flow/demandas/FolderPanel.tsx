"use client";

import { useMemo, useState } from "react";
import { Folder } from "lucide-react";
import { SearchInput } from "@/components/flow/ui";
import type { Client } from "@/modules/clients/domain/types";
import type { Service } from "@/modules/services/domain/types";

export default function FolderPanel({
  services,
  clients,
  activeServiceId,
  activeClientId,
  onSelectService,
  onSelectClient,
}: {
  services: Service[];
  clients: Client[];
  activeServiceId: string | null;
  activeClientId: string | null;
  onSelectService: (serviceId: string | null) => void;
  onSelectClient: (serviceId: string, clientId: string | null) => void;
}) {
  const [search, setSearch] = useState("");

  const groups = useMemo(
    () =>
      services.map((service) => ({
        service,
        clients: clients.filter((client) =>
          client.services.some((s) => s.serviceId === service.id && s.status !== "ended")
        ),
      })),
    [services, clients]
  );

  const filteredGroups = groups.filter(
    (group) => search === "" || group.service.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-flow-border px-4 py-5 lg:flex">
      <SearchInput
        placeholder="Buscar pasta ou lista..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-5"
      />

      <div className="flex flex-col gap-5 overflow-y-auto">
        {filteredGroups.map(({ service, clients: serviceClients }) => (
          <div key={service.id}>
            <button
              type="button"
              onClick={() => onSelectService(activeServiceId === service.id ? null : service.id)}
              className={`mb-2 flex w-full items-center gap-2 rounded-md px-1 py-0.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                activeServiceId === service.id && !activeClientId
                  ? "text-flow-yellow"
                  : "text-flow-text-muted hover:text-flow-text-primary"
              }`}
            >
              <Folder size={13} strokeWidth={1.75} />
              {service.name}
              <span className="ml-auto rounded-full border border-flow-border px-1.5 py-0.5 text-[10px] normal-case tracking-normal">
                {serviceClients.length}
              </span>
            </button>
            <ul className="flex flex-col gap-0.5">
              {serviceClients.map((client) => {
                const isActive = activeServiceId === service.id && activeClientId === client.id;
                return (
                  <li key={client.id}>
                    <button
                      type="button"
                      onClick={() => onSelectClient(service.id, isActive ? null : client.id)}
                      className={`w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                        isActive
                          ? "bg-flow-panel-alt text-flow-yellow"
                          : "text-flow-text-secondary hover:bg-flow-panel-alt hover:text-flow-text-primary"
                      }`}
                    >
                      {client.name}
                    </button>
                  </li>
                );
              })}
              {serviceClients.length === 0 && (
                <li className="px-2 py-1 text-xs text-flow-text-muted">Nenhum cliente</li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}
