import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext } from "@/modules/identity";
import { listServices as listServicesRepository } from "../infrastructure/services.repository";
import type { Service } from "../domain/types";

/**
 * Organization-scoped service catalogue for the current session. Resolves
 * the organization from the authenticated context — never from a
 * client-supplied id.
 */
export async function listServices(): Promise<Service[]> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) return [];

  const supabase = await createSupabaseServerClient();
  return listServicesRepository(supabase, context.currentMembership.organization.id);
}
