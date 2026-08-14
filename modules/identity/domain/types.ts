export type MembershipStatus = "invited" | "active" | "disabled";

export type SystemRoleKey = "owner" | "admin" | "member";

export interface Organization {
  id: string;
  name: string;
  slug: string;
}

export interface Role {
  id: string;
  key: string;
  name: string;
  organizationId: string | null;
  isSystem: boolean;
}

export interface AppUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
}

/** The active organization membership for the signed-in user, with the
 * permission keys already resolved from role_permissions. */
export interface MembershipContext {
  membershipId: string;
  organization: Organization;
  role: Role;
  permissions: Set<string>;
}

/** Everything the Flow shell needs to render: who is signed in, and which
 * organizations they belong to. currentMembership is the one currently in
 * scope — organization switching is out of scope for phase 1 (single
 * membership assumed), but the shape supports more than one. */
export interface UserContext {
  user: AppUser;
  memberships: MembershipContext[];
  currentMembership: MembershipContext | null;
}

export function hasPermission(context: MembershipContext | null, key: string): boolean {
  return context?.permissions.has(key) ?? false;
}
