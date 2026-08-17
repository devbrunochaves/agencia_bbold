import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppUser, MembershipContext, Organization, UserContext } from "../domain/types";
import type { OrganizationMember } from "../domain/member";

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
  client_access_mode: "all" | "restricted";
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
        client_access_mode,
        organization:organizations ( id, name, slug ),
        role:roles (
          id, key, name, organization_id, is_system,
          role_permissions ( permission:permissions ( key ) )
        )
      `
    )
    .eq("user_id", authUser.id)
    .eq("status", "active")
    // Fase 9 audit (§59) — without an explicit order, "the first membership"
    // was whatever order Postgres happened to return, not a stable choice.
    // Until a real organization switcher exists, the oldest membership
    // (first one the user was added to) is the deterministic default.
    .order("created_at", { ascending: true });

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
      clientAccessMode: row.client_access_mode,
    })
  );

  const currentMembership = memberships[0] ?? null;
  let accountStatus: UserContext["accountStatus"] = "active";

  if (!currentMembership) {
    // No active membership — find out why, so the UI can tell "suspended"
    // apart from "never invited" apart from "invite not yet accepted".
    const { data: anyMembership } = await supabase
      .from("memberships")
      .select("status")
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!anyMembership) accountStatus = "no_membership";
    else if (anyMembership.status === "suspended") accountStatus = "suspended";
    else if (anyMembership.status === "removed") accountStatus = "removed";
    else if (anyMembership.status === "invited") accountStatus = "invited_only";
    else accountStatus = "no_membership";
  }

  return {
    user,
    memberships,
    currentMembership,
    accountStatus,
  };
}

interface MembershipMemberRow {
  user_id: string;
  role: { name: string } | null;
  user: { full_name: string | null; email: string } | null;
}

/** Active memberships of an organization, for pickers (task assignee, etc). */
export async function listActiveMembers(
  supabase: SupabaseClient,
  organizationId: string
): Promise<OrganizationMember[]> {
  const { data, error } = await supabase
    .from("memberships")
    .select("user_id, role:roles ( name ), user:users ( full_name, email )")
    .eq("organization_id", organizationId)
    .eq("status", "active");

  if (error) throw error;

  return ((data as unknown as MembershipMemberRow[]) ?? []).map((row) => ({
    userId: row.user_id,
    name: row.user?.full_name || row.user?.email || "—",
    roleName: row.role?.name ?? "",
  }));
}
