import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Session lives in cookies so the server
 * (middleware, Server Components) can read the same session.
 * Use only in Client Components — server code must use lib/supabase/server.ts.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
