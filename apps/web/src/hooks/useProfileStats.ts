"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface ProfileStats {
  postCount: number;
  followerCount: number;
  followingCount: number;
  sessionsBookedCount: number;
}

export interface UseProfileStatsResult {
  stats: ProfileStats | null;
  loading: boolean;
  error: string | null;
}

export function useProfileStats(userId: string | null): UseProfileStatsResult {
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setStats(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();

    Promise.all([
      supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("author_id", userId),
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId),
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId),
      supabase
        .from("session_bookings")
        .select("*", { count: "exact", head: true })
        .eq("student_id", userId),
    ])
      .then(([postsRes, followersRes, followingRes, sessionsRes]) => {
        if (!isMounted) return;

        const firstError =
          postsRes.error ?? followersRes.error ?? followingRes.error ?? sessionsRes.error;

        if (firstError) {
          setError(firstError.message);
        } else {
          setStats({
            postCount: postsRes.count ?? 0,
            followerCount: followersRes.count ?? 0,
            followingCount: followingRes.count ?? 0,
            sessionsBookedCount: sessionsRes.count ?? 0,
          });
        }
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { stats, loading, error };
}