import * as React from "react";
import type { UserRole } from "@nexhub/types";
import { cn } from "../cn";

const ROLE_LABEL: Record<UserRole, string> = {
  developer: "Dev",
  student: "Student",
  tutor: "Tutor",
};

const ROLE_CLASSES: Record<UserRole, string> = {
  developer: "bg-[#818CF8]/12 text-[#818CF8] border-[#818CF8]/25 shadow-[0_0_8px_0_rgb(129_140_248_/_0.15)]",
  student:   "bg-[#34D399]/12 text-[#34D399] border-[#34D399]/25 shadow-[0_0_8px_0_rgb(52_211_153_/_0.15)]",
  tutor:     "bg-[#F59E0B]/12 text-[#F59E0B] border-[#F59E0B]/25 shadow-[0_0_8px_0_rgb(245_158_11_/_0.15)]",
};

export interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 font-display text-[10px] font-semibold uppercase tracking-wider",
        ROLE_CLASSES[role],
        className,
      )}
    >
      {ROLE_LABEL[role]}
    </span>
  );
}
