import * as React from "react";
import type { UserRole } from "@nexhub/types";
import { cn } from "../cn";

const ROLE_LABEL: Record<UserRole, string> = {
  developer: "Developer",
  student: "Student",
  tutor: "Tutor",
};

const ROLE_CLASSES: Record<UserRole, string> = {
  developer: "bg-role-developer/15 text-role-developer border-role-developer/30",
  student: "bg-role-student/15 text-role-student border-role-student/30",
  tutor: "bg-role-tutor/15 text-role-tutor border-role-tutor/30",
};

export interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill border px-2 py-0.5 font-display text-xs uppercase tracking-wide",
        ROLE_CLASSES[role],
        className,
      )}
    >
      {ROLE_LABEL[role]}
    </span>
  );
}
