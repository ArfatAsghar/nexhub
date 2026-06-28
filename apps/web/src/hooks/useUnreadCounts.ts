"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function useUnreadCounts(userId: string | null) {
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!userId) {
      setNotificationCount(0);
      setMessageCount(0);
      return;
    }

    const supabase = createSupabaseBrowserClient();

    const { count: notifCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", userId)
      .eq("is_read", false);

    setNotificationCount(notifCount ?? 0);

    const { data: convos } = await supabase
      .from("conversations")
      .select("id")
      .or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`);

    const convoIds = (convos ?? []).map((c) => c.id);
    if (convoIds.length === 0) {
      setMessageCount(0);
      return;
    }

    const [{ data: messages }, { data: readStates }] = await Promise.all([
      supabase
        .from("messages")
        .select("conversation_id, created_at, sender_id")
        .in("conversation_id", convoIds),
      supabase
        .from("conversation_read_state")
        .select("conversation_id, last_read_at")
        .eq("user_id", userId)
        .in("conversation_id", convoIds),
    ]);

    const readMap = new Map(
      (readStates ?? []).map((r) => [r.conversation_id, r.last_read_at]),
    );

    let unread = 0;
    for (const msg of messages ?? []) {
      if (msg.sender_id === userId) continue;
      const lastRead = readMap.get(msg.conversation_id) ?? "1970-01-01T00:00:00.000Z";
      if (new Date(msg.created_at) > new Date(lastRead)) unread++;
    }

    setMessageCount(unread);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!userId) return;
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel("sidebar-unread")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` },
        () => refresh(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  return { notificationCount, messageCount, refresh };
}
