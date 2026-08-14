import type { Metadata } from "next";
import { getFinancialSettings, listFinancialCategories } from "@/modules/finance";
import ConfiguracoesView from "./ConfiguracoesView";

export const metadata: Metadata = {
  title: "Configurações — BBOLD Flow",
  robots: { index: false, follow: false },
};

export default async function ConfiguracoesPage() {
  const [settings, categories] = await Promise.all([
    getFinancialSettings(),
    listFinancialCategories({ includeInactive: true }),
  ]);

  if (!settings) return null;

  return <ConfiguracoesView settings={settings} categories={categories} />;
}
