import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const supabase = createSupabaseBrowserClient();

export type Story = {
  id:              string;
  author_id:       string;
  author_name:     string;
  author_username: string;
  author_avatar:   string | null;
  type:            "image" | "text";
  image_url?:      string;
  text?:           string;
  bg?:             string;
  created_at:      string;
};

export type UploadPayload =
  | { type: "image"; file: File }
  | { type: "text"; text: string; bg: string };

const STORY_BUCKET = "stories";
const EXPIRY_MS    = 24 * 60 * 60 * 1000;

export function useStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // ── Fetch — RLS already limits rows to own stories + followed users ───────

  const fetchStories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error(`Auth error: ${authError.message}`);
      if (!user)     throw new Error("Not authenticated");

      const since = new Date(Date.now() - EXPIRY_MS).toISOString();

      const { data, error: fetchError } = await supabase
        .from("stories")
        .select(`
          id, author_id, type, image_url, text, bg, created_at,
          profiles ( full_name, username, avatar_url )
        `)
        .gte("created_at", since)
        .order("created_at", { ascending: false });

      // RLS policy on the stories table restricts rows to:
      //   • stories the current user authored
      //   • stories from users the current user follows
      // So no extra client-side filtering is needed here.
      if (fetchError) throw new Error(`Fetch failed: ${fetchError.message}`);

      setStories(
        (data ?? []).map((row: any) => ({
          id:              row.id,
          author_id:       row.author_id,
          author_name:     row.profiles?.full_name  ?? "Unknown",
          author_username: row.profiles?.username   ?? "",
          author_avatar:   row.profiles?.avatar_url ?? null,
          type:            row.type,
          image_url:       row.image_url  ?? undefined,
          text:            row.text        ?? undefined,
          bg:              row.bg           ?? undefined,
          created_at:      row.created_at,
        })),
      );
    } catch (err: any) {
      console.error("[useStories] fetchStories failed:", err?.message ?? err);
      setError(err?.message ?? "Failed to load stories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStories(); }, [fetchStories]);

  // ── Auto-prune expired stories from local state every 60 s ───────────────

  useEffect(() => {
    const id = setInterval(() => {
      setStories((prev) =>
        prev.filter((s) => Date.now() - new Date(s.created_at).getTime() < EXPIRY_MS),
      );
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Upload ───────────────────────────────────────────────────────────────

  const uploadStory = useCallback(async (payload: UploadPayload) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error(`Auth error: ${authError.message}`);
      if (!user)     throw new Error("Not authenticated");

      let imageUrl: string | undefined;

      if (payload.type === "image") {
        const ext      = payload.file.name.split(".").pop() ?? "jpg";
        const filePath = `${user.id}/${Date.now()}.${ext}`;

        console.log("[useStories] Uploading image to storage:", filePath);

        const { error: uploadError } = await supabase.storage
          .from(STORY_BUCKET)
          .upload(filePath, payload.file, { upsert: false });

        if (uploadError) {
          throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from(STORY_BUCKET)
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
        console.log("[useStories] Image URL:", imageUrl);
      }

      console.log("[useStories] Inserting story row, type:", payload.type);

      const { data: newStory, error: insertError } = await supabase
        .from("stories")
        .insert({
          author_id: user.id,
          type:      payload.type,
          image_url: imageUrl ?? null,
          text:      payload.type === "text" ? payload.text : null,
          bg:        payload.type === "text" ? payload.bg   : null,
        })
        .select(`
          id, author_id, type, image_url, text, bg, created_at,
          profiles ( full_name, username, avatar_url )
        `)
        .single();

      if (insertError) {
        throw new Error(
          `DB insert failed: ${insertError.message} (code: ${insertError.code})`,
        );
      }

      console.log("[useStories] Story inserted successfully:", newStory.id);

      setStories((prev) => [
        {
          id:              newStory.id,
          author_id:       newStory.author_id,
          author_name:     (newStory.profiles as any)?.full_name  ?? "Unknown",
          author_username: (newStory.profiles as any)?.username   ?? "",
          author_avatar:   (newStory.profiles as any)?.avatar_url ?? null,
          type:            newStory.type as Story["type"],
          image_url:       newStory.image_url  ?? undefined,
          text:            newStory.text        ?? undefined,
          bg:              newStory.bg           ?? undefined,
          created_at:      newStory.created_at,
        },
        ...prev,
      ]);
    } catch (err: any) {
      console.error("[useStories] uploadStory failed:", err?.message ?? err);
      throw err;
    }
  }, []);

  // ── Delete ───────────────────────────────────────────────────────────────

  const deleteStory = useCallback(async (storyId: string) => {
    try {
      const story = stories.find((s) => s.id === storyId);

      // Remove image file from storage first
      if (story?.type === "image" && story.image_url) {
        const url      = new URL(story.image_url);
        const segments = url.pathname.split(`/${STORY_BUCKET}/`);
        const filePath = segments[1];
        if (filePath) {
          const { error: storageError } = await supabase.storage
            .from(STORY_BUCKET)
            .remove([filePath]);
          if (storageError) {
            console.warn("[useStories] Storage delete warning:", storageError.message);
          }
        }
      }

      const { error: deleteError } = await supabase
        .from("stories")
        .delete()
        .eq("id", storyId);

      if (deleteError) {
        throw new Error(`Delete failed: ${deleteError.message}`);
      }

      setStories((prev) => prev.filter((s) => s.id !== storyId));
      console.log("[useStories] Story deleted:", storyId);
    } catch (err: any) {
      console.error("[useStories] deleteStory failed:", err?.message ?? err);
      throw err;
    }
  }, [stories]);

  return { stories, loading, error, fetchStories, uploadStory, deleteStory };
}