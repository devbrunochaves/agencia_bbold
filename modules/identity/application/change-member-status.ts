import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext } from "./get-current-user-context";
import { hasPermission } from "../domain/types";
import { ChangeMemberStatusSchema, type ChangeMemberStatusInput } from "../domain/schemas";
import { changeMemberStatus as changeStatusRepository, getMemberById } from "../infrastructure/members.repository";
import { assertNotLastActiveOwner } from "./last-owner-guard";
import type { Member } from "../domain/members";
import { UnauthorizedError, ValidationError } from "./errors";

/** Covers suspend, reactivate, and remove — status is never DELETEd (§40/§41). */
export async function changeMemberStatus(input: ChangeMemberStatusInput): Promise<Member> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) throw new UnauthorizedError();
  if (!hasPermission(context.currentMembership, "members.manage")) throw new UnauthorizedError();

  const parsed = ChangeMemberStatusSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message);

  const organizationId = context.currentMembership.organization.id;
  const supabase = await createSupabaseServerClient();

  const existing = await getMemberById(supabase, parsed.data.membershipId);
  if (!existing) throw new UnauthorizedError();

  if (parsed.data.status !== "active") {
    await assertNotLastActiveOwner(supabase, organizationId, parsed.data.membershipId);
  }

  return changeStatusRepository(supabase, parsed.data.membershipId, parsed.data.status);
}
