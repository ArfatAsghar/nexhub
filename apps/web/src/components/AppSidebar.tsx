"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, Button, RoleBadge } from "@nexhub/ui";
import type { Database } from "@nexhub/types";
import { signOut } from "@/lib/supabase/auth-actions";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faCompass,
  faComment,
  faBell,
  faBookmark,
  faCog,
  faUser,
  faSignOutAlt,
  faPlus,
  faCalendarAlt,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const NAV_ITEMS = [
  { href: "/feed", label: "Home", icon: faHome, badgeKey: null },
  { href: "/explore", label: "Explore", icon: faCompass, badgeKey: null },
  { href: "/messages", label: "Messages", icon: faComment, badgeKey: "messages" as const },
  { href: "/notifications", label: "Notifications", icon: faBell, badgeKey: "notifications" as const },
  { href: "/sessions", label: "Sessions", icon: faCalendarAlt, badgeKey: null },
  { href: "/leaderboard", label: "Leaderboard", icon: faTrophy, badgeKey: null },
  { href: "/bookmarks", label: "Bookmarks", icon: faBookmark, badgeKey: null },
];

const Logo = () => (
  <div className="flex items-center gap-2 mb-6 px-2">
    <svg
      className="h-7 w-7"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="24" fill="url(#logo-grad)" />
      <path
        d="M32 68V32H44L56 53V32H68V68H56L44 47V68H32Z"
        fill="#07090E"
      />
    </svg>
    <span className="font-display text-lg font-bold tracking-tight text-ink">
      Nex<span className="text-accent">Hub</span>
    </span>
  </div>
);

export function AppSidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const { notificationCount, messageCount } = useUnreadCounts(profile?.id ?? null);

  function badgeFor(key: "messages" | "notifications" | null) {
    if (key === "messages") return messageCount;
    if (key === "notifications") return notificationCount;
    return 0;
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[240px] flex-col border-r border-border bg-canvas-raised p-4 lg:flex">
      <Link href="/feed">
        <Logo />
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const badge = badgeFor(item.badgeKey);
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
                <FontAwesomeIcon icon={item.icon} className="h-4 w-4" />
                <span>{item.label}</span>
              </div>
              {badge > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-canvas">
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
            <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
            <span>Profile</span>
          </Link>
        )}
      </nav>

      <Link href="/feed">
        <Button variant="primary" className="mb-3 w-full flex items-center justify-center gap-2">
          <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" />
          <span>New Post</span>
        </Button>
      </Link>

      {profile && (
        <div className="flex items-center justify-between rounded-card border border-border p-2">
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm text-ink">{profile.full_name}</span>
            <RoleBadge role={profile.role} className="mt-1 w-fit" />
          </div>
          <form action={signOut} className="flex items-center">
            <button
              type="submit"
              className="p-2 text-ink-muted hover:text-ink transition-colors"
              title="Sign out"
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}
