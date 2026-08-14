import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { listRecurrences } from "../infrastructure/financial-recurrences.repository";
import type { FinancialRecurrence } from "../domain/types";
import { UnauthorizedError } from "./errors";

export async function listFinancialRecurrences(): Promise<FinancialRecurrence[]> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) return [];
  if (!hasPermission(context.currentMembership, "finance.view")) throw new UnauthorizedError();

  const supabase = await createSupabaseServerClient();
  return listRecurrences(supabase, context.currentMembership.organization.id);
}
