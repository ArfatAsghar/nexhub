"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ── Config ──────────────────────────────────────────────────────────────────
const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

// ── Types ───────────────────────────────────────────────────────────────────

export interface RoomParticipant {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  isHost: boolean;
  isMicOn: boolean;
  isCamOn: boolean;
  isScreenSharing: boolean;
  handRaised: boolean;
  isSpeaker: boolean;
  stream: MediaStream | null;
}

interface PresenceState {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  isHost: boolean;
  isMicOn: boolean;
  isCamOn: boolean;
  isScreenSharing: boolean;
  handRaised: boolean;
  isSpeaker: boolean;
}

interface SignalPayload {
  from: string;
  to: string;
  type: "offer" | "answer" | "ice" | "grant-speaker" | "deny-speaker" | "session-ended";
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

interface HandSignalPayload {
  from: string;
  type: "raise" | "lower";
  displayName: string;
  avatarUrl: string | null;
}

export interface UseSessionRoomParams {
  sessionId: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  isHost: boolean;
}

export interface UseSessionRoomResult {
  participants: RoomParticipant[];
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  isMicOn: boolean;
  isCamOn: boolean;
  isScreenSharing: boolean;
  handRaised: boolean;
  speakerRequests: { userId: string; displayName: string; avatarUrl: string | null }[];
  grantedSpeakers: Set<string>;
  isConnecting: boolean;
  sessionEnded: boolean;
  error: string | null;
  toggleMic: () => void;
  toggleCam: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  raiseHand: () => void;
  lowerHand: () => void;
  grantSpeaker: (targetUserId: string) => void;
  denySpeaker: (targetUserId: string) => void;
  endSession: () => Promise<void>;
  leaveRoom: () => void;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useSessionRoom({
  sessionId,
  userId,
  displayName,
  avatarUrl,
  isHost,
}: UseSessionRoomParams): UseSessionRoomResult {
  // ── Local media state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(isHost);
  const [isCamOn, setIsCamOn] = useState(isHost);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);

  // ── Remote state
  const [presenceMap, setPresenceMap] = useState<Map<string, PresenceState>>(new Map());
  const [peerStreams, setPeerStreams] = useState<Map<string, MediaStream>>(new Map());
  const [speakerRequests, setSpeakerRequests] = useState<
    { userId: string; displayName: string; avatarUrl: string | null }[]
  >([]);
  const [grantedSpeakers, setGrantedSpeakers] = useState<Set<string>>(new Set());
  const [isConnecting, setIsConnecting] = useState(true);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Refs (never trigger re-renders)
  const channelRef = useRef<RealtimeChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingIce = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const isMicOnRef = useRef(isHost);
  const isCamOnRef = useRef(isHost);
  const grantedRef = useRef<Set<string>>(new Set());

  // ── Derived participant list
  const participants: RoomParticipant[] = Array.from(presenceMap.values()).map((p) => ({
    ...p,
    stream: peerStreams.get(p.userId) ?? null,
  }));

  // ─────────────────────────────────────────────────────────────────────────
  // Internal helpers
  // ─────────────────────────────────────────────────────────────────────────

  /** Update our own Presence entry with current local state. */
  const broadcastPresence = useCallback(() => {
    channelRef.current?.track({
      userId,
      displayName,
      avatarUrl,
      isHost,
      isMicOn: isMicOnRef.current,
      isCamOn: isCamOnRef.current,
      isScreenSharing: !!screenStreamRef.current,
      handRaised,
      isSpeaker: isHost || grantedRef.current.has(userId),
    } satisfies PresenceState);
  }, [userId, displayName, avatarUrl, isHost, handRaised]);

  /** Build an RTCPeerConnection wired to our local stream and channel. */
  const createPc = useCallback(
    (targetId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      // Attach local tracks
      if (localStreamRef.current) {
        for (const track of localStreamRef.current.getTracks()) {
          pc.addTrack(track, localStreamRef.current);
        }
      }

      // Surface remote tracks
      pc.ontrack = ({ streams: [stream] }) => {
        if (!stream) return;
        setPeerStreams((prev) => new Map(prev).set(targetId, stream));
      };

      // Forward ICE candidates
      pc.onicecandidate = ({ candidate }) => {
        if (!candidate || !channelRef.current) return;
        channelRef.current.send({
          type: "broadcast",
          event: "signal",
          payload: {
            from: userId,
            to: targetId,
            type: "ice",
            candidate: candidate.toJSON(),
          } satisfies SignalPayload,
        });
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          peersRef.current.delete(targetId);
          setPeerStreams((prev) => {
            const next = new Map(prev);
            next.delete(targetId);
            return next;
          });
        }
      };

      return pc;
    },
    [userId],
  );

  /** Create offer and send to targetId. */
  const makeOffer = useCallback(
    async (targetId: string, pc: RTCPeerConnection) => {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      channelRef.current?.send({
        type: "broadcast",
        event: "signal",
        payload: {
          from: userId,
          to: targetId,
          type: "offer",
          sdp: pc.localDescription?.toJSON(),
        } satisfies SignalPayload,
      });
    },
    [userId],
  );

