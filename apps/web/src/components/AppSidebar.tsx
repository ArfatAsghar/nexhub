"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, Button, RoleBadge, Avatar } from "@nexhub/ui";
import type { Database } from "@nexhub/types";
import { signOut } from "@/lib/supabase/auth-actions";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import {
  Home,
  Compass,
  MessageSquare,
  Bell,
  Bookmark,
  User,
  LogOut,
  Plus,
  CalendarDays,
  Trophy,
} from "lucide-react";
import { NewPostModal } from "@/components/NewPostModal";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const NAV_ITEMS = [
  { href: "/feed",          label: "Home",          icon: Home,          badgeKey: null },
  { href: "/explore",       label: "Explore",        icon: Compass,       badgeKey: null },
  { href: "/messages",      label: "Messages",       icon: MessageSquare, badgeKey: "messages" as const },
  { href: "/notifications", label: "Notifications",  icon: Bell,          badgeKey: "notifications" as const },
  { href: "/sessions",      label: "Sessions",       icon: CalendarDays,  badgeKey: null },
  { href: "/leaderboard",   label: "Leaderboard",    icon: Trophy,        badgeKey: null },
  { href: "/bookmarks",     label: "Bookmarks",      icon: Bookmark,      badgeKey: null },
];

const Logo = () => (
  <div className="flex items-center gap-2.5 mb-6 px-2">
    <svg
      className="h-8 w-8 text-ink"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M50 10L86 31V71L50 92L14 71V31L50 10Z"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="51" r="14" fill="currentColor" />
    </svg>
    <span className="font-display text-lg font-bold tracking-tight text-ink">
      NexHub
    </span>
  </div>
);

export function AppSidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const { notificationCount, messageCount } = useUnreadCounts(profile?.id ?? null);
  const [modalOpen, setModalOpen] = useState(false);

  function badgeFor(key: "messages" | "notifications" | null) {
    if (key === "messages") return messageCount;
    if (key === "notifications") return notificationCount;
    return 0;
  }

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[232px] flex-col border-r border-border bg-canvas-raised p-4 lg:flex">
        <Link href="/feed">
          <Logo />
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            const badge = badgeFor(item.badgeKey);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-card px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-canvas-overlay text-ink font-semibold"
                    : "text-ink-muted hover:bg-canvas-overlay hover:text-ink",
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} strokeWidth={active ? 2.2 : 1.8} className={active ? "text-ink" : "text-ink-faint"} />
                  <span>{item.label}</span>
                </div>
                {badge > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-[10px] font-bold text-canvas">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </Link>
            );
          })}
          {profile && (
            <Link
              href={`/profile/${profile.username}`}
              className={cn(
                "flex items-center gap-3 rounded-card px-3 py-2 text-sm transition-colors",
                pathname.startsWith("/profile")
                  ? "bg-canvas-overlay text-ink font-semibold"
                  : "text-ink-muted hover:bg-canvas-overlay hover:text-ink",
              )}
            >
              <User size={16} strokeWidth={pathname.startsWith("/profile") ? 2.2 : 1.8} className={pathname.startsWith("/profile") ? "text-ink" : "text-ink-faint"} />
              <span>Profile</span>
            </Link>
          )}
        </nav>

        <Button
          onClick={() => setModalOpen(true)}
          variant="primary"
          className="mb-3 w-full flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          <span>New Post</span>
        </Button>

        {profile && (
          <div className="flex items-center justify-between rounded-card border border-border p-2 bg-canvas">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar name={profile.full_name ?? profile.username ?? "U"} src={profile.avatar_url} size="sm" />
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-xs font-semibold text-ink leading-tight">{profile.full_name}</span>
                <RoleBadge role={profile.role} className="mt-0.5 w-fit" />
              </div>
            </div>
            <form action={signOut} className="flex items-center">
              <button
                type="submit"
                className="p-1.5 text-ink-muted hover:text-ink hover:bg-canvas-overlay rounded-sm transition-colors"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </form>
          </div>
        )}
      </aside>

      {modalOpen && (
        <NewPostModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            if (window.location.pathname === "/feed") {
              window.location.reload();
            } else {
              window.location.href = "/feed";
            }
          }}
        />
      )}
    </>
  );
}
