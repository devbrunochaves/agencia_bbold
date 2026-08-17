import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { getFinancialOverview, listFinancialEntries } from "@/modules/finance";
import { shiftCompetenceMonth } from "@/modules/finance/domain/competence";
import { sumReceivable } from "@/modules/finance/domain/rules";
import type { FinancialDashboardOverview, FinancialMonthPoint } from "../domain/types";

const YEAR_MONTHS = 12;

export async function getFinancialDashboardOverview(competenceMonth: string): Promise<FinancialDashboardOverview | null> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) return null;
  if (!hasPermission(context.currentMembership, "finance.view")) return null;

  const overview = await getFinancialOverview(competenceMonth);
  if (!overview) return null;

  // Fase 9 audit (§41) — a single ranged query + in-memory grouping,
  // instead of 12 separate competence-month round-trips.
  const monthKeys = Array.from({ length: YEAR_MONTHS }, (_, i) => shiftCompetenceMonth(competenceMonth, i - (YEAR_MONTHS - 1)));
  const yearEntries = await listFinancialEntries({
    competenceFrom: monthKeys[0],
    competenceTo: monthKeys[monthKeys.length - 1],
    type: "income",
    status: "paid",
  });
  const receivedByMonth = new Map<string, number>();
  for (const entry of yearEntries) {
    receivedByMonth.set(entry.competenceMonth, (receivedByMonth.get(entry.competenceMonth) ?? 0) + entry.amountCents);
  }
  const yearlyReceived: FinancialMonthPoint[] = monthKeys.map((month) => ({
    competenceMonth: month,
    receivedCents: receivedByMonth.get(month) ?? 0,
  }));

  return {
    competenceMonth,
    receivedCents: overview.receivedCents,
    receivableCents: sumReceivable(overview.entries),
    paidExpensesCents: overview.paidExpensesCents,
    resultCents: overview.realizedProfitCents,
    pendingInvoiceCount: overview.invoiceSummary.pending,
    yearlyReceived,
  };
}
