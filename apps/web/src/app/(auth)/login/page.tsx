"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@nexhub/ui";
import { signInWithEmail, signInWithGoogle } from "@/lib/supabase/auth-actions";

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

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signInWithEmail, {});

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Log in to NexHub</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Pick up where you left off.
        </p>
      </div>

      <form action={signInWithGoogle} className="flex flex-col gap-2">
        <Button type="submit" variant="secondary" className="w-full flex items-center justify-center">
          <GoogleIcon />
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
            name="email"
            type="email"
            placeholder="Email Address"
            required
            className="h-11 rounded-card border border-border bg-canvas px-4 text-sm text-ink placeholder:text-ink-faint focus:border-ink-muted focus:outline-none"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            className="h-11 rounded-card border border-border bg-canvas px-4 text-sm text-ink placeholder:text-ink-faint focus:border-ink-muted focus:outline-none"
          />
        </div>
        {state?.error && (
          <p className="text-xs text-danger font-medium" role="alert">
            {state.error}
          </p>
        )}
        <Button type="submit" disabled={pending} className="w-full h-11 bg-ink text-canvas font-semibold">
          {pending ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="text-center text-sm text-ink-muted">
        New to NexHub?{" "}
        <Link href="/register" className="font-semibold text-ink hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
