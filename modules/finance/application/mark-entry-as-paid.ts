import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { getEntryById, markAsPaid } from "../infrastructure/financial-entries.repository";
import type { FinancialEntry } from "../domain/types";
import { UnauthorizedError, ValidationError } from "./errors";

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export async function markFinancialEntryAsPaid(id: string, paidAt: string): Promise<FinancialEntry> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) throw new UnauthorizedError();
  if (!hasPermission(context.currentMembership, "finance.manage")) throw new UnauthorizedError();
  if (!isoDate.test(paidAt)) throw new ValidationError("Data inválida");

  const supabase = await createSupabaseServerClient();
  const existing = await getEntryById(supabase, id);
  if (!existing || existing.organizationId !== context.currentMembership.organization.id) {
    throw new UnauthorizedError();
  }

  return markAsPaid(supabase, id, paidAt);
}
