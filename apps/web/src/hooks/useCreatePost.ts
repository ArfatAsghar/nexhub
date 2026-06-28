"use client";

import { useCallback, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { MAX_POST_TAGS, type PostType } from "@nexhub/types";
import type { Database } from "@nexhub/types";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];

export interface CreatePostInput {
  type: PostType;
  content: string;
  tags?: string[];
  codeSnippet?: string;
  codeLanguage?: string;
}

export interface UseCreatePostResult {
  createPost: (input: CreatePostInput) => Promise<PostRow | null>;
  pending: boolean;
  error: string | null;
}

export function useCreatePost(): UseCreatePostResult {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPost = useCallback(
    async (input: CreatePostInput): Promise<PostRow | null> => {
      setError(null);

      const content = input.content.trim();
      if (!content) {
        setError("Post content can't be empty.");
        return null;
      }

      const tags = input.tags ?? [];
      if (tags.length > MAX_POST_TAGS) {
        setError(`You can add up to ${MAX_POST_TAGS} tags.`);
        return null;
      }

      if (input.codeSnippet && !input.codeLanguage) {
        setError("Pick a language for your code snippet.");
        return null;
      }

      setPending(true);

      const supabase = createSupabaseBrowserClient();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        setError("You must be signed in to post.");
        setPending(false);
        return null;
      }

      const { data, error: insertError } = await supabase
        .from("posts")
        .insert({
          author_id: userId,
          type: input.type,
          content,
          tags,
          code_snippet: input.codeSnippet ?? null,
          code_language: input.codeLanguage ?? null,
        })
        .select()
        .single();

      setPending(false);

      if (insertError) {
        setError(insertError.message);
        return null;
      }

      return data;
    },
    [],
  );

  return { createPost, pending, error };
}