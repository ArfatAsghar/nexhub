"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@nexhub/types";
import type { FeedPost } from "@/hooks/usePosts";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function usePost(postId: string | null) {
  const [post, setPost] = useState<FeedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    if (!postId) {
      setPost(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { data: userData } = await supabase.auth.getUser();
    const currentUserId = userData.user?.id ?? null;

    const { data, error: fetchError } = await supabase
      .from("posts")
      .select(
        `
        *,
        author:profiles!posts_author_id_fkey(*),
        likes(count),
        comments(count)
      `,
      )
      .eq("id", postId)
      .maybeSingle();

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    if (!data) {
      setPost(null);
      setLoading(false);
      return;
    }

    let likedByMe = false;
    let bookmarkedByMe = false;

    if (currentUserId) {
      const [{ data: liked }, { data: bookmarked }] = await Promise.all([
        supabase
          .from("likes")
          .select("id")
          .eq("post_id", postId)
          .eq("user_id", currentUserId)
          .maybeSingle(),
        supabase
          .from("bookmarks")
          .select("id")
          .eq("post_id", postId)
          .eq("user_id", currentUserId)
          .maybeSingle(),
      ]);
      likedByMe = !!liked;
      bookmarkedByMe = !!bookmarked;
    }

    const authorRaw = (data as unknown as { author: Profile | Profile[] }).author;
    const author = Array.isArray(authorRaw) ? authorRaw[0]! : authorRaw;
    const likesAgg = (data as unknown as { likes: { count: number }[] }).likes;
    const commentsAgg = (data as unknown as { comments: { count: number }[] }).comments;

    setPost({
      ...(data as unknown as FeedPost),
      author,
      like_count: likesAgg?.[0]?.count ?? 0,
      comment_count: commentsAgg?.[0]?.count ?? 0,
      liked_by_me: likedByMe,
      bookmarked_by_me: bookmarkedByMe,
    });
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const toggleLikeLocally = useCallback(() => {
    setPost((prev) =>
      prev
        ? {
            ...prev,
            liked_by_me: !prev.liked_by_me,
            like_count: prev.liked_by_me
              ? prev.like_count - 1
              : prev.like_count + 1,
          }
        : prev,
    );
  }, []);

  const toggleBookmarkLocally = useCallback(() => {
    setPost((prev) => (prev ? { ...prev, bookmarked_by_me: !prev.bookmarked_by_me } : prev));
  }, []);

  return {
    post,
    loading,
    error,
    refresh: fetchPost,
    toggleLikeLocally,
    toggleBookmarkLocally,
  };
}
