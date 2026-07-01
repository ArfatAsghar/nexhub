import * as React from "react";
import { Heart, MessageCircle, Bookmark, Share2 } from "lucide-react";
import type { PostType, UserRole } from "@nexhub/types";
import { Avatar } from "./Avatar";
import { RoleBadge } from "./RoleBadge";
import { TagPill } from "./TagPill";
import { CodeBlock } from "./CodeBlock";
import { cn } from "../cn";

const POST_TYPE_LABEL: Record<PostType, string> = {
  question: "Question",
  project: "Project",
  lesson: "Lesson",
  discussion: "Discussion",
};

const ROLE_BORDER_CLASSES: Record<UserRole, string> = {
  developer: "border-l-role-developer",
  student: "border-l-role-student",
  tutor: "border-l-role-tutor",
};

export interface PostCardAuthor {
  name: string;
  username: string;
  role: UserRole;
  avatarUrl?: string | null;
}

export interface PostCardProps {
  author: PostCardAuthor;
  type: PostType;
  content: string;
  tags?: string[];
  codeSnippet?: string | null;
  codeLanguage?: string | null;
  timeAgo: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  bookmarkedByMe: boolean;
  onLikeToggle?: () => void;
  onBookmarkToggle?: () => void;
  onCommentClick?: () => void;
  onShareClick?: () => void;
  onAuthorClick?: (e: React.MouseEvent) => void;
  onTagClick?: (tag: string) => void;
  onCardClick?: () => void;
  className?: string;
}

export function PostCard({
  author,
  type,
  content,
  tags = [],
  codeSnippet,
  codeLanguage,
  timeAgo,
  likeCount,
  commentCount,
  likedByMe,
  bookmarkedByMe,
  onLikeToggle,
  onBookmarkToggle,
  onCommentClick,
  onShareClick,
  onAuthorClick,
  onTagClick,
  onCardClick,
  className,
}: PostCardProps) {
  function stop(handler?: (e: React.MouseEvent) => void) {
    return (e: React.MouseEvent) => {
      e.stopPropagation();
      handler?.(e);
    };
  }

  return (
    <article
      onClick={onCardClick}
      role={onCardClick ? "button" : undefined}
      tabIndex={onCardClick ? 0 : undefined}
      onKeyDown={
        onCardClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onCardClick();
            }
          : undefined
      }
      className={cn(
        "rounded-card border border-border border-l-2 bg-canvas-raised p-5 shadow-card transition-all duration-100",
        ROLE_BORDER_CLASSES[author.role],
        onCardClick && "cursor-pointer hover:border-ink-faint",
        className,
      )}
    >
      <header className="flex items-start gap-3">
        <button type="button" onClick={stop(onAuthorClick)} className="shrink-0">
          <Avatar name={author.name} src={author.avatarUrl} size="md" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={stop(onAuthorClick)}
              className="font-display text-sm font-semibold text-ink hover:underline truncate"
            >
              {author.name}
            </button>
            <RoleBadge role={author.role} />
          </div>
          <p className="text-xs text-ink-faint mt-0.5">
            @{author.username} · {timeAgo}
          </p>
        </div>
        <span className="rounded-full border border-border bg-canvas px-2.5 py-0.5 text-xs text-ink-muted shrink-0">
          {POST_TYPE_LABEL[type]}
        </span>
      </header>

      <p className="mt-3.5 whitespace-pre-wrap text-sm leading-relaxed text-ink">
        {content}
      </p>

      {codeSnippet && (
        <CodeBlock code={codeSnippet} language={codeLanguage} className="mt-3" />
      )}

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <TagPill key={tag} tag={tag} onClick={stop(() => onTagClick?.(tag))} />
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-5 border-t border-border pt-3 text-ink-muted">
        <button
          type="button"
          onClick={stop(onLikeToggle)}
          aria-pressed={likedByMe}
          className={cn(
            "flex items-center gap-1.5 text-xs transition-colors hover:text-ink",
            likedByMe && "text-ink font-semibold",
          )}
        >
          <Heart size={15} fill={likedByMe ? "currentColor" : "none"} />
          <span>{likeCount}</span>
        </button>

        <button
          type="button"
          onClick={stop(onCommentClick)}
          className="flex items-center gap-1.5 text-xs transition-colors hover:text-ink"
        >
          <MessageCircle size={15} />
          <span>{commentCount}</span>
        </button>

        <button
          type="button"
          onClick={stop(onBookmarkToggle)}
          aria-pressed={bookmarkedByMe}
          className={cn(
            "ml-auto flex items-center gap-1.5 text-xs transition-colors hover:text-ink",
            bookmarkedByMe && "text-ink",
          )}
        >
          <Bookmark size={15} fill={bookmarkedByMe ? "currentColor" : "none"} />
        </button>

        <button
          type="button"
          onClick={stop(onShareClick)}
          className="flex items-center gap-1.5 text-xs transition-colors hover:text-ink"
        >
          <Share2 size={15} />
        </button>
      </div>
    </article>
  );
}