import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext } from "./get-current-user-context";
import { hasPermission } from "../domain/types";
import { listRoles as listRolesRepository, listPermissions as listPermissionsRepository } from "../infrastructure/roles.repository";
import type { Permission, RoleWithPermissions } from "../domain/roles";
import { UnauthorizedError } from "./errors";

export async function listRoles(): Promise<RoleWithPermissions[]> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) return [];
  if (!hasPermission(context.currentMembership, "members.view")) throw new UnauthorizedError();

  const supabase = await createSupabaseServerClient();
  return listRolesRepository(supabase, context.currentMembership.organization.id);
}

export async function listPermissions(): Promise<Permission[]> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) return [];
  if (!hasPermission(context.currentMembership, "members.view")) throw new UnauthorizedError();

  const supabase = await createSupabaseServerClient();
  return listPermissionsRepository(supabase);
}
