"use client";

import { useCallback, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { MAX_NICHE_TAGS } from "@nexhub/types";

export interface UpdateProfileInput {
  fullName: string;
  bio: string;
  nicheTags: string[];
  avatarUrl?: string | null;
  coverUrl?: string | null;
}

export interface UseUpdateProfileResult {
  updateProfile: (input: UpdateProfileInput) => Promise<boolean>;
  uploadAvatar: (file: File) => Promise<string | null>;
  uploadCover: (file: File) => Promise<string | null>;
  pending: boolean;
  error: string | null;
}

export function useUpdateProfile(): UseUpdateProfileResult {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = useCallback(
    async (bucket: "avatars" | "covers", file: File): Promise<string | null> => {
      const supabase = createSupabaseBrowserClient();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return null;

      const ext = file.name.split(".").pop() ?? "jpg";
      const filePath = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        setError(uploadError.message);
        return null;
      }

      return supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
    },
    [],
  );

  const uploadAvatar = useCallback(
    (file: File) => uploadImage("avatars", file),
    [uploadImage],
  );

  const uploadCover = useCallback(
    (file: File) => uploadImage("covers", file),
    [uploadImage],
  );

  const updateProfile = useCallback(
    async (input: UpdateProfileInput): Promise<boolean> => {
      setError(null);

      const fullName = input.fullName.trim();
      if (!fullName) {
        setError("Name can't be empty.");
        return false;
      }

      if (input.nicheTags.length > MAX_NICHE_TAGS) {
        setError(`You can select up to ${MAX_NICHE_TAGS} interests.`);
        return false;
      }

      setPending(true);

      const supabase = createSupabaseBrowserClient();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        setError("You must be signed in to edit your profile.");
        setPending(false);
        return false;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          bio: input.bio.trim() || null,
          niche_tags: input.nicheTags,
          ...(input.avatarUrl !== undefined ? { avatar_url: input.avatarUrl } : {}),
          ...(input.coverUrl !== undefined ? { cover_url: input.coverUrl } : {}),
        })
        .eq("id", userId);

      setPending(false);

      if (updateError) {
        setError(updateError.message);
        return false;
      }

      return true;
    },
    [],
  );

  return { updateProfile, uploadAvatar, uploadCover, pending, error };
}
