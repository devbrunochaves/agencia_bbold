import type { DisplayEntryStatus, FinancialEntry, OrganizationFinancialSettings } from "./types";
import { sumCents } from "./money";

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Overdue is never stored — see the migration comment. Pure so it's testable. */
export function isEntryOverdue(entry: FinancialEntry, today = todayISODate()): boolean {
  if (!entry.dueDate) return false;
  if (entry.status === "paid" || entry.status === "cancelled") return false;
  return entry.dueDate < today;
}

export function getDisplayStatus(entry: FinancialEntry, today = todayISODate()): DisplayEntryStatus {
  if (isEntryOverdue(entry, today)) return "overdue";
  return entry.status;
}

function isRealized(entry: FinancialEntry): boolean {
  return entry.status === "paid" && entry.paidAt !== null;
}

export function sumPaidIncome(entries: FinancialEntry[]): number {
  return sumCents(entries.filter((e) => e.type === "income" && isRealized(e)).map((e) => e.amountCents));
}

export function sumPaidExpenses(entries: FinancialEntry[]): number {
  return sumCents(entries.filter((e) => e.type === "expense" && isRealized(e)).map((e) => e.amountCents));
}

/** "Lucro do mês" — realized result only (paid income − paid expenses). Never mixes in forecast. */
export function computeRealizedProfit(entries: FinancialEntry[]): number {
  return sumPaidIncome(entries) - sumPaidExpenses(entries);
}

export function sumReceivable(entries: FinancialEntry[]): number {
  return sumCents(
    entries
      .filter((e) => e.type === "income" && (e.status === "pending" || e.status === "planned"))
      .map((e) => e.amountCents)
  );
}

export function sumPayable(entries: FinancialEntry[]): number {
  return sumCents(
    entries
      .filter((e) => e.type === "expense" && (e.status === "pending" || e.status === "planned"))
      .map((e) => e.amountCents)
  );
}

export interface GoalProgress {
  goalCents: number;
  receivedCents: number;
  percentage: number;
  remainingCents: number;
  exceededByCents: number;
}

export function computeGoalProgress(goalCents: number, receivedCents: number): GoalProgress {
  const percentage = goalCents > 0 ? Math.round((receivedCents / goalCents) * 100) : 0;
  return {
    goalCents,
    receivedCents,
    percentage,
    remainingCents: Math.max(goalCents - receivedCents, 0),
    exceededByCents: Math.max(receivedCents - goalCents, 0),
  };
}

/**
 * "Saldo em caixa" = opening balance + paid income − paid expenses, counted
 * only from entries paid on/after opening_balance_date. Without an opening
 * balance configured (all zero, freshly-seeded settings) this still returns
 * a real, derivable number — it just starts from zero, which is honest
 * (never an invented figure).
 */
export function computeCashBalance(
  entriesSinceOpening: FinancialEntry[],
  settings: OrganizationFinancialSettings
): number {
  return settings.openingBalanceCents + computeRealizedProfit(entriesSinceOpening);
}
