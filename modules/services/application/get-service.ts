import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext } from "@/modules/identity";
import { getServiceById } from "../infrastructure/services.repository";
import type { Service } from "../domain/types";

export async function getService(id: string): Promise<Service | null> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) return null;

  const supabase = await createSupabaseServerClient();
  const service = await getServiceById(supabase, id);
  if (service && service.organizationId !== context.currentMembership.organization.id) return null;
  return service;
}
