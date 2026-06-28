"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { Button, PostCard } from "@nexhub/ui";
import { PostCommentsSection } from "@/components/PostCommentsSection";
import { ReportPostModal } from "@/components/ReportPostModal";
import { usePost } from "@/hooks/usePost";
import { useRelatedPosts } from "@/hooks/useRelatedPosts";
import { useLikePost } from "@/hooks/useLikePost";
import { useBookmarkPost } from "@/hooks/useBookmarkPost";
import { timeAgo } from "@/lib/timeAgo";

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const postId = params.id;

  const {
    post,
    loading,
    error,
    toggleLikeLocally,
    toggleBookmarkLocally,
  } = usePost(postId);

  const { posts: relatedPosts, loading: relatedLoading } = useRelatedPosts(
    postId,
    post?.tags ?? [],
    post?.author_id ?? null,
  );

  const { toggleLike } = useLikePost();
  const { toggleBookmark } = useBookmarkPost();

  const [reportOpen, setReportOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState("");

  const handleAuthorClick = useCallback(
    (username: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      router.push(`/profile/${username}`);
    },
    [router],
  );

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/post/${postId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "NexHub post", url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareMessage("Link copied!");
        setTimeout(() => setShareMessage(""), 2000);
      }
    } catch {
      await navigator.clipboard.writeText(url);
      setShareMessage("Link copied!");
      setTimeout(() => setShareMessage(""), 2000);
    }
  }, [postId]);

  if (!loading && !post && !error) {
    notFound();
  }

  return (
    <div className="flex justify-center gap-6 px-4 py-6">
      <main className="w-full max-w-2xl">
        <Link
          href="/feed"
          className="mb-4 inline-block text-sm text-ink-faint hover:text-accent"
        >
          ← Back to feed
        </Link>

        {loading && <p className="text-sm text-ink-faint">Loading post…</p>}
        {error && <p className="text-sm text-danger">Error: {error}</p>}

        {post && (
          <>
            <PostCommentsSection
              post={post}
              onLikeToggle={() =>
                toggleLike(post.id, post.liked_by_me, toggleLikeLocally)
              }
              onBookmarkToggle={() =>
                toggleBookmark(post.id, post.bookmarked_by_me, toggleBookmarkLocally)
              }
              onShareClick={handleShare}
              onAuthorClick={(e) => handleAuthorClick(post.author.username, e)}
            />

            <div className="mt-4 flex items-center gap-3">
              <Button variant="ghost" onClick={() => setReportOpen(true)}>
                Report post
              </Button>
              {shareMessage && (
                <span className="text-xs text-accent">{shareMessage}</span>
              )}
            </div>
          </>
        )}
      </main>

      <aside className="hidden w-[280px] shrink-0 xl:block">
        <div className="sticky top-6 rounded-card border border-border bg-canvas-raised p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
            Related posts
          </p>
          {relatedLoading ? (
            <p className="text-xs text-ink-faint">Loading…</p>
          ) : relatedPosts.length === 0 ? (
            <p className="text-xs text-ink-faint">No related posts found.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {relatedPosts.map((rp) => (
                <Link key={rp.id} href={`/post/${rp.id}`}>
                  <PostCard
                    author={{
                      name: rp.author.full_name,
                      username: rp.author.username,
                      role: rp.author.role,
                      avatarUrl: rp.author.avatar_url,
                    }}
                    type={rp.type}
                    content={rp.content}
                    tags={rp.tags}
                    timeAgo={timeAgo(rp.created_at)}
                    likeCount={0}
                    commentCount={0}
                    likedByMe={false}
                    bookmarkedByMe={false}
                    className="cursor-pointer hover:border-accent/30"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </aside>

      <ReportPostModal
        open={reportOpen}
        postId={postId}
        onClose={() => setReportOpen(false)}
      />
    </div>
  );
}
