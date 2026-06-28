"use client";

import { Modal } from "@nexhub/ui";
import { PostCommentsSection } from "@/components/PostCommentsSection";
import type { FeedPost } from "@/hooks/usePosts";

export interface PostDetailModalProps {
  post: FeedPost | null;
  onClose: () => void;
  onLikeToggle?: () => void;
  onBookmarkToggle?: () => void;
  onShareClick?: () => void;
  onAuthorClick?: (e: React.MouseEvent) => void;
}

export function PostDetailModal({
  post,
  onClose,
  onLikeToggle,
  onBookmarkToggle,
  onShareClick,
  onAuthorClick,
}: PostDetailModalProps) {
  if (!post) return null;

  return (
    <Modal open={!!post} onClose={onClose} title="Post" className="max-w-xl">
      <div className="max-h-[70vh] overflow-y-auto pr-1">
        <PostCommentsSection
          post={post}
          onLikeToggle={onLikeToggle}
          onBookmarkToggle={onBookmarkToggle}
          onShareClick={
            onShareClick ??
            (() => {
              const url = `${window.location.origin}/post/${post.id}`;
              navigator.clipboard.writeText(url);
            })
          }
          onAuthorClick={onAuthorClick}
        />
      </div>
    </Modal>
  );
}
