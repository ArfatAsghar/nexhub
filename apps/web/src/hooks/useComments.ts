"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@nexhub/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type CommentRow = Database["public"]["Tables"]["comments"]["Row"];

export interface CommentWithAuthor extends CommentRow {
  author: Profile;
}

export interface CommentThread extends CommentWithAuthor {
  replies: CommentWithAuthor[];
}

export interface UseCommentsResult {
  threads: CommentThread[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useComments(postId: string): UseCommentsResult {
  const [threads, setThreads] = useState<CommentThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { data, error: commentsError } = await supabase
      .from("comments")
      .select("*, author:profiles!comments_author_id_fkey(*)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (commentsError) {
      setError(commentsError.message);
      setLoading(false);
      return;
    }

    const rows = (data ?? []).map((row) => {
      const authorRaw = (row as unknown as { author: Profile | Profile[] }).author;
      const author = Array.isArray(authorRaw) ? authorRaw[0] : authorRaw;
      return { ...row, author } as CommentWithAuthor;
    });

    const topLevel = rows.filter((c) => !c.parent_comment_id);
    const repliesByParent = new Map<string, CommentWithAuthor[]>();
    for (const c of rows) {
      if (c.parent_comment_id) {
        const list = repliesByParent.get(c.parent_comment_id) ?? [];
        list.push(c);
        repliesByParent.set(c.parent_comment_id, list);
      }
    }

    setThreads(
      topLevel.map((comment) => ({
        ...comment,
        replies: repliesByParent.get(comment.id) ?? [],
      })),
    );
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return { threads, loading, error, refresh: fetchComments };
}