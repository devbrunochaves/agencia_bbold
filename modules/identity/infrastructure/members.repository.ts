import type { SupabaseClient } from "@supabase/supabase-js";
import type { Member } from "../domain/members";
import type { ClientAccessMode, MembershipStatus } from "../domain/types";

interface MemberRow {
  id: string;
  user_id: string | null;
  invited_email: string | null;
  status: MembershipStatus;
  client_access_mode: ClientAccessMode;
  created_at: string;
  role: { id: string; key: string; name: string };
  user: { full_name: string | null; email: string } | null;
  member_client_access: { client_id: string }[];
}

const MEMBER_SELECT = `
  id, user_id, invited_email, status, client_access_mode, created_at,
  role:roles ( id, key, name ),
  user:users ( full_name, email ),
  member_client_access ( client_id )
`;

function toMember(row: MemberRow): Member {
  return {
    membershipId: row.id,
    userId: row.user_id,
    name: row.user?.full_name || row.user?.email || row.invited_email || "—",
    email: row.user?.email ?? row.invited_email ?? "",
    roleId: row.role.id,
    roleKey: row.role.key,
    roleName: row.role.name,
    status: row.status,
    clientAccessMode: row.client_access_mode,
    allowedClientIds: (row.member_client_access ?? []).map((a) => a.client_id),
    createdAt: row.created_at,
  };
}

export async function listMembers(supabase: SupabaseClient, organizationId: string): Promise<Member[]> {
  const { data, error } = await supabase
    .from("memberships")
    .select(MEMBER_SELECT)
    .eq("organization_id", organizationId)
    .neq("status", "removed")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return ((data as unknown as MemberRow[]) ?? []).map(toMember);
}

export async function getMemberById(supabase: SupabaseClient, membershipId: string): Promise<Member | null> {
  const { data, error } = await supabase
    .from("memberships")
    .select(MEMBER_SELECT)
    .eq("id", membershipId)
    .maybeSingle();

  if (error) throw error;
  return data ? toMember(data as unknown as MemberRow) : null;
}

export async function createInvitedMembership(
  supabase: SupabaseClient,
  organizationId: string,
  invitedBy: string,
  input: { email: string; roleId: string; clientAccessMode: ClientAccessMode; clientIds: string[] }
): Promise<Member> {
  const { data, error } = await supabase
    .from("memberships")
    .insert({
      organization_id: organizationId,
      invited_by: invitedBy,
      invited_email: input.email,
      role_id: input.roleId,
      status: "invited",
      client_access_mode: input.clientAccessMode,
    })
    .select("id")
    .single();

  if (error) throw error;

  if (input.clientAccessMode === "restricted" && input.clientIds.length > 0) {
    await setMemberClientAccess(supabase, data.id, input.clientIds);
  }

  const member = await getMemberById(supabase, data.id);
  if (!member) throw new Error("Convite criado, mas não foi possível recarregá-lo.");
  return member;
}

export async function updateMemberRole(
  supabase: SupabaseClient,
  membershipId: string,
  roleId: string
): Promise<Member> {
  const { error } = await supabase.from("memberships").update({ role_id: roleId }).eq("id", membershipId);
  if (error) throw error;

  const member = await getMemberById(supabase, membershipId);
  if (!member) throw new Error("Membro atualizado, mas não foi possível recarregá-lo.");
  return member;
}

export async function updateMemberClientAccess(
  supabase: SupabaseClient,
  membershipId: string,
  mode: ClientAccessMode,
  clientIds: string[]
): Promise<Member> {
  const { error } = await supabase
    .from("memberships")
    .update({ client_access_mode: mode })
    .eq("id", membershipId);
  if (error) throw error;

  await setMemberClientAccess(supabase, membershipId, mode === "restricted" ? clientIds : []);

  const member = await getMemberById(supabase, membershipId);
  if (!member) throw new Error("Membro atualizado, mas não foi possível recarregá-lo.");
  return member;
}

async function setMemberClientAccess(
  supabase: SupabaseClient,
  membershipId: string,
  clientIds: string[]
): Promise<void> {
  const { data: existing, error: existingError } = await supabase
    .from("member_client_access")
    .select("client_id")
    .eq("membership_id", membershipId);
  if (existingError) throw existingError;

  const existingIds = new Set((existing ?? []).map((row) => row.client_id as string));
  const nextIds = new Set(clientIds);

  const toRemove = [...existingIds].filter((id) => !nextIds.has(id));
  const toAdd = [...nextIds].filter((id) => !existingIds.has(id));

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("member_client_access")
      .delete()
      .eq("membership_id", membershipId)
      .in("client_id", toRemove);
    if (error) throw error;
  }

  if (toAdd.length > 0) {
    const { error } = await supabase
      .from("member_client_access")
      .insert(toAdd.map((clientId) => ({ membership_id: membershipId, client_id: clientId })));
    if (error) throw error;
  }
}

export async function changeMemberStatus(
  supabase: SupabaseClient,
  membershipId: string,
  status: MembershipStatus
): Promise<Member> {
  const { error } = await supabase.from("memberships").update({ status }).eq("id", membershipId);
  if (error) throw error;

  const member = await getMemberById(supabase, membershipId);
  if (!member) throw new Error("Membro atualizado, mas não foi possível recarregá-lo.");
  return member;
}

export async function countActiveOwners(
  supabase: SupabaseClient,
  organizationId: string,
  ownerRoleId: string,
  excludeMembershipId?: string
): Promise<number> {
  let query = supabase
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("role_id", ownerRoleId)
    .eq("status", "active");

  if (excludeMembershipId) query = query.neq("id", excludeMembershipId);

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}
