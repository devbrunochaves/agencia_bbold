import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { UpdateFinancialEntrySchema, type UpdateFinancialEntryInput } from "../domain/schemas";
import { getEntryById, updateEntry } from "../infrastructure/financial-entries.repository";
import type { FinancialEntry } from "../domain/types";
import { UnauthorizedError, ValidationError } from "./errors";

export async function updateFinancialEntry(input: UpdateFinancialEntryInput): Promise<FinancialEntry> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) throw new UnauthorizedError();
  if (!hasPermission(context.currentMembership, "finance.manage")) throw new UnauthorizedError();

  const parsed = UpdateFinancialEntrySchema.safeParse(input);
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message);

  const supabase = await createSupabaseServerClient();

  const existing = await getEntryById(supabase, parsed.data.id);
  if (!existing || existing.organizationId !== context.currentMembership.organization.id) {
    throw new UnauthorizedError();
  }

  const { id, ...formInput } = parsed.data;
  return updateEntry(supabase, id, formInput);
}
