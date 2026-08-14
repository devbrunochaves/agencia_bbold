import PageHeader from "@/components/flow/PageHeader";
import { Tabs } from "@/components/flow/ui";
import FolderPanel from "./FolderPanel";
import IndicatorsRail from "./IndicatorsRail";
import OverviewTab from "./OverviewTab";
import ListaTab from "./ListaTab";
import QuadroTab from "./QuadroTab";
import CalendarioTab from "./CalendarioTab";

export default function DemandasView() {
  return (
    <>
      <PageHeader title="Demandas" subtitle="Operação e produção de conteúdo da agência" />

      <div className="flex">
        <FolderPanel />

        <div className="min-w-0 flex-1">
          <Tabs
            items={[
              { key: "overview", label: "Overview", content: <div className="px-6 py-6 lg:px-8"><OverviewTab /></div> },
              { key: "lista", label: "Lista", content: <div className="px-6 py-6 lg:px-8"><ListaTab /></div> },
              { key: "quadro", label: "Quadro", content: <div className="px-6 py-6 lg:px-8"><QuadroTab /></div> },
              { key: "calendario", label: "Calendário", content: <div className="px-6 py-6 lg:px-8"><CalendarioTab /></div> },
            ]}
          />
        </div>

        <IndicatorsRail />
      </div>
    </>
  );
}
