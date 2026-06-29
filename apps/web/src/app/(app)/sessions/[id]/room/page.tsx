"use client";

import { useEffect, useRef, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import {
  useSessionRoom,
  type RoomParticipant,
} from "@/hooks/useSessionRoom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone,
  faMicrophoneSlash,
  faVideo,
  faVideoSlash,
  faDesktop,
  faStopCircle,
  faHandPaper,
  faPhoneSlash,
  faCrown,
  faUsers,
  faCheck,
  faTimes,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

// ─────────────────────────────────────────────────────────────────────────────
// VideoTile — single participant video panel
// ─────────────────────────────────────────────────────────────────────────────
function VideoTile({
  stream,
  displayName,
  avatarUrl,
  isMicOn,
  isCamOn,
  isHost,
  isLocal = false,
  isLarge = false,
}: {
  stream: MediaStream | null;
  displayName: string;
  avatarUrl: string | null;
  isMicOn: boolean;
  isCamOn: boolean;
  isHost: boolean;
  isLocal?: boolean;
  isLarge?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (stream) {
      el.srcObject = stream;
      el.play().catch(() => {});
    } else {
      el.srcObject = null;
    }
  }, [stream]);

  return (
    <div
      className={`relative overflow-hidden rounded-card border border-border bg-canvas-raised ${
        isLarge ? "aspect-video w-full" : "aspect-video"
      }`}
    >
      {stream && isCamOn ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-canvas-overlay">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-canvas text-xl font-bold text-ink">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* Name / host badge overlay */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
        <span className="flex items-center gap-1 truncate text-xs font-medium text-white">
          {isHost && (
            <FontAwesomeIcon icon={faCrown} className="h-3 w-3 text-yellow-400" />
          )}
          {displayName}
          {isLocal && " (You)"}
        </span>
        {!isMicOn && (
          <FontAwesomeIcon
            icon={faMicrophoneSlash}
            className="h-3 w-3 shrink-0 text-red-400"
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ScreenShareTile — full-width screen-share panel
// ─────────────────────────────────────────────────────────────────────────────
function ScreenShareTile({ stream }: { stream: MediaStream }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.srcObject = stream;
    el.play().catch(() => {});
  }, [stream]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-card border border-accent bg-canvas">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-contain"
      />
      <span className="absolute right-2 top-2 rounded-pill bg-accent px-2.5 py-0.5 text-[10px] font-bold text-canvas">
        SCREEN SHARE
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main room page
// ─────────────────────────────────────────────────────────────────────────────
export default function SessionRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user, profile, loading: userLoading } = useUser();
  const resolvedParams = use(params);
  const sessionId = resolvedParams.id;

  const [session, setSession] = useState<any | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Fetch session info on mount
  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("sessions")
        .select("*, tutor:profiles!sessions_tutor_id_fkey(*)")
        .eq("id", sessionId)
        .single();

      if (error || !data) {
        setAccessError("Session not found.");
        setSessionLoading(false);
        return;
      }
      setSession(data);
      setSessionLoading(false);
    }
    load();
  }, [sessionId]);

  // Gate access: host always enters; participants need is_live + booking
  const isHost = !!(user && session && user.id === session.tutor_id);
  const isLive = !!(session && (session as any).is_live);

  // Initialize the room (only after session + user loaded)
  const canEnter = !sessionLoading && !userLoading && !!user && !!session;

  const {
    participants,
    localStream,
    screenStream,
    isMicOn,
    isCamOn,
    isScreenSharing,
    handRaised,
    speakerRequests,
    grantedSpeakers,
    isConnecting,
    sessionEnded,
    error: roomError,
    toggleMic,
    toggleCam,
    startScreenShare,
    stopScreenShare,
    raiseHand,
    lowerHand,
    grantSpeaker,
    denySpeaker,
    endSession,
    leaveRoom,
  } = useSessionRoom(
    canEnter
      ? {
          sessionId,
          userId: user!.id,
          displayName: profile?.full_name ?? user!.email ?? "Anonymous",
          avatarUrl: profile?.avatar_url ?? null,
          isHost,
        }
      : // Stub params when not yet ready — hook will not initialize yet
        {
          sessionId: "",
          userId: "",
          displayName: "",
          avatarUrl: null,
          isHost: false,
        },
  );

  // Redirect when session ends
  useEffect(() => {
    if (sessionEnded) {
      router.push("/sessions");
    }
  }, [sessionEnded, router]);

  // ── Start / end session handlers (host only) ────────────────────────────
  const handleStartSession = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase
      .from("sessions")
      .update({ is_live: true } as any)
      .eq("id", sessionId);
    setSession((prev: any) => ({ ...prev, is_live: true }));
  }, [sessionId]);

  const handleLeave = useCallback(() => {
    leaveRoom();
    router.push("/sessions");
  }, [leaveRoom, router]);

  const handleEnd = useCallback(async () => {
    await endSession();
    router.push("/sessions");
  }, [endSession, router]);

  // ── Screens ─────────────────────────────────────────────────────────────

  if (sessionLoading || userLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <FontAwesomeIcon icon={faSpinner} className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (accessError || roomError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-canvas text-center px-6">
        <p className="text-sm text-danger">{accessError ?? roomError}</p>
        <button
          onClick={() => router.push("/sessions")}
          className="text-xs text-accent underline"
        >
          Back to Sessions
        </button>
      </div>
    );
  }

  // Host hasn't started yet — show a "Start Session" waiting screen
  if (isHost && !isLive) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6 bg-canvas px-6 text-center">
        <h1 className="font-display text-xl text-ink">{session?.title}</h1>
        <p className="text-sm text-ink-muted max-w-sm">
          You are the host. Click below to open the live room and let participants join.
        </p>
        <button
          onClick={handleStartSession}
          className="rounded-pill bg-accent px-6 py-3 text-sm font-bold text-canvas hover:opacity-90 transition-opacity"
        >
          🚀 Start Session Live
        </button>
        <button onClick={() => router.push("/sessions")} className="text-xs text-ink-muted underline">
          Cancel
        </button>
      </div>
    );
  }

  if (!isLive && !isHost) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-canvas text-center px-6">
        <p className="text-sm text-ink-muted">
          This session has not started yet. Please wait for the host to begin.
        </p>
        <button onClick={() => router.push("/sessions")} className="text-xs text-accent underline">
          Back to Sessions
        </button>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-canvas">
        <FontAwesomeIcon icon={faSpinner} className="h-8 w-8 animate-spin text-accent" />
        <p className="text-sm text-ink-muted">Connecting to session…</p>
      </div>
    );
  }

  // Remote participants (everyone except local user)
  const remotes = participants.filter((p) => p.userId !== user?.id);
  const localParticipant = participants.find((p) => p.userId === user?.id);

  return (
    <div className="flex h-screen flex-col bg-canvas overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <FontAwesomeIcon icon={faVideo} className="h-4 w-4 text-accent shrink-0" />
          <span className="truncate text-sm font-semibold text-ink">{session?.title}</span>
          <span className="shrink-0 rounded-pill bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-400">
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-ink-muted">
            <FontAwesomeIcon icon={faUsers} className="h-3 w-3" />
            {participants.length} in room
          </span>
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="rounded-card border border-border bg-canvas-raised px-2.5 py-1 text-xs text-ink-muted hover:text-ink transition-colors"
          >
            {sidebarOpen ? "Hide" : "Show"} Sidebar
          </button>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main video area */}
        <main className="flex flex-1 flex-col gap-3 overflow-auto p-3">
          {/* Screen share (takes center stage) */}
          {screenStream && <ScreenShareTile stream={screenStream} />}

          {/* Remote participant grid */}
          {remotes.length === 0 && !screenStream ? (
            <div className="flex flex-1 items-center justify-center text-sm text-ink-faint">
              Waiting for others to join…
            </div>
          ) : (
            <div
              className={`grid gap-3 ${
                remotes.length === 1
                  ? "grid-cols-1 max-w-xl mx-auto w-full"
                  : remotes.length <= 4
                  ? "grid-cols-2"
                  : "grid-cols-3"
              }`}
            >
              {remotes.map((p) => (
                <VideoTile
                  key={p.userId}
                  stream={p.stream}
                  displayName={p.displayName}
                  avatarUrl={p.avatarUrl}
                  isMicOn={p.isMicOn}
                  isCamOn={p.isCamOn}
                  isHost={p.isHost}
                  isLarge={remotes.length === 1}
                />
              ))}
            </div>
          )}

          {/* Self preview (bottom-right pip or grid tile) */}
          {localStream && (
            <div className="fixed bottom-20 right-4 w-36 z-20 shadow-overlay">
              <VideoTile
                stream={localStream}
                displayName={profile?.full_name ?? "You"}
                avatarUrl={profile?.avatar_url ?? null}
                isMicOn={isMicOn}
                isCamOn={isCamOn}
                isHost={isHost}
                isLocal
              />
            </div>
          )}
        </main>

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        {sidebarOpen && (
          <aside className="hidden w-64 shrink-0 flex-col gap-4 border-l border-border bg-canvas-raised p-3 md:flex overflow-y-auto">
            {/* Participants list */}
            <div>
              <p className="mb-2 text-[10px] uppercase font-bold tracking-wider text-ink-faint">
                Participants ({participants.length})
              </p>
              <ul className="flex flex-col gap-1.5">
                {participants.map((p) => (
                  <li key={p.userId} className="flex items-center gap-2 text-xs">
                    <div className="relative h-6 w-6 shrink-0">
                      {p.avatarUrl ? (
                        <img
                          src={p.avatarUrl}
                          alt={p.displayName}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-canvas text-[10px] font-bold text-ink">
                          {p.displayName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      {p.isHost && (
                        <FontAwesomeIcon
                          icon={faCrown}
                          className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 text-yellow-400"
                        />
                      )}
                    </div>
                    <span className="truncate text-ink">
                      {p.displayName}
                      {p.userId === user?.id && " (You)"}
                    </span>
                    <div className="ml-auto flex shrink-0 items-center gap-1">
                      {p.handRaised && (
                        <span className="text-[10px]" title="Hand raised">
                          ✋
                        </span>
                      )}
                      {!p.isMicOn && (
                        <FontAwesomeIcon
                          icon={faMicrophoneSlash}
                          className="h-2.5 w-2.5 text-red-400"
                        />
                      )}
                      {p.isScreenSharing && (
                        <FontAwesomeIcon
                          icon={faDesktop}
                          className="h-2.5 w-2.5 text-accent"
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Speaker request queue (host only) */}
            {isHost && speakerRequests.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] uppercase font-bold tracking-wider text-ink-faint">
                  Speak Requests ({speakerRequests.length})
                </p>
                <div className="flex flex-col gap-2">
                  {speakerRequests.map((req) => (
                    <div
                      key={req.userId}
                      className="flex items-center justify-between gap-2 rounded-card border border-border bg-canvas p-2"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        {req.avatarUrl ? (
                          <img
                            src={req.avatarUrl}
                            className="h-5 w-5 rounded-full object-cover shrink-0"
                            alt={req.displayName}
                          />
                        ) : (
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-canvas-overlay text-[9px] font-bold text-ink">
                            {req.displayName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="truncate text-[11px] text-ink">
                          {req.displayName}
                        </span>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() => grantSpeaker(req.userId)}
                          title="Allow speaking"
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-success/20 text-success hover:bg-success/40 transition-colors"
                        >
                          <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => denySpeaker(req.userId)}
                          title="Deny"
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-danger/20 text-danger hover:bg-danger/40 transition-colors"
                        >
                          <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <footer className="flex shrink-0 items-center justify-center gap-3 border-t border-border bg-canvas-raised px-4 py-3">
        {/* Camera toggle */}
        {isHost && (
          <ToolbarButton
            icon={isCamOn ? faVideo : faVideoSlash}
            active={isCamOn}
            label={isCamOn ? "Camera On" : "Camera Off"}
            onClick={toggleCam}
          />
        )}

        {/* Mic toggle — available to host + granted speakers */}
        {(isHost || grantedSpeakers.has(user?.id ?? "")) && (
          <ToolbarButton
            icon={isMicOn ? faMicrophone : faMicrophoneSlash}
            active={isMicOn}
            danger={!isMicOn}
            label={isMicOn ? "Mute" : "Unmute"}
            onClick={toggleMic}
          />
        )}

        {/* Screen share (host only) */}
        {isHost && (
          <ToolbarButton
            icon={isScreenSharing ? faStopCircle : faDesktop}
            active={isScreenSharing}
            label={isScreenSharing ? "Stop Share" : "Share Screen"}
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
          />
        )}

        {/* Raise / lower hand (participants only) */}
        {!isHost && (
          <ToolbarButton
            icon={faHandPaper}
            active={handRaised}
            label={handRaised ? "Lower Hand" : "Raise Hand ✋"}
            onClick={handRaised ? lowerHand : raiseHand}
          />
        )}

        <div className="mx-3 h-8 w-px bg-border" />

        {/* Leave / End */}
        {isHost ? (
          <button
            onClick={handleEnd}
            className="flex items-center gap-2 rounded-pill bg-danger px-4 py-2 text-xs font-bold text-white hover:bg-danger/80 transition-colors"
          >
            <FontAwesomeIcon icon={faPhoneSlash} className="h-3.5 w-3.5" />
            End Session
          </button>
        ) : (
          <button
            onClick={handleLeave}
            className="flex items-center gap-2 rounded-pill bg-danger/20 border border-danger/30 px-4 py-2 text-xs font-bold text-danger hover:bg-danger/30 transition-colors"
          >
            <FontAwesomeIcon icon={faPhoneSlash} className="h-3.5 w-3.5" />
            Leave Room
          </button>
        )}
      </footer>
    </div>
  );
}

// ── Toolbar button helper component ──────────────────────────────────────────
function ToolbarButton({
  icon,
  active,
  danger = false,
  label,
  onClick,
}: {
  icon: any;
  active: boolean;
  danger?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex flex-col items-center gap-1 rounded-card p-2.5 transition-colors text-xs ${
        danger
          ? "bg-danger/15 text-danger hover:bg-danger/25"
          : active
          ? "bg-canvas-overlay text-ink hover:bg-canvas-overlay/80"
          : "bg-canvas text-ink-muted hover:bg-canvas-raised hover:text-ink"
      }`}
    >
      <FontAwesomeIcon icon={icon} className="h-4 w-4" />
      <span className="hidden text-[10px] sm:block">{label}</span>
    </button>
  );
}
