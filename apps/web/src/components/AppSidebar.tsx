"use client";

import { useState } from "react";
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

import { NewPostModal } from "@/components/NewPostModal";

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
  <div className="flex items-center gap-3 mb-6 px-2">
    <svg
      className="h-8 w-8"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logo-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
        <linearGradient id="logo-grad-2" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#FB923C" />
        </linearGradient>
      </defs>
      {/* Sleek outer hexagon frame */}
      <path
        d="M50 6L90 28V72L50 94L10 72V28L50 6Z"
        stroke="url(#logo-grad-1)"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      {/* Nested inner translucent core */}
      <path
        d="M50 22L76 37V67L50 82L24 67V37L50 22Z"
        fill="url(#logo-grad-2)"
        fillOpacity="0.75"
      />
      {/* Central circular cutout */}
      <circle cx="50" cy="52" r="12" fill="var(--canvas-raised-color)" />
    </svg>
    <span className="font-display text-lg font-bold tracking-tight text-ink">
      Nex<span className="text-accent">Hub</span>
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

      <Button
        onClick={() => setModalOpen(true)}
        variant="primary"
        className="mb-3 w-full flex items-center justify-center gap-2"
      >
        <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" />
        <span>New Post</span>
      </Button>

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
