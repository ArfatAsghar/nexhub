import * as React from "react";
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal } from "lucide-react";
import type { PostType, UserRole } from "@nexhub/types";
import { Avatar } from "./Avatar";
import { RoleBadge } from "./RoleBadge";
import { TagPill } from "./TagPill";
import { CodeBlock } from "./CodeBlock";
import { cn } from "../cn";

const POST_TYPE_LABEL: Record<PostType, { label: string; color: string }> = {
  question: { label: "Question", color: "text-[#F59E0B] bg-[#F59E0B]/8 border-[#F59E0B]/20" },
  project:  { label: "Project",  color: "text-[#34D399] bg-[#34D399]/8 border-[#34D399]/20" },
  lesson:   { label: "Lesson",   color: "text-[#818CF8] bg-[#818CF8]/8 border-[#818CF8]/20" },
  discussion: { label: "Discussion", color: "text-[#8B93A8] bg-white/4 border-white/10" },
};

const ROLE_GLOW: Record<UserRole, string> = {
  developer: "hover:shadow-[0_8px_32px_0_rgb(129_140_248_/_0.08),_0_1px_3px_0_rgb(0_0_0_/_0.5)]",
  student:   "hover:shadow-[0_8px_32px_0_rgb(52_211_153_/_0.08),_0_1px_3px_0_rgb(0_0_0_/_0.5)]",
  tutor:     "hover:shadow-[0_8px_32px_0_rgb(245_158_11_/_0.08),_0_1px_3px_0_rgb(0_0_0_/_0.5)]",
};

const ROLE_TOP_BORDER: Record<UserRole, string> = {
  developer: "before:bg-gradient-to-r before:from-transparent before:via-[#818CF8]/60 before:to-transparent",
  student:   "before:bg-gradient-to-r before:from-transparent before:via-[#34D399]/60 before:to-transparent",
  tutor:     "before:bg-gradient-to-r before:from-transparent before:via-[#F59E0B]/60 before:to-transparent",
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

  const typeInfo = POST_TYPE_LABEL[type];

  return (
    <article
      onClick={onCardClick}
      role={onCardClick ? "button" : undefined}
      tabIndex={onCardClick ? 0 : undefined}
      onKeyDown={
        onCardClick
          ? (e) => { if (e.key === "Enter" || e.key === " ") onCardClick(); }
          : undefined
      }
      className={cn(
        // Base floating panel
        "relative overflow-hidden rounded-xl border border-white/[0.07] bg-canvas-raised",
        "shadow-card transition-all duration-200",
        // Top accent line via pseudo-element
        "before:absolute before:inset-x-0 before:top-0 before:h-px before:content-['']",
        ROLE_TOP_BORDER[author.role],
        ROLE_GLOW[author.role],
        onCardClick && "cursor-pointer hover:-translate-y-0.5",
        className,
      )}
    >
      <div className="p-5">
        {/* Header */}
        <header className="flex items-start gap-3">
          <button type="button" onClick={stop(onAuthorClick)} className="shrink-0 mt-0.5">
            <Avatar name={author.name} src={author.avatarUrl} size="md" />
          </button>
          <div className="flex flex-1 min-w-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={stop(onAuthorClick)}
                  className="font-display text-sm font-semibold text-ink hover:text-accent transition-colors truncate"
                >
                  {author.name}
                </button>
                <RoleBadge role={author.role} />
              </div>
              <p className="text-xs text-ink-faint mt-0.5">
                @{author.username} · {timeAgo}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide",
                typeInfo.color,
              )}>
                {typeInfo.label}
              </span>
              <button
                type="button"
                onClick={stop()}
                className="p-1 rounded-md text-ink-faint hover:text-ink hover:bg-white/5 transition-colors"
              >
                <MoreHorizontal size={14} />
              </button>
            </div>
          </div>
        </header>

        {/* Body */}
        <p className="mt-3.5 text-sm leading-relaxed text-ink/90 whitespace-pre-wrap">
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

        {/* Action bar */}
        <div className="mt-4 flex items-center gap-1 border-t border-white/[0.06] pt-3">
          <button
            type="button"
            onClick={stop(onLikeToggle)}
            aria-pressed={likedByMe}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150",
              likedByMe
                ? "text-[#EF4444] bg-[#EF4444]/10"
                : "text-ink-faint hover:text-[#EF4444] hover:bg-[#EF4444]/8",
            )}
          >
            <Heart size={14} fill={likedByMe ? "currentColor" : "none"} />
            <span>{likeCount}</span>
          </button>

          <button
            type="button"
            onClick={stop(onCommentClick)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-faint hover:text-ink hover:bg-white/5 transition-all duration-150"
          >
            <MessageCircle size={14} />
            <span>{commentCount}</span>
          </button>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={stop(onShareClick)}
              className="flex items-center gap-1.5 rounded-lg p-1.5 text-xs text-ink-faint hover:text-ink hover:bg-white/5 transition-all duration-150"
            >
              <Share2 size={14} />
            </button>

            <button
              type="button"
              onClick={stop(onBookmarkToggle)}
              aria-pressed={bookmarkedByMe}
              className={cn(
                "flex items-center gap-1.5 rounded-lg p-1.5 text-xs transition-all duration-150",
                bookmarkedByMe
                  ? "text-accent bg-accent/10"
                  : "text-ink-faint hover:text-accent hover:bg-accent/8",
              )}
            >
              <Bookmark size={14} fill={bookmarkedByMe ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}