"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface TrendingTag {
  tag: string;
  postCount: number;
}

export interface UseTrendingTagsResult {
  tags: TrendingTag[];
  loading: boolean;
  error: string | null;
}

export function useTrendingTags(limit = 5): UseTrendingTagsResult {
  const [tags, setTags] = useState<TrendingTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const supabase = createSupabaseBrowserClient();

    supabase
      .rpc("trending_tags", { tag_limit: limit })
      .then(({ data, error: rpcError }) => {
        if (!isMounted) return;
        if (rpcError) {
          setError(rpcError.message);
        } else {
          setTags(
            (data ?? []).map((row) => ({
              tag: row.tag,
              postCount: row.post_count,
            })),
          );
        }
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [limit]);

  return { tags, loading, error };
}