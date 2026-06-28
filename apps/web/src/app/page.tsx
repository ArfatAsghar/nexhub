import Link from "next/link";
import { Button } from "@nexhub/ui";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-display text-4xl tracking-tight text-ink">
        Nex<span className="text-accent">Hub</span>
      </h1>
      <p className="max-w-md text-ink-muted">
        Where developers, students &amp; tutors connect.
      </p>
      <div className="flex gap-3">
        <Link href="/register">
          <Button variant="primary">Get Started</Button>
        </Link>
        <Link href="/login">
          <Button variant="secondary">Login</Button>
        </Link>
      </div>
    </main>
  );
}
