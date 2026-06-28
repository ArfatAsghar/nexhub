"use client";

import { useState } from "react";
import { Modal, Button, cn, Avatar } from "@nexhub/ui";
import { NICHE_TAGS, MAX_NICHE_TAGS } from "@nexhub/types";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";

export interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialFullName: string;
  initialBio: string;
  initialNicheTags: string[];
  initialAvatarUrl?: string | null;
  initialCoverUrl?: string | null;
}

export function EditProfileModal({
  open,
  onClose,
  onSaved,
  initialFullName,
  initialBio,
  initialNicheTags,
  initialAvatarUrl,
  initialCoverUrl,
}: EditProfileModalProps) {
  const { updateProfile, uploadAvatar, uploadCover, pending, error } = useUpdateProfile();

  const [fullName, setFullName] = useState(initialFullName);
  const [bio, setBio] = useState(initialBio);
  const [tags, setTags] = useState<string[]>(initialNicheTags);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? null);
  const [coverUrl, setCoverUrl] = useState(initialCoverUrl ?? null);
  const [uploading, setUploading] = useState(false);

  function toggleTag(tag: string) {
    setTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= MAX_NICHE_TAGS) return prev;
      return [...prev, tag];
    });
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadAvatar(file);
    if (url) setAvatarUrl(url);
    setUploading(false);
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadCover(file);
    if (url) setCoverUrl(url);
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await updateProfile({
      fullName,
      bio,
      nicheTags: tags,
      avatarUrl,
      coverUrl,
    });
    if (ok) {
      onSaved();
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit profile">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-faint">
            Cover photo
          </p>
          <label className="block cursor-pointer">
            <div
              className="h-24 w-full overflow-hidden rounded-card bg-gradient-to-r from-accent/40 to-role-tutor/40 bg-cover bg-center"
              style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
            />
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
            <span className="mt-1 inline-block text-xs text-accent">Change cover</span>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <Avatar name={fullName} src={avatarUrl} size="lg" />
          <label className="cursor-pointer text-xs text-accent">
            Change avatar
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-faint">
            Name
          </p>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full rounded-card border border-border bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-faint">
            Bio
          </p>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Tell people a bit about yourself…"
            className="w-full resize-none rounded-card border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-faint">
            Interests ({tags.length}/{MAX_NICHE_TAGS})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {NICHE_TAGS.map((tag) => {
              const selected = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  disabled={!selected && tags.length >= MAX_NICHE_TAGS}
                  className={cn(
                    "rounded-pill border px-3 py-1 text-xs transition-colors disabled:opacity-40",
                    selected
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border text-ink-muted hover:border-ink-faint",
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending || uploading}>
            {pending || uploading ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
