export type MembershipStatus = "invited" | "active" | "suspended" | "removed";
export type ClientAccessMode = "all" | "restricted";

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
  clientAccessMode: ClientAccessMode;
}

/**
 * Everything the Flow shell needs to render: who is signed in, and which
 * organizations they belong to. currentMembership is the one currently in
 * scope — organization switching is out of scope for this version (a user
 * with more than one active membership gets the first one returned by the
 * query, arbitrarily but deterministically; see identity.repository.ts).
 * Multi-org support (a switcher) is a future evolution, not implemented now
 * — but nothing here assumes a user has only one membership.
 *
 * accountStatus explains why currentMembership might be null: distinct from
 * "no membership at all" so the UI can show the right message instead of a
 * generic access-denied screen.
 */
export interface UserContext {
  user: AppUser;
  memberships: MembershipContext[];
  currentMembership: MembershipContext | null;
  accountStatus: "active" | "no_membership" | "suspended" | "removed" | "invited_only";
}

export function hasPermission(context: MembershipContext | null, key: string): boolean {
  return context?.permissions.has(key) ?? false;
}
