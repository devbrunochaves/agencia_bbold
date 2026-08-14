import type { Metadata } from "next";
import { getFinancialSettings, listFinancialCategories } from "@/modules/finance";
import { requirePermission } from "@/modules/identity";
import AccessDenied from "@/components/flow/AccessDenied";
import ConfiguracoesView from "./ConfiguracoesView";

export const metadata: Metadata = {
  title: "Configurações — BBOLD Flow",
  robots: { index: false, follow: false },
};

export default async function ConfiguracoesPage() {
  const check = await requirePermission("settings.view");
  if (!check.ok) return <AccessDenied />;

  const [settings, categories] = await Promise.all([
    getFinancialSettings(),
    listFinancialCategories({ includeInactive: true }),
  ]);

  if (!settings) return null;

  return <ConfiguracoesView settings={settings} categories={categories} />;
}
