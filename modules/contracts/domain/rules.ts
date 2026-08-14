import type { Contract, ContractStatus, DisplayContractStatus } from "./types";
import { CONTRACT_STATUS_TRANSITIONS } from "./types";

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Expired is never stored — see the migration comment. Pure so it's testable. */
export function isContractExpired(contract: Contract, today = todayISODate()): boolean {
  if (contract.status !== "signed" || !contract.endDate) return false;
  return contract.endDate < today;
}

export function getDisplayContractStatus(contract: Contract, today = todayISODate()): DisplayContractStatus {
  if (isContractExpired(contract, today)) return "expired";
  return contract.status;
}

export function canTransition(from: ContractStatus, to: ContractStatus): boolean {
  return CONTRACT_STATUS_TRANSITIONS[from].includes(to);
}

/** Sum of installment amounts must equal total_amount — validated here, not in the DB (§12). */
export function installmentsMatchTotal(installmentCents: number[], totalAmountCents: number): boolean {
  return installmentCents.reduce((sum, v) => sum + v, 0) === totalAmountCents;
}

/** Splits a total into N installments, putting the rounding remainder on the last one. */
export function splitAmountIntoInstallments(totalCents: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(totalCents / count);
  const remainder = totalCents - base * count;
  return Array.from({ length: count }, (_, i) => (i === count - 1 ? base + remainder : base));
}

/**
 * "Valor do mês" — sum of totalAmount (one_time/installment) or
 * recurringAmount (recurring) for contracts whose signed_at falls in the
 * given competence month. Explicit metric: signed value, not receita
 * financeira (that's Financeiro's job) — avoids an ambiguous number.
 */
export function sumSignedValueForMonth(contracts: Contract[], competenceMonth: string): number {
  const [year, month] = competenceMonth.split("-").map(Number);
  return contracts
    .filter((c) => {
      if (c.status !== "signed" || !c.signedAt) return false;
      const signedDate = new Date(c.signedAt);
      return signedDate.getUTCFullYear() === year && signedDate.getUTCMonth() + 1 === month;
    })
    .reduce((sum, c) => sum + (c.billingType === "recurring" ? c.recurringAmountCents ?? 0 : c.totalAmountCents ?? 0), 0);
}
