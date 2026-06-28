"use client";

import Link from "next/link";
import { Avatar, RoleBadge, Button } from "@nexhub/ui";
import { useWhoToFollow } from "@/hooks/useWhoToFollow";
import { useFollowUser } from "@/hooks/useFollowUser";

export function WhoToFollowPanel() {
  const { users, loading, refresh, toggleFollowLocally, removeUserLocally } = useWhoToFollow(4);
  const { toggleFollow } = useFollowUser();

  if (loading) {
    return (
      <div className="rounded-card border border-border bg-canvas-raised p-4">
        <p className="font-display text-sm text-ink">Who to Follow</p>
        <p className="mt-3 text-xs text-ink-faint">Loading…</p>
      </div>
    );
  }

  if (users.length === 0) return null;

  return (
    <div className="rounded-card border border-border bg-canvas-raised p-4">
      <p className="font-display text-sm text-ink">Who to Follow</p>
      <ul className="mt-3 flex flex-col gap-3">
        {users.map((user) => (
          <li key={user.id} className="flex items-center gap-2.5">
            <Link
              href={`/profile/${user.username}`}
              className="flex min-w-0 flex-1 items-center gap-2.5"
            >
              <Avatar name={user.full_name} src={user.avatar_url} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-xs text-ink hover:text-accent">
                    {user.full_name}
                  </p>
                  <RoleBadge role={user.role} className="shrink-0 px-1.5 py-0 text-[10px]" />
                </div>
                <p className="truncate text-xs text-ink-faint">@{user.username}</p>
              </div>
            </Link>
            <Button
              variant={user.following_by_me ? "secondary" : "primary"}
              size="sm"
              className="h-7 shrink-0 px-2.5 text-xs"
              onClick={async () => {
                const wasFollowing = user.following_by_me;
                if (!wasFollowing) {
                  removeUserLocally(user.id);
                } else {
                  toggleFollowLocally(user.id);
                }

                await toggleFollow(user.id, wasFollowing, () => {
                  refresh();
                });

                refresh();
              }}
            >
              {user.following_by_me ? "Following" : "Follow"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}