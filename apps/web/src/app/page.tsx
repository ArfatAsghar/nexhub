"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCode,
  faGraduationCap,
  faChalkboardTeacher,
  faArrowRight,
  faStar,
  faUsers,
  faFileCode,
  faCalendarCheck,
  faQuoteLeft,
  faTerminal,
  faRocket,
  faCheck,
  faBolt,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";

// Monochromatic GitHub icon SVG
const GitHubIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" width="16" height="16">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Animated counter hook
// ─────────────────────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat Counter Card
// ─────────────────────────────────────────────────────────────────────────────
function StatCounter({ value, label, suffix = "", icon, started }: {
  value: number; label: string; suffix?: string; icon: any; started: boolean;
}) {
  const count = useCountUp(value, 2000, started);
  return (
    <div className="flex flex-col items-center justify-center border border-border bg-canvas-raised p-6 text-center rounded-card">
      <div className="mb-2 text-ink-faint">
        <FontAwesomeIcon icon={icon} className="text-lg" />
      </div>
      <div className="font-display text-2xl font-bold text-ink tracking-tight">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="mt-1 text-xs text-ink-muted font-medium uppercase tracking-wider">{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Role Card
// ─────────────────────────────────────────────────────────────────────────────
function RoleCard({ role, tagline, description, features, cta, href, icon }: {
  role: string; tagline: string; description: string; features: string[]; cta: string; href: string; icon: any;
}) {
  return (
    <div className="flex flex-col justify-between rounded-card border border-border bg-canvas-raised p-6 transition-colors hover:border-ink-faint">
      <div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-border text-ink bg-canvas">
            <FontAwesomeIcon icon={icon} className="text-sm" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold tracking-wide uppercase text-ink">{role}</h3>
            <p className="text-[11px] text-ink-faint font-medium">{tagline}</p>
          </div>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-ink-muted">{description}</p>
        <ul className="mt-6 flex flex-col gap-2.5">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-xs text-ink-muted">
              <span className="mt-0.5 text-[10px] text-ink-faint font-bold">✓</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-8">
        <Link
          href={href}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-card border border-border bg-canvas py-2.5 text-xs font-semibold text-ink transition-colors hover:bg-canvas-overlay"
        >
          {cta} <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Testimonial card
// ─────────────────────────────────────────────────────────────────────────────
function TestimonialCard({ quote, name, handle, role, avatarLetter }: {
  quote: string; name: string; handle: string;
  role: "developer" | "student" | "tutor"; avatarLetter: string;
}) {
  return (
    <div className="relative flex flex-col gap-4 rounded-card border border-border bg-canvas-raised p-6">
      <FontAwesomeIcon icon={faQuoteLeft} className="absolute right-5 top-5 text-xl text-border" />
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <FontAwesomeIcon key={i} icon={faStar} className="text-[10px] text-ink-muted" />
        ))}
      </div>
      <p className="text-xs leading-relaxed text-ink-muted">"{quote}"</p>
      <div className="flex items-center gap-3 border-t border-border pt-4 mt-auto">
        <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-ink bg-canvas border border-border">
          {avatarLetter}
        </div>
        <div>
          <p className="text-xs font-semibold text-ink">{name}</p>
          <p className="text-[10px] text-ink-faint">@{handle} · {role}</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Landing Page
// ─────────────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsStarted, setStatsStarted] = useState(false);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) { setStatsStarted(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-canvas text-ink">
      
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-5 md:px-12 border-b border-border bg-canvas-raised">
        <div className="flex items-center gap-2.5">
          <svg width="28" height="28" viewBox="0 0 100 100" fill="none" className="text-ink">
            <path
              d="M50 10L86 31V71L50 92L14 71V31L50 10Z"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinejoin="round"
            />
            <circle cx="50" cy="51" r="14" fill="currentColor" />
          </svg>
          <span className="font-mono text-base font-bold text-ink">NexHub</span>
        </div>
        <div className="hidden items-center gap-8 text-xs font-medium text-ink-muted md:flex">
          <a href="#roles" className="transition-colors hover:text-ink">Roles</a>
          <a href="#stats" className="transition-colors hover:text-ink">Stats</a>
          <a href="#testimonials" className="transition-colors hover:text-ink">Reviews</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-xs font-semibold text-ink-muted transition-colors hover:text-ink md:block">Sign in</Link>
          <Link href="/register" className="rounded-card bg-ink px-4 py-2 text-xs font-semibold text-canvas transition-opacity hover:opacity-90">
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24 pt-20 text-center md:pt-28">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-canvas-raised px-4 py-1 text-xs font-semibold text-ink-muted">
          <FontAwesomeIcon icon={faBolt} className="text-[10px]" />
          <span>The Developer Community Platform</span>
        </div>

        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-ink md:text-6xl">
          Where Code Meets Community
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-ink-muted">
          NexHub brings developers, students, and tutors together — share knowledge, showcase projects,
          book live coding sessions, and grow faster than you ever could alone.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4 text-[11px] text-ink-faint">
          {["Share code & projects", "Book live sessions", "Build your network", "Learn from experts"].map((v) => (
            <span key={v} className="flex items-center gap-1.5 font-medium">
              <span className="text-ink-faint font-bold">✓</span>
              {v}
            </span>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/register" className="inline-flex items-center gap-2 rounded-card bg-ink px-7 py-3 text-xs font-semibold text-canvas transition-opacity hover:opacity-90">
            Start for Free <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
          </Link>
          <Link href="/login" className="inline-flex items-center gap-2 rounded-card border border-border bg-canvas-raised px-7 py-3 text-xs font-semibold text-ink-muted transition-colors hover:text-ink hover:border-ink-faint">
            <GitHubIcon className="h-3.5 w-3.5" /> Sign in
          </Link>
        </div>

        {/* Video Demo Mockup */}
        <div className="relative mx-auto mt-16 max-w-3xl">
          {/* Flat outline box */}
          <div className="relative overflow-hidden rounded-card border border-border bg-canvas-raised text-left shadow-card">
            {/* Window Chrome Header */}
            <div className="flex items-center justify-between border-b border-border bg-canvas px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-border" />
                <div className="h-2.5 w-2.5 rounded-full bg-border" />
                <div className="h-2.5 w-2.5 rounded-full bg-border" />
                <span className="ml-3 text-[10px] text-ink-faint font-mono">nexhub.app/showcase.mp4</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-ink-muted" />
                <span className="text-[9px] text-ink-faint font-semibold tracking-wider uppercase font-mono">Demo</span>
              </div>
            </div>
            
            {/* Aspect Ratio Video Container */}
            <div className="relative aspect-video w-full bg-canvas-raised overflow-hidden">
              <video
                src="https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-programmer-typing-on-a-keyboard-22001-large.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* Overlay minimal Banner */}
              <div className="absolute bottom-4 left-4 right-4 p-3 rounded-card border border-border bg-canvas-raised/90 backdrop-blur-md flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-ink font-mono flex items-center gap-1.5">
                    Interactive Coding Workspace
                  </h4>
                  <p className="text-[10px] text-ink-faint truncate mt-0.5">Collaborative programming with integrated text, audio and video rooms.</p>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-sm border border-border bg-canvas text-ink-muted text-[10px] font-semibold font-mono">
                  v1.2.0
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <section id="stats" ref={statsRef} className="relative z-10 border-y border-border bg-canvas-raised py-16">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-10 text-center text-[10px] font-semibold uppercase tracking-widest text-ink-faint">Platform metrics</p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCounter value={12400} label="Registered Users" icon={faUsers} started={statsStarted} />
            <StatCounter value={38000} label="Posts Shared" icon={faFileCode} started={statsStarted} />
            <StatCounter value={5200} label="Sessions Booked" icon={faCalendarCheck} started={statsStarted} />
            <StatCounter value={94} label="Countries Reached" suffix="+" icon={faGlobe} started={statsStarted} />
          </div>
        </div>
      </section>

      {/* ── Role showcase ─────────────────────────────────────────────── */}
      <section id="roles" className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        <div className="mb-3 text-center text-[10px] font-semibold uppercase tracking-widest text-ink-faint">Built for every role</div>
        <h2 className="mb-3 text-center font-display text-2xl font-bold text-ink">Three Core Roles</h2>
        <p className="mx-auto mb-16 max-w-md text-center text-xs leading-relaxed text-ink-muted">
          Whether you write code, learn it, or teach it — NexHub is your space to thrive.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          <RoleCard icon={faCode} role="Developer" tagline="Ship code, build reputation"
            description="Share projects, publish code snippets, get peer reviews, and establish yourself as an authority in your niche."
            features={["Post code with syntax highlighting","Tag projects by language & framework","Get likes, comments, and bookmarks","Connect with students who want to learn","Host paid 1-on-1 coding sessions"]}
            cta="Join as Developer" href="/register?role=developer" />
          <RoleCard icon={faGraduationCap} role="Student" tagline="Learn by doing, not just watching"
            description="Discover real code, follow expert developers, and book live sessions with tutors who've actually shipped production software."
            features={["Follow top developers in your stack","Bookmark lessons and tutorials","Book 1-on-1 sessions with tutors","Ask questions in comments","Track your learning journey"]}
            cta="Join as Student" href="/register?role=student" />
          <RoleCard icon={faChalkboardTeacher} role="Tutor" tagline="Teach what you know, earn what you're worth"
            description="Set your schedule, price your sessions, and build a loyal student base by sharing real-world expertise on NexHub."
            features={["Set availability and session pricing","Publish lessons and tutorials","Receive session booking requests","Build your tutor profile & reviews","Earn from what you already know"]}
            cta="Join as Tutor" href="/register?role=tutor" />
        </div>
      </section>

      {/* ── Feature strip ─────────────────────────────────────────────── */}
      <section className="relative z-10 border-y border-border bg-canvas-raised py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { icon: faRocket, title: "Live Coding Sessions", desc: "Book real-time 1-on-1 video sessions with developers and tutors who've shipped real products." },
              { icon: faFileCode, title: "Code-first Posts", desc: "Every post supports full syntax-highlighted code blocks. Share lessons, snippets, and project walkthroughs." },
              { icon: faUsers, title: "Follow & Discover", desc: "Build your feed around the people who matter — follow by role, niche, and skill stack." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-border text-ink bg-canvas">
                  <FontAwesomeIcon icon={icon} className="text-xs" />
                </div>
                <div>
                  <h3 className="mb-1 text-xs font-semibold text-ink uppercase tracking-wide">{title}</h3>
                  <p className="text-[11px] leading-relaxed text-ink-muted">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────── */}
      <section id="testimonials" className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        <div className="mb-3 text-center text-[10px] font-semibold uppercase tracking-widest text-ink-faint">User reviews</div>
        <h2 className="mb-16 text-center font-display text-2xl font-bold text-ink">Built for real people.</h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <TestimonialCard quote="I posted a React hook on NexHub and within a week had 3 students book sessions with me. The platform basically turned my open-source work into a side income." name="Marcus Reid" handle="marcusdev" role="developer" avatarLetter="M" />
          <TestimonialCard quote="I was completely stuck on system design concepts. Found a tutor on NexHub, booked a 1-hour session, and finally understood distributed caching. Couldn't recommend it more." name="Priya Sharma" handle="priya_learns" role="student" avatarLetter="P" />
          <TestimonialCard quote="My NexHub profile has become my portfolio. Recruiters reach out after seeing my lesson posts. It's like a GitHub + LinkedIn for practical coding knowledge." name="Jordan Cole" handle="jordancodes" role="developer" avatarLetter="J" />
          <TestimonialCard quote="Teaching on NexHub is seamless. I set my rates, share my availability, and students come to me. I run 8-10 sessions a week alongside my day job." name="Dr. Aisha Malik" handle="aisha_teaches" role="tutor" avatarLetter="A" />
          <TestimonialCard quote="The code snippet posts are what hooked me. I can actually read and learn from real code samples, not just theory. The community is incredibly supportive." name="Liam Torres" handle="liambuilds" role="student" avatarLetter="L" />
          <TestimonialCard quote="I went from 0 to 400 followers in 2 months just by consistently posting TypeScript lessons. The algorithm rewards quality content — as it should." name="Yuki Tanaka" handle="yukidev" role="tutor" avatarLetter="Y" />
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 pb-24">
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-card border border-border p-12 text-center bg-canvas-raised">
          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-canvas px-4 py-1 text-xs font-semibold text-ink-muted">
              <span>Free to join</span>
            </div>
            <h2 className="mb-3 font-display text-2xl font-bold text-ink">Ready to level up?</h2>
            <p className="mb-8 text-xs text-ink-muted">Join thousands of developers, students, and tutors already building on NexHub.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register" className="inline-flex items-center gap-2 rounded-card bg-ink px-8 py-3 text-xs font-semibold text-canvas transition-opacity hover:opacity-90">
                Create Free Account <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
              </Link>
              <Link href="/login" className="inline-flex items-center gap-2 rounded-card border border-border bg-canvas px-8 py-3 text-xs font-semibold text-ink-muted transition-colors hover:text-ink">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-border bg-canvas px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
            <span className="font-mono">NexHub</span>
            <span className="text-border">·</span>
            <span className="text-[11px] font-normal">Where developers, students & tutors connect.</span>
          </div>
          <div className="flex gap-6 text-xs text-ink-faint">
            <Link href="/register" className="transition-colors hover:text-ink">Sign Up</Link>
            <Link href="/login" className="transition-colors hover:text-ink">Login</Link>
            <a href="https://github.com/ArfatAsghar/nexhub" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 transition-colors hover:text-ink">
              <GitHubIcon className="h-3.5 w-3.5" /> GitHub
            </a>
          </div>
          <p className="text-[11px] text-ink-faint">© 2026 NexHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
