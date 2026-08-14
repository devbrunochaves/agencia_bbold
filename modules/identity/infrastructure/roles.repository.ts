import type { SupabaseClient } from "@supabase/supabase-js";
import type { Permission, RoleWithPermissions } from "../domain/roles";

interface RoleRow {
  id: string;
  key: string;
  name: string;
  organization_id: string | null;
  is_system: boolean;
  role_permissions: { permission: { key: string } }[];
}

const ROLE_SELECT = `
  id, key, name, organization_id, is_system,
  role_permissions ( permission:permissions ( key ) )
`;

function toRole(row: RoleRow): RoleWithPermissions {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    organizationId: row.organization_id,
    isSystem: row.is_system,
    permissionKeys: row.role_permissions.map((rp) => rp.permission.key),
  };
}

/** System roles (organization_id null) plus this organization's custom roles. */
export async function listRoles(
  supabase: SupabaseClient,
  organizationId: string
): Promise<RoleWithPermissions[]> {
  const { data, error } = await supabase
    .from("roles")
    .select(ROLE_SELECT)
    .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
    .order("is_system", { ascending: false })
    .order("name", { ascending: true });

  if (error) throw error;
  return ((data as unknown as RoleRow[]) ?? []).map(toRole);
}

export async function getSystemRoleId(supabase: SupabaseClient, key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("roles")
    .select("id")
    .eq("key", key)
    .is("organization_id", null)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

export async function listPermissions(supabase: SupabaseClient): Promise<Permission[]> {
  const { data, error } = await supabase
    .from("permissions")
    .select("key, module, description")
    .order("module", { ascending: true });

  if (error) throw error;
  return (data as Permission[]) ?? [];
}

export async function createRole(
  supabase: SupabaseClient,
  organizationId: string,
  input: { key: string; name: string; permissionKeys: string[] }
): Promise<RoleWithPermissions> {
  const { data: role, error } = await supabase
    .from("roles")
    .insert({ organization_id: organizationId, key: input.key, name: input.name, is_system: false })
    .select("id")
    .single();

  if (error) throw error;

  await syncRolePermissions(supabase, role.id, input.permissionKeys);

  const created = await getRoleById(supabase, role.id);
  if (!created) throw new Error("Papel criado, mas não foi possível recarregá-lo.");
  return created;
}

export async function getRoleById(supabase: SupabaseClient, id: string): Promise<RoleWithPermissions | null> {
  const { data, error } = await supabase.from("roles").select(ROLE_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toRole(data as unknown as RoleRow) : null;
}

export async function updateRolePermissions(
  supabase: SupabaseClient,
  roleId: string,
  permissionKeys: string[]
): Promise<RoleWithPermissions> {
  await syncRolePermissions(supabase, roleId, permissionKeys);

  const role = await getRoleById(supabase, roleId);
  if (!role) throw new Error("Papel atualizado, mas não foi possível recarregá-lo.");
  return role;
}

async function syncRolePermissions(
  supabase: SupabaseClient,
  roleId: string,
  permissionKeys: string[]
): Promise<void> {
  const { data: permissions, error: permissionsError } = await supabase
    .from("permissions")
    .select("id, key")
    .in("key", permissionKeys);
  if (permissionsError) throw permissionsError;

  const permissionIds = (permissions ?? []).map((p) => p.id as string);

  const { error: deleteError } = await supabase.from("role_permissions").delete().eq("role_id", roleId);
  if (deleteError) throw deleteError;

  if (permissionIds.length > 0) {
    const { error: insertError } = await supabase
      .from("role_permissions")
      .insert(permissionIds.map((permissionId) => ({ role_id: roleId, permission_id: permissionId })));
    if (insertError) throw insertError;
  }
}
