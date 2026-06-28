"use client";

import { useCallback, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface UseBookSessionResult {
  bookSession: (sessionId: string) => Promise<boolean>;
  pending: boolean;
  error: string | null;
}

export function useBookSession(): UseBookSessionResult {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bookSession = useCallback(async (sessionId: string): Promise<boolean> => {
    setError(null);
    setPending(true);

    const supabase = createSupabaseBrowserClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
      setError("You must be signed in to book a session.");
      setPending(false);
      return false;
    }

    const { error: insertError } = await supabase
      .from("session_bookings")
      .insert({ session_id: sessionId, student_id: userId });

    setPending(false);

    if (insertError) {
      if (insertError.code === "23505") {
        return true;
      }
      setError(insertError.message);
      return false;
    }

    return true;
  }, []);

  return { bookSession, pending, error };
}