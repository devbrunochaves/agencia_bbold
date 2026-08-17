import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { listEntries } from "../infrastructure/financial-entries.repository";
import { getSettings } from "../infrastructure/financial-settings.repository";
import { shiftCompetenceMonth } from "../domain/competence";
import {
  computeCashBalance,
  computeGoalProgress,
  computeRealizedProfit,
  sumPaidExpenses,
  sumPaidIncome,
  type GoalProgress,
} from "../domain/rules";
import type { FinancialEntry, OrganizationFinancialSettings } from "../domain/types";
import { UnauthorizedError } from "./errors";

export interface CashflowPoint {
  month: string;
  incomeCents: number;
  expenseCents: number;
}

export interface InvoiceSummary {
  toIssue: number;
  issued: number;
  pending: number;
}

export interface FinancialOverview {
  competenceMonth: string;
  entries: FinancialEntry[];
  settings: OrganizationFinancialSettings;
  realizedProfitCents: number;
  receivedCents: number;
  paidExpensesCents: number;
  cashBalanceCents: number;
  goalProgress: GoalProgress;
  cashflow: CashflowPoint[];
  invoiceQueue: FinancialEntry[];
  invoiceSummary: InvoiceSummary;
}

const CASHFLOW_MONTHS = 6;

export async function getFinancialOverview(competenceMonth: string): Promise<FinancialOverview | null> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) return null;

  if (!hasPermission(context.currentMembership, "finance.view")) {
    throw new UnauthorizedError();
  }

  const organizationId = context.currentMembership.organization.id;
  const supabase = await createSupabaseServerClient();

  const settings = await getSettings(supabase, organizationId);

  const monthKeys = Array.from({ length: CASHFLOW_MONTHS }, (_, i) =>
    shiftCompetenceMonth(competenceMonth, i - (CASHFLOW_MONTHS - 1))
  );

  // Fase 9 audit (§41) — a single ranged query + in-memory grouping,
  // instead of one round-trip per cashflow month.
  const [entries, entriesSinceOpening, cashflowRangeEntries] = await Promise.all([
    listEntries(supabase, organizationId, { competenceMonth }),
    listEntries(supabase, organizationId, { status: "paid", paidSince: settings.openingBalanceDate }),
    listEntries(supabase, organizationId, {
      competenceFrom: monthKeys[0],
      competenceTo: monthKeys[monthKeys.length - 1],
      status: "paid",
    }),
  ]);

  const entriesByMonth = new Map<string, typeof cashflowRangeEntries>();
  for (const entry of cashflowRangeEntries) {
    const bucket = entriesByMonth.get(entry.competenceMonth) ?? [];
    bucket.push(entry);
    entriesByMonth.set(entry.competenceMonth, bucket);
  }
  const cashflowByMonth = monthKeys.map((month) => {
    const monthEntries = entriesByMonth.get(month) ?? [];
    return {
      month,
      incomeCents: sumPaidIncome(monthEntries),
      expenseCents: sumPaidExpenses(monthEntries),
    };
  });

  const receivedCents = sumPaidIncome(entries);
  const paidExpensesCents = sumPaidExpenses(entries);
  const realizedProfitCents = computeRealizedProfit(entries);
  const cashBalanceCents = computeCashBalance(entriesSinceOpening, settings);
  const goalProgress = computeGoalProgress(settings.monthlyRevenueGoalCents, receivedCents);

  const invoiceQueue = entries.filter((e) => e.requiresInvoice && e.invoiceStatus === "pending");
  const invoiceEntries = entries.filter((e) => e.requiresInvoice);
  const invoiceSummary: InvoiceSummary = {
    toIssue: invoiceEntries.length,
    issued: invoiceEntries.filter((e) => e.invoiceStatus === "issued").length,
    pending: invoiceQueue.length,
  };

  return {
    competenceMonth,
    entries,
    settings,
    realizedProfitCents,
    receivedCents,
    paidExpensesCents,
    cashBalanceCents,
    goalProgress,
    cashflow: cashflowByMonth,
    invoiceQueue,
    invoiceSummary,
  };
}

// Re-exported for callers that only need the settings shape alongside the overview.
export type { OrganizationFinancialSettings };
