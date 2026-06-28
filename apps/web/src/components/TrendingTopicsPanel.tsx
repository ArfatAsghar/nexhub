"use client";

import { useTrendingTags } from "@/hooks/useTrendingTags";

export function TrendingTopicsPanel() {
  const { tags, loading } = useTrendingTags(5);

  if (loading) {
    return (
      <div className="rounded-card border border-border bg-canvas-raised p-4">
        <p className="font-display text-sm text-ink">Trending Topics</p>
        <p className="mt-3 text-xs text-ink-faint">Loading…</p>
      </div>
    );
  }

  if (tags.length === 0) return null;

  return (
    <div className="rounded-card border border-border bg-canvas-raised p-4">
      <p className="font-display text-sm text-ink">Trending Topics</p>
      <ul className="mt-3 flex flex-col gap-2.5">
        {tags.map(({ tag, postCount }) => (
          <li key={tag} className="flex items-center justify-between">
            <span className="text-xs text-ink hover:text-accent">#{tag}</span>
            <span className="text-xs text-ink-faint">
              {postCount} {postCount === 1 ? "post" : "posts"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}