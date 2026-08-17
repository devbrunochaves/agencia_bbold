import type { Metadata } from "next";
import Link from "next/link";
import { getContract, getContractorSnapshot, listContractTemplates } from "@/modules/contracts";
import { getMissingContractorFields } from "@/modules/contracts/domain/rules";
import { listClients } from "@/modules/clients";
import { listServices } from "@/modules/services";
import { requirePermission } from "@/modules/identity";
import AccessDenied from "@/components/flow/AccessDenied";
import { EmptyState } from "@/components/flow/ui";
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

  // §76 — never let a contract be created with the contratada's legal data
  // incomplete; createContract() rejects it server-side regardless, but
  // this avoids the user filling the whole form only to fail on submit.
  // Editing an existing (already-frozen) contract is still allowed.
  const missingFields = getMissingContractorFields(contractorSnapshot);
  if (!params.id && missingFields.length > 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <EmptyState
          title="Dados jurídicos da BBOLD incompletos"
          description={`Configure antes de criar um contrato: ${missingFields.join(", ")}. Isso ainda não tem uma tela dedicada em Configurações — peça para alguém com acesso ao banco atualizar a organização.`}
          action={
            <Link
              href="/flow/contratos"
              className="inline-flex items-center rounded-lg bg-flow-panel-alt px-4 py-2 text-sm font-medium text-flow-text-primary hover:border-flow-border-strong"
            >
              Voltar para Contratos
            </Link>
          }
        />
      </div>
    );
  }

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
