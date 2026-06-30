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

// Inline SVG replacement for faGithub to avoid brand icons dependency issues
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
// Stat counter card
// ─────────────────────────────────────────────────────────────────────────────
function StatCounter({
  value,
  label,
  suffix = "",
  icon,
  started,
}: {
  value: number;
  label: string;
  suffix?: string;
  icon: any;
  started: boolean;
}) {
  const count = useCountUp(value, 2200, started);
  const display = value >= 1000 ? (count / 1000).toFixed(1) + "K" : count;
  return (
    <div className="group flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-8 py-6 backdrop-blur-sm transition-all duration-300 hover:border-[#818CF8]/40 hover:bg-white/10">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#818CF8]/20 text-[#818CF8] text-xl">
        <FontAwesomeIcon icon={icon} />
      </div>
      <div className="text-center">
        <p className="font-mono text-4xl font-bold text-white">
          {display}{suffix}
        </p>
        <p className="mt-1 text-sm text-white/60">{label}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Floating code snippet
// ─────────────────────────────────────────────────────────────────────────────
function FloatingCode({ code, style }: { code: string; style: React.CSSProperties }) {
  return (
    <div
      className="pointer-events-none absolute hidden select-none rounded-lg border border-white/5 bg-white/[0.03] px-4 py-3 font-mono text-xs text-white/20 backdrop-blur-sm xl:block"
      style={style}
    >
      <pre>{code}</pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Role card
// ─────────────────────────────────────────────────────────────────────────────
function RoleCard({
  color, icon, role, tagline, description, features, cta, href,
}: {
  color: string; icon: any; role: string; tagline: string;
  description: string; features: string[]; cta: string; href: string;
}) {
  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-8 transition-all duration-500 hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl"
    >
      <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl" style={{ background: `${color}20`, color }}>
        <FontAwesomeIcon icon={icon} />
      </div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color }}>{role}</div>
      <h3 className="mb-3 text-xl font-bold text-white">{tagline}</h3>
      <p className="mb-6 text-sm leading-relaxed text-white/60">{description}</p>
      <ul className="mb-8 flex flex-col gap-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-white/70">
            <FontAwesomeIcon icon={faCheck} className="shrink-0 text-xs" style={{ color }} />
            {f}
          </li>
        ))}
      </ul>
      <div className="mt-auto">
        <Link
          href={href}
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:gap-3"
          style={{ background: `${color}20`, border: `1px solid ${color}40` }}
        >
          {cta} <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Testimonial card
