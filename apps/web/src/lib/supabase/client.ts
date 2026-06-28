import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@nexhub/types";

/**
 * Supabase client for Client Components.
 * Safe to call multiple times — the underlying client is memoized by
 * @supabase/ssr per the official Next.js App Router pattern.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}