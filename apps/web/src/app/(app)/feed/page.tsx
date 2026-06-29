"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePosts } from "@/hooks/usePosts";
import { useUser } from "@/hooks/useUser";
import { useLikePost } from "@/hooks/useLikePost";
import { useBookmarkPost } from "@/hooks/useBookmarkPost";
import { useStories, type UploadPayload } from "@/hooks/useStories";
import { NewPostModal } from "@/components/NewPostModal";
import { PostDetailModal } from "@/components/PostDetailModal";
import { WhoToFollowPanel } from "@/components/WhoToFollowPanel";
import { TrendingTopicsPanel } from "@/components/TrendingTopicsPanel";
import { UpcomingSessionsPanel } from "@/components/UpcomingSessionsPanel";
import { PostCard, Avatar } from "@nexhub/ui";
import type { FeedPost } from "@/hooks/usePosts";
import type { Story } from "@/hooks/useStories";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faPen, faTrash, faPlus, faCalendarAlt, faClock, faVideo } from "@fortawesome/free-solid-svg-icons";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function timeAgo(iso: string): string {
  const diffMs  = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1)  return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)   return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function isStoryLive(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;
}

// ─────────────────────────────────────────────────────────────────────────────
// Story Upload Modal
// ─────────────────────────────────────────────────────────────────────────────

type StoryUploadModalProps = {
  open: boolean;
  onClose: () => void;
  onPublish: (payload: UploadPayload) => Promise<void>;
};

const TEXT_BG_OPTIONS = [
  { label: "Dark",   value: "bg-[#1a1a2e]" },
  { label: "Purple", value: "bg-gradient-to-br from-purple-700 to-indigo-900" },
  { label: "Teal",   value: "bg-gradient-to-br from-teal-500 to-cyan-800" },
  { label: "Sunset", value: "bg-gradient-to-br from-orange-500 to-pink-700" },
  { label: "Forest", value: "bg-gradient-to-br from-green-600 to-emerald-900" },
];

const DEFAULT_TEXT_BG = TEXT_BG_OPTIONS[0]?.value ?? "bg-[#1a1a2e]";

