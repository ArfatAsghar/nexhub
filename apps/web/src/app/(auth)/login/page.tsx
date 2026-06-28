"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@nexhub/ui";
import { signInWithEmail, signInWithGoogle } from "@/lib/supabase/auth-actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signInWithEmail, {});

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-2xl text-ink">Log in to NexHub</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Pick up where you left off.
        </p>
      </div>

      <form action={signInWithGoogle} className="flex flex-col gap-2">
        <Button type="submit" variant="secondary" className="w-full">
          Continue with Google
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-ink-faint">
        <div className="h-px flex-1 bg-border" />
        <span>or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form action={formAction} className="flex flex-col gap-3">
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
          className="h-10 rounded-card border border-border bg-canvas-raised px-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent"
        />
        {state?.error && (
          <p className="text-sm text-danger" role="alert">
            {state.error}
          </p>
        )}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="text-center text-sm text-ink-muted">
        New to NexHub?{" "}
        <Link href="/register" className="text-accent hover:text-accent-hover">
          Create an account
        </Link>
      </p>
    </div>
  );
}
