import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Sends the actual Supabase Auth invite email. Requires
 * SUPABASE_SERVICE_ROLE_KEY server-side — not present in this environment,
 * so this throws today. Called from invite-member.ts inside a try/catch
 * that never reports success unless this actually succeeded.
 */
export async function sendAuthInvite(email: string, redirectTo: string): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
  if (error) throw error;
}
