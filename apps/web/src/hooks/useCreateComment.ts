"use client";

import { useCallback, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface UseCreateCommentResult {
  createComment: (
    postId: string,
    content: string,
    parentCommentId?: string,
  ) => Promise<boolean>;
  pending: boolean;
  error: string | null;
}

export function useCreateComment(): UseCreateCommentResult {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createComment = useCallback(
    async (
      postId: string,
      content: string,
      parentCommentId?: string,
    ): Promise<boolean> => {
      setError(null);

      const trimmed = content.trim();
      if (!trimmed) {
        setError("Comment can't be empty.");
        return false;
      }

      setPending(true);

      const supabase = createSupabaseBrowserClient();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        setError("You must be signed in to comment.");
        setPending(false);
        return false;
      }

      const { error: insertError } = await supabase.from("comments").insert({
        post_id: postId,
        author_id: userId,
        parent_comment_id: parentCommentId ?? null,
        content: trimmed,
      });

      setPending(false);

      if (insertError) {
        setError(insertError.message);
        return false;
      }

      return true;
    },
    [],
  );

  return { createComment, pending, error };
}