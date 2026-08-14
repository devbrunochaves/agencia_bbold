import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext } from "./get-current-user-context";
import { hasPermission } from "../domain/types";
import { CreateRoleSchema, UpdateRolePermissionsSchema, type CreateRoleInput, type UpdateRolePermissionsInput } from "../domain/schemas";
import { createRole as createRoleRepository, updateRolePermissions as updateRolePermissionsRepository, getRoleById } from "../infrastructure/roles.repository";
import { buildCustomRoleKey, type RoleWithPermissions } from "../domain/roles";
import { UnauthorizedError, ValidationError } from "./errors";

/** Custom roles always belong to one organization — never a global/shared role (§37). */
export async function createRole(input: CreateRoleInput): Promise<RoleWithPermissions> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) throw new UnauthorizedError();
  if (!hasPermission(context.currentMembership, "members.manage")) throw new UnauthorizedError();

  const parsed = CreateRoleSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message);

  const supabase = await createSupabaseServerClient();
  return createRoleRepository(supabase, context.currentMembership.organization.id, {
    key: buildCustomRoleKey(parsed.data.name),
    name: parsed.data.name,
    permissionKeys: parsed.data.permissionKeys,
  });
}

/** System roles (owner/admin/member) are not editable — enforced here since they have organizationId = null. */
export async function updateRolePermissions(input: UpdateRolePermissionsInput): Promise<RoleWithPermissions> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) throw new UnauthorizedError();
  if (!hasPermission(context.currentMembership, "members.manage")) throw new UnauthorizedError();

  const parsed = UpdateRolePermissionsSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message);

  const supabase = await createSupabaseServerClient();
  const role = await getRoleById(supabase, parsed.data.roleId);
  if (!role || role.organizationId !== context.currentMembership.organization.id) {
    throw new UnauthorizedError();
  }
  if (role.isSystem) {
    throw new ValidationError("Papéis do sistema (Owner, Admin, Member) não podem ser editados.");
  }

  return updateRolePermissionsRepository(supabase, parsed.data.roleId, parsed.data.permissionKeys);
}
