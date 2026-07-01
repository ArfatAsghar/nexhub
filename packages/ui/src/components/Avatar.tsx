import * as React from "react";
import { cn } from "../cn";

export interface AvatarProps {
  name: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  online?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps["size"]>, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-lg",
};

const DOT_SIZE: Record<NonNullable<AvatarProps["size"]>, string> = {
  xs: "h-1.5 w-1.5",
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
  xl: "h-3.5 w-3.5",
};

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function Avatar({ name, src, size = "md", online, className }: AvatarProps) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className={cn("rounded-full object-cover ring-1 ring-border", SIZE_CLASSES[size])}
        />
      ) : (
        <span
          className={cn(
            "flex items-center justify-center rounded-full bg-canvas-overlay font-display text-ink-muted ring-1 ring-border select-none",
            SIZE_CLASSES[size],
          )}
        >
          {initialsFor(name)}
        </span>
      )}
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-canvas",
            DOT_SIZE[size],
            online ? "bg-success" : "bg-ink-faint",
          )}
        />
      )}
    </span>
  );
}