import { Building2, DollarSign, ListTree, Settings2, Sparkles, Tags } from "lucide-react";
import PageHeader from "@/components/flow/PageHeader";
import { Badge, PageContainer } from "@/components/flow/ui";
import CardComponent from "@/components/flow/Card";

const sections = [
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
    icon: DollarSign,
    title: "Meta financeira",
    description: "Meta mensal de receita usada no painel do Financeiro.",
  },
  {
    icon: Tags,
    title: "Categorias financeiras",
    description: "Categorias configuráveis de entradas e saídas.",
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

export default function ConfiguracoesView() {
  return (
    <>
      <PageHeader title="Configurações" subtitle="Preferências gerais da organização" />

      <PageContainer>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <CardComponent key={section.title} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-flow-panel-alt text-flow-yellow">
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
