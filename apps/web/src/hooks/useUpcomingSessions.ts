"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@nexhub/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];

export interface UpcomingSession extends SessionRow {
  tutor: Profile;
  booked_by_me: boolean;
}

export interface UseUpcomingSessionsResult {
  sessions: UpcomingSession[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useUpcomingSessions(limit = 2): UseUpcomingSessionsResult {
  const [sessions, setSessions] = useState<UpcomingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { data: userData } = await supabase.auth.getUser();
    const currentUserId = userData.user?.id ?? null;

    const { data, error: sessionsError } = await supabase
      .from("sessions")
      .select("*, tutor:profiles!sessions_tutor_id_fkey(*)")
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(limit);

    if (sessionsError) {
      setError(sessionsError.message);
      setLoading(false);
      return;
    }

    const rows = data ?? [];
    const sessionIds = rows.map((r) => r.id);

    let bookedSet = new Set<string>();
    if (currentUserId && sessionIds.length > 0) {
      const { data: bookings } = await supabase
        .from("session_bookings")
        .select("session_id")
        .eq("student_id", currentUserId)
        .in("session_id", sessionIds);
      bookedSet = new Set((bookings ?? []).map((b) => b.session_id));
    }

    setSessions(
      rows.flatMap((row) => {
        const tutorRaw = (row as unknown as { tutor: Profile | Profile[] }).tutor;
        const tutor = Array.isArray(tutorRaw) ? tutorRaw[0] : tutorRaw;
        if (!tutor) return [];
        return [{ ...row, tutor, booked_by_me: bookedSet.has(row.id) }];
      }),
    );
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, loading, error, refresh: fetchSessions };
}