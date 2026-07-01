import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen overflow-hidden bg-canvas text-ink">
      <div className="relative z-10 flex w-full flex-col lg:flex-row">
        
        {/* Left column: Minimalist Branding (Visible on lg screens) */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-canvas-raised border-r border-border relative overflow-hidden">
          {/* Logo & Header */}
          <Link href="/" className="flex items-center gap-2.5 z-10 text-ink">
            <svg width="28" height="28" viewBox="0 0 100 100" fill="none" className="text-ink">
              <path
                d="M50 10L86 31V71L50 92L14 71V31L50 10Z"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinejoin="round"
              />
              <circle cx="50" cy="51" r="14" fill="currentColor" />
            </svg>
            <span className="font-display text-base font-bold tracking-tight">
              NexHub
            </span>
          </Link>

          {/* Clean typographic pitch */}
          <div className="my-auto z-10 max-w-md">
            <span className="inline-block px-2.5 py-1 rounded-sm text-xs font-medium border border-border bg-canvas text-ink-muted mb-6">
              Developer Network
            </span>
            <h2 className="text-3xl font-semibold tracking-tight leading-tight mb-4">
              Step into the hub of developer minds.
            </h2>
            <p className="text-ink-muted text-sm leading-relaxed mb-8">
              Join a high-performance network where developers showcase live projects, tutors share real-world experience, and students accelerate their careers.
            </p>

            {/* Flat tick list */}
            <div className="flex flex-col gap-4">
              {[
                { title: "Real-time Coding Rooms", desc: "Interact instantly using fully integrated WebRTC text, video, and audio rooms." },
                { title: "Rich Code Snippet Sharing", desc: "Publish and explore concepts with native, full-featured syntax highlighting." },
                { title: "Personalized Developer Portfolios", desc: "A customizable, role-specific profile showcasing your posts, projects, and bookings." }
              ].map((f, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-border text-ink-muted text-xs mt-0.5 font-semibold">✓</div>
                  <div>
                    <h4 className="text-xs font-semibold text-ink">{f.title}</h4>
                    <p className="text-[11px] text-ink-faint mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-ink-faint z-10">
            © 2026 NexHub. All rights reserved.
          </div>
        </div>

        {/* Right column: Form container */}
        <div className="flex flex-1 flex-col justify-center items-center px-6 py-12 lg:px-12 relative">
          {/* Logo on small screens */}
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 100 100" fill="none" className="text-ink">
              <path
                d="M50 10L86 31V71L50 92L14 71V31L50 10Z"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinejoin="round"
              />
              <circle cx="50" cy="51" r="14" fill="currentColor" />
            </svg>
            <span className="font-display text-base font-bold text-ink">NexHub</span>
          </div>

          {/* Clean minimal card wrapping children */}
          <div className="w-full max-w-[420px] rounded-card border border-border bg-canvas-raised p-8 md:p-10 shadow-card">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
