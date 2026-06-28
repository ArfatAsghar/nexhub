"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@nexhub/types";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

export function useMessages(
  conversationId: string | null,
  currentUserId: string | null,
) {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();

    const { data, error: fetchError } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setMessages(data ?? []);
    setLoading(false);

    if (currentUserId) {
      const now = new Date().toISOString();
      await supabase.from("conversation_read_state").upsert(
        {
          conversation_id: conversationId,
          user_id: currentUserId,
          last_read_at: now,
        },
        { onConflict: "conversation_id,user_id" },
      );

      const unreadIds = (data ?? [])
        .filter((m) => m.sender_id !== currentUserId && !m.read_at)
        .map((m) => m.id);

      if (unreadIds.length > 0) {
        await supabase
          .from("messages")
          .update({ read_at: now })
          .in("id", unreadIds);
      }
    }
  }, [conversationId, currentUserId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!conversationId) return;
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as MessageRow;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, row];
          });
          if (currentUserId && row.sender_id !== currentUserId) {
            const now = new Date().toISOString();
            supabase
              .from("conversation_read_state")
              .upsert(
                {
                  conversation_id: conversationId,
                  user_id: currentUserId,
                  last_read_at: now,
                },
                { onConflict: "conversation_id,user_id" },
              )
              .then(() =>
                supabase.from("messages").update({ read_at: now }).eq("id", row.id),
              );
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as MessageRow;
          setMessages((prev) => prev.map((m) => (m.id === row.id ? row : m)));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  const sendMessage = useCallback(
    async (content: string, imageFile?: File | null) => {
      if (!conversationId || !currentUserId) return false;
      const trimmed = content.trim();
      if (!trimmed && !imageFile) return false;

      setSending(true);
      setError(null);
      const supabase = createSupabaseBrowserClient();

      let imageUrl: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop() ?? "jpg";
        const filePath = `${currentUserId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("message-images")
          .upload(filePath, imageFile, { upsert: false });

        if (uploadError) {
          setError(uploadError.message);
          setSending(false);
          return false;
        }

        imageUrl = supabase.storage.from("message-images").getPublicUrl(filePath)
          .data.publicUrl;
      }

      const { error: insertError } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: trimmed || (imageUrl ? "📷 Image" : ""),
        image_url: imageUrl,
      });

      setSending(false);
      if (insertError) {
        setError(insertError.message);
        return false;
      }
      return true;
    },
    [conversationId, currentUserId],
  );

  return {
    messages,
    loading,
    error,
    sending,
    sendMessage,
    refresh: fetchMessages,
  };
}
