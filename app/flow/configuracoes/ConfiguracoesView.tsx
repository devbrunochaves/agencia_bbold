import { Building2, ListTree, Settings2, Sparkles } from "lucide-react";
import PageHeader from "@/components/flow/PageHeader";
import { Badge, PageContainer } from "@/components/flow/ui";
import CardComponent from "@/components/flow/Card";
import type { FinancialCategory, OrganizationFinancialSettings } from "@/modules/finance/domain/types";
import FinancialSettingsCard from "./FinancialSettingsCard";
import FinancialCategoriesCard from "./FinancialCategoriesCard";

const comingSoonSections = [
  {
    icon: Building2,
    title: "Organização",
    description: "Nome, slug e identidade da organização no BBOLD Flow.",
  },
  {
    icon: Sparkles,
    title: "Dados da empresa",
    description: "Razão social, documento e informações usadas em contratos.",
  },
  {
    icon: ListTree,
    title: "Serviços",
    description: "Catálogo de serviços oferecidos pela agência.",
  },
  {
    icon: Settings2,
    title: "Preferências",
    description: "Tema, notificações e demais preferências da conta.",
  },
];

export default function ConfiguracoesView({
  settings,
  categories,
}: {
  settings: OrganizationFinancialSettings;
  categories: FinancialCategory[];
}) {
  return (
    <>
      <PageHeader title="Configurações" subtitle="Preferências gerais da organização" />

      <PageContainer>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <FinancialSettingsCard settings={settings} />
          <FinancialCategoriesCard categories={categories} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {comingSoonSections.map((section) => (
            <CardComponent key={section.title} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-flow-panel-alt text-flow-yellow-ink">
                  <section.icon size={18} strokeWidth={1.75} />
                </div>
                <Badge tone="neutral">Em breve</Badge>
              </div>
              <div>
                <p className="text-sm font-semibold text-flow-text-primary">{section.title}</p>
                <p className="mt-1 text-xs text-flow-text-muted">{section.description}</p>
              </div>
            </CardComponent>
          ))}
        </div>
      </PageContainer>
    </>
  );
}
