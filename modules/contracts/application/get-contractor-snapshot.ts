import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext } from "@/modules/identity";
import { getOrganizationContractorSnapshot } from "../infrastructure/organization-snapshot.repository";
import type { PartySnapshot } from "../domain/types";

export async function getContractorSnapshot(): Promise<PartySnapshot | null> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) return null;

  const supabase = await createSupabaseServerClient();
  return getOrganizationContractorSnapshot(supabase, context.currentMembership.organization.id);
}