function StoryUploadModal({ open, onClose, onPublish }: StoryUploadModalProps) {
  const [tab, setTab]                   = useState<"image" | "text">("image");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [text, setText]                 = useState("");
  const [bg, setBg]                     = useState(DEFAULT_TEXT_BG);
  const [publishing, setPublishing]     = useState(false);
  const fileInputRef                    = useRef<HTMLInputElement>(null);

  const reset = () => {
    setTab("image");
    setImagePreview(null);
    setImageFile(null);
    setText("");
    setBg(DEFAULT_TEXT_BG);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handlePublish = async () => {
    if (tab === "image" && !imageFile) return;
    if (tab === "text"  && !text.trim()) return;
    setPublishing(true);
    try {
      await onPublish(
        tab === "image"
          ? { type: "image", file: imageFile! }
          : { type: "text", text: text.trim(), bg },
      );
      handleClose();
    } finally {
      setPublishing(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-canvas p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-ink">Add to your story</h2>
          <button type="button" onClick={handleClose} className="text-ink-muted hover:text-ink">✕</button>
        </div>

        <div className="mb-5 flex gap-2">
          {(["image", "text"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 rounded-pill border py-1.5 text-sm capitalize transition-colors flex items-center justify-center gap-2 ${
                tab === t
                  ? "border-accent bg-accent/15 text-accent font-semibold"
                  : "border-border text-ink-muted hover:border-ink-faint"
              }`}
            >
              <FontAwesomeIcon icon={t === "image" ? faCamera : faPen} />
              <span>{t === "image" ? "Image" : "Text"}</span>
            </button>
          ))}
        </div>

        {tab === "image" && (
          <div className="flex flex-col items-center gap-4">
            {imagePreview ? (
              <div className="relative w-full overflow-hidden rounded-xl">
                <img src={imagePreview} alt="Story preview" className="max-h-72 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setImagePreview(null); setImageFile(null); }}
                  className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white hover:bg-black/70"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-ink-muted hover:border-accent hover:text-accent"
              >
                <FontAwesomeIcon icon={faCamera} className="text-3xl" />
                <span className="text-sm">Click to choose an image</span>
                <span className="text-xs opacity-60">JPG, PNG, GIF, WEBP</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
        )}

        {tab === "text" && (
          <div className="flex flex-col gap-4">
            <div className={`${bg} flex h-48 w-full items-center justify-center overflow-hidden rounded-xl p-4`}>
              <p className="text-center text-lg font-semibold leading-snug text-white drop-shadow">
                {text || <span className="opacity-40">Your story text…</span>}
              </p>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={280}
              rows={3}
              placeholder="What's your story?"
              className="w-full resize-none rounded-card border border-border bg-canvas-raised px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <div>
              <p className="mb-2 text-xs text-ink-muted">Background</p>
              <div className="flex gap-2">
                {TEXT_BG_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setBg(opt.value)}
                    title={opt.label}
                    className={`${opt.value} h-7 w-7 rounded-full transition-transform ${
                      bg === opt.value ? "scale-125 ring-2 ring-accent ring-offset-1" : ""
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handlePublish}
          disabled={publishing || (tab === "image" && !imageFile) || (tab === "text" && !text.trim())}
          className="mt-5 w-full rounded-pill bg-accent py-2.5 text-sm font-semibold text-canvas transition-opacity disabled:opacity-40 hover:opacity-90"
        >
          {publishing ? "Publishing…" : "Share Story"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Story Viewer
// ─────────────────────────────────────────────────────────────────────────────

type StoryViewerProps = {
  stories: Story[];
  initialIndex: number;
  currentUserId: string;
  onClose: () => void;
  onDelete: (storyId: string) => Promise<void>;
};

function StoryViewer({ stories, initialIndex, currentUserId, onClose, onDelete }: StoryViewerProps) {
  const [index, setIndex]       = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const intervalRef             = useRef<ReturnType<typeof setInterval> | null>(null);
  const DURATION                = 5000;

  const story = stories[index];

  const goNext = useCallback(() => {
    if (index < stories.length - 1) { setIndex((i) => i + 1); setProgress(0); }
    else onClose();
  }, [index, stories.length, onClose]);

  const goPrev = useCallback(() => {
    if (index > 0) { setIndex((i) => i - 1); setProgress(0); }
  }, [index]);

  useEffect(() => {
    setProgress(0);
    const tick = 50;
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(intervalRef.current!); goNext(); return 100; }
        return p + (tick / DURATION) * 100;
      });
    }, tick);
    return () => clearInterval(intervalRef.current!);
  }, [index, goNext]);

  const handleDelete = async () => {
    if (!story) return;
    setDeleting(true);
    try {
      await onDelete(story.id);
      if (stories.length === 1) onClose();
      else goNext();
    } finally {
      setDeleting(false);
    }
  };

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
      <div
        className="relative flex h-full max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bars */}
        <div className="absolute inset-x-0 top-0 z-10 flex gap-1 p-2">
          {stories.map((_, i) => (
            <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full bg-white transition-none"
                style={{
                  width: i < index ? "100%" : i === index ? `${progress}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Author bar */}
        <div className="absolute inset-x-0 top-4 z-10 flex items-center justify-between px-4 pt-4">
          <div className="flex items-center gap-2">
            <Avatar name={story.author_name} src={story.author_avatar} size="sm" />
            <div>
              <p className="text-xs font-semibold text-white">{story.author_name}</p>
              <p className="text-[10px] text-white/60">{timeAgo(story.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {story.author_id === currentUserId && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-full bg-black/40 px-3 py-1.5 text-xs text-red-400 hover:bg-black/60 disabled:opacity-50 flex items-center gap-1.5"
              >
                <FontAwesomeIcon icon={faTrash} />
                <span>{deleting ? "Deleting…" : "Delete"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-black/40 p-1 text-white hover:bg-black/60"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        {story.type === "image" ? (
          <img src={story.image_url!} alt="Story" className="h-full w-full object-cover" />
        ) : (
          <div className={`${story.bg ?? "bg-[#1a1a2e]"} flex h-full w-full items-center justify-center p-8`}>
            <p className="text-center text-2xl font-bold leading-snug text-white drop-shadow-lg">
              {story.text}
            </p>
          </div>
        )}

        {/* Tap zones */}
        <button type="button" onClick={goPrev} className="absolute inset-y-0 left-0 w-1/3" aria-label="Previous" />
        <button type="button" onClick={goNext} className="absolute inset-y-0 right-0 w-1/3" aria-label="Next" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const router      = useRouter();
  const { profile } = useUser();

  const {
    posts, loading: postsLoading, error, refresh,
    fetchNextPage, hasNextPage,
    toggleLikeLocally, toggleBookmarkLocally,
  } = usePosts({ limit: 15 });

  const { stories, uploadStory, deleteStory } = useStories();
  const { toggleLike }     = useLikePost();
  const { toggleBookmark } = useBookmarkPost();

  const [modalOpen, setModalOpen]             = useState(false);
  const [selectedPost, setSelectedPost]       = useState<FeedPost | null>(null);
  const [showNewBanner, setShowNewBanner]     = useState(false);
  const [loadingMore, setLoadingMore]         = useState(false);
  const [storyUploadOpen, setStoryUploadOpen] = useState(false);
  const [viewerState, setViewerState]         = useState<{ open: boolean; index: number }>({ open: false, index: 0 });

  // Follower-only upcoming sessions
  type FollowingSession = {
    id: string;
    title: string;
    scheduled_at: string;
    host_id: string;
    host_name: string;
    host_username: string;
    host_avatar: string | null;
  };
  const [followingSessions, setFollowingSessions] = useState<FollowingSession[]>([]);

  useEffect(() => {
    if (!profile?.id) return;
    const supabase = createSupabaseBrowserClient();
    (async () => {
      // 1. Get IDs of users this profile follows
      const { data: followData } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", profile.id);
      if (!followData || followData.length === 0) return;
      const followingIds = followData.map((f: any) => f.following_id);

      // 2. Get upcoming sessions hosted by those users
      const now = new Date().toISOString();
      const { data: sessionData } = await supabase
        .from("sessions")
        .select("id, title, scheduled_at, host_id, profiles!sessions_host_id_fkey(full_name, username, avatar_url)")
        .in("host_id", followingIds)
        .gt("scheduled_at", now)
        .order("scheduled_at", { ascending: true })
        .limit(5);

      if (sessionData) {
        setFollowingSessions(
          sessionData.map((s: any) => ({
            id: s.id,
            title: s.title,
            scheduled_at: s.scheduled_at,
            host_id: s.host_id,
            host_name: s.profiles?.full_name ?? "Unknown",
            host_username: s.profiles?.username ?? "",
            host_avatar: s.profiles?.avatar_url ?? null,
          }))
        );
      }
    })();
  }, [profile?.id]);

  const liveStories = useMemo(
    () => stories.filter((s) => isStoryLive(s.created_at)),
    [stories],
  );

  const storyAuthors = useMemo(() => {
    const seen = new Set<string>();
    return liveStories.filter((s) => {
      if (seen.has(s.author_id)) return false;
      seen.add(s.author_id);
      return true;
    });
  }, [liveStories]);

  const openViewer = (authorId: string) => {
    const idx = liveStories.findIndex((s) => s.author_id === authorId);
    if (idx >= 0) setViewerState({ open: true, index: idx });
  };

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (entry?.isIntersecting && hasNextPage && !loadingMore) {
          setLoadingMore(true);
          try { await fetchNextPage(); } finally { setLoadingMore(false); }
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, loadingMore, fetchNextPage]);

  const latestCreatedAt = posts[0]?.created_at ?? null;
  useEffect(() => {
    if (!latestCreatedAt) return;
    const id = setInterval(async () => {
      try {
        const { checkForNewPosts } = await import("@/lib/feedUtils");
        const hasNew = await checkForNewPosts(latestCreatedAt);
        if (hasNew) setShowNewBanner(true);
      } catch { /* silent */ }
    }, 30_000);
    return () => clearInterval(id);
  }, [latestCreatedAt]);

  const handleAuthorClick = useCallback((username: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    router.push(`/profile/${username}`);
  }, [router]);

  const handleLike = useCallback(
    (post: FeedPost) => toggleLike(post.id, post.liked_by_me, () => toggleLikeLocally(post.id)),
    [toggleLike, toggleLikeLocally],
  );

  const handleBookmark = useCallback(
    (post: FeedPost) => toggleBookmark(post.id, post.bookmarked_by_me, () => toggleBookmarkLocally(post.id)),
    [toggleBookmark, toggleBookmarkLocally],
  );

  const liveSelectedPost = selectedPost
    ? (posts.find((p) => p.id === selectedPost.id) ?? selectedPost)
    : null;

  return (
    <div className="flex justify-center gap-6 px-4 py-6">
      <main className="w-full max-w-2xl">

        {/* Stories bar */}
        <div className="mb-6 flex gap-4 overflow-x-auto pb-2">
          {/* Add story button */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStoryUploadOpen(true)}
              className="relative flex h-14 w-14 flex-col items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-accent bg-accent/10 hover:bg-accent/20 text-ink"
              aria-label="Add story"
            >
              <FontAwesomeIcon icon={faPlus} className="text-lg" />
              <span className="absolute bottom-0.5 right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-accent text-[8px] text-canvas border border-canvas">
                <FontAwesomeIcon icon={faCamera} className="scale-75" />
              </span>
            </button>
            <span className="w-16 truncate text-center text-xs text-ink-muted">Your story</span>
          </div>

          {/* Live story bubbles */}
          {storyAuthors.map((s) => (
            <div key={s.author_id} className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => openViewer(s.author_id)}
                className="rounded-full p-[2px] ring-2 ring-accent ring-offset-2 ring-offset-canvas focus:outline-none"
              >
                <Avatar name={s.author_name} src={s.author_avatar} size="lg" />
              </button>
              <span className="w-16 truncate text-center text-xs text-ink-muted hover:text-accent">
                {s.author_id === profile?.id ? "You" : `@${s.author_username}`}
              </span>
            </div>
          ))}
        </div>

        {/* Create post bar */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="mb-6 w-full rounded-card border border-border bg-canvas-raised px-4 py-3 text-left text-sm text-ink-faint hover:border-ink-faint"
        >
          {profile ? `What's on your mind, ${profile.full_name.split(" ")[0]}?` : "What's on your mind?"}
        </button>

        {/* Follower-only upcoming sessions */}
        {followingSessions.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ink-faint">
              <FontAwesomeIcon icon={faVideo} className="text-accent" />
              Upcoming Sessions from People You Follow
            </h2>
            <div className="flex flex-col gap-3">
              {followingSessions.map((session) => {
                const dateObj = new Date(session.scheduled_at);
                const dateStr = dateObj.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
                const timeStr = dateObj.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
                return (
                  <div
                    key={session.id}
                    className="flex items-center gap-4 rounded-card border border-accent/30 bg-gradient-to-r from-accent/10 to-accent/5 px-4 py-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
                      <FontAwesomeIcon icon={faVideo} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{session.title}</p>
                      <p className="mt-0.5 text-[11px] text-ink-muted">
                        by{" "}
                        <a
                          href={`/profile/${session.host_username}`}
                          className="font-medium text-accent hover:underline"
                        >
                          @{session.host_username}
                        </a>
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="flex items-center gap-1 text-[11px] text-ink-faint">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-accent/70" />
                        {dateStr}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-faint">
                        <FontAwesomeIcon icon={faClock} className="text-accent/70" />
                        {timeStr}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* New posts banner */}
        {showNewBanner && (
          <button
            type="button"
            onClick={() => { setShowNewBanner(false); refresh(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="mb-4 w-full rounded-card border border-accent bg-accent/10 py-2.5 text-sm font-medium text-accent hover:bg-accent/20"
          >
            ↑ New posts available — tap to refresh
          </button>
        )}

        {error && <p className="mb-4 text-sm text-danger">Error: {error}</p>}

        {/* Post feed */}
        {postsLoading && posts.length === 0 ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-card border border-border bg-canvas-raised" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                author={{ name: post.author.full_name, username: post.author.username, role: post.author.role, avatarUrl: post.author.avatar_url }}
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
                onAuthorClick={(e) => handleAuthorClick(post.author.username, e)}
              />
            ))}
            <div ref={sentinelRef} className="h-4" />
            {loadingMore && <div className="flex justify-center py-4"><span className="text-sm text-ink-faint">Loading more…</span></div>}
            {!hasNextPage && posts.length > 0 && <p className="py-6 text-center text-sm text-ink-faint">You're all caught up 🎉</p>}
          </div>
        )}
      </main>

      {/* Sidebar */}
      <aside className="hidden w-[280px] shrink-0 flex-col gap-4 xl:flex">
        <div className="sticky top-6 flex flex-col gap-4">
          <WhoToFollowPanel />
          <TrendingTopicsPanel />
          <UpcomingSessionsPanel />
        </div>
      </aside>

      {/* Modals */}
      <NewPostModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={() => { refresh(); setModalOpen(false); }} />

      <PostDetailModal
        post={liveSelectedPost}
        onClose={() => setSelectedPost(null)}
        onLikeToggle={() => { if (liveSelectedPost) handleLike(liveSelectedPost); }}
        onBookmarkToggle={() => { if (liveSelectedPost) handleBookmark(liveSelectedPost); }}
        onAuthorClick={(e) => liveSelectedPost && handleAuthorClick(liveSelectedPost.author.username, e)}
      />

      <StoryUploadModal
        open={storyUploadOpen}
        onClose={() => setStoryUploadOpen(false)}
        onPublish={async (payload) => { await uploadStory(payload); }}
      />

      {viewerState.open && liveStories.length > 0 && (
        <StoryViewer
          stories={liveStories}
          initialIndex={viewerState.index}
          currentUserId={profile?.id ?? ""}
          onClose={() => setViewerState({ open: false, index: 0 })}
          onDelete={deleteStory}
        />
      )}
    </div>
  );
}