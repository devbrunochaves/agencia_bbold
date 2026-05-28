import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Singleton browser client — session stored in cookies (accessible by middleware)
export const supabase = createBrowserClient(supabaseUrl, supabaseKey)
