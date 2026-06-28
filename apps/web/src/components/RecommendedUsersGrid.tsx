"use client";

import { useRecommendedUsers } from "@/hooks/useRecommendedUsers";

export function RecommendedUsersGrid() {
  const { users, loading, error, toggleFollowLocally } = useRecommendedUsers(8);

  if (error) return null; // fail quietly, it's a secondary surface
  if (!loading && users.length === 0) return null;

  return (
    <section className="mt-6">
      <h2 className="font-display text-sm font-medium text-ink-muted">
        People you might know
      </h2>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-card border border-border bg-canvas-raised"
              />
            ))
          : users.map((user) => (
              <div
                key={user.id}
                className="flex flex-col items-center rounded-card border border-border bg-canvas-raised p-4 text-center"
              >
                <div className="h-12 w-12 overflow-hidden rounded-full bg-canvas">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-ink-faint">
                      {user.full_name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <p className="mt-2 truncate text-sm font-medium text-ink">
                  {user.full_name}
                </p>
                <p className="truncate text-xs text-ink-faint">
                  @{user.username}
                </p>

                <span className="mt-1 rounded-pill border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-ink-muted">
                  {user.role}
                </span>

                {user.headline && (
                  <p className="mt-2 line-clamp-2 text-xs text-ink-muted">
                    {user.headline}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => toggleFollowLocally(user.id)}
                  className={`mt-3 w-full rounded-pill border px-3 py-1.5 text-xs transition-colors ${
                    user.followed_by_me
                      ? "border-border text-ink-muted hover:border-danger hover:text-danger"
                      : "border-accent bg-accent/15 text-accent hover:bg-accent/25"
                  }`}
                >
                  {user.followed_by_me ? "Following" : "Follow"}
                </button>
              </div>
            ))}
      </div>
    </section>
  );
}