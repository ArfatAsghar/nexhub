"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@nexhub/types";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type NotificationType = NotificationRow["type"];

export type NotificationItem = NotificationRow & {
  actor: Pick<Profile, "id" | "username" | "full_name" | "avatar_url"> | null;
};

export type NotificationFilter = "all" | NotificationType;

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<NotificationFilter>("all");

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();

    let query = supabase
      .from("notifications")
      .select(
        "*, actor:profiles!notifications_actor_id_fkey(id, username, full_name, avatar_url)",
      )
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (filter !== "all") {
      query = query.eq("type", filter);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const items = (data ?? []).map((row) => {
      const actorRaw = (row as unknown as { actor: Profile | Profile[] | null }).actor;
      const actor = Array.isArray(actorRaw) ? actorRaw[0] : actorRaw;
      return { ...row, actor: actor ?? null };
    });

    setNotifications(items);
    setLoading(false);
  }, [userId, filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!userId) return;
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel("notifications-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        () => fetchNotifications(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      const supabase = createSupabaseBrowserClient();
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)),
      );
    },
    [],
  );

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    const supabase = createSupabaseBrowserClient();
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", userId)
      .eq("is_read", false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    loading,
    error,
    filter,
    setFilter,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
