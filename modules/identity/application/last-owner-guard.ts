import type { SupabaseClient } from "@supabase/supabase-js";
import { getMemberById, countActiveOwners } from "../infrastructure/members.repository";
import { getSystemRoleId } from "../infrastructure/roles.repository";
import { ValidationError } from "./errors";

/**
 * Application-layer half of last-Owner protection (§38/§39) — the
 * companion DB trigger (prevent_last_owner_removal, phase 7 migration) is
 * defense in depth, not the only line of defense: this runs first and
 * produces a clear message instead of a raw Postgres exception bubbling up.
 */
export async function assertNotLastActiveOwner(
  supabase: SupabaseClient,
  organizationId: string,
  membershipId: string
): Promise<void> {
  const member = await getMemberById(supabase, membershipId);
  if (!member || member.roleKey !== "owner" || member.status !== "active") return;

  const ownerRoleId = await getSystemRoleId(supabase, "owner");
  if (!ownerRoleId) return;

  const remaining = await countActiveOwners(supabase, organizationId, ownerRoleId, membershipId);
  if (remaining === 0) {
    throw new ValidationError(
      "Não é possível remover, suspender ou rebaixar o último Owner ativo da organização."
    );
  }
}