  /** Flush queued ICE candidates after remote description is set. */
  const flushIce = useCallback(async (targetId: string, pc: RTCPeerConnection) => {
    const queued = pendingIce.current.get(targetId) ?? [];
    for (const c of queued) await pc.addIceCandidate(new RTCIceCandidate(c));
    pendingIce.current.delete(targetId);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Signal handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleOffer = useCallback(
    async ({ from, sdp }: SignalPayload) => {
      if (!sdp) return;
      let pc = peersRef.current.get(from);
      if (!pc) {
        pc = createPc(from);
        peersRef.current.set(from, pc);
      }
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      await flushIce(from, pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      channelRef.current?.send({
        type: "broadcast",
        event: "signal",
        payload: {
          from: userId,
          to: from,
          type: "answer",
          sdp: pc.localDescription?.toJSON(),
        } satisfies SignalPayload,
      });
    },
    [userId, createPc, flushIce],
  );

  const handleAnswer = useCallback(
    async ({ from, sdp }: SignalPayload) => {
      if (!sdp) return;
      const pc = peersRef.current.get(from);
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      await flushIce(from, pc);
    },
    [flushIce],
  );

  const handleIce = useCallback(async ({ from, candidate }: SignalPayload) => {
    if (!candidate) return;
    const pc = peersRef.current.get(from);
    if (!pc?.remoteDescription) {
      const q = pendingIce.current.get(from) ?? [];
      q.push(candidate);
      pendingIce.current.set(from, q);
      return;
    }
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Presence handlers
  // ─────────────────────────────────────────────────────────────────────────

  /** When a peer joins: the user with the LARGER userId creates the offer.
   * This deterministic rule prevents signaling collision ("glare"). */
  const handlePeerJoined = useCallback(
    async (targetId: string) => {
      if (targetId === userId) return;
      if (userId <= targetId) return; // smaller userId waits for offer

      const pc = createPc(targetId);
      peersRef.current.set(targetId, pc);
      await makeOffer(targetId, pc);
    },
    [userId, createPc, makeOffer],
  );

  const handlePeerLeft = useCallback((targetId: string) => {
    const pc = peersRef.current.get(targetId);
    if (pc) { pc.close(); peersRef.current.delete(targetId); }
    setPeerStreams((prev) => { const n = new Map(prev); n.delete(targetId); return n; });
    setPresenceMap((prev) => { const n = new Map(prev); n.delete(targetId); return n; });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Initialization
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    let destroyed = false;

    async function init() {
      try {
        // Acquire local media — host gets camera+mic, listeners get mic only (muted)
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: isHost ? { width: 1280, height: 720 } : false,
        });
        if (destroyed) { stream.getTracks().forEach((t) => t.stop()); return; }

        // Participants start muted
        if (!isHost) stream.getAudioTracks().forEach((t) => { t.enabled = false; });

        localStreamRef.current = stream;
        setLocalStream(stream);

        // ── Realtime channel ─────────────────────────────────────────────
        const supabase = createSupabaseBrowserClient();
        const channel = supabase.channel(`session-room-${sessionId}`, {
          config: { presence: { key: userId } },
        });
        channelRef.current = channel;

        // Presence: full sync (fired on subscribe and whenever state changes)
        channel.on("presence", { event: "sync" }, () => {
          const raw = channel.presenceState<PresenceState>();
          const map = new Map<string, PresenceState>();
          for (const presences of Object.values(raw)) {
            for (const p of presences as unknown as PresenceState[]) {
              if (p.userId) map.set(p.userId, p);
            }
          }
          setPresenceMap(map);
        });

        channel.on("presence", { event: "join" }, ({ newPresences }) => {
          for (const p of newPresences as unknown as PresenceState[]) {
            if (!p.userId) continue;
            setPresenceMap((prev) => new Map(prev).set(p.userId, p));
            handlePeerJoined(p.userId);
          }
        });

        channel.on("presence", { event: "leave" }, ({ leftPresences }) => {
          for (const p of leftPresences as unknown as PresenceState[]) {
            if (p.userId) handlePeerLeft(p.userId);
          }
        });

        // WebRTC signaling
        channel.on("broadcast", { event: "signal" }, ({ payload }: { payload: SignalPayload }) => {
          // Accept wildcard "to" for session-ended broadcasts
          if (payload.to !== userId && payload.to !== "*") return;

          switch (payload.type) {
            case "offer":          handleOffer(payload);  break;
            case "answer":         handleAnswer(payload); break;
            case "ice":            handleIce(payload);    break;

            case "grant-speaker":
              setGrantedSpeakers((prev) => {
                const next = new Set(prev);
                next.add(userId);
                grantedRef.current = next;
                return next;
              });
              // Unmute participant's mic
              localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = true; });
              isMicOnRef.current = true;
              setIsMicOn(true);
              break;

            case "deny-speaker":
              setSpeakerRequests((prev) => prev.filter((r) => r.userId !== payload.from));
              break;

            case "session-ended":
              setSessionEnded(true);
              break;
          }
        });

        // Hand raise signals (broadcast to whole channel — host handles them)
        channel.on("broadcast", { event: "hand-signal" }, ({ payload }: { payload: HandSignalPayload }) => {
          if (!isHost) return;
          if (payload.type === "raise") {
            setSpeakerRequests((prev) => {
              if (prev.some((r) => r.userId === payload.from)) return prev;
              return [...prev, { userId: payload.from, displayName: payload.displayName, avatarUrl: payload.avatarUrl }];
            });
          } else {
            setSpeakerRequests((prev) => prev.filter((r) => r.userId !== payload.from));
          }
        });

        // Subscribe and announce presence
        channel.subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channel.track({
              userId, displayName, avatarUrl, isHost,
              isMicOn: isHost, isCamOn: isHost,
              isScreenSharing: false, handRaised: false,
              isSpeaker: isHost,
            } satisfies PresenceState);
            if (!destroyed) setIsConnecting(false);
          }
        });
      } catch (err: any) {
        if (!destroyed) {
          setError(err.message ?? "Could not access camera or microphone.");
          setIsConnecting(false);
        }
      }
    }

