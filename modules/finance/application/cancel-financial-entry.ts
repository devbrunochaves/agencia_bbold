import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { cancelEntry, getEntryById } from "../infrastructure/financial-entries.repository";
import type { FinancialEntry } from "../domain/types";
import { UnauthorizedError } from "./errors";

export async function cancelFinancialEntry(id: string): Promise<FinancialEntry> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) throw new UnauthorizedError();
  if (!hasPermission(context.currentMembership, "finance.manage")) throw new UnauthorizedError();

  const supabase = await createSupabaseServerClient();
  const existing = await getEntryById(supabase, id);
  if (!existing || existing.organizationId !== context.currentMembership.organization.id) {
    throw new UnauthorizedError();
  }

  return cancelEntry(supabase, id);
}
