import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { CreateFinancialEntrySchema, type CreateFinancialEntryInput } from "../domain/schemas";
import { createEntry } from "../infrastructure/financial-entries.repository";
import type { FinancialEntry } from "../domain/types";
import { UnauthorizedError, ValidationError } from "./errors";

/** organization_id and created_by resolved from the session — never from the form. */
export async function createFinancialEntry(input: CreateFinancialEntryInput): Promise<FinancialEntry> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) throw new UnauthorizedError();
  if (!hasPermission(context.currentMembership, "finance.manage")) throw new UnauthorizedError();

  const parsed = CreateFinancialEntrySchema.safeParse(input);
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message);

  const supabase = await createSupabaseServerClient();
  return createEntry(supabase, context.currentMembership.organization.id, context.user.id, parsed.data);
}