    init();

    return () => {
      destroyed = true;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
      channelRef.current?.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, userId]);

  // ─────────────────────────────────────────────────────────────────────────
  // Exposed controls
  // ─────────────────────────────────────────────────────────────────────────

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !isMicOnRef.current;
    stream.getAudioTracks().forEach((t) => { t.enabled = next; });
    isMicOnRef.current = next;
    setIsMicOn(next);
    broadcastPresence();
  }, [broadcastPresence]);

  const toggleCam = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !isCamOnRef.current;
    stream.getVideoTracks().forEach((t) => { t.enabled = next; });
    isCamOnRef.current = next;
    setIsCamOn(next);
    broadcastPresence();
  }, [broadcastPresence]);

  const startScreenShare = useCallback(async () => {
    try {
      const screen = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { cursor: "always" },
        audio: false,
      });
      screenStreamRef.current = screen;
      setScreenStream(screen);
      setIsScreenSharing(true);

      const videoTrack = screen.getVideoTracks()[0];
      if (videoTrack) {
        // Replace video sender track in every active peer connection
        for (const pc of peersRef.current.values()) {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) await sender.replaceTrack(videoTrack);
        }
        // Restore camera when browser stop-sharing button is pressed
        videoTrack.addEventListener("ended", () => stopScreenShare());
      }
      broadcastPresence();
    } catch {
      // User cancelled the picker — do nothing
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [broadcastPresence]);

  const stopScreenShare = useCallback(() => {
    const screen = screenStreamRef.current;
    if (!screen) return;
    screen.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    setScreenStream(null);
    setIsScreenSharing(false);

    // Restore camera track
    const camTrack = localStreamRef.current?.getVideoTracks()[0];
    if (camTrack) {
      for (const pc of peersRef.current.values()) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(camTrack);
      }
    }
    broadcastPresence();
  }, [broadcastPresence]);

  const raiseHand = useCallback(() => {
    setHandRaised(true);
    channelRef.current?.send({
      type: "broadcast",
      event: "hand-signal",
      payload: { from: userId, type: "raise", displayName, avatarUrl } satisfies HandSignalPayload,
    });
    broadcastPresence();
  }, [userId, displayName, avatarUrl, broadcastPresence]);

  const lowerHand = useCallback(() => {
    setHandRaised(false);
    channelRef.current?.send({
      type: "broadcast",
      event: "hand-signal",
      payload: { from: userId, type: "lower", displayName, avatarUrl } satisfies HandSignalPayload,
    });
    broadcastPresence();
  }, [userId, displayName, avatarUrl, broadcastPresence]);

  const grantSpeaker = useCallback((targetUserId: string) => {
    channelRef.current?.send({
      type: "broadcast",
      event: "signal",
      payload: { from: userId, to: targetUserId, type: "grant-speaker" } satisfies SignalPayload,
    });
    setGrantedSpeakers((prev) => {
      const next = new Set(prev);
      next.add(targetUserId);
      grantedRef.current = next;
      return next;
    });
    setSpeakerRequests((prev) => prev.filter((r) => r.userId !== targetUserId));
  }, [userId]);

  const denySpeaker = useCallback((targetUserId: string) => {
    channelRef.current?.send({
      type: "broadcast",
      event: "signal",
      payload: { from: userId, to: targetUserId, type: "deny-speaker" } satisfies SignalPayload,
    });
    setSpeakerRequests((prev) => prev.filter((r) => r.userId !== targetUserId));
  }, [userId]);

  const endSession = useCallback(async () => {
    // Notify all participants
    channelRef.current?.send({
      type: "broadcast",
      event: "signal",
      payload: { from: userId, to: "*", type: "session-ended" } as any,
    });
    // Mark session offline
    const supabase = createSupabaseBrowserClient();
    await supabase.from("sessions").update({ is_live: false } as any).eq("id", sessionId);
    setSessionEnded(true);
  }, [userId, sessionId]);

  const leaveRoom = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();
    channelRef.current?.unsubscribe();
    channelRef.current = null;
  }, []);

  return {
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
    error,
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
  };
}
