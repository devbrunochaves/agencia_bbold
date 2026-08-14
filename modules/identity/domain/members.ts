import type { ClientAccessMode, MembershipStatus } from "./types";

export interface Member {
  membershipId: string;
  userId: string | null;
  name: string;
  email: string;
  roleId: string;
  roleKey: string;
  roleName: string;
  status: MembershipStatus;
  clientAccessMode: ClientAccessMode;
  allowedClientIds: string[];
  createdAt: string;
}

export const MEMBERSHIP_STATUS_LABEL: Record<MembershipStatus, string> = {
  invited: "Convite pendente",
  active: "Ativo",
  suspended: "Suspenso",
  removed: "Removido",
};

/** Target status a membership can be moved to, from the member detail drawer — never "invited", which is only ever the starting state. */
export type MembershipStatusTarget = Exclude<MembershipStatus, "invited">;

export const MEMBERSHIP_STATUS_ACTIONS: Record<MembershipStatus, MembershipStatusTarget[]> = {
  invited: ["removed"],
  active: ["suspended", "removed"],
  suspended: ["active", "removed"],
  removed: [],
};
