"use client";

import { useCallback, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PostCard } from "@nexhub/ui";
import { PostDetailModal } from "@/components/PostDetailModal";
import { useUser } from "@/hooks/useUser";
import { useBookmarkedPosts } from "@/hooks/useBookmarkedPosts";
import { useLikePost } from "@/hooks/useLikePost";
import { useBookmarkPost } from "@/hooks/useBookmarkPost";
import type { FeedPost } from "@/hooks/usePosts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faBookmark } from "@fortawesome/free-solid-svg-icons";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

type FilterType = "all" | "question" | "project" | "lesson" | "discussion";

export default function BookmarksPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const {
    posts,
    loading,
    error,
    toggleLikeLocally,
    toggleBookmarkLocally,
  } = useBookmarkedPosts(user?.id ?? null);

  const { toggleLike } = useLikePost();
  const { toggleBookmark } = useBookmarkPost();

  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [filterType, setFilterType] = useState<FilterType>("all");

  const handleAuthorClick = useCallback(
    (username: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      router.push(`/profile/${username}`);
    },
    [router],
  );

  const handleLike = useCallback(
    (post: FeedPost) =>
      toggleLike(post.id, post.liked_by_me, () => toggleLikeLocally(post.id)),
    [toggleLike, toggleLikeLocally],
  );

  const handleBookmark = useCallback(
    (post: FeedPost) =>
      toggleBookmark(post.id, post.bookmarked_by_me, () =>
        toggleBookmarkLocally(post.id),
      ),
    [toggleBookmark, toggleBookmarkLocally],
  );

  // Client side filtering by post type
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => filterType === "all" || post.type === filterType);
  }, [posts, filterType]);

  const liveSelectedPost = selectedPost
    ? (posts.find((p) => p.id === selectedPost.id) ?? selectedPost)
    : null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="font-display text-xl text-ink flex items-center gap-2">
        <FontAwesomeIcon icon={faBookmark} className="text-accent h-5 w-5" />
        Bookmarks
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        Posts you&apos;ve saved from the feed.
      </p>

      {/* Filter Tabs */}
      {user && posts.length > 0 && (
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2 border-b border-border">
          {([
            { id: "all", label: "All Bookmarks" },
            { id: "question", label: "Questions" },
            { id: "project", label: "Projects" },
            { id: "lesson", label: "Lessons" },
            { id: "discussion", label: "Discussions" },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setFilterType(t.id)}
              className={`shrink-0 rounded-pill border px-3 py-1 text-xs transition-colors font-medium ${
                filterType === t.id
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-ink-muted hover:border-ink-faint hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-danger">Error: {error}</p>}

      {(userLoading || loading) && posts.length === 0 ? (
        <div className="mt-6 flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-card border border-border bg-canvas-raised"
            />
          ))}
        </div>
      ) : !user ? (
        <p className="mt-6 text-sm text-ink-muted">
          Sign in to see your bookmarked posts.
        </p>
      ) : posts.length === 0 ? (
        <p className="mt-6 text-sm text-ink-muted">
          No bookmarked posts yet. Tap the bookmark icon on a post in your feed
          to save it here.
        </p>
      ) : filteredPosts.length === 0 ? (
        <p className="mt-6 text-sm text-ink-muted italic">
          No saved posts match the selected category.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {filteredPosts.map((post) => (
            <div key={post.id} className="relative group">
              <PostCard
                author={{
                  name: post.author.full_name,
                  username: post.author.username,
                  role: post.author.role,
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
                onAuthorClick={(e) => handleAuthorClick(post.author.username, e)}
              />

              {/* Hover to Unsave Quick Action */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleBookmark(post);
                }}
                className="absolute top-3.5 right-3.5 hidden group-hover:flex items-center gap-1.5 rounded-pill bg-danger/10 hover:bg-danger/25 border border-danger/30 px-3 py-1.5 text-xs text-danger font-bold transition-all shadow-sm z-10"
                title="Remove Bookmark"
              >
                <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
                <span>Unsave</span>
              </button>
            </div>
          ))}
        </div>
      )}

      <PostDetailModal
        post={liveSelectedPost}
        onClose={() => setSelectedPost(null)}
        onLikeToggle={() => {
          if (liveSelectedPost) handleLike(liveSelectedPost);
        }}
        onBookmarkToggle={() => {
          if (liveSelectedPost) handleBookmark(liveSelectedPost);
        }}
        onAuthorClick={(e) =>
          liveSelectedPost &&
          handleAuthorClick(liveSelectedPost.author.username, e)
        }
      />
    </main>
  );
}
