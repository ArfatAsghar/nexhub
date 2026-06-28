"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useProfileStats } from "@/hooks/useProfileStats";
import { useIsFollowing } from "@/hooks/useIsFollowing";
import { useFollowUser } from "@/hooks/useFollowUser";
import { usePosts, type FeedPost } from "@/hooks/usePosts";
import { useBookmarkedPosts } from "@/hooks/useBookmarkedPosts";
import { useLikePost } from "@/hooks/useLikePost";
import { useBookmarkPost } from "@/hooks/useBookmarkPost";
import { PostDetailModal } from "@/components/PostDetailModal";
import { EditProfileModal } from "@/components/EditProfileModal";
import { Avatar, RoleBadge, Button, StatCard, PostCard } from "@nexhub/ui";
import type { Database, PostType } from "@nexhub/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type ProfileTab = "posts" | "projects" | "lessons" | "bookmarks";

const TABS: { id: ProfileTab; label: string }[] = [
  { id: "posts", label: "Posts" },
  { id: "projects", label: "Projects" },
  { id: "lessons", label: "Lessons" },
  { id: "bookmarks", label: "Bookmarks" },
];

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function useProfileByUsername(username: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    const supabase = createSupabaseBrowserClient();

    supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .maybeSingle()
      .then(({ data }) => {
        if (!isMounted) return;
        if (!data) {
          setNotFoundFlag(true);
        } else {
          setProfile(data);
        }
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [username]);

  return { profile, loading, notFound: notFoundFlag };
}

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;

  const { profile: viewedProfile, loading: profileLoading, notFound: profileNotFound } =
    useProfileByUsername(username);
  const { user: currentUser } = useUser();

  const isOwnProfile = currentUser?.id === viewedProfile?.id;

  const { stats } = useProfileStats(viewedProfile?.id ?? null);
  const { isFollowing, toggleLocally } = useIsFollowing(
    isOwnProfile ? null : viewedProfile?.id ?? null,
  );
  const { toggleFollow } = useFollowUser();

  const [tab, setTab] = useState<ProfileTab>("posts");
  const [editOpen, setEditOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);

  const postTypeFilter: PostType | undefined =
    tab === "projects" ? "project" : tab === "lessons" ? "lesson" : undefined;

  const { toggleLike } = useLikePost();
  const { toggleBookmark } = useBookmarkPost();

  const {
    posts: authoredPosts,
    loading: postsLoading,
    toggleLikeLocally,
    toggleBookmarkLocally,
  } = usePosts({
    type: postTypeFilter,
    authorId: viewedProfile?.id,
    limit: 50,
  });

  const {
    posts: bookmarkedPosts,
    loading: bookmarksLoading,
    toggleLikeLocally: toggleBookmarkedLikeLocally,
    toggleBookmarkLocally: toggleBookmarkedBookmarkLocally,
  } = useBookmarkedPosts(isOwnProfile ? viewedProfile?.id ?? null : null);

  if (profileNotFound) {
    notFound();
  }

  if (profileLoading || !viewedProfile) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-6">
        <p className="text-sm text-ink-faint">Loading profile…</p>
      </main>
    );
  }

  const showBookmarksTab = isOwnProfile;
  const visiblePosts = tab === "bookmarks" ? bookmarkedPosts : authoredPosts;
  const visibleLoading = tab === "bookmarks" ? bookmarksLoading : postsLoading;

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div
        className="h-32 rounded-card bg-gradient-to-r from-accent/40 to-role-tutor/40 bg-cover bg-center"
        style={
          viewedProfile.cover_url
            ? { backgroundImage: `url(${viewedProfile.cover_url})` }
            : undefined
        }
      />

      <div className="-mt-10 flex items-end justify-between px-2">
        <div className="rounded-full border-4 border-canvas">
          <Avatar name={viewedProfile.full_name} src={viewedProfile.avatar_url} size="xl" />
        </div>
        {isOwnProfile ? (
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Link href={`/messages?with=${viewedProfile.username}`}>
              <Button variant="secondary">Message</Button>
            </Link>
            <Button
              variant={isFollowing ? "secondary" : "primary"}
              onClick={() => toggleFollow(viewedProfile.id, isFollowing, toggleLocally)}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
          </div>
        )}
      </div>

      <div className="mt-3 px-2">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-lg text-ink">{viewedProfile.full_name}</h1>
          <RoleBadge role={viewedProfile.role} />
        </div>
        <p className="text-sm text-ink-muted">@{viewedProfile.username}</p>
        {viewedProfile.bio && (
          <p className="mt-2 text-sm text-ink">{viewedProfile.bio}</p>
        )}
        {viewedProfile.niche_tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {viewedProfile.niche_tags.map((tag) => (
              <span
                key={tag}
                className="rounded-pill bg-canvas-overlay px-2 py-0.5 text-xs text-ink-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 flex justify-around border-y border-border py-3">
        <StatCard label="Posts" value={stats?.postCount ?? 0} />
        <StatCard label="Followers" value={stats?.followerCount ?? 0} />
        <StatCard label="Following" value={stats?.followingCount ?? 0} />
        <StatCard label="Sessions Booked" value={stats?.sessionsBookedCount ?? 0} />
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {TABS.filter((t) => t.id !== "bookmarks" || showBookmarksTab).map((t) => (
          <button
            key={t.id}
            type="button"
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

      {visibleLoading ? (
        <p className="mt-6 text-sm text-ink-faint">Loading…</p>
      ) : visiblePosts.length === 0 ? (
        <p className="mt-6 text-sm text-ink-faint">Nothing here yet.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {visiblePosts.map((post) => {
            const likeLocal = tab === "bookmarks" ? toggleBookmarkedLikeLocally : toggleLikeLocally;
            const bookmarkLocal = tab === "bookmarks" ? toggleBookmarkedBookmarkLocally : toggleBookmarkLocally;
            return (
              <PostCard
                key={post.id}
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
                onLikeToggle={() =>
                  toggleLike(post.id, post.liked_by_me, () => likeLocal(post.id))
                }
                onBookmarkToggle={() =>
                  toggleBookmark(post.id, post.bookmarked_by_me, () =>
                    bookmarkLocal(post.id),
                  )
                }
                className="h-full"
              />
            );
          })}
        </div>
      )}

      {isOwnProfile && (
        <EditProfileModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={() => window.location.reload()}
          initialFullName={viewedProfile.full_name}
          initialBio={viewedProfile.bio ?? ""}
          initialNicheTags={viewedProfile.niche_tags}
          initialAvatarUrl={viewedProfile.avatar_url}
          initialCoverUrl={viewedProfile.cover_url}
        />
      )}

      <PostDetailModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onLikeToggle={() => {
          if (selectedPost) {
            toggleLike(selectedPost.id, selectedPost.liked_by_me, () =>
              toggleLikeLocally(selectedPost.id),
            );
          }
        }}
        onBookmarkToggle={() => {
          if (selectedPost) {
            toggleBookmark(selectedPost.id, selectedPost.bookmarked_by_me, () =>
              toggleBookmarkLocally(selectedPost.id),
            );
          }
        }}
      />
    </main>
  );
}