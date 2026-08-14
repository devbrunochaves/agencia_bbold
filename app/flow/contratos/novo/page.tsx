import type { Metadata } from "next";
import { getContract, getContractorSnapshot, listContractTemplates } from "@/modules/contracts";
import { listClients } from "@/modules/clients";
import { listServices } from "@/modules/services";
import { requirePermission } from "@/modules/identity";
import AccessDenied from "@/components/flow/AccessDenied";
import ContractEditorView from "./ContractEditorView";

export const metadata: Metadata = {
  title: "Novo contrato — BBOLD Flow",
  robots: { index: false, follow: false },
};

export default async function NovoContratoPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const check = await requirePermission("contracts.manage");
  if (!check.ok) return <AccessDenied backHref="/flow/contratos" />;

  const params = await searchParams;

  const [clients, services, templates, contractorSnapshot, contract] = await Promise.all([
    listClients(),
    listServices(),
    listContractTemplates(),
    getContractorSnapshot(),
    params.id ? getContract(params.id) : Promise.resolve(null),
  ]);

  if (!contractorSnapshot) return null;

  return (
    <ContractEditorView
      clients={clients}
      services={services}
      templates={templates}
      contractorSnapshot={contractorSnapshot}
      contract={contract}
    />
  );
}
