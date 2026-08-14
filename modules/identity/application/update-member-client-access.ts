import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext } from "./get-current-user-context";
import { hasPermission } from "../domain/types";
import { UpdateMemberClientAccessSchema, type UpdateMemberClientAccessInput } from "../domain/schemas";
import { updateMemberClientAccess as updateRepository, getMemberById } from "../infrastructure/members.repository";
import type { Member } from "../domain/members";
import { UnauthorizedError, ValidationError } from "./errors";

export async function updateMemberClientAccess(input: UpdateMemberClientAccessInput): Promise<Member> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) throw new UnauthorizedError();
  if (!hasPermission(context.currentMembership, "members.manage")) throw new UnauthorizedError();

  const parsed = UpdateMemberClientAccessSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message);

  const supabase = await createSupabaseServerClient();
  const existing = await getMemberById(supabase, parsed.data.membershipId);
  if (!existing) throw new UnauthorizedError();

  return updateRepository(supabase, parsed.data.membershipId, parsed.data.clientAccessMode, parsed.data.clientIds);
}
