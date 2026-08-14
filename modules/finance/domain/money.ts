/**
 * Money is always handled as integer cents in application code — never a
 * JS float. `numeric(14,2)` columns come back from PostgREST as strings
 * (or occasionally numbers for small values); both paths go through
 * parseAmountToCents so arithmetic in rules.ts never touches a float.
 */

export function parseAmountToCents(value: string | number): number {
  const str = typeof value === "number" ? value.toFixed(2) : value;
  const [whole, fraction = "0"] = str.split(".");
  const sign = whole.startsWith("-") ? -1 : 1;
  const wholeAbs = whole.replace("-", "");
  const cents = Number(wholeAbs) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
  return sign * cents;
}

export function centsToAmountString(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  const whole = Math.floor(abs / 100);
  const fraction = String(abs % 100).padStart(2, "0");
  return `${sign}${whole}.${fraction}`;
}

/** Parses a BRL-formatted or plain user input ("1800", "1800,50", "1.800,50") into cents. */
export function parseUserAmountToCents(input: string): number {
  const normalized = input.trim().replace(/[^\d,.-]/g, "");
  if (!normalized) return 0;

  const hasComma = normalized.includes(",");
  const cleaned = hasComma
    ? normalized.replace(/\./g, "").replace(",", ".")
    : normalized;

  const parsed = Number(cleaned);
  if (Number.isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

export function formatCentsAsBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function sumCents(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0);
}
