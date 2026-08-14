import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserContext } from "../infrastructure/identity.repository";
import type { UserContext } from "../domain/types";

/**
 * Server-only entry point used by the /flow layout (and later by pages/
 * server actions that need to check permissions) to resolve who is signed
 * in and what they can do. Never call this from a Client Component.
 */
export async function getCurrentUserContext(): Promise<UserContext | null> {
  const supabase = await createSupabaseServerClient();
  return getUserContext(supabase);
}
