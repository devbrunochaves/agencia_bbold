import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { countOpenTasksByClient } from "../infrastructure/tasks.repository";

export async function getOpenTaskCountsByClient(): Promise<Record<string, number>> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) return {};
  if (!hasPermission(context.currentMembership, "tasks.view")) return {};

  const supabase = await createSupabaseServerClient();
  return countOpenTasksByClient(supabase, context.currentMembership.organization.id);
}
