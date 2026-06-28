"use client";

import { useMemo, useState } from "react";
import { usePosts, type FeedPost } from "@/hooks/usePosts";
import { useLikePost } from "@/hooks/useLikePost";
import { useBookmarkPost } from "@/hooks/useBookmarkPost";
import { useUserSearch } from "@/hooks/useUserSearch";
import { PostDetailModal } from "@/components/PostDetailModal";
import { TrendingTopicsPanel } from "@/components/TrendingTopicsPanel";
import { RecommendedUsersGrid } from "@/components/RecommendedUsersGrid";
import { PostCard } from "@nexhub/ui";
import type { PostType, UserRole } from "@nexhub/types";

// ─────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────

type ExploreTab =
  | "all"
  | "developers"
  | "students"
  | "tutors"
  | "lessons"
  | "projects"
  | "questions";

const TABS: { id: ExploreTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "developers", label: "Developers" },   // Filter: Devs
  { id: "students", label: "Students" },        // Filter: Students
  { id: "tutors", label: "Tutors" },            // Filter: Tutors
  { id: "lessons", label: "Lessons" },          // Content type: Lessons
  { id: "projects", label: "Projects" },        // Content type: Projects
  { id: "questions", label: "Questions" },      // Content type: Questions
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function filtersForTab(tab: ExploreTab): {
  type?: PostType;
  authorRole?: UserRole;
} {
  switch (tab) {
    case "developers":  return { authorRole: "developer" };
    case "students":    return { authorRole: "student" };
    case "tutors":      return { authorRole: "tutor" };
    case "lessons":     return { type: "lesson" };
    case "projects":    return { type: "project" };
    case "questions":   return { type: "question" };
    default:            return {};
  }
}

function timeAgo(iso: string): string {
  const diffMs  = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1)  return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)   return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function ExplorePage() {
  const [tab, setTab]               = useState<ExploreTab>("all");
  const [search, setSearch]         = useState("");
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);

  const { type, authorRole } = filtersForTab(tab);

  const {
    posts,
    loading,
    error,
    toggleLikeLocally,
    toggleBookmarkLocally,
  } = usePosts({ type, authorRole, limit: 12 });

  const { toggleLike }     = useLikePost();
  const { toggleBookmark } = useBookmarkPost();

  // ── User search (separate from post feed) ──────────────────────────────────
  // Covers "search bar searches users + posts + tags"
  const { users: matchedUsers, loading: usersSearching } = useUserSearch(search);

  // ── Client-side post filter by search query ────────────────────────────────
  const visiblePosts = useMemo(() => {
    if (!search.trim()) return posts;
    const q = search.toLowerCase();
    return posts.filter(
      (p) =>
        p.content.toLowerCase().includes(q) ||
        p.author.username.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [posts, search]);

  // Keep the open modal in sync with optimistic like/bookmark updates
  const liveSelectedPost = selectedPost
    ? (visiblePosts.find((p) => p.id === selectedPost.id) ?? selectedPost)
    : null;

  const isSearching = search.trim().length >= 2;

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleLike(post: FeedPost) {
    toggleLike(post.id, post.liked_by_me, () => toggleLikeLocally(post.id));
  }

  function handleBookmark(post: FeedPost) {
    toggleBookmark(post.id, post.bookmarked_by_me, () =>
      toggleBookmarkLocally(post.id),
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-6">
      <div className="flex gap-6">

        {/* ── Main column ─────────────────────────────────────────────────── */}
        <main className="min-w-0 flex-1">
          <h1 className="font-display text-xl text-ink">Explore</h1>

          {/* ① Search bar — users + posts + tags */}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts, people, tags…"
            className="mt-4 w-full rounded-card border border-border bg-canvas-raised px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent"
          />

          {/* People results surfaced above the post feed while searching */}
          {isSearching && (usersSearching || matchedUsers.length > 0) && (
            <div className="mt-4 rounded-card border border-border bg-canvas-raised p-3">
              <p className="text-xs font-medium text-ink-muted">People</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {usersSearching && matchedUsers.length === 0 ? (
                  <span className="text-xs text-ink-faint">Searching…</span>
                ) : (
                  matchedUsers.map((u) => (
                    <a
                      key={u.id}
                      href={`/profile/${u.username}`}
                      className="flex items-center gap-2 rounded-pill border border-border px-3 py-1.5 text-xs text-ink hover:border-accent hover:text-accent"
                    >
                      <span className="h-5 w-5 overflow-hidden rounded-full bg-canvas">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt={u.full_name}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </span>
                      @{u.username}
                    </a>
                  ))
                )}
              </div>
            </div>
          )}

          {/*
           * ② Filter tabs
           *    — Role filters:   All / Developers / Students / Tutors
           *    — Content types:  Lessons / Projects / Questions
           */}
          <div
            role="tablist"
            aria-label="Explore filters"
            className="mt-4 flex gap-2 overflow-x-auto pb-2"
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`shrink-0 rounded-pill border px-3 py-1.5 text-xs transition-colors ${
                  tab === t.id
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border text-ink-muted hover:border-ink-faint"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Error state */}
          {error && (
            <p className="mt-4 text-sm text-danger">
              Could not load posts — {error}
            </p>
          )}

          {/* Post grid */}
          {loading ? (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-48 animate-pulse rounded-card border border-border bg-canvas-raised"
                />
              ))}
            </div>
          ) : visiblePosts.length === 0 ? (
            <p className="mt-6 text-sm text-ink-faint">
              No posts match this filter.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
              {visiblePosts.map((post) => (
                <PostCard
                  key={post.id}
                  author={{
                    name:      post.author.full_name,
                    username:  post.author.username,
                    role:      post.author.role,
                    avatarUrl: post.author.avatar_url,
                  }}
                  type={post.type}
                  content={post.content}
                  tags={post.tags}
                  codeSnippet={post.code_snippet}
                  codeLanguage={post.code_language}
                  timeAgo={timeAgo(post.created_at)}
                  likeCount={post.like_count}
                  commentCount={post.comment_count}
                  likedByMe={post.liked_by_me}
                  bookmarkedByMe={post.bookmarked_by_me}
                  onCardClick={() => setSelectedPost(post)}
                  onCommentClick={() => setSelectedPost(post)}
                  onLikeToggle={() => handleLike(post)}
                  onBookmarkToggle={() => handleBookmark(post)}
                />
              ))}
            </div>
          )}

          {/*
           * ③ Recommended users grid
           *    Shown only on the unfiltered, non-search view so it doesn't
           *    compete with search results or category-scoped feeds.
           */}
          {!isSearching && tab === "all" && <RecommendedUsersGrid />}
        </main>

        {/*
         * ── Sidebar ────────────────────────────────────────────────────────
         * ④ Trending hashtag cloud (via TrendingTopicsPanel)
         *    Sticky so it stays in view while scrolling the post feed.
         */}
        <aside className="hidden w-[280px] shrink-0 flex-col gap-4 2xl:flex">
          <div className="sticky top-6">
            <TrendingTopicsPanel />
          </div>
        </aside>
      </div>

      {/* Post detail modal */}
      <PostDetailModal
        post={liveSelectedPost}
        onClose={() => setSelectedPost(null)}
        onLikeToggle={() => {
          if (liveSelectedPost) handleLike(liveSelectedPost);
        }}
        onBookmarkToggle={() => {
          if (liveSelectedPost) handleBookmark(liveSelectedPost);
        }}
      />
    </div>
  );
}