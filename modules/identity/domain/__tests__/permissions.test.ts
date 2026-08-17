import { describe, expect, it } from "vitest";
import { hasPermission } from "../types";
import type { MembershipContext } from "../types";

function makeMembership(permissionKeys: string[]): MembershipContext {
  return {
    membershipId: "m1",
    organization: { id: "org-1", name: "Org", slug: "org" },
    role: { id: "r1", key: "member", name: "Member", organizationId: null, isSystem: true },
    permissions: new Set(permissionKeys),
    clientAccessMode: "all",
  };
}

describe("hasPermission", () => {
  it("returns false for a null membership context (no active membership at all)", () => {
    expect(hasPermission(null, "clients.view")).toBe(false);
  });

  it("returns true only for keys actually present in the membership's permission set", () => {
    const membership = makeMembership(["clients.view", "tasks.view"]);
    expect(hasPermission(membership, "clients.view")).toBe(true);
    expect(hasPermission(membership, "finance.manage")).toBe(false);
  });

  it("returns false for an empty permission set — never defaults to allow", () => {
    const membership = makeMembership([]);
    expect(hasPermission(membership, "dashboard.view")).toBe(false);
  });
});
