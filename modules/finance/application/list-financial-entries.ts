import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { listEntries, type ListFinancialEntriesFilters } from "../infrastructure/financial-entries.repository";
import type { FinancialEntry } from "../domain/types";
import { UnauthorizedError } from "./errors";

export async function listFinancialEntries(filters: ListFinancialEntriesFilters = {}): Promise<FinancialEntry[]> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) return [];
  if (!hasPermission(context.currentMembership, "finance.view")) throw new UnauthorizedError();

  const supabase = await createSupabaseServerClient();
  return listEntries(supabase, context.currentMembership.organization.id, filters);
}
