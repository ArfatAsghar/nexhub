import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@nexhub/types";

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 *
 * Must be called fresh on every request (do NOT memoize at module scope) —
 * it reads the current request's cookies to resolve the session.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll is called from a Server Component where cookies can't
            // be mutated. Safe to ignore as long as middleware.ts also
            // refreshes the session (it does — see middleware.ts).
          }
        },
      },
    },
  );
}
