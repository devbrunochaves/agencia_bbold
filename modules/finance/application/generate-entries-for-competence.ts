import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { listRecurrences } from "../infrastructure/financial-recurrences.repository";
import { insertGeneratedEntries, listEntries } from "../infrastructure/financial-entries.repository";
import { centsToAmountString } from "../domain/money";
import { UnauthorizedError, ValidationError } from "./errors";

const isoMonth = /^\d{4}-\d{2}-01$/;

function dueDateForMonth(competenceMonth: string, dayOfMonth: number | null): string | null {
  if (!dayOfMonth) return null;
  const [year, month] = competenceMonth.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(dayOfMonth, lastDay);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * "Gerar lançamentos do mês" — lazy, on-demand generation instead of a
 * cron/scheduler (§17). Idempotent: relies on
 * financial_entries_recurrence_competence_uidx (recurrence_id, competence_month)
 * to make re-running this for the same month a safe no-op for entries that
 * already exist, and additionally pre-filters in memory so we never even
 * attempt the duplicate insert.
 */
export async function generateEntriesForCompetence(
  competenceMonth: string
): Promise<{ created: number; skipped: number }> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) throw new UnauthorizedError();
  if (!hasPermission(context.currentMembership, "finance.manage")) throw new UnauthorizedError();
  if (!isoMonth.test(competenceMonth)) throw new ValidationError("Competência inválida");

  const organizationId = context.currentMembership.organization.id;
  const supabase = await createSupabaseServerClient();

  const [recurrences, existingEntries] = await Promise.all([
    listRecurrences(supabase, organizationId, { activeOnly: true }),
    listEntries(supabase, organizationId, { competenceMonth }),
  ]);

  const existingRecurrenceIds = new Set(
    existingEntries.map((e) => e.recurrenceId).filter((id): id is string => id !== null)
  );

  const dueThisMonth = recurrences.filter((r) => {
    if (r.frequency !== "monthly") return false;
    if (r.startDate > competenceMonth) return false;
    return !(r.endDate && r.endDate < competenceMonth);
  });
  const eligible = dueThisMonth.filter((r) => !existingRecurrenceIds.has(r.id));

  const rows = eligible.map((r) => ({
    organization_id: organizationId,
    client_id: r.clientId,
    category_id: r.categoryId,
    type: r.type,
    description: r.description,
    amount: centsToAmountString(r.amountCents),
    competence_month: competenceMonth,
    due_date: dueDateForMonth(competenceMonth, r.dayOfMonth),
    recurrence_id: r.id,
    created_by: context.user.id,
  }));

  const created = await insertGeneratedEntries(supabase, rows);
  return { created, skipped: dueThisMonth.length - created };
}
