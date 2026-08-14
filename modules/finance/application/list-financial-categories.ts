import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { listCategories } from "../infrastructure/financial-categories.repository";
import type { FinancialCategory, FinancialEntryType } from "../domain/types";
import { UnauthorizedError } from "./errors";

export async function listFinancialCategories(
  options: { type?: FinancialEntryType; includeInactive?: boolean } = {}
): Promise<FinancialCategory[]> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) return [];
  if (!hasPermission(context.currentMembership, "finance.view")) throw new UnauthorizedError();

  const supabase = await createSupabaseServerClient();
  return listCategories(supabase, context.currentMembership.organization.id, options);
}
