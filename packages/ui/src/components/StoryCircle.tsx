import * as React from "react";
import type { UserRole } from "@nexhub/types";
import { Avatar } from "./Avatar";
import { cn } from "../cn";

const RING_CLASSES: Record<UserRole, string> = {
  developer: "ring-role-developer",
  student: "ring-role-student",
  tutor: "ring-role-tutor",
};

export interface StoryCircleProps {
  name: string;
  username: string;
  role: UserRole;
  avatarUrl?: string | null;
  onClick?: () => void;
}

export function StoryCircle({
  name,
  username,
  role,
  avatarUrl,
  onClick,
}: StoryCircleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center"
    >
      <span className={cn("rounded-full p-0.5 ring-2", RING_CLASSES[role])}>
        <Avatar name={name} src={avatarUrl} size="lg" />
      </span>
      <span className="w-full truncate text-xs text-ink-muted">@{username}</span>
    </button>
  );
}