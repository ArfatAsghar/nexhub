"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar, Button, PostCard } from "@nexhub/ui";
import { useComments, type CommentWithAuthor } from "@/hooks/useComments";
import { useCreateComment } from "@/hooks/useCreateComment";
import type { FeedPost } from "@/hooks/usePosts";
import { timeAgo } from "@/lib/timeAgo";

function CommentRow({
  comment,
  onReply,
}: {
  comment: CommentWithAuthor;
  onReply?: () => void;
}) {
  return (
    <div className="flex gap-2.5">
      <Link href={`/profile/${comment.author.username}`} className="shrink-0">
        <Avatar
          name={comment.author.full_name}
          src={comment.author.avatar_url}
          size="sm"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <Link
            href={`/profile/${comment.author.username}`}
            className="text-xs font-medium text-ink hover:text-accent"
          >
            {comment.author.full_name}
          </Link>
          <span className="text-xs text-ink-faint">
            @{comment.author.username} · {timeAgo(comment.created_at)}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-ink">{comment.content}</p>
        {onReply && (
          <button
            type="button"
            onClick={onReply}
            className="mt-1 text-xs text-ink-faint hover:text-accent"
          >
            Reply
          </button>
        )}
      </div>
    </div>
  );
}

export interface PostCommentsSectionProps {
  post: FeedPost;
  onLikeToggle?: () => void;
  onBookmarkToggle?: () => void;
  onShareClick?: () => void;
  onAuthorClick?: (e: React.MouseEvent) => void;
  showActions?: boolean;
}

export function PostCommentsSection({
  post,
  onLikeToggle,
  onBookmarkToggle,
  onShareClick,
  onAuthorClick,
  showActions = true,
}: PostCommentsSectionProps) {
  const { threads, loading, refresh } = useComments(post.id);
  const { createComment, pending, error } = useCreateComment();
  const [commentInput, setCommentInput] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await createComment(post.id, commentInput, replyingTo ?? undefined);
    if (ok) {
      setCommentInput("");
      setReplyingTo(null);
      refresh();
    }
  }

  return (
    <div className="flex flex-col gap-4">
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
        onLikeToggle={showActions ? onLikeToggle : undefined}
        onBookmarkToggle={showActions ? onBookmarkToggle : undefined}
        onShareClick={showActions ? onShareClick : undefined}
        onAuthorClick={onAuthorClick}
        className={showActions ? "" : "border-none bg-transparent p-0 shadow-none"}
      />

      <div className="border-t border-border pt-3">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
          Comments
        </p>

        {loading ? (
          <p className="text-xs text-ink-faint">Loading comments…</p>
        ) : threads.length === 0 ? (
          <p className="text-xs text-ink-faint">No comments yet. Be the first.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {threads.map((thread) => (
              <div key={thread.id} className="flex flex-col gap-3">
                <CommentRow comment={thread} onReply={() => setReplyingTo(thread.id)} />
                {thread.replies.length > 0 && (
                  <div className="ml-8 flex flex-col gap-3 border-l border-border pl-3">
                    {thread.replies.map((reply) => (
                      <CommentRow key={reply.id} comment={reply} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-border pt-3">
        {replyingTo && (
          <div className="mb-2 flex items-center justify-between text-xs text-ink-faint">
            <span>Replying to comment</span>
            <button type="button" onClick={() => setReplyingTo(null)} className="hover:text-ink">
              Cancel
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="Write a comment…"
            className="flex-1 rounded-card border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <Button type="submit" disabled={pending || !commentInput.trim()}>
            {pending ? "…" : "Send"}
          </Button>
        </div>
        {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
      </form>
    </div>
  );
}
