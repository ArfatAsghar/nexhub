"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database, PostType, UserRole } from "@nexhub/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type PostRow = Database["public"]["Tables"]["posts"]["Row"];

export interface FeedPost extends PostRow {
  author: Profile;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
  bookmarked_by_me: boolean;
}

export interface UsePostsOptions {
  type?: PostType;
  authorRole?: UserRole;
  authorId?: string;
  limit?: number;
}

export interface UsePostsResult {
  posts: FeedPost[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  fetchNextPage: () => Promise<void>;
  hasNextPage: boolean;
  toggleLikeLocally: (postId: string) => void;
  toggleBookmarkLocally: (postId: string) => void;
}

export function usePosts(options: UsePostsOptions = {}): UsePostsResult {
  const { type, authorRole, authorId, limit = 20 } = options;

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const enrichPosts = useCallback(
    async (rows: Record<string, unknown>[]): Promise<FeedPost[]> => {
      const supabase = createSupabaseBrowserClient();
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id ?? null;
      const postIds = rows.map((row) => row.id as string);

      let likedSet = new Set<string>();
      let bookmarkedSet = new Set<string>();

      if (currentUserId && postIds.length > 0) {
        const [{ data: likedRows }, { data: bookmarkedRows }] = await Promise.all([
          supabase
            .from("likes")
            .select("post_id")
            .eq("user_id", currentUserId)
            .in("post_id", postIds),
          supabase
            .from("bookmarks")
            .select("post_id")
            .eq("user_id", currentUserId)
            .in("post_id", postIds),
        ]);

        likedSet = new Set((likedRows ?? []).map((r) => r.post_id));
        bookmarkedSet = new Set((bookmarkedRows ?? []).map((r) => r.post_id));
      }

      return rows.map((row) => {
        const authorRaw = row.author as Profile | Profile[] | undefined;
        const author = Array.isArray(authorRaw) ? authorRaw[0]! : authorRaw!;
        const likesAgg = row.likes as { count: number }[] | undefined;
        const commentsAgg = row.comments as { count: number }[] | undefined;
        const id = row.id as string;

        return {
          ...(row as unknown as PostRow),
          author,
          like_count: likesAgg?.[0]?.count ?? 0,
          comment_count: commentsAgg?.[0]?.count ?? 0,
          liked_by_me: likedSet.has(id),
          bookmarked_by_me: bookmarkedSet.has(id),
        };
      });
    },
    [],
  );

  const queryPosts = useCallback(
    async (offset: number) => {
      const supabase = createSupabaseBrowserClient();

      const authorEmbed = authorRole
        ? "author:profiles!posts_author_id_fkey!inner(*)"
        : "author:profiles!posts_author_id_fkey(*)";

      let query = supabase
        .from("posts")
        .select(
          `
        *,
        ${authorEmbed},
        likes(count),
        comments(count)
      `,
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (type) {
        query = query.eq("type", type);
      }

      if (authorRole) {
        query = query.eq("author.role", authorRole);
      }

      if (authorId) {
        query = query.eq("author_id", authorId);
      }

      return await query;
    },
    [type, authorRole, authorId, limit],
  );

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: postsError } = await queryPosts(0);

    if (postsError) {
      setError(postsError.message);
      setLoading(false);
      return;
    }

    const rows = data ?? [];
    const enriched = await enrichPosts((data ?? []) as Record<string, unknown>[]);

    setPosts(enriched);
    setHasNextPage(rows.length === limit);
    setLoading(false);
  }, [queryPosts, enrichPosts, limit]);

  const fetchNextPage = useCallback(async () => {
    if (!hasNextPage) return;

    const offset = posts.length;
    const { data, error: postsError } = await queryPosts(offset);

    if (postsError) {
      setError(postsError.message);
      return;
    }

    const rows = data ?? [];
    if (rows.length === 0) {
      setHasNextPage(false);
      return;
    }

    const enriched = await enrichPosts((data ?? []) as Record<string, unknown>[]);
    setPosts((prev) => [...prev, ...enriched]);
    setHasNextPage(rows.length === limit);
  }, [hasNextPage, posts.length, queryPosts, enrichPosts, limit]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const toggleLikeLocally = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              liked_by_me: !post.liked_by_me,
              like_count: post.liked_by_me
                ? post.like_count - 1
                : post.like_count + 1,
            }
          : post,
      ),
    );
  }, []);

  const toggleBookmarkLocally = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, bookmarked_by_me: !post.bookmarked_by_me }
          : post,
      ),
    );
  }, []);

  return {
    posts,
    loading,
    error,
    refresh: fetchPosts,
    fetchNextPage,
    hasNextPage,
    toggleLikeLocally,
    toggleBookmarkLocally,
  };
}
