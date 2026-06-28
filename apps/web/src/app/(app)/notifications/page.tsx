"use client";

import Link from "next/link";
import { Avatar, Button, cn } from "@nexhub/ui";
import { useUser } from "@/hooks/useUser";
import {
  useNotifications,
  type NotificationFilter,
  type NotificationType,
} from "@/hooks/useNotifications";
import { timeAgo } from "@/lib/timeAgo";

const FILTERS: { id: NotificationFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "like", label: "Likes" },
  { id: "follow", label: "Follows" },
  { id: "session_booked", label: "Sessions" },
  { id: "mention", label: "Mentions" },
  { id: "comment", label: "Comments" },
];

function notificationText(type: NotificationType, actorName: string): string {
  switch (type) {
    case "like":
      return `${actorName} liked your post`;
    case "comment":
      return `${actorName} commented on your post`;
    case "follow":
      return `${actorName} started following you`;
    case "mention":
      return `${actorName} mentioned you`;
    case "session_booked":
      return `${actorName} booked your session`;
    default:
      return `${actorName} sent you a notification`;
  }
}

function notificationHref(
  type: NotificationType,
  postId: string | null,
  actorUsername: string | null,
): string {
  if (postId && (type === "like" || type === "comment" || type === "mention")) {
    return `/post/${postId}`;
  }
  if (type === "follow" && actorUsername) {
    return `/profile/${actorUsername}`;
  }
  return "/notifications";
}

export default function NotificationsPage() {
  const { user } = useUser();
  const {
    notifications,
    loading,
    error,
    filter,
    setFilter,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications(user?.id ?? null);

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl text-ink">Notifications</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" onClick={() => markAllAsRead()}>
            Mark all read
          </Button>
        )}
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "shrink-0 rounded-pill border px-3 py-1.5 text-xs transition-colors",
              filter === f.id
                ? "border-accent bg-accent/15 text-accent"
                : "border-border text-ink-muted hover:border-ink-faint",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-danger">Error: {error}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-ink-faint">Loading notifications…</p>
      ) : notifications.length === 0 ? (
        <p className="mt-6 text-sm text-ink-faint">No notifications yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-card border border-border bg-canvas-raised">
          {notifications.map((n) => {
            const actorName = n.actor?.full_name ?? "Someone";
            const href = notificationHref(n.type, n.post_id, n.actor?.username ?? null);

            return (
              <li key={n.id}>
                <Link
                  href={href}
                  onClick={() => {
                    if (!n.is_read) markAsRead(n.id);
                  }}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-canvas-overlay",
                    !n.is_read && "bg-accent/5",
                  )}
                >
                  <Avatar
                    name={actorName}
                    src={n.actor?.avatar_url}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink">
                      {notificationText(n.type, actorName)}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                  {!n.is_read && (
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
