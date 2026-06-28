"use client";

import { useEffect, useState, useMemo } from "react";
import { Avatar, RoleBadge } from "@nexhub/ui";
import { useUser } from "@/hooks/useUser";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrophy,
  faCrown,
  faStar,
  faArrowUp,
  faFilter,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

type FilterRole = "all" | "developer" | "student" | "tutor";

export default function LeaderboardPage() {
  const { user } = useUser();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<FilterRole>("all");

  useEffect(() => {
    async function loadLeaderboard() {
      setLoading(true);
      const supabase = createSupabaseBrowserClient();

      // Fetch profiles with post and comment counts
      const { data, error } = await supabase.from("profiles").select(`
        id,
        username,
        full_name,
        avatar_url,
        role,
        posts:posts(count),
        comments:comments(count)
      `);

      if (error) {
        setLoading(false);
        return;
      }

      // Compute XP and Level
      const computed = (data ?? []).map((p: any) => {
        const postsCount = p.posts?.[0]?.count ?? 0;
        const commentsCount = p.comments?.[0]?.count ?? 0;
        
        // Gamification XP Formula:
        // 10 XP per post, 5 XP per comment, + 15 starting XP
        const xp = postsCount * 10 + commentsCount * 5 + 15;
        const level = Math.floor(xp / 100) + 1;

        return {
          id: p.id,
          username: p.username,
          fullName: p.full_name,
          avatarUrl: p.avatar_url,
          role: p.role,
          postsCount,
          commentsCount,
          xp,
          level,
        };
      });

      // Sort by XP descending
      computed.sort((a, b) => b.xp - a.xp);
      setProfiles(computed);
      setLoading(false);
    }

    loadLeaderboard();
  }, []);

  // Filtered profiles list
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => roleFilter === "all" || p.role === roleFilter);
  }, [profiles, roleFilter]);

  // Find current user stats
  const currentUserStats = useMemo(() => {
    if (!user) return null;
    const index = profiles.findIndex((p) => p.id === user.id);
    if (index === -1) return null;
    return {
      rank: index + 1,
      stats: profiles[index],
    };
  }, [user, profiles]);

  // Top 3 Podium
  const podium = useMemo(() => {
    const topThree = filteredProfiles.slice(0, 3);
    const podiumArr = [null, null, null] as any[];
    // Order: 2nd place, 1st place, 3rd place for visual layout
    if (topThree[1]) podiumArr[0] = topThree[1]; // 2nd
    if (topThree[0]) podiumArr[1] = topThree[0]; // 1st
    if (topThree[2]) podiumArr[2] = topThree[2]; // 3rd
    return podiumArr;
  }, [filteredProfiles]);

  // Remaining list items (rank 4 onwards)
  const listItems = useMemo(() => {
    return filteredProfiles.slice(3);
  }, [filteredProfiles]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl text-ink flex items-center gap-2">
            <FontAwesomeIcon icon={faTrophy} className="text-accent" />
            NexHub Leaderboard
          </h1>
          <p className="text-sm text-ink-muted">
            Celebrate our top contributors and check out your level ranking.
          </p>
        </div>
      </div>

      {/* User stats widget */}
      {user && currentUserStats && (
        <div className="mb-6 rounded-card border border-accent bg-accent/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar
              name={currentUserStats.stats.fullName}
              src={currentUserStats.stats.avatarUrl}
              size="md"
            />
            <div>
              <p className="text-sm font-bold text-ink flex items-center gap-1.5">
                {currentUserStats.stats.fullName}
                <span className="text-xs font-normal text-ink-muted">
                  (Rank #{currentUserStats.rank})
                </span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-accent font-semibold">
                  Level {currentUserStats.stats.level}
                </span>
                <span className="text-xs text-ink-faint">·</span>
                <span className="text-xs text-ink-muted">
                  {currentUserStats.stats.xp} XP Points
                </span>
              </div>
            </div>
          </div>

          <div className="w-full sm:w-64">
            <div className="flex justify-between text-[10px] text-ink-muted mb-1 font-bold">
              <span>PROGRESS</span>
              <span>
                {currentUserStats.stats.xp % 100}% (Next level:{" "}
                {Math.ceil(currentUserStats.stats.xp / 100) * 100} XP)
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-canvas border border-border overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-500"
                style={{ width: `${currentUserStats.stats.xp % 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter roles tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 border-b border-border">
        {([
          { id: "all", label: "All Roles" },
          { id: "developer", label: "Developers" },
          { id: "student", label: "Students" },
          { id: "tutor", label: "Tutors" },
        ] as const).map((r) => (
          <button
            key={r.id}
            onClick={() => setRoleFilter(r.id)}
            className={`shrink-0 rounded-pill border px-3 py-1.5 text-xs transition-colors font-medium ${
              roleFilter === r.id
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-ink-muted hover:border-ink-faint hover:text-ink"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-64 animate-pulse border border-border bg-canvas-raised rounded-card" />
      ) : filteredProfiles.length === 0 ? (
        <p className="text-sm text-ink-muted text-center py-10">No users found under this category.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Visual Podium block */}
          <div className="flex flex-col sm:flex-row items-end justify-center gap-4 py-4 min-h-[220px]">
            {podium.map((pod, i) => {
              if (!pod) return <div key={i} className="hidden sm:block w-48" />;
              
              // Styles depending on podium spot
              const isFirst = i === 1;
              const isSecond = i === 0;
              const cardHeight = isFirst ? "h-52 bg-accent/10 border-accent" : "h-44 bg-canvas-raised border-border";
              const crownColor = isFirst ? "text-yellow-400" : isSecond ? "text-slate-300" : "text-amber-600";
              const rankLabel = isFirst ? "1st" : isSecond ? "2nd" : "3rd";

              return (
                <div
                  key={pod.id}
                  className={`w-full sm:w-48 rounded-card border p-4 flex flex-col items-center justify-center text-center shadow-sm transition-transform hover:-translate-y-1 ${cardHeight}`}
                >
                  <div className="relative mb-2">
                    <FontAwesomeIcon icon={faCrown} className={`absolute -top-4 left-1/2 -translate-x-1/2 h-5 w-5 ${crownColor}`} />
                    <Avatar name={pod.fullName} src={pod.avatarUrl} size="lg" className="ring-2 ring-border" />
                    <span className={`absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-full border border-canvas font-bold text-xs flex items-center justify-center ${
                      isFirst ? "bg-yellow-400 text-black" : isSecond ? "bg-slate-300 text-black" : "bg-amber-600 text-white"
                    }`}>
                      {rankLabel}
                    </span>
                  </div>

                  <p className="truncate text-xs font-bold text-ink max-w-full">
                    {pod.fullName}
                  </p>
                  <RoleBadge role={pod.role} className="mt-0.5" />

                  <div className="mt-2 text-xs flex items-center gap-1.5 font-medium">
                    <span className="text-accent">Lv. {pod.level}</span>
                    <span className="text-ink-faint">|</span>
                    <span className="text-ink-muted">{pod.xp} XP</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Remaining Rankings List */}
          {listItems.length > 0 && (
            <div className="rounded-card border border-border bg-canvas-raised overflow-hidden">
              <div className="grid grid-cols-12 px-4 py-2 border-b border-border bg-canvas/30 text-[10px] uppercase font-bold text-ink-faint">
                <div className="col-span-1">Rank</div>
                <div className="col-span-6">User</div>
                <div className="col-span-2 text-center">Level</div>
                <div className="col-span-1 text-center">Posts</div>
                <div className="col-span-2 text-right">XP Points</div>
              </div>

              <div className="divide-y divide-border/40">
                {listItems.map((pod, idx) => {
                  const rank = idx + 4;
                  const isCurrentUser = user?.id === pod.id;
                  return (
                    <div
                      key={pod.id}
                      className={`grid grid-cols-12 px-4 py-3 items-center text-xs transition-colors ${
                        isCurrentUser ? "bg-accent/5 font-semibold" : "hover:bg-canvas/10"
                      }`}
                    >
                      <div className="col-span-1 font-bold text-ink-muted">#{rank}</div>
                      
                      <div className="col-span-6 flex items-center gap-2">
                        <Avatar name={pod.fullName} src={pod.avatarUrl} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-ink">{pod.fullName}</p>
                          <p className="truncate text-[10px] text-ink-faint">@{pod.username}</p>
                        </div>
                      </div>

                      <div className="col-span-2 text-center text-accent font-semibold">
                        Lv. {pod.level}
                      </div>

                      <div className="col-span-1 text-center text-ink-muted">
                        {pod.postsCount}
                      </div>

                      <div className="col-span-2 text-right font-medium text-ink">
                        {pod.xp} XP
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
