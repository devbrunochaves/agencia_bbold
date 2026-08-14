import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppUser, MembershipContext, Organization, UserContext } from "../domain/types";

interface RoleRow {
  id: string;
  key: string;
  name: string;
  organization_id: string | null;
  is_system: boolean;
  role_permissions: { permission: { key: string } }[];
}

interface MembershipRow {
  id: string;
  organization: Organization;
  role: RoleRow;
}

/**
 * Loads the full identity context (user + active memberships + resolved
 * permissions) for the currently authenticated Supabase session. Every
 * caller in the UI layer goes through this instead of hitting
 * `supabase.from(...)` directly, so the shape of "who can do what" lives in
 * one place.
 */
export async function getUserContext(
  supabase: SupabaseClient
): Promise<UserContext | null> {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, email, full_name, avatar_url")
    .eq("id", authUser.id)
    .maybeSingle();

  const user: AppUser = {
    id: authUser.id,
    email: profile?.email ?? authUser.email ?? "",
    fullName: profile?.full_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
  };

  const { data: membershipRows, error } = await supabase
    .from("memberships")
    .select(
      `
        id,
        organization:organizations ( id, name, slug ),
        role:roles (
          id, key, name, organization_id, is_system,
          role_permissions ( permission:permissions ( key ) )
        )
      `
    )
    .eq("user_id", authUser.id)
    .eq("status", "active");

  if (error) throw error;

  const memberships: MembershipContext[] = ((membershipRows ?? []) as unknown as MembershipRow[]).map(
    (row) => ({
      membershipId: row.id,
      organization: row.organization,
      role: {
        id: row.role.id,
        key: row.role.key,
        name: row.role.name,
        organizationId: row.role.organization_id,
        isSystem: row.role.is_system,
      },
      permissions: new Set(row.role.role_permissions.map((rp) => rp.permission.key)),
    })
  );

  return {
    user,
    memberships,
    currentMembership: memberships[0] ?? null,
  };
}
