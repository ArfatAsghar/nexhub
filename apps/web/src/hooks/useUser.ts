"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@nexhub/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface UseUserResult {
  /** The raw Supabase auth user (id, email, etc). Null if signed out. */
  user: User | null;
  /** The matching public.profiles row for the signed-in user. Null if signed out or not yet loaded. */
  profile: Profile | null;
  /** True while the initial session/profile fetch is in flight. */
  loading: boolean;
  /** Set if the profile fetch failed (auth itself succeeded). */
  error: string | null;
}

/**
 * Tracks the current Supabase auth session + matching profile row on the
 * client, and stays in sync with sign-in/sign-out events (e.g. triggered
 * from another tab, or after the signOut() server action redirects here).
 *
 * Server Components should keep using createSupabaseServerClient() directly
 * (see (app)/layout.tsx) — this hook is for Client Components that need to
 * react to auth state without a full page reload.
 */
export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let isMounted = true;

    async function loadProfile(currentUser: User | null) {
      if (!currentUser) {
        if (isMounted) {
          setProfile(null);
          setError(null);
        }
        return;
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (!isMounted) return;

      if (profileError) {
        setProfile(null);
        setError(profileError.message);
      } else {
        setProfile(data);
        setError(null);
      }
    }

    // Initial load
    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) return;
      setUser(data.user);
      loadProfile(data.user).finally(() => {
        if (isMounted) setLoading(false);
      });
    });

    // Stay in sync with sign-in / sign-out / token refresh
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        setUser(session?.user ?? null);
        loadProfile(session?.user ?? null);
      },
    );

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return { user, profile, loading, error };
}