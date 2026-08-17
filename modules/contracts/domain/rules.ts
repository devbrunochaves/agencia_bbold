import type { Contract, ContractStatus, DisplayContractStatus, PartySnapshot } from "./types";
import { CONTRACT_STATUS_TRANSITIONS } from "./types";
import { toOperationalDateParts } from "@/lib/timezone";

/**
 * Fase 9 audit (§76) — required BBOLD (contratada) legal fields for a
 * real contract. The seed ships obviously-fake placeholder values (CNPJ
 * "00000000000000" etc.) so this deliberately only checks *presence*, not
 * plausibility — detecting "looks fake" is out of scope and would be an
 * unreliable heuristic. An organization that never configured its legal
 * data at all (nulls, the pre-seed state) is what this blocks.
 */
const REQUIRED_CONTRACTOR_FIELDS: { key: keyof PartySnapshot; label: string }[] = [
  { key: "legalName", label: "Razão social" },
  { key: "documentNumber", label: "CNPJ" },
  { key: "addressStreet", label: "Endereço" },
  { key: "addressCity", label: "Cidade" },
  { key: "addressState", label: "Estado" },
  { key: "representativeName", label: "Representante" },
  { key: "representativeDocument", label: "Documento do representante" },
];

export function getMissingContractorFields(snapshot: PartySnapshot): string[] {
  return REQUIRED_CONTRACTOR_FIELDS.filter((f) => !snapshot[f.key]).map((f) => f.label);
}

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
 *
 * `signed_at` is a timestamptz (a real instant, set to `now()` when the
 * contract transitions to "signed" — see the migration trigger), so it
 * must be bucketed into a month using the operational timezone (§29),
 * never UTC — a contract signed late at night in Brazil near a month
 * boundary would otherwise land in the wrong competence month.
 */
export function sumSignedValueForMonth(contracts: Contract[], competenceMonth: string): number {
  const [year, month] = competenceMonth.split("-").map(Number);
  return contracts
    .filter((c) => {
      if (c.status !== "signed" || !c.signedAt) return false;
      const signedDate = toOperationalDateParts(c.signedAt);
      return signedDate.year === year && signedDate.month === month;
    })
    .reduce((sum, c) => sum + (c.billingType === "recurring" ? c.recurringAmountCents ?? 0 : c.totalAmountCents ?? 0), 0);
}
