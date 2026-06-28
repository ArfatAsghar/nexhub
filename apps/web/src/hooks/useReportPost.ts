"use client";

import { useCallback, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function useReportPost() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportPost = useCallback(async (postId: string, reason: string) => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Please describe why you're reporting this post.");
      return false;
    }

    setPending(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
      setError("You must be signed in to report a post.");
      setPending(false);
      return false;
    }

    const { error: insertError } = await supabase.from("post_reports").insert({
      post_id: postId,
      reporter_id: userId,
      reason: trimmed,
    });

    setPending(false);
    if (insertError) {
      setError(insertError.message);
      return false;
    }
    return true;
  }, []);

  return { reportPost, pending, error };
}
