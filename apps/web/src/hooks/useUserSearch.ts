"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserRole } from "@nexhub/types";

export type RecommendedUser = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  headline: string | null;
  follower_count: number;
  followed_by_me: boolean;
};

export function useUserSearch(query: string) {
  const [users, setUsers] = useState<RecommendedUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setUsers([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timeout = setTimeout(async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData.user?.id;

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, role, bio")
        .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
        .limit(10);

      if (cancelled) return;

      let followedSet = new Set<string>();
      const ids = (profiles ?? []).map((p) => p.id);
      if (currentUserId && ids.length > 0) {
        const { data: follows } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", currentUserId)
          .in("following_id", ids);
        followedSet = new Set((follows ?? []).map((f) => f.following_id));
      }

      setUsers(
        (profiles ?? []).map((p) => ({
          id: p.id,
          username: p.username,
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          role: p.role,
          headline: p.bio,
          follower_count: 0,
          followed_by_me: followedSet.has(p.id),
        })),
      );
      setLoading(false);
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  return { users, loading };
}
