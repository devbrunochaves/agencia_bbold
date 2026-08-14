import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — server-only, lazily created (never at
 * module load, so importing this file is safe even when the env var is
 * absent). SUPABASE_SERVICE_ROLE_KEY must never be prefixed NEXT_PUBLIC_
 * and must never be imported from a Client Component; this file has no
 * "use client" and lives under lib/supabase, imported only from
 * application/infrastructure code that runs on the server.
 *
 * Not wired into any user-facing flow yet — see
 * modules/identity/infrastructure/auth-invite.ts for the one place that
 * calls it, and modules/identity/application/invite-member.ts for how the
 * failure is handled without ever claiming an email was sent when it wasn't.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured for this environment — admin Auth operations (like inviting a user by email) are unavailable."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
