import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { CreateFinancialRecurrenceSchema, type CreateFinancialRecurrenceInput } from "../domain/schemas";
import { createRecurrence, updateRecurrenceActive } from "../infrastructure/financial-recurrences.repository";
import type { FinancialRecurrence } from "../domain/types";
import { UnauthorizedError, ValidationError } from "./errors";

export async function createFinancialRecurrence(
  input: CreateFinancialRecurrenceInput
): Promise<FinancialRecurrence> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) throw new UnauthorizedError();
  if (!hasPermission(context.currentMembership, "finance.manage")) throw new UnauthorizedError();

  const parsed = CreateFinancialRecurrenceSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message);

  const supabase = await createSupabaseServerClient();
  return createRecurrence(supabase, context.currentMembership.organization.id, context.user.id, parsed.data);
}

export async function setFinancialRecurrenceActive(id: string, active: boolean): Promise<FinancialRecurrence> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) throw new UnauthorizedError();
  if (!hasPermission(context.currentMembership, "finance.manage")) throw new UnauthorizedError();

  const supabase = await createSupabaseServerClient();
  return updateRecurrenceActive(supabase, id, active);
}
