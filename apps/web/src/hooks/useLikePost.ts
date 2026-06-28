"use client";

import { useCallback, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface UseLikePostResult {
  toggleLike: (
    postId: string,
    currentlyLiked: boolean,
    onOptimisticToggle: () => void,
  ) => Promise<void>;
  pending: boolean;
  error: string | null;
}

export function useLikePost(): UseLikePostResult {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleLike = useCallback(
    async (
      postId: string,
      currentlyLiked: boolean,
      onOptimisticToggle: () => void,
    ) => {
      setError(null);
      setPending(true);
      onOptimisticToggle();

      const supabase = createSupabaseBrowserClient();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        onOptimisticToggle();
        setError("You must be signed in to like a post.");
        setPending(false);
        return;
      }

      const result = currentlyLiked
        ? await supabase
            .from("likes")
            .delete()
            .eq("post_id", postId)
            .eq("user_id", userId)
        : await supabase.from("likes").insert({ post_id: postId, user_id: userId });

      if (result.error) {
        onOptimisticToggle();
        setError(result.error.message);
      }

      setPending(false);
    },
    [],
  );

  return { toggleLike, pending, error };
}