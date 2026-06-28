import type { PostType, UserRole } from "./database";

/** Niche tags users can select at registration (max 5) — from product spec. */
export const NICHE_TAGS = [
  "React",
  "Python",
  "Mathematics",
  "Physics",
  "UI/UX",
  "DSA",
  "Machine Learning",
  "Web Dev",
] as const;

export type NicheTag = (typeof NICHE_TAGS)[number];

export const MAX_NICHE_TAGS = 5;
export const MAX_POST_TAGS = 5;

export const USER_ROLES: readonly UserRole[] = ["student", "developer", "tutor"];

export const POST_TYPES: readonly PostType[] = [
  "question",
  "project",
  "lesson",
  "discussion",
];

/** Role badge colors, matching the product spec exactly. */
export const ROLE_COLORS: Record<UserRole, string> = {
  developer: "#6C63FF",
  student: "#00D4AA",
  tutor: "#FF6B6B",
};
