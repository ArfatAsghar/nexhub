"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@nexhub/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type PostRow = Database["public"]["Tables"]["posts"]["Row"];

export type RelatedPost = PostRow & {
  author: Pick<Profile, "id" | "username" | "full_name" | "avatar_url" | "role">;
};

export function useRelatedPosts(
  postId: string | null,
  tags: string[],
  authorId: string | null,
) {
  const [posts, setPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRelated = useCallback(async () => {
    if (!postId) {
      setPosts([]);
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();

    let query = supabase
      .from("posts")
      .select(
        "id, author_id, type, content, tags, created_at, author:profiles!posts_author_id_fkey(id, username, full_name, avatar_url, role)",
      )
      .neq("id", postId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (tags.length > 0) {
      query = query.overlaps("tags", tags);
    } else if (authorId) {
      query = query.eq("author_id", authorId);
    }

    const { data } = await query;

    const rows = (data ?? []).map((row) => {
      const authorRaw = (row as unknown as { author: Profile | Profile[] }).author;
      const author = Array.isArray(authorRaw) ? authorRaw[0]! : authorRaw!;
      return { ...row, author } as unknown as RelatedPost;
    });

    setPosts(rows);
    setLoading(false);
  }, [postId, tags, authorId]);

  useEffect(() => {
    fetchRelated();
  }, [fetchRelated]);

  return { posts, loading };
}
