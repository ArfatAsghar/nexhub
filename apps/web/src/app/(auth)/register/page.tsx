"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button, cn } from "@nexhub/ui";
import { NICHE_TAGS, MAX_NICHE_TAGS, type UserRole } from "@nexhub/types";
import { signUpWithEmail, signInWithGoogle } from "@/lib/supabase/auth-actions";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "developer", label: "Developer" },
  { value: "tutor", label: "Tutor" },
];

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(signUpWithEmail, {});
  const [role, setRole] = useState<UserRole>("student");
  const [tags, setTags] = useState<string[]>([]);

  function toggleTag(tag: string) {
    setTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= MAX_NICHE_TAGS) return prev;
      return [...prev, tag];
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-2xl text-ink">Join NexHub</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Where developers, students &amp; tutors connect.
        </p>
      </div>

      <form action={signInWithGoogle}>
        <Button type="submit" variant="secondary" className="w-full">
          Continue with Google
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-ink-faint">
        <div className="h-px flex-1 bg-border" />
        <span>or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <input
            name="fullName"
            placeholder="Full name"
            required
            className="h-10 rounded-card border border-border bg-canvas-raised px-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            name="username"
            placeholder="Username"
            required
            pattern="[a-z0-9_]{3,20}"
            title="3-20 characters: lowercase letters, numbers, underscore"
            className="h-10 rounded-card border border-border bg-canvas-raised px-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="h-10 rounded-card border border-border bg-canvas-raised px-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            minLength={8}
            className="h-10 rounded-card border border-border bg-canvas-raised px-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
            I am a…
          </p>
          <input type="hidden" name="role" value={role} />
          <div className="flex gap-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={cn(
                  "flex-1 rounded-pill border px-3 py-1.5 text-sm transition-colors",
                  role === r.value
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border text-ink-muted hover:border-ink-faint",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
            Your interests (up to {MAX_NICHE_TAGS})
          </p>
          <div className="flex flex-wrap gap-2">
            {NICHE_TAGS.map((tag) => {
              const selected = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  disabled={!selected && tags.length >= MAX_NICHE_TAGS}
                  className={cn(
                    "rounded-pill border px-3 py-1 text-xs transition-colors disabled:opacity-40",
                    selected
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border text-ink-muted hover:border-ink-faint",
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
          {tags.map((tag) => (
            <input key={tag} type="hidden" name="nicheTags" value={tag} />
          ))}
        </div>

        {state?.error && (
          <p className="text-sm text-danger" role="alert">
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:text-accent-hover">
          Log in
        </Link>
      </p>
    </div>
  );
}
