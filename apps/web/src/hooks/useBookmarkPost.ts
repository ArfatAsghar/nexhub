"use client";

import { useCallback, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface UseBookmarkPostResult {
  toggleBookmark: (
    postId: string,
    currentlyBookmarked: boolean,
    onOptimisticToggle: () => void,
  ) => Promise<void>;
  pending: boolean;
  error: string | null;
}

export function useBookmarkPost(): UseBookmarkPostResult {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleBookmark = useCallback(
    async (
      postId: string,
      currentlyBookmarked: boolean,
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
        setError("You must be signed in to bookmark a post.");
        setPending(false);
        return;
      }

      const result = currentlyBookmarked
        ? await supabase
            .from("bookmarks")
            .delete()
            .eq("post_id", postId)
            .eq("user_id", userId)
        : await supabase
            .from("bookmarks")
            .insert({ post_id: postId, user_id: userId });

      if (result.error) {
        onOptimisticToggle();
        setError(result.error.message);
      }

      setPending(false);
    },
    [],
  );

  return { toggleBookmark, pending, error };
}