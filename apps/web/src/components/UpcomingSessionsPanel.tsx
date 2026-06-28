"use client";

import { Avatar, Button } from "@nexhub/ui";
import { useUpcomingSessions } from "@/hooks/useUpcomingSessions";
import { useBookSession } from "@/hooks/useBookSession";

function formatSessionTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function UpcomingSessionsPanel() {
  const { sessions, loading, refresh } = useUpcomingSessions(2);
  const { bookSession, pending } = useBookSession();

  if (loading) {
    return (
      <div className="rounded-card border border-border bg-canvas-raised p-4">
        <p className="font-display text-sm text-ink">Upcoming Sessions</p>
        <p className="mt-3 text-xs text-ink-faint">Loading…</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-card border border-border bg-canvas-raised p-4">
        <p className="font-display text-sm text-ink">Upcoming Sessions</p>
        <p className="mt-3 text-xs text-ink-faint">
          No sessions scheduled yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-border bg-canvas-raised p-4">
      <p className="font-display text-sm text-ink">Upcoming Sessions</p>
      <ul className="mt-3 flex flex-col gap-3">
        {sessions.map((session) => (
          <li key={session.id} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Avatar
                name={session.tutor.full_name}
                src={session.tutor.avatar_url}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-ink">{session.title}</p>
                <p className="truncate text-xs text-ink-faint">
                  @{session.tutor.username} ·{" "}
                  {formatSessionTime(session.scheduled_at)}
                </p>
              </div>
            </div>
            <Button
              variant={session.booked_by_me ? "secondary" : "primary"}
              size="sm"
              className="h-7 w-full text-xs"
              disabled={pending || session.booked_by_me}
              onClick={async () => {
                const ok = await bookSession(session.id);
                if (ok) refresh();
              }}
            >
              {session.booked_by_me ? "Booked" : "Book"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}