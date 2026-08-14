import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext } from "./get-current-user-context";
import { hasPermission } from "../domain/types";
import { listMembers as listMembersRepository } from "../infrastructure/members.repository";
import type { Member } from "../domain/members";
import { UnauthorizedError } from "./errors";

export async function listMembers(): Promise<Member[]> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) return [];
  if (!hasPermission(context.currentMembership, "members.view")) throw new UnauthorizedError();

  const supabase = await createSupabaseServerClient();
  return listMembersRepository(supabase, context.currentMembership.organization.id);
}
