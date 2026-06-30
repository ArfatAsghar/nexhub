"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, Avatar, RoleBadge } from "@nexhub/ui";
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
  Zap,
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
  <Link href="/feed" className="flex items-center gap-3 px-3 py-2 mb-2 group">
    <svg className="h-7 w-7 shrink-0" viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="sidebar-logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
      </defs>
      <polygon
        points="16,2 29,9.5 29,22.5 16,30 3,22.5 3,9.5"
        fill="url(#sidebar-logo-grad)"
        opacity="0.15"
      />
      <polygon
        points="16,2 29,9.5 29,22.5 16,30 3,22.5 3,9.5"
        fill="none"
        stroke="url(#sidebar-logo-grad)"
        strokeWidth="1.5"
      />
      <polygon
        points="16,8 23,12 23,20 16,24 9,20 9,12"
        fill="url(#sidebar-logo-grad)"
        opacity="0.3"
      />
      <circle cx="16" cy="16" r="3.5" fill="url(#sidebar-logo-grad)" />
    </svg>
    <span className="font-mono text-[15px] font-bold tracking-tight text-ink group-hover:text-accent transition-colors">
      Nex<span className="text-accent">Hub</span>
    </span>
  </Link>
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
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[232px] flex-col border-r border-white/[0.06] bg-canvas-raised lg:flex">
        {/* Subtle top gradient line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

        <div className="flex flex-1 flex-col gap-1 p-4 overflow-y-auto">
          {/* Logo */}
          <Logo />

          {/* Divider */}
          <div className="mx-3 mb-3 h-px bg-white/[0.06]" />

          {/* Nav Items */}
          <nav className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => {
              const active = pathname.startsWith(item.href);
              const badge = badgeFor(item.badgeKey);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all duration-150",
                    active
                      ? "bg-accent/12 text-accent font-semibold"
                      : "text-ink-muted hover:bg-white/[0.05] hover:text-ink",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={17}
                      strokeWidth={active ? 2.2 : 1.8}
                      className={cn(
                        "transition-colors",
                        active ? "text-accent" : "text-ink-faint group-hover:text-ink",
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                  {badge > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white shadow-accent-sm">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Profile link */}
            {profile && (
              <Link
                href={`/profile/${profile.username}`}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150",
                  pathname.startsWith("/profile")
                    ? "bg-accent/12 text-accent font-semibold"
                    : "text-ink-muted hover:bg-white/[0.05] hover:text-ink",
                )}
              >
                <User
                  size={17}
                  strokeWidth={pathname.startsWith("/profile") ? 2.2 : 1.8}
                  className={cn(
                    "transition-colors",
                    pathname.startsWith("/profile") ? "text-accent" : "text-ink-faint group-hover:text-ink",
                  )}
                />
                <span>Profile</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Bottom section */}
        <div className="p-4 border-t border-white/[0.06]">
          {/* New Post button */}
          <button
            onClick={() => setModalOpen(true)}
            className={cn(
              "mb-3 w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150",
              "bg-accent hover:bg-accent-hover active:scale-[0.98]",
              "shadow-accent-sm hover:shadow-accent",
              "relative overflow-hidden",
              "before:absolute before:inset-0 before:bg-white/10 before:opacity-0 hover:before:opacity-100 before:transition-opacity",
            )}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>New Post</span>
            <Zap size={13} className="ml-auto text-white/60" />
          </button>

          {/* Profile footer card */}
          {profile && (
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 transition-all duration-150 hover:bg-white/[0.04]">
              <Avatar
                name={profile.full_name ?? profile.username ?? "U"}
                src={profile.avatar_url}
                size="sm"
                online
              />
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-semibold text-ink leading-tight">
                  {profile.full_name ?? profile.username}
                </p>
                <RoleBadge role={profile.role} className="mt-1" />
              </div>
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint hover:text-ink hover:bg-white/[0.08] transition-all duration-150"
                  title="Sign out"
                >
                  <LogOut size={14} />
                </button>
              </form>
            </div>
          )}
        </div>
      </aside>

      {/* New Post Modal */}
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
