import * as React from "react";
import { cn } from "../cn";

export interface TagPillProps {
  tag: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
  className?: string;
}

export function TagPill({ tag, onClick, className }: TagPillProps) {
  const Comp = onClick ? "button" : "span";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full bg-white/[0.05] border border-white/[0.08] px-2.5 py-0.5 text-[11px] font-medium text-ink-faint",
        "transition-all duration-150",
        onClick && "hover:bg-accent/12 hover:text-accent hover:border-accent/30 cursor-pointer",
        className,
      )}
    >
      <span className="text-accent/60 mr-0.5">#</span>{tag}
    </Comp>
  );
}