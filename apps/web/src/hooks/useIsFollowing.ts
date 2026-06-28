"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface UseIsFollowingResult {
  isFollowing: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  toggleLocally: () => void;
}

export function useIsFollowing(targetUserId: string | null): UseIsFollowingResult {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    if (!targetUserId) {
      setIsFollowing(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { data: userData } = await supabase.auth.getUser();
    const currentUserId = userData.user?.id;

    if (!currentUserId) {
      setIsFollowing(false);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUserId)
      .eq("following_id", targetUserId)
      .maybeSingle();

    setIsFollowing(!!data);
    setLoading(false);
  }, [targetUserId]);

  useEffect(() => {
    check();
  }, [check]);

  const toggleLocally = useCallback(() => {
    setIsFollowing((prev) => !prev);
  }, []);

  return { isFollowing, loading, refresh: check, toggleLocally };
}