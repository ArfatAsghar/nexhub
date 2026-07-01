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
        "inline-flex items-center rounded-sm bg-canvas-overlay border border-border px-2 py-0.5 text-xs text-ink-muted transition-colors",
        onClick && "hover:bg-canvas-overlay hover:text-ink hover:border-ink-faint cursor-pointer",
        className,
      )}
    >
      #{tag}
    </Comp>
  );
}