import * as React from "react";
import type { UserRole } from "@nexhub/types";
import { cn } from "../cn";

const ROLE_LABEL: Record<UserRole, string> = {
  developer: "Developer",
  student: "Student",
  tutor: "Tutor",
};

const ROLE_CLASSES: Record<UserRole, string> = {
  developer: "text-ink-muted border-border",
  student:   "text-ink-muted border-border",
  tutor:     "text-ink-muted border-border",
};

export interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border bg-canvas-overlay px-1.5 py-0.5 font-display text-[10px] uppercase tracking-wider",
        ROLE_CLASSES[role],
        className,
      )}
    >
      {ROLE_LABEL[role]}
    </span>
  );
}
