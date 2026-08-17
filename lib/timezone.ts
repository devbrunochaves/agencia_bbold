/**
 * Fase 9 audit (§29) — explicit operational timezone decision for the V1:
 * the agency operates in a single Brazilian timezone, so the Flow has no
 * per-organization timezone setting yet (deliberate, not an oversight —
 * a future addition if BBOLD ever operates across timezones).
 *
 * Use this helper anywhere a `timestamptz` value (an instant — e.g.
 * `signed_at`, `sent_at`, `completed_at`, `cancelled_at`) needs to be
 * bucketed into a calendar year/month/day *as the agency experiences it*.
 * Never hand-roll a `-3` hour offset — `Intl.DateTimeFormat` with an
 * explicit `timeZone` handles DST-free Brazil correctly and centralizes
 * the decision in one place.
 *
 * Plain `date` columns (e.g. `due_date`, `competence_month`, `paid_at`,
 * `invoice_issued_at`) are calendar dates already, not instants — they
 * don't need this helper, just parse them as `${date}T00:00:00` locally,
 * as the rest of the codebase already does (see app/flow/demandas/format.ts).
 */
export const OPERATIONAL_TIMEZONE = "America/Sao_Paulo";

/** Year/month/day of an ISO instant (e.g. a timestamptz string) as seen in the operational timezone. */
export function toOperationalDateParts(isoInstant: string): { year: number; month: number; day: number } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: OPERATIONAL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [{ value: year }, , { value: month }, , { value: day }] = formatter.formatToParts(new Date(isoInstant));
  return { year: Number(year), month: Number(month), day: Number(day) };
}
