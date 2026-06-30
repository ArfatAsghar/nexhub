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
  xs: "h-6 w-6 text-[9px]",
  sm: "h-8 w-8 text-[10px]",
  md: "h-10 w-10 text-xs",
  lg: "h-14 w-14 text-sm",
  xl: "h-20 w-20 text-base",
};

const DOT_SIZE: Record<NonNullable<AvatarProps["size"]>, string> = {
  xs: "h-1.5 w-1.5",
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
  xl: "h-3.5 w-3.5",
};

// Gradient palettes for fallback initials — cycles across 6 options
const GRADIENT_PALETTES = [
  "from-[#6366F1] to-[#8B5CF6]",
  "from-[#34D399] to-[#10B981]",
  "from-[#F59E0B] to-[#EF4444]",
  "from-[#818CF8] to-[#6366F1]",
  "from-[#EC4899] to-[#8B5CF6]",
  "from-[#14B8A6] to-[#6366F1]",
];

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function gradientFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return GRADIENT_PALETTES[hash % GRADIENT_PALETTES.length]!;
}

export function Avatar({ name, src, size = "md", online, className }: AvatarProps) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className={cn(
            "rounded-full object-cover ring-2 ring-white/8 transition-all duration-200 hover:ring-accent/40",
            SIZE_CLASSES[size],
          )}
        />
      ) : (
        <span
          className={cn(
            "flex items-center justify-center rounded-full bg-gradient-to-br font-display font-semibold text-white",
            "ring-2 ring-white/8 transition-all duration-200 hover:ring-accent/40",
            "select-none",
            gradientFor(name),
            SIZE_CLASSES[size],
          )}
        >
          {initialsFor(name)}
        </span>
      )}
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-[1.5px] border-canvas",
            DOT_SIZE[size],
            online ? "bg-[#10B981] shadow-[0_0_6px_0_rgb(16_185_129_/_0.8)]" : "bg-ink-faint",
          )}
        />
      )}
    </span>
  );
}