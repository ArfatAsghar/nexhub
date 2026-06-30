"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button, cn } from "@nexhub/ui";
import { NICHE_TAGS, MAX_NICHE_TAGS, type UserRole } from "@nexhub/types";
import { signUpWithEmail, signInWithGoogle } from "@/lib/supabase/auth-actions";

const ROLES: { value: UserRole; label: string; color: string; bg: string; border: string }[] = [
  { value: "student", label: "Student", color: "text-[#34D399]", bg: "bg-[#34D399]/10", border: "border-[#34D399]/40" },
  { value: "developer", label: "Developer", color: "text-[#818CF8]", bg: "bg-[#818CF8]/10", border: "border-[#818CF8]/40" },
  { value: "tutor", label: "Tutor", color: "text-[#FB923C]", bg: "bg-[#FB923C]/10", border: "border-[#FB923C]/40" },
];

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
    <path
      fill="#EA4335"
      d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.37 0 3.4 2.673 1.48 6.57l3.786 3.195z"
    />
    <path
      fill="#34A853"
      d="M16.04 15.345c-1.07.728-2.455 1.164-4.04 1.164a7.076 7.076 0 01-6.734-4.855L1.48 14.85C3.4 18.745 7.37 21.418 12 21.418c3.127 0 5.964-1.036 8.018-2.827l-3.978-3.246z"
    />
    <path
      fill="#4285F4"
      d="M23.49 12.273c0-.818-.073-1.609-.209-2.373H12v4.509h6.445a5.518 5.518 0 01-2.395 3.618l3.978 3.246c2.327-2.145 3.464-5.3 3.464-8.99z"
    />
    <path
      fill="#FBBC05"
      d="M5.266 12.235a7.034 7.034 0 010-2.47L1.48 6.57a11.96 11.96 0 000 10.86l3.786-3.195z"
    />
  </svg>
);

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

  const activeRoleData = ROLES.find((r) => r.value === role) || ROLES[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-mono text-2xl font-bold tracking-tight text-white">Join NexHub</h1>
        <p className="mt-1.5 text-sm text-white/50">
          Where developers, students &amp; tutors connect.
        </p>
      </div>

      <form action={signInWithGoogle}>
        <Button type="submit" variant="secondary" className="w-full flex items-center justify-center border-white/10 hover:border-white/20 bg-white/[0.04] text-white">
          <GoogleIcon />
          Continue with Google
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-white/30">
        <div className="h-px flex-1 bg-white/10" />
        <span>or</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <form action={formAction} className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <input
            name="fullName"
            placeholder="Full name"
            required
            className="h-11 rounded-xl border border-white/10 bg-white/[0.02] px-4 text-sm text-white placeholder:text-white/30 focus:border-[#818CF8] focus:bg-white/[0.04] focus:outline-none focus:ring-1 focus:ring-[#818CF8]"
          />
          <input
            name="username"
            placeholder="Username"
            required
            pattern="[a-z0-9_]{3,20}"
            title="3-20 characters: lowercase letters, numbers, underscore"
            className="h-11 rounded-xl border border-white/10 bg-white/[0.02] px-4 text-sm text-white placeholder:text-white/30 focus:border-[#818CF8] focus:bg-white/[0.04] focus:outline-none focus:ring-1 focus:ring-[#818CF8]"
          />
          <input
            name="email"
            type="email"
            placeholder="Email Address"
            required
            className="h-11 rounded-xl border border-white/10 bg-white/[0.02] px-4 text-sm text-white placeholder:text-white/30 focus:border-[#818CF8] focus:bg-white/[0.04] focus:outline-none focus:ring-1 focus:ring-[#818CF8]"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            minLength={8}
            className="h-11 rounded-xl border border-white/10 bg-white/[0.02] px-4 text-sm text-white placeholder:text-white/30 focus:border-[#818CF8] focus:bg-white/[0.04] focus:outline-none focus:ring-1 focus:ring-[#818CF8]"
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
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
                  "flex-1 rounded-xl border py-2 text-xs font-semibold transition-all duration-200",
                  role === r.value
                    ? `${r.color} ${r.bg} ${r.border} scale-[1.02]`
                    : "border-white/10 text-white/60 hover:border-white/20 hover:text-white",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
            Your interests (up to {MAX_NICHE_TAGS})
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
            {NICHE_TAGS.map((tag) => {
              const selected = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  disabled={!selected && tags.length >= MAX_NICHE_TAGS}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] transition-all duration-150 disabled:opacity-30",
                    selected
                      ? "border-[#818CF8]/50 bg-[#818CF8]/10 text-white font-medium"
                      : "border-white/10 text-white/60 hover:border-white/20 hover:text-white",
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
          <p className="text-xs text-danger font-medium" role="alert">
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full h-11 bg-[#818CF8] hover:bg-[#818CF8]/90 text-white rounded-xl font-semibold shadow-lg shadow-[#818CF8]/25 transition-all">
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-white/50">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[#818CF8] hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
