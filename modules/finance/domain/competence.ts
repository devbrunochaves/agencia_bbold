/** competence_month is always normalized to the first day of the month (see migration). */

export function currentCompetenceMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export function shiftCompetenceMonth(competenceMonth: string, deltaMonths: number): string {
  const [year, month] = competenceMonth.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + deltaMonths, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export function formatCompetenceMonth(competenceMonth: string): string {
  const [year, month] = competenceMonth.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    date
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
}
