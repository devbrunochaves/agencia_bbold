import type { Metadata } from "next";
import { getFinancialOverview, listFinancialCategories, listFinancialRecurrences } from "@/modules/finance";
import { currentCompetenceMonth } from "@/modules/finance/domain/competence";
import { listClients } from "@/modules/clients";
import { requirePermission } from "@/modules/identity";
import AccessDenied from "@/components/flow/AccessDenied";
import FinanceiroView from "./FinanceiroView";

export const metadata: Metadata = {
  title: "Financeiro — BBOLD Flow",
  robots: { index: false, follow: false },
};

const competenceRegex = /^\d{4}-\d{2}-01$/;

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ competence?: string }>;
}) {
  const check = await requirePermission("finance.view");
  if (!check.ok) return <AccessDenied />;

  const params = await searchParams;
  const competenceMonth = competenceRegex.test(params.competence ?? "")
    ? (params.competence as string)
    : currentCompetenceMonth();

  const [overview, categories, clients, recurrences] = await Promise.all([
    getFinancialOverview(competenceMonth),
    listFinancialCategories(),
    listClients(),
    listFinancialRecurrences(),
  ]);

  if (!overview) {
    return null;
  }

  return (
    <FinanceiroView overview={overview} categories={categories} clients={clients} recurrences={recurrences} />
  );
}
