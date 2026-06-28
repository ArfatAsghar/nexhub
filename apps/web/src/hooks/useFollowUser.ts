"use client";

import { useCallback, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface UseFollowUserResult {
  toggleFollow: (
    targetUserId: string,
    currentlyFollowing: boolean,
    onOptimisticToggle: () => void,
  ) => Promise<void>;
  pending: boolean;
  error: string | null;
}

export function useFollowUser(): UseFollowUserResult {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleFollow = useCallback(
    async (
      targetUserId: string,
      currentlyFollowing: boolean,
      onOptimisticToggle: () => void,
    ) => {
      setError(null);

      const supabase = createSupabaseBrowserClient();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        setError("You must be signed in to follow someone.");
        return;
      }

      if (userId === targetUserId) {
        setError("You can't follow yourself.");
        return;
      }

      setPending(true);
      onOptimisticToggle();

      const result = currentlyFollowing
        ? await supabase
            .from("follows")
            .delete()
            .eq("follower_id", userId)
            .eq("following_id", targetUserId)
        : await supabase
            .from("follows")
            .insert({ follower_id: userId, following_id: targetUserId });

      if (result.error) {
        onOptimisticToggle();
        setError(result.error.message);
      }

      setPending(false);
    },
    [],
  );

  return { toggleFollow, pending, error };
}