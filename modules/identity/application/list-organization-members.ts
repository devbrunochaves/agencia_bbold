import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext } from "./get-current-user-context";
import { listActiveMembers } from "../infrastructure/identity.repository";
import type { OrganizationMember } from "../domain/member";

/**
 * Active memberships of the current organization, for pickers (task
 * assignee, etc). Not the same as identity.repository's getUserContext,
 * which resolves only the signed-in user's own memberships.
 */
export async function listOrganizationMembers(): Promise<OrganizationMember[]> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) return [];

  const supabase = await createSupabaseServerClient();
  return listActiveMembers(supabase, context.currentMembership.organization.id);
}
