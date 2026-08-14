import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext } from "./get-current-user-context";
import { hasPermission } from "../domain/types";
import { UpdateMemberRoleSchema, type UpdateMemberRoleInput } from "../domain/schemas";
import { updateMemberRole as updateMemberRoleRepository, getMemberById } from "../infrastructure/members.repository";
import { getRoleById } from "../infrastructure/roles.repository";
import { assertNotLastActiveOwner } from "./last-owner-guard";
import type { Member } from "../domain/members";
import { UnauthorizedError, ValidationError } from "./errors";

export async function updateMemberRole(input: UpdateMemberRoleInput): Promise<Member> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) throw new UnauthorizedError();
  if (!hasPermission(context.currentMembership, "members.manage")) throw new UnauthorizedError();

  const parsed = UpdateMemberRoleSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message);

  const organizationId = context.currentMembership.organization.id;
  const supabase = await createSupabaseServerClient();

  const existing = await getMemberById(supabase, parsed.data.membershipId);
  if (!existing) throw new UnauthorizedError();

  const targetRole = await getRoleById(supabase, parsed.data.roleId);
  if (!targetRole || (targetRole.organizationId !== null && targetRole.organizationId !== organizationId)) {
    throw new ValidationError("Papel inválido.");
  }

  if (targetRole.key !== "owner") {
    await assertNotLastActiveOwner(supabase, organizationId, parsed.data.membershipId);
  }

  return updateMemberRoleRepository(supabase, parsed.data.membershipId, parsed.data.roleId);
}
