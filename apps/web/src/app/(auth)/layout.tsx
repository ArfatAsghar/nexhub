import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#07090E] text-white bg-grid-pattern">
      {/* Background ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#818CF8]/10 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-[#34D399]/10 blur-[120px]" />
      </div>

      {/* Responsive split screen */}
      <div className="relative z-10 flex w-full flex-col lg:flex-row">
        
        {/* Left column: Branding & Showcase (Visible on lg screens) */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-white/[0.01] border-r border-white/5 relative overflow-hidden">
          {/* Accent mesh inside the panel */}
          <div className="absolute -right-20 top-20 h-80 w-80 rounded-full bg-purple-900/10 blur-[80px]" />
          
          {/* Logo & Header */}
          <Link href="/" className="flex items-center gap-2.5 z-10">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <defs>
                <linearGradient id="auth-logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#818CF8" />
                  <stop offset="100%" stopColor="#34D399" />
                </linearGradient>
              </defs>
              <polygon points="16,2 29,9.5 29,22.5 16,30 3,22.5 3,9.5" fill="url(#auth-logo-grad)" opacity="0.15" />
              <polygon points="16,2 29,9.5 29,22.5 16,30 3,22.5 3,9.5" fill="none" stroke="url(#auth-logo-grad)" strokeWidth="1.5" />
              <polygon points="16,8 23,12 23,20 16,24 9,20 9,12" fill="url(#auth-logo-grad)" opacity="0.3" />
              <circle cx="16" cy="16" r="3.5" fill="url(#auth-logo-grad)" />
            </svg>
            <span className="font-mono text-lg font-bold tracking-tight text-white">
              Nex<span style={{ color: "#818CF8" }}>Hub</span>
            </span>
          </Link>

          {/* Core visual / pitch */}
          <div className="my-auto z-10 max-w-md">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold border border-[#818CF8]/30 bg-[#818CF8]/10 text-[#818CF8] mb-6">
              Connect. Collaborate. Code.
            </span>
            <h2 className="text-4xl font-bold font-mono tracking-tight text-white leading-tight mb-4">
              Step into the hub of developer minds.
            </h2>
            <p className="text-white/60 text-sm leading-relaxed mb-8">
              Join a high-performance network where developers showcase live projects, tutors share real-world experience, and students accelerate their careers.
            </p>

            {/* Feature tick list */}
            <div className="flex flex-col gap-4">
              {[
                { title: "Real-time Coding Rooms", desc: "Interact instantly using fully integrated WebRTC text, video, and audio rooms." },
                { title: "Rich Code Snippet Sharing", desc: "Publish and explore concepts with native, full-featured syntax highlighting." },
                { title: "Personalized Developer Portfolios", desc: "A customizable, role-specific profile showcasing your posts, projects, and bookings." }
              ].map((f, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#34D399]/20 text-[#34D399] text-xs mt-0.5">✓</div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">{f.title}</h4>
                    <p className="text-[11px] text-white/50">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer inside sidebar */}
          <div className="text-xs text-white/30 z-10">
            © 2026 NexHub. Built for developers.
          </div>
        </div>

        {/* Right column: Form container */}
        <div className="flex flex-1 flex-col justify-center items-center px-6 py-12 lg:px-12 relative">
          {/* Logo on small screens */}
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <defs>
                <linearGradient id="auth-logo-grad-sm" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#818CF8" />
                  <stop offset="100%" stopColor="#34D399" />
                </linearGradient>
              </defs>
              <polygon points="16,2 29,9.5 29,22.5 16,30 3,22.5 3,9.5" fill="url(#auth-logo-grad-sm)" opacity="0.15" />
              <polygon points="16,2 29,9.5 29,22.5 16,30 3,22.5 3,9.5" fill="none" stroke="url(#auth-logo-grad-sm)" strokeWidth="1.5" />
              <circle cx="16" cy="16" r="3.5" fill="url(#auth-logo-grad-sm)" />
            </svg>
            <span className="font-mono text-base font-bold text-white">Nex<span style={{ color: "#818CF8" }}>Hub</span></span>
          </div>

          {/* Glassmorphic Card wrapping the child form page */}
          <div className="w-full max-w-[440px] rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-10 backdrop-blur-md shadow-2xl relative">
            {/* Top lighting glow effect */}
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[#818CF8]/30 to-transparent" />
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

