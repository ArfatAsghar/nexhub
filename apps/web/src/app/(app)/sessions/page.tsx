"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button, RoleBadge } from "@nexhub/ui";
import { useUser } from "@/hooks/useUser";
import { useUpcomingSessions, type UpcomingSession } from "@/hooks/useUpcomingSessions";
import { useBookSession } from "@/hooks/useBookSession";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarAlt,
  faClock,
  faUsers,
  faChalkboardTeacher,
  faCreditCard,
  faPlus,
  faInfoCircle,
  faCheckCircle,
  faSpinner,
  faVideo,
  faTag,
  faLock,
  faUnlock,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";

type TabType = "browse" | "my-bookings" | "host";

function formatSessionTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SessionsPage() {
  const router = useRouter();
  const { user, profile, loading: userLoading } = useUser();
  const { sessions, loading: sessionsLoading, refresh, error } = useUpcomingSessions(50);
  const { bookSession, pending: bookingPending } = useBookSession();

  const [activeTab, setActiveTab] = useState<TabType>("browse");
  const [selectedSessionForPayment, setSelectedSessionForPayment] = useState<UpcomingSession | null>(null);
  
  // Payment Modal state
  const [paymentMethod, setPaymentMethod] = useState<"jazzcash" | "easypaisa">("jazzcash");
  const [accountNumber, setAccountNumber] = useState("");
  const [paymentStep, setPaymentStep] = useState<"form" | "loading" | "success">("form");

  // Host Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState("60");
  const [tag, setTag] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [pricePkr, setPricePkr] = useState("500");
  const [hostPending, setHostPending] = useState(false);
  const [hostError, setHostError] = useState<string | null>(null);
  const [hostSessions, setHostSessions] = useState<any[]>([]);

  // Starting a session (host)
  const [startingSessionId, setStartingSessionId] = useState<string | null>(null);

  // Check profile role
  const isTutorOrDeveloper = profile?.role === "tutor" || profile?.role === "developer";

  // Fetch hosted sessions if user is a tutor/developer
  const fetchHostedSessions = useCallback(async () => {
    if (!user) return;
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .eq("tutor_id", user.id)
      .order("scheduled_at", { ascending: true });
    setHostSessions(data ?? []);
  }, [user]);

  useEffect(() => {
    if (activeTab === "host") {
      fetchHostedSessions();
    }
  }, [activeTab, fetchHostedSessions]);

  // Bookings filter
  const myBookings = sessions.filter((s) => s.booked_by_me);

  // Host form handler
  async function handleHostSession(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !title.trim() || !scheduledAt) return;

    setHostPending(true);
    setHostError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: insertError } = await supabase.from("sessions").insert({
      tutor_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      scheduled_at: new Date(scheduledAt).toISOString(),
      duration_minutes: parseInt(duration),
      niche_tag: tag.trim() || null,
      price_pkr: isFree ? 0 : parseInt(pricePkr) || 0,
    } as any);

    setHostPending(false);

    if (insertError) {
      setHostError(insertError.message);
      return;
    }

    // Reset Form
    setTitle("");
    setDescription("");
    setScheduledAt("");
    setDuration("60");
    setTag("");
    setIsFree(true);
    setPricePkr("500");
    fetchHostedSessions();
    refresh();
  }

  // Book session after successful payment
  async function handleCompleteBooking() {
    if (!selectedSessionForPayment) return;
    
    const ok = await bookSession(selectedSessionForPayment.id);
    if (ok) {
      refresh();
      setSelectedSessionForPayment(null);
      setPaymentStep("form");
      setAccountNumber("");
    }
  }

  // Payment process simulation
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber.trim()) return;

    setPaymentStep("loading");
    setTimeout(() => {
      setPaymentStep("success");
    }, 1800);
  };

  // Start session live (host action)
  const handleStartSession = async (sessionId: string) => {
    setStartingSessionId(sessionId);
    const supabase = createSupabaseBrowserClient();
    await supabase.from("sessions").update({ is_live: true } as any).eq("id", sessionId);
    router.push(`/sessions/${sessionId}/room`);
  };

  // Join room (participant action)
  const handleJoinRoom = (sessionId: string) => {
    router.push(`/sessions/${sessionId}/room`);
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl text-ink">Tutoring Sessions</h1>
          <p className="text-sm text-ink-muted">
            Book 1-on-1 tutoring sessions or schedule one as a tutor.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-border">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("browse")}
            className={`pb-2.5 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "browse"
                ? "border-accent text-ink"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            Browse Sessions
          </button>
          <button
            onClick={() => setActiveTab("my-bookings")}
            className={`pb-2.5 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "my-bookings"
                ? "border-accent text-ink"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            My Bookings ({myBookings.length})
          </button>
          {isTutorOrDeveloper && (
            <button
              onClick={() => setActiveTab("host")}
              className={`pb-2.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === "host"
                  ? "border-accent text-ink"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              Host a Session
            </button>
          )}
        </div>
      </div>

      {/* error */}
      {error && <p className="mb-4 text-sm text-danger">Error: {error}</p>}

      {/* BROWSE TAB */}
      {activeTab === "browse" && (
        <div className="flex flex-col gap-4">
          {sessionsLoading && sessions.length === 0 ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-card border border-border bg-canvas-raised"
              />
            ))
          ) : sessions.length === 0 ? (
            <p className="text-sm text-ink-muted">No upcoming sessions scheduled.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-col justify-between rounded-card border border-border bg-canvas-raised p-4 transition-colors hover:border-ink-faint"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={session.tutor.full_name}
                          src={session.tutor.avatar_url}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-ink">
                            {session.tutor.full_name}
                          </p>
                          <RoleBadge role={session.tutor.role} className="mt-0.5" />
                        </div>
                      </div>
                      {session.niche_tag && (
                        <span className="rounded-pill bg-canvas px-2.5 py-0.5 text-[10px] text-accent border border-border">
                          #{session.niche_tag}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-ink leading-snug">
                      {session.title}
                    </h3>
                    {session.description && (
                      <p className="mt-1 text-xs text-ink-muted line-clamp-2">
                        {session.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/50 flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-faint">
                      <span className="flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faCalendarAlt} className="h-3 w-3" />
                        {formatSessionTime(session.scheduled_at)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faClock} className="h-3 w-3" />
                        {session.duration_minutes} min
                      </span>
                    </div>

                    {/* Price badge */}
                    <div className="flex items-center justify-between">
                      {(session as any).price_pkr > 0 ? (
                        <span className="flex items-center gap-1 rounded-pill bg-role-tutor/15 px-2.5 py-0.5 text-[10px] font-bold text-role-tutor">
                          <FontAwesomeIcon icon={faTag} className="h-2.5 w-2.5" />
                          Rs. {(session as any).price_pkr}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-pill bg-success/15 px-2.5 py-0.5 text-[10px] font-bold text-success">
                          <FontAwesomeIcon icon={faUnlock} className="h-2.5 w-2.5" />
                          FREE
                        </span>
                      )}
                      {(session as any).is_live && (
                        <span className="flex items-center gap-1 rounded-pill bg-red-500/15 px-2.5 py-0.5 text-[10px] font-bold text-red-400 animate-pulse">
                          ● LIVE
                        </span>
                      )}
                    </div>

                    {/* Host actions vs participant actions */}
                    {user && user.id === session.tutor_id ? (
                      // Host: Start or Open Room
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full text-xs flex items-center justify-center gap-1.5"
                        disabled={startingSessionId === session.id}
                        onClick={() => handleStartSession(session.id)}
                      >
                        {startingSessionId === session.id ? (
                          <FontAwesomeIcon icon={faSpinner} className="h-3 w-3 animate-spin" />
                        ) : (
                          <FontAwesomeIcon icon={faPlay} className="h-3 w-3" />
                        )}
                        {(session as any).is_live ? "Open Room" : "Start Session"}
                      </Button>
                    ) : session.booked_by_me ? (
                      // Booked participant
                      (session as any).is_live ? (
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full text-xs flex items-center justify-center gap-1.5"
                          onClick={() => handleJoinRoom(session.id)}
                        >
                          <FontAwesomeIcon icon={faVideo} className="h-3 w-3" />
                          Join Room
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full text-xs"
                          disabled
                        >
                          <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                          Booked · Waiting for host
                        </Button>
                      )
                    ) : (
                      // Unbooked
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => setSelectedSessionForPayment(session)}
                      >
                        {(session as any).price_pkr > 0 ? (
                          <span className="flex items-center gap-1">
                            <FontAwesomeIcon icon={faCreditCard} className="h-3 w-3" />
                            Book · Rs. {(session as any).price_pkr}
                          </span>
                        ) : (
                          "Book Free Session"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MY BOOKINGS TAB */}
      {activeTab === "my-bookings" && (
        <div className="flex flex-col gap-4">
          {myBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border rounded-card bg-canvas-raised text-center">
              <FontAwesomeIcon icon={faCalendarAlt} className="h-8 w-8 text-ink-faint mb-3" />
              <p className="text-sm text-ink font-semibold">No booked sessions</p>
              <p className="text-xs text-ink-muted mt-1 max-w-xs">
                Browse sessions scheduled by tutors and book them to see them here.
              </p>
              <Button
                variant="primary"
                size="sm"
                className="mt-4 text-xs"
                onClick={() => setActiveTab("browse")}
              >
                Browse Upcoming Sessions
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {myBookings.map((session) => (
                <div
                  key={session.id}
                  className="rounded-card border border-accent bg-canvas-raised p-4"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={session.tutor.full_name}
                        src={session.tutor.avatar_url}
                        size="sm"
                      />
                      <div>
                        <p className="text-xs font-semibold text-ink">
                          {session.tutor.full_name}
                        </p>
                        <p className="text-[10px] text-ink-muted">Tutor</p>
                      </div>
                    </div>
                    <span className="rounded-pill bg-accent/10 px-2 py-0.5 text-[10px] text-accent font-bold">
                      CONFIRMED
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-ink">{session.title}</h3>
                  <p className="mt-1 text-xs text-ink-muted">{session.description}</p>

                  <div className="mt-4 pt-3 border-t border-border flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs text-ink-muted">
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        {formatSessionTime(session.scheduled_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faClock} />
                        {session.duration_minutes}m
                      </span>
                    </div>
                    {/* Join Room if session is live */}
                    {(session as any).is_live ? (
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full text-xs flex items-center justify-center gap-1.5"
                        onClick={() => handleJoinRoom(session.id)}
                      >
                        <FontAwesomeIcon icon={faVideo} className="h-3 w-3" />
                        Join Room Now
                      </Button>
                    ) : (
                      <p className="text-center text-[10px] text-ink-faint">
                        Session starts {formatSessionTime(session.scheduled_at)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* HOST TAB */}
      {activeTab === "host" && isTutorOrDeveloper && (
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Scheduling Form */}
          <div className="flex-1 rounded-card border border-border bg-canvas-raised p-5">
            <h2 className="font-display text-sm font-bold text-ink mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faChalkboardTeacher} className="text-accent" />
              Schedule a Session
            </h2>

            <form onSubmit={handleHostSession} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-xs text-ink-muted font-medium">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Master React Hooks & Context"
                  className="w-full rounded-card border border-border bg-canvas px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-ink-muted font-medium">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What will you cover in this session?"
                  className="w-full resize-none rounded-card border border-border bg-canvas px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-ink-muted font-medium">Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full rounded-card border border-border bg-canvas px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-ink-muted font-medium">Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full rounded-card border border-border bg-canvas px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-ink-muted font-medium">Topic Tag</label>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="e.g. react (lowercase, no spaces)"
                  className="w-full rounded-card border border-border bg-canvas px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Pricing */}
              <div className="rounded-card border border-border bg-canvas p-3 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-ink-muted">Session Pricing</label>
                  <button
                    type="button"
                    onClick={() => setIsFree((v) => !v)}
                    className={`flex items-center gap-1.5 rounded-pill px-3 py-1 text-[11px] font-semibold transition-colors ${
                      isFree
                        ? "bg-success/20 text-success"
                        : "bg-role-tutor/20 text-role-tutor"
                    }`}
                  >
                    <FontAwesomeIcon icon={isFree ? faUnlock : faLock} className="h-3 w-3" />
                    {isFree ? "Free" : "Paid"}
                  </button>
                </div>
                {!isFree && (
                  <div>
                    <label className="mb-1 block text-xs text-ink-muted">Price (PKR)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink-faint">Rs.</span>
                      <input
                        type="number"
                        min="50"
                        step="50"
                        value={pricePkr}
                        onChange={(e) => setPricePkr(e.target.value)}
                        className="w-full rounded-card border border-border bg-canvas-raised pl-8 pr-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                  </div>
                )}
              </div>

              {hostError && <p className="text-xs text-danger">{hostError}</p>}

              <Button type="submit" disabled={hostPending} className="w-full flex items-center justify-center gap-2">
                {hostPending ? (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin h-3.5 w-3.5" />
                ) : (
                  <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
                )}
                <span>Schedule Session</span>
              </Button>
            </form>
          </div>

          {/* Hosted Sessions list */}
          <div className="w-full lg:w-80 rounded-card border border-border bg-canvas-raised p-5 flex flex-col gap-4">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-ink-faint">
              Your Scheduled Sessions
            </h3>
            {hostSessions.length === 0 ? (
              <p className="text-xs text-ink-muted italic">You haven't scheduled any sessions yet.</p>
            ) : (
              <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
                {hostSessions.map((s) => (
                  <div key={s.id} className="border border-border rounded-card p-3 bg-canvas/30 text-xs flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-ink truncate">{s.title}</p>
                      {(s as any).price_pkr > 0 ? (
                        <span className="shrink-0 rounded-pill bg-role-tutor/15 px-2 py-0.5 text-[9px] font-bold text-role-tutor">
                          Rs. {(s as any).price_pkr}
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-pill bg-success/15 px-2 py-0.5 text-[9px] font-bold text-success">
                          FREE
                        </span>
                      )}
                    </div>
                    <p className="text-ink-muted text-[11px]">{formatSessionTime(s.scheduled_at)}</p>
                    <p className="text-ink-faint text-[10px]">{s.duration_minutes}m · #{s.niche_tag || "no tag"}</p>
                    <button
                      onClick={() => handleStartSession(s.id)}
                      disabled={startingSessionId === s.id}
                      className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-pill bg-accent/15 py-1.5 text-[11px] font-semibold text-accent hover:bg-accent/25 transition-colors disabled:opacity-50"
                    >
                      {startingSessionId === s.id ? (
                        <FontAwesomeIcon icon={faSpinner} className="h-3 w-3 animate-spin" />
                      ) : (
                        <FontAwesomeIcon icon={faPlay} className="h-3 w-3" />
                      )}
                      {(s as any).is_live ? "Open Room" : "Start Session"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* JazzCash / EasyPaisa Payment Modal */}
      {selectedSessionForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-card border border-border bg-canvas-raised p-5 shadow-overlay relative">
            <button
              onClick={() => {
                setSelectedSessionForPayment(null);
                setPaymentStep("form");
                setAccountNumber("");
              }}
              className="absolute right-4 top-4 text-ink-muted hover:text-ink text-sm"
              disabled={paymentStep === "loading"}
            >
              ✕
            </button>

            {paymentStep === "form" && (
              <>
                <h3 className="font-display text-sm font-bold text-ink mb-2">
                  Session Payment Checkout
                </h3>
                <p className="text-xs text-ink-muted mb-4">
                  Please pay the session booking fee to confirm your attendance.
                </p>

                <div className="rounded-card border border-border bg-canvas p-3 mb-4 flex flex-col gap-1.5">
                  <p className="text-[10px] text-ink-faint uppercase font-bold">Booking Details</p>
                  <p className="text-xs text-ink font-semibold">{selectedSessionForPayment.title}</p>
                  <p className="text-xs text-ink-muted">Tutor: {selectedSessionForPayment.tutor.full_name}</p>
                  <p className="text-xs text-ink-muted">Time: {formatSessionTime(selectedSessionForPayment.scheduled_at)}</p>
                  {(selectedSessionForPayment as any).price_pkr > 0 ? (
                    <p className="text-xs text-accent font-bold mt-1">
                      Amount: Rs. {(selectedSessionForPayment as any).price_pkr}
                    </p>
                  ) : (
                    <p className="text-xs text-success font-bold mt-1">FREE Session — No payment required</p>
                  )}
                </div>

                <form onSubmit={handlePaymentSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs text-ink-muted mb-2 font-medium">Select Mobile Wallet</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("jazzcash")}
                        className={`rounded-card border p-3 flex flex-col items-center justify-center gap-1.5 transition-all ${
                          paymentMethod === "jazzcash"
                            ? "border-accent bg-accent/10"
                            : "border-border bg-canvas hover:border-ink-faint"
                        }`}
                      >
                        <span className="text-xs font-semibold text-ink">JazzCash</span>
                        <span className="text-[9px] text-ink-muted">Mobile Wallet</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod("easypaisa")}
                        className={`rounded-card border p-3 flex flex-col items-center justify-center gap-1.5 transition-all ${
                          paymentMethod === "easypaisa"
                            ? "border-accent bg-accent/10"
                            : "border-border bg-canvas hover:border-ink-faint"
                        }`}
                      >
                        <span className="text-xs font-semibold text-ink">EasyPaisa</span>
                        <span className="text-[9px] text-ink-muted">Mobile Wallet</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-ink-muted mb-1 font-medium">Mobile Account Number</label>
                    <input
                      type="tel"
                      required
                      pattern="03[0-9]{9}"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g. 03001234567"
                      className="w-full rounded-card border border-border bg-canvas px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <span className="text-[10px] text-ink-faint mt-1 block">
                      Enter your 11-digit mobile wallet account number.
                    </span>
                  </div>

                  <Button type="submit" variant="primary" className="w-full flex items-center justify-center gap-2">
                    <FontAwesomeIcon icon={faCreditCard} className="h-3.5 w-3.5" />
                    <span>
                      {(selectedSessionForPayment as any)?.price_pkr > 0
                        ? `Pay Rs. ${(selectedSessionForPayment as any).price_pkr} & Book`
                        : "Confirm Free Booking"}
                    </span>
                  </Button>
                </form>
              </>
            )}

            {paymentStep === "loading" && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin h-8 w-8 text-accent mb-4" />
                <p className="text-sm font-semibold text-ink">Processing Payment</p>
                <p className="text-xs text-ink-muted mt-1 max-w-xs">
                  Please approve the payment request prompt on your mobile screen.
                </p>
              </div>
            )}

            {paymentStep === "success" && (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <FontAwesomeIcon icon={faCheckCircle} className="h-10 w-10 text-success mb-4" />
                <p className="text-sm font-semibold text-ink">Payment Successful!</p>
                <p className="text-xs text-ink-muted mt-1 max-w-xs">
                  Your seat has been reserved. You can view it under the &quot;My Bookings&quot; tab.
                </p>
                <Button
                  onClick={handleCompleteBooking}
                  variant="primary"
                  className="mt-6 w-full text-xs"
                >
                  Close &amp; View Bookings
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
