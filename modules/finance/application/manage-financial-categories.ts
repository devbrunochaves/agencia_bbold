import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import {
  CreateFinancialCategorySchema,
  UpdateFinancialCategorySchema,
  type CreateFinancialCategoryInput,
  type UpdateFinancialCategoryInput,
} from "../domain/schemas";
import { createCategory, updateCategory } from "../infrastructure/financial-categories.repository";
import type { FinancialCategory } from "../domain/types";
import { UnauthorizedError, ValidationError } from "./errors";

export async function createFinancialCategory(input: CreateFinancialCategoryInput): Promise<FinancialCategory> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) throw new UnauthorizedError();
  if (!hasPermission(context.currentMembership, "finance.manage")) throw new UnauthorizedError();

  const parsed = CreateFinancialCategorySchema.safeParse(input);
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message);

  const supabase = await createSupabaseServerClient();
  return createCategory(supabase, context.currentMembership.organization.id, parsed.data);
}

/** Categories are never physically deleted — "remove" means active=false (§56). */
export async function updateFinancialCategory(input: UpdateFinancialCategoryInput): Promise<FinancialCategory> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) throw new UnauthorizedError();
  if (!hasPermission(context.currentMembership, "finance.manage")) throw new UnauthorizedError();

  const parsed = UpdateFinancialCategorySchema.safeParse(input);
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message);

  const supabase = await createSupabaseServerClient();
  const { id, ...patch } = parsed.data;
  return updateCategory(supabase, id, patch);
}
