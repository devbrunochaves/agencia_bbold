import type { Metadata } from "next";
import { listClients, type ClientStatus } from "@/modules/clients";
import { listServices } from "@/modules/services";
import { getOpenTaskCountsByClient } from "@/modules/tasks";
import { requirePermission } from "@/modules/identity";
import AccessDenied from "@/components/flow/AccessDenied";
import ClientesView from "./ClientesView";

export const metadata: Metadata = {
  title: "Clientes — BBOLD Flow",
  robots: { index: false, follow: false },
};

interface ClientesPageProps {
  searchParams: Promise<{ status?: string; search?: string; service?: string }>;
}

const VALID_STATUSES: ClientStatus[] = ["prospect", "active", "paused", "closed"];

export default async function ClientesPage({ searchParams }: ClientesPageProps) {
  const check = await requirePermission("clients.view");
  if (!check.ok) return <AccessDenied />;

  const params = await searchParams;
  const status = VALID_STATUSES.includes(params.status as ClientStatus)
    ? (params.status as ClientStatus)
    : undefined;

  const [allClients, filteredClients, services, openTaskCounts] = await Promise.all([
    listClients(),
    listClients({ status, search: params.search, serviceId: params.service }),
    listServices(),
    getOpenTaskCountsByClient(),
  ]);

  return (
    <ClientesView
      clients={filteredClients}
      services={services}
      totalCount={allClients.length}
      openTaskCounts={openTaskCounts}
    />
  );
}
