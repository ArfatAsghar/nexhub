"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@nexhub/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface SuggestedUser extends Profile {
  following_by_me: boolean;
}

export interface UseWhoToFollowResult {
  users: SuggestedUser[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  toggleFollowLocally: (userId: string) => void;
  removeUserLocally: (userId: string) => void;
}

export function useWhoToFollow(limit = 4): UseWhoToFollowResult {
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { data: userData } = await supabase.auth.getUser();
    const currentUserId = userData.user?.id;

    if (!currentUserId) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const { data: followRows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", currentUserId);

    const followingSet = new Set((followRows ?? []).map((f) => f.following_id));

    let query = supabase
      .from("profiles")
      .select("*")
      .neq("id", currentUserId);

    if (followingSet.size > 0) {
      query = query.not("id", "in", `(${Array.from(followingSet).join(",")})`);
    }

    const { data: profiles, error: profilesError } = await query.limit(limit);

    if (profilesError) {
      setError(profilesError.message);
      setLoading(false);
      return;
    }

    setUsers(
      (profiles ?? []).map((p) => ({
        ...p,
        following_by_me: false,
      })),
    );
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleFollowLocally = useCallback((userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, following_by_me: !u.following_by_me } : u,
      ),
    );
  }, []);

  const removeUserLocally = useCallback((userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  return { users, loading, error, refresh: fetchUsers, toggleFollowLocally, removeUserLocally };
}