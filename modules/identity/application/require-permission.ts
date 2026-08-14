import { getCurrentUserContext } from "./get-current-user-context";
import { hasPermission } from "../domain/types";
import type { UserContext } from "../domain/types";

export type PermissionCheckResult =
  | { ok: true; context: UserContext }
  | {
      ok: false;
      reason: "unauthenticated" | "no_membership" | "suspended" | "removed" | "invited_only" | "forbidden";
      /** Present only for "forbidden" — lets the caller redirect to getDefaultRoute(context) instead of just showing AccessDenied (§65/§66). */
      context?: UserContext;
    };

/**
 * Server-side gate every /flow/* page and every Server Action must call
 * before doing anything — the menu being hidden is UX, this is the actual
 * boundary (§2/§22/§46/§47 of the phase brief). Never trust that a page was
 * reached "because the sidebar link was there".
 */
export async function requirePermission(permissionKey: string): Promise<PermissionCheckResult> {
  const context = await getCurrentUserContext();

  if (!context) return { ok: false, reason: "unauthenticated" };
  if (!context.currentMembership) {
    if (context.accountStatus === "suspended") return { ok: false, reason: "suspended" };
    if (context.accountStatus === "removed") return { ok: false, reason: "removed" };
    if (context.accountStatus === "invited_only") return { ok: false, reason: "invited_only" };
    return { ok: false, reason: "no_membership" };
  }
  if (!hasPermission(context.currentMembership, permissionKey)) {
    return { ok: false, reason: "forbidden", context };
  }

  return { ok: true, context };
}