// ─────────────────────────────────────────────────────────────────────────────
const ROLE_COLOR: Record<string, string> = {
  developer: "#818CF8",
  student: "#34D399",
  tutor: "#FB923C",
};
function TestimonialCard({ quote, name, handle, role, avatarLetter }: {
  quote: string; name: string; handle: string;
  role: "developer" | "student" | "tutor"; avatarLetter: string;
}) {
  const color = ROLE_COLOR[role];
  return (
    <div className="relative flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07]">
      <FontAwesomeIcon icon={faQuoteLeft} className="absolute right-5 top-5 text-2xl text-white/10" />
      <div className="flex gap-1">{[...Array(5)].map((_, i) => <FontAwesomeIcon key={i} icon={faStar} className="text-xs text-yellow-400" />)}</div>
      <p className="text-sm leading-relaxed text-white/70">"{quote}"</p>
      <div className="flex items-center gap-3 border-t border-white/10 pt-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: `${color}30`, border: `1px solid ${color}40` }}>
          {avatarLetter}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{name}</p>
          <p className="text-xs" style={{ color }}>@{handle} · {role}</p>
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
    <div className="relative min-h-screen overflow-x-hidden bg-[#07090E] text-white bg-grid-pattern">

      {/* Mesh gradient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#818CF8]/10 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-[500px] w-[500px] rounded-full bg-[#34D399]/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-[#FB923C]/10 blur-[120px]" />
      </div>

      {/* Floating code snippets */}
      <FloatingCode code={`const hub = new NexHub();\nawait hub.connect(user);`} style={{ top: "18%", left: "3%", transform: "rotate(-3deg)" }} />
      <FloatingCode code={`// Book a session\nsession.schedule({\n  tutor: "alex",\n  date: "2024-07-15"\n});`} style={{ top: "35%", right: "2%", transform: "rotate(2deg)" }} />
      <FloatingCode code={`POST /api/posts\n{ type: "lesson",\n  tags: ["react"] }`} style={{ bottom: "25%", left: "2%", transform: "rotate(-2deg)" }} />

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-2.5">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="lp-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#818CF8" /><stop offset="100%" stopColor="#34D399" />
              </linearGradient>
            </defs>
            <polygon points="16,2 29,9.5 29,22.5 16,30 3,22.5 3,9.5" fill="url(#lp-grad)" opacity="0.15" />
            <polygon points="16,2 29,9.5 29,22.5 16,30 3,22.5 3,9.5" fill="none" stroke="url(#lp-grad)" strokeWidth="1.5" />
            <polygon points="16,8 23,12 23,20 16,24 9,20 9,12" fill="url(#lp-grad)" opacity="0.3" />
            <circle cx="16" cy="16" r="3.5" fill="url(#lp-grad)" />
          </svg>
          <span className="font-mono text-lg font-bold text-white">Nex<span style={{ color: "#818CF8" }}>Hub</span></span>
        </div>
        <div className="hidden items-center gap-8 text-sm text-white/60 md:flex">
          <a href="#roles" className="transition-colors hover:text-white">For Who</a>
          <a href="#stats" className="transition-colors hover:text-white">Stats</a>
          <a href="#testimonials" className="transition-colors hover:text-white">Reviews</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-sm text-white/70 transition-colors hover:text-white md:block">Sign in</Link>
          <Link href="/register" className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90" style={{ background: "#818CF8" }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24 pt-20 text-center md:pt-32">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold" style={{ borderColor: "#818CF8aa", background: "#818CF820", color: "#818CF8" }}>
          <FontAwesomeIcon icon={faBolt} className="text-[10px]" />
          The Developer Community Platform
        </div>

        <h1 className="font-mono text-5xl font-bold leading-tight tracking-tight text-white md:text-7xl">
          Where Code Meets{" "}
          <span className="bg-gradient-to-r from-[#818CF8] via-purple-400 to-[#34D399] bg-clip-text text-transparent">
            Community
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
          NexHub brings developers, students, and tutors together — share knowledge, showcase projects,
          book live coding sessions, and grow faster than you ever could alone.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-white/50">
          {["Share code & projects", "Book live sessions", "Build your network", "Learn from experts"].map((v) => (
            <span key={v} className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faCheck} className="text-[10px]" style={{ color: "#34D399" }} />
              {v}
            </span>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/register" className="group inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:gap-3" style={{ background: "#818CF8", boxShadow: "0 8px 30px #818CF830" }}>
            Start for Free <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
          </Link>
          <Link href="/login" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-7 py-3.5 text-sm font-semibold text-white/80 backdrop-blur-sm transition-all duration-200 hover:border-white/30 hover:text-white">
            <GitHubIcon className="h-4 w-4" /> Sign in
          </Link>
        </div>

        {/* Video Demo Mockup */}
        <div className="relative mx-auto mt-20 max-w-3xl">
          {/* Glowing backlights */}
          <div className="absolute -inset-1.5 rounded-2xl blur-lg" style={{ background: "linear-gradient(90deg, #818CF870, #9333ea40, #34D39970)" }} />
          
          {/* Laptop/Browser Frame */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0D111C] text-left shadow-2xl">
            {/* Window Chrome Header */}
            <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.03] px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500/60" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                <div className="h-3 w-3 rounded-full bg-green-500/60" />
                <span className="ml-3 text-xs text-white/30 font-mono">nexhub.app/showcase.mp4</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] text-white/40 font-semibold tracking-wider uppercase font-mono">Live Demo</span>
              </div>
            </div>
            
            {/* Aspect Ratio Video Container */}
            <div className="relative aspect-video w-full bg-black/40 overflow-hidden group/video">
              <video
                src="https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-programmer-typing-on-a-keyboard-22001-large.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover transition-transform duration-700 group-hover/video:scale-105"
              />
              
              {/* Overlay Glassmorphic Info Banner */}
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl border border-white/10 bg-black/60 backdrop-blur-md flex items-center justify-between transition-opacity duration-300">
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faRocket} className="text-[#818CF8]" />
                    Interactive Coding Workspace
                  </h4>
                  <p className="text-[10px] text-white/50 truncate mt-0.5">Experience collaborative programming with built-in voice and video channels.</p>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#818CF8]/20 border border-[#818CF8]/40 text-[#818CF8] text-[10px] font-semibold font-mono">
                  <FontAwesomeIcon icon={faGlobe} />
                  v1.2.0
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <section id="stats" ref={statsRef} className="relative z-10 border-y border-white/5 bg-white/[0.02] py-16">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-10 text-center text-xs font-semibold uppercase tracking-widest text-white/30">Trusted by the community</p>
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
        <div className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-white/30">Built for every role</div>
        <h2 className="mb-4 text-center font-mono text-3xl font-bold text-white md:text-4xl">One Platform, Three Superpowers</h2>
        <p className="mx-auto mb-16 max-w-xl text-center text-sm leading-relaxed text-white/50">
          Whether you write code, learn it, or teach it — NexHub is your space to thrive.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          <RoleCard color="#818CF8" icon={faCode} role="Developer" tagline="Ship code, build reputation"
            description="Share projects, publish code snippets, get peer reviews, and establish yourself as an authority in your niche."
            features={["Post code with syntax highlighting","Tag projects by language & framework","Get likes, comments, and bookmarks","Connect with students who want to learn","Host paid 1-on-1 coding sessions"]}
            cta="Join as Developer" href="/register?role=developer" />
          <RoleCard color="#34D399" icon={faGraduationCap} role="Student" tagline="Learn by doing, not just watching"
            description="Discover real code, follow expert developers, and book live sessions with tutors who've actually shipped production software."
            features={["Follow top developers in your stack","Bookmark lessons and tutorials","Book 1-on-1 sessions with tutors","Ask questions in comments","Track your learning journey"]}
            cta="Join as Student" href="/register?role=student" />
          <RoleCard color="#FB923C" icon={faChalkboardTeacher} role="Tutor" tagline="Teach what you know, earn what you're worth"
            description="Set your schedule, price your sessions, and build a loyal student base by sharing real-world expertise on NexHub."
            features={["Set availability and session pricing","Publish lessons and tutorials","Receive session booking requests","Build your tutor profile & reviews","Earn from what you already know"]}
            cta="Join as Tutor" href="/register?role=tutor" />
        </div>
      </section>

      {/* ── Feature strip ─────────────────────────────────────────────── */}
      <section className="relative z-10 border-y border-white/5 bg-white/[0.02] py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: faRocket, title: "Live Coding Sessions", desc: "Book real-time 1-on-1 video sessions with developers and tutors who've shipped real products." },
              { icon: faFileCode, title: "Code-first Posts", desc: "Every post supports full syntax-highlighted code blocks. Share lessons, snippets, and full project walkthroughs." },
              { icon: faUsers, title: "Follow & Discover", desc: "Build your feed around the people who matter — follow by role, niche, and skill stack." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#818CF8]" style={{ background: "#818CF815" }}>
                  <FontAwesomeIcon icon={icon} />
                </div>
                <div>
                  <h3 className="mb-1.5 text-sm font-semibold text-white">{title}</h3>
                  <p className="text-xs leading-relaxed text-white/50">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────── */}
      <section id="testimonials" className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        <div className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-white/30">What people say</div>
        <h2 className="mb-16 text-center font-mono text-3xl font-bold text-white md:text-4xl">Real people. Real results.</h2>
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
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-white/10 p-12 text-center" style={{ background: "linear-gradient(135deg, #818CF820, #7e22ce20, #34D39910)" }}>
          <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full blur-[80px]" style={{ background: "#818CF820" }} />
          <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full blur-[80px]" style={{ background: "#34D39920" }} />
          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold" style={{ borderColor: "#818CF840", background: "#818CF810", color: "#818CF8" }}>
              <FontAwesomeIcon icon={faBolt} /> Free to join
            </div>
            <h2 className="mb-4 font-mono text-3xl font-bold text-white md:text-4xl">Ready to level up?</h2>
            <p className="mb-8 text-white/60">Join thousands of developers, students, and tutors already building on NexHub.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register" className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold text-white transition-all hover:opacity-90" style={{ background: "#818CF8", boxShadow: "0 8px 30px #818CF830" }}>
                Create Free Account <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
              </Link>
              <Link href="/login" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-8 py-3.5 text-sm font-semibold text-white/80 transition-all hover:border-white/40 hover:text-white">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-white/50">
            <span className="font-mono">Nex<span style={{ color: "#818CF8" }}>Hub</span></span>
            <span className="text-white/20">·</span>
            <span className="text-xs">Where developers, students & tutors connect.</span>
          </div>
          <div className="flex gap-6 text-xs text-white/30">
            <Link href="/register" className="transition-colors hover:text-white">Sign Up</Link>
            <Link href="/login" className="transition-colors hover:text-white">Login</Link>
            <a href="https://github.com/ArfatAsghar/nexhub" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 transition-colors hover:text-white">
              <GitHubIcon className="h-3.5 w-3.5" /> GitHub
            </a>
          </div>
          <p className="text-xs text-white/20">© 2026 NexHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
