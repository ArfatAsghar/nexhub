"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@nexhub/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type ConversationPreview = {
  id: string;
  otherUser: Pick<Profile, "id" | "username" | "full_name" | "avatar_url">;
  lastMessage: {
    content: string;
    created_at: string;
    sender_id: string;
    image_url?: string | null;
  } | null;
  unreadCount: number;
};

export function useConversations(userId: string | null) {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!userId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();

    const { data: convoRows, error: convoError } = await supabase
      .from("conversations")
      .select(
        `
        id,
        user_one_id,
        user_two_id,
        user_one:profiles!conversations_user_one_id_fkey(id, username, full_name, avatar_url),
        user_two:profiles!conversations_user_two_id_fkey(id, username, full_name, avatar_url)
      `,
      )
      .or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (convoError) {
      setError(convoError.message);
      setLoading(false);
      return;
    }

    const convoIds = (convoRows ?? []).map((c) => c.id);
    if (convoIds.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const [{ data: messages }, { data: readStates }] = await Promise.all([
      supabase
        .from("messages")
        .select("id, conversation_id, content, created_at, sender_id, image_url, read_at")
        .in("conversation_id", convoIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("conversation_read_state")
        .select("conversation_id, last_read_at")
        .eq("user_id", userId)
        .in("conversation_id", convoIds),
    ]);

    const readMap = new Map<string, string>();
    for (const row of readStates ?? []) {
      const r = row as unknown as { conversation_id: string; last_read_at: string };
      readMap.set(r.conversation_id, r.last_read_at);
    }

    const lastByConvo = new Map<string, (typeof messages extends (infer M)[] | null ? M : never)>();
    for (const msg of messages ?? []) {
      if (!lastByConvo.has(msg.conversation_id)) {
        lastByConvo.set(msg.conversation_id, msg);
      }
    }

    const unreadByConvo = new Map<string, number>();
    for (const msg of messages ?? []) {
      if (msg.sender_id === userId) continue;
      const lastRead = readMap.get(msg.conversation_id) ?? "1970-01-01T00:00:00.000Z";
      if (new Date(msg.created_at) > new Date(lastRead)) {
        unreadByConvo.set(msg.conversation_id, (unreadByConvo.get(msg.conversation_id) ?? 0) + 1);
      }
    }

    const previews: ConversationPreview[] = (convoRows ?? []).map((row) => {
      const userOne = row.user_one as Profile | Profile[] | null;
      const userTwo = row.user_two as Profile | Profile[] | null;
      const one = Array.isArray(userOne) ? userOne[0] : userOne;
      const two = Array.isArray(userTwo) ? userTwo[0] : userTwo;
      const otherUser =
        row.user_one_id === userId
          ? two!
          : one!;
      const last = lastByConvo.get(row.id);

      return {
        id: row.id,
        otherUser: {
          id: otherUser.id,
          username: otherUser.username,
          full_name: otherUser.full_name,
          avatar_url: otherUser.avatar_url,
        },
        lastMessage: last
          ? {
              content: last.content,
              created_at: last.created_at,
              sender_id: last.sender_id,
              image_url: (last as { image_url?: string | null }).image_url ?? null,
            }
          : null,
        unreadCount: unreadByConvo.get(row.id) ?? 0,
      };
    });

    previews.sort((a, b) => {
      const aTime = a.lastMessage?.created_at ?? "";
      const bTime = b.lastMessage?.created_at ?? "";
      return bTime.localeCompare(aTime);
    });

    setConversations(previews);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!userId) return;
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("conversations-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => fetchConversations(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversations" },
        () => fetchConversations(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchConversations]);

  return { conversations, loading, error, refresh: fetchConversations };
}
