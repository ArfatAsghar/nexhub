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

export function useRecommendedUsers(limit = 8) {
  const [users, setUsers] = useState<RecommendedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const supabase = createSupabaseBrowserClient();
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData.user?.id;

      const { data: profiles, error: fetchError } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, role, bio")
        .order("created_at", { ascending: false })
        .limit(limit + (currentUserId ? 1 : 0));

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      const filtered = (profiles ?? []).filter((p) => p.id !== currentUserId).slice(0, limit);
      const ids = filtered.map((p) => p.id);

      let followedSet = new Set<string>();
      const followerCounts = new Map<string, number>();

      if (ids.length > 0) {
        const [{ data: follows }, { data: followerRows }] = await Promise.all([
          currentUserId
            ? supabase
                .from("follows")
                .select("following_id")
                .eq("follower_id", currentUserId)
                .in("following_id", ids)
            : Promise.resolve({ data: [] }),
          supabase.from("follows").select("following_id").in("following_id", ids),
        ]);

        followedSet = new Set((follows ?? []).map((f) => f.following_id));
        for (const row of followerRows ?? []) {
          followerCounts.set(
            row.following_id,
            (followerCounts.get(row.following_id) ?? 0) + 1,
          );
        }
      }

      setUsers(
        filtered.map((p) => ({
          id: p.id,
          username: p.username,
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          role: p.role,
          headline: p.bio,
          follower_count: followerCounts.get(p.id) ?? 0,
          followed_by_me: followedSet.has(p.id),
        })),
      );
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  const toggleFollowLocally = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              followed_by_me: !u.followed_by_me,
              follower_count: u.followed_by_me
                ? u.follower_count - 1
                : u.follower_count + 1,
            }
          : u,
      ),
    );
  };

  return { users, loading, error, toggleFollowLocally };
}
