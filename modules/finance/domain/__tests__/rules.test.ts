import { describe, expect, it } from "vitest";
import type { FinancialEntry } from "../types";
import { computeRealizedProfit, sumPaidExpenses, sumPaidIncome } from "../rules";

function makeEntry(overrides: Partial<FinancialEntry> & { id: string; type: "income" | "expense"; status: FinancialEntry["status"]; amountCents: number }): FinancialEntry {
  return {
    organizationId: "org-1",
    clientId: null,
    clientName: null,
    categoryId: null,
    categoryName: null,
    description: `Lançamento ${overrides.id}`,
    competenceMonth: "2026-08-01",
    dueDate: null,
    paidAt: overrides.status === "paid" ? "2026-08-10" : null,
    recurrenceId: null,
    requiresInvoice: false,
    invoiceStatus: "not_required",
    invoiceIssuedAt: null,
    notes: null,
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

describe("sumPaidIncome / sumPaidExpenses / computeRealizedProfit (§63)", () => {
  const entries: FinancialEntry[] = [
    makeEntry({ id: "1", type: "income", status: "paid", amountCents: 500_000 }),
    makeEntry({ id: "2", type: "income", status: "paid", amountCents: 280_000 }),
    makeEntry({ id: "3", type: "income", status: "pending", amountCents: 900_000 }), // not received yet — excluded
    makeEntry({ id: "4", type: "expense", status: "paid", amountCents: 120_000 }),
    makeEntry({ id: "5", type: "expense", status: "pending", amountCents: 60_000 }), // not paid yet — excluded
    makeEntry({ id: "6", type: "income", status: "cancelled", amountCents: 1_000_000 }), // cancelled — excluded
  ];

  it("sums only paid income", () => {
    expect(sumPaidIncome(entries)).toBe(780_000);
  });

  it("sums only paid expenses", () => {
    expect(sumPaidExpenses(entries)).toBe(120_000);
  });

  it("computes realized profit as paid income minus paid expenses — never mixing in planned/pending amounts", () => {
    expect(computeRealizedProfit(entries)).toBe(660_000);
  });

  it("returns 0 for an empty competence with no entries", () => {
    expect(sumPaidIncome([])).toBe(0);
    expect(sumPaidExpenses([])).toBe(0);
    expect(computeRealizedProfit([])).toBe(0);
  });
});
