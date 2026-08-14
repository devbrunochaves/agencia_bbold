import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext } from "./get-current-user-context";
import { hasPermission } from "../domain/types";
import { InviteMemberSchema, type InviteMemberInput } from "../domain/schemas";
import { createInvitedMembership } from "../infrastructure/members.repository";
import { sendAuthInvite } from "../infrastructure/auth-invite";
import type { Member } from "../domain/members";
import { UnauthorizedError, ValidationError } from "./errors";

export interface InviteMemberResult {
  member: Member;
  emailSent: boolean;
  emailError: string | null;
}

/**
 * Always creates a real, functional pending membership (status='invited').
 * The Auth email step is best-effort and clearly reported: emailSent=false
 * means exactly that — no email went out — never faked as success (§28/§58
 * of the phase brief). SUPABASE_SERVICE_ROLE_KEY isn't configured in this
 * environment, so emailSent will be false today; the membership itself is
 * still real and the invited person can be granted access by an admin
 * through other means until that's wired up.
 */
export async function inviteMember(input: InviteMemberInput): Promise<InviteMemberResult> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) throw new UnauthorizedError();
  if (!hasPermission(context.currentMembership, "members.manage")) throw new UnauthorizedError();

  const parsed = InviteMemberSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message);

  const supabase = await createSupabaseServerClient();
  const member = await createInvitedMembership(
    supabase,
    context.currentMembership.organization.id,
    context.user.id,
    parsed.data
  );

  let emailSent = false;
  let emailError: string | null = null;
  try {
    await sendAuthInvite(parsed.data.email, `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/login`);
    emailSent = true;
  } catch (error) {
    emailError = error instanceof Error ? error.message : "Não foi possível enviar o convite por e-mail.";
  }

  return { member, emailSent, emailError };
}
