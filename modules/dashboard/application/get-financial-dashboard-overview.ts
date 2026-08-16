import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { getFinancialOverview, listFinancialEntries } from "@/modules/finance";
import { shiftCompetenceMonth } from "@/modules/finance/domain/competence";
import { sumPaidIncome, sumReceivable } from "@/modules/finance/domain/rules";
import type { FinancialDashboardOverview, FinancialMonthPoint } from "../domain/types";

const YEAR_MONTHS = 12;

export async function getFinancialDashboardOverview(competenceMonth: string): Promise<FinancialDashboardOverview | null> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) return null;
  if (!hasPermission(context.currentMembership, "finance.view")) return null;

  const overview = await getFinancialOverview(competenceMonth);
  if (!overview) return null;

  const monthKeys = Array.from({ length: YEAR_MONTHS }, (_, i) => shiftCompetenceMonth(competenceMonth, i - (YEAR_MONTHS - 1)));
  const yearlyReceived: FinancialMonthPoint[] = await Promise.all(
    monthKeys.map(async (month) => {
      const entries = await listFinancialEntries({ competenceMonth: month, status: "paid" });
      return { competenceMonth: month, receivedCents: sumPaidIncome(entries) };
    })
  );

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
