import type { Metadata } from "next";
import { listContracts, type ContractStatus } from "@/modules/contracts";
import { listClients } from "@/modules/clients";
import { listServices } from "@/modules/services";
import ContratosView from "./ContratosView";

export const metadata: Metadata = {
  title: "Contratos — BBOLD Flow",
  robots: { index: false, follow: false },
};

const VALID_STATUSES: ContractStatus[] = ["draft", "sent", "signed", "cancelled"];

interface ContratosPageProps {
  searchParams: Promise<{ status?: string; client?: string; service?: string; search?: string }>;
}

export default async function ContratosPage({ searchParams }: ContratosPageProps) {
  const params = await searchParams;
  const status = VALID_STATUSES.includes(params.status as ContractStatus)
    ? (params.status as ContractStatus)
    : undefined;

  const [contracts, allContracts, clients, services] = await Promise.all([
    listContracts({
      status,
      clientId: params.client || undefined,
      serviceId: params.service || undefined,
      search: params.search || undefined,
    }),
    listContracts(),
    listClients(),
    listServices(),
  ]);

  return (
    <ContratosView contracts={contracts} allContracts={allContracts} clients={clients} services={services} />
  );
}
