"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@nexhub/types";
import type { FeedPost } from "@/hooks/usePosts";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface BookmarkedPostRow {
  post: {
    id: string;
    [key: string]: unknown;
    author: Profile | Profile[];
    likes: { count: number }[];
    comments: { count: number }[];
  } | null;
}

export interface UseBookmarkedPostsResult {
  posts: FeedPost[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  toggleLikeLocally: (postId: string) => void;
  toggleBookmarkLocally: (postId: string) => void;
}

export function useBookmarkedPosts(userId: string | null): UseBookmarkedPostsResult {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    if (!userId) {
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();

    const { data, error: fetchError } = await supabase
      .from("bookmarks")
      .select(
        "post:posts(*, author:profiles!posts_author_id_fkey(*), likes(count), comments(count))",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const rows = ((data ?? []) as unknown as BookmarkedPostRow[])
      .map((row) => {
        if (!row.post) return null;
        const authorRaw = row.post.author;
        const author = Array.isArray(authorRaw) ? authorRaw[0] : authorRaw;
        if (!author) return null;

        return {
          ...row.post,
          author,
          like_count: row.post.likes?.[0]?.count ?? 0,
          comment_count: row.post.comments?.[0]?.count ?? 0,
          liked_by_me: false,
          bookmarked_by_me: true,
        } as unknown as FeedPost;
      })
      .filter((p): p is FeedPost => p !== null);

    const postIds = rows.map((p) => p.id);
    if (postIds.length > 0) {
      const { data: likedRows } = await supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", userId)
        .in("post_id", postIds);

      const likedSet = new Set((likedRows ?? []).map((r) => r.post_id));
      for (const post of rows) {
        post.liked_by_me = likedSet.has(post.id);
      }
    }

    setPosts(rows);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const toggleLikeLocally = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              liked_by_me: !p.liked_by_me,
              like_count: p.liked_by_me ? p.like_count - 1 : p.like_count + 1,
            }
          : p,
      ),
    );
  }, []);

  const toggleBookmarkLocally = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  return {
    posts,
    loading,
    error,
    refresh: fetchBookmarks,
    toggleLikeLocally,
    toggleBookmarkLocally,
  };
}
