"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar, Button, cn } from "@nexhub/ui";
import { useUser } from "@/hooks/useUser";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getOrCreateConversation } from "@/lib/conversations";
import { timeAgo } from "@/lib/timeAgo";
import type { Database } from "@nexhub/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera } from "@fortawesome/free-solid-svg-icons";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const withUsername = searchParams.get("with");

  const { user } = useUser();
  const { conversations, loading, refresh } = useConversations(user?.id ?? null);

  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const { messages, loading: messagesLoading, sending, sendMessage } = useMessages(
    activeConvoId,
    user?.id ?? null,
  );

  const [draft, setDraft] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeConvo = conversations.find((c) => c.id === activeConvoId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!withUsername || !user) return;

    async function openWithUser() {
      if (!withUsername) return;
      const supabase = createSupabaseBrowserClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", withUsername)
        .maybeSingle();

      if (!profile) return;
      const convoId = await getOrCreateConversation(supabase, user!.id, profile.id);
      setActiveConvoId(convoId);
      refresh();
      router.replace("/messages");
    }

    openWithUser();
  }, [withUsername, user, refresh, router]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearchLoading(true);
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, role, email, bio, cover_url, niche_tags, is_private, show_online_status, created_at, updated_at")
        .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
        .neq("id", user?.id ?? "")
        .limit(8);

      setSearchResults(data ?? []);
      setSearchLoading(false);
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchQuery, user?.id]);

  const startConversation = useCallback(
    async (otherUserId: string) => {
      if (!user) return;
      const supabase = createSupabaseBrowserClient();
      const convoId = await getOrCreateConversation(supabase, user.id, otherUserId);
      setActiveConvoId(convoId);
      setSearchOpen(false);
      setSearchQuery("");
      refresh();
    },
    [user, refresh],
  );

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const ok = await sendMessage(draft, imageFile);
    if (ok) {
      setDraft("");
      setImageFile(null);
      refresh();
    }
  }

  return (
    <main className="mx-auto flex h-[calc(100vh-3rem)] max-w-5xl flex-col px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
      <h1 className="font-display text-xl text-ink">Messages</h1>
          <p className="text-sm text-ink-muted">Real-time direct messages</p>
        </div>
        <Button variant="secondary" onClick={() => setSearchOpen(true)}>
          New chat
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-card border border-border">
        {/* Conversation list */}
        <div
          className={cn(
            "flex w-full flex-col border-r border-border bg-canvas-raised md:w-80",
            activeConvoId && "hidden md:flex",
          )}
        >
          {loading ? (
            <p className="p-4 text-sm text-ink-faint">Loading conversations…</p>
          ) : conversations.length === 0 ? (
            <p className="p-4 text-sm text-ink-faint">
              No conversations yet. Start one with New chat.
            </p>
          ) : (
            <ul className="overflow-y-auto">
              {conversations.map((convo) => (
                <li key={convo.id}>
                  <button
                    type="button"
                    onClick={() => setActiveConvoId(convo.id)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-canvas-overlay",
                      activeConvoId === convo.id && "bg-canvas-overlay",
                    )}
                  >
                    <Avatar
                      name={convo.otherUser.full_name}
                      src={convo.otherUser.avatar_url}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-ink">
                          {convo.otherUser.full_name}
                        </span>
                        {convo.lastMessage && (
                          <span className="shrink-0 text-xs text-ink-faint">
                            {timeAgo(convo.lastMessage.created_at)}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-ink-muted">
                        {convo.lastMessage
                          ? convo.lastMessage.image_url
                            ? "📷 Image"
                            : convo.lastMessage.content
                          : "No messages yet"}
                      </p>
                    </div>
                    {convo.unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs text-canvas font-semibold">
                        {convo.unreadCount}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Chat pane */}
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col bg-canvas",
            !activeConvoId && "hidden md:flex",
          )}
        >
          {!activeConvoId ? (
            <div className="flex flex-1 items-center justify-center text-sm text-ink-faint">
              Select a conversation
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <button
                  type="button"
                  className="text-sm text-accent md:hidden"
                  onClick={() => setActiveConvoId(null)}
                >
                  ← Back
                </button>
                <Avatar
                  name={activeConvo?.otherUser.full_name ?? ""}
                  src={activeConvo?.otherUser.avatar_url}
                  size="sm"
                />
                <div>
                  <p className="text-sm font-medium text-ink">
                    {activeConvo?.otherUser.full_name}
                  </p>
                  <p className="text-xs text-ink-faint">
                    @{activeConvo?.otherUser.username}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                {messagesLoading ? (
                  <p className="text-sm text-ink-faint">Loading messages…</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {messages.map((msg) => {
                      const mine = msg.sender_id === user?.id;
                      const seen = !!msg.read_at;
                      return (
                        <div
                          key={msg.id}
                          className={cn("flex flex-col", mine ? "items-end" : "items-start")}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-card px-3 py-2 text-sm",
                              mine
                                ? "bg-accent text-canvas font-medium"
                                : "border border-border bg-canvas-raised text-ink",
                            )}
                          >
                            {msg.image_url && (
                              <img
                                src={msg.image_url}
                                alt="Shared"
                                className="mb-2 max-h-48 rounded-md object-cover"
                              />
                            )}
                            {msg.content && msg.content !== "📷 Image" && (
                              <p>{msg.content}</p>
                            )}
                          </div>
                          <span className="mt-1 text-xs text-ink-faint">
                            {timeAgo(msg.created_at)}
                            {mine && (seen ? " · Seen" : " · Delivered")}
                          </span>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              <form
                onSubmit={handleSend}
                className="border-t border-border px-4 py-3"
              >
                {imageFile && (
                  <p className="mb-2 text-xs text-ink-muted">
                    Image attached: {imageFile.name}{" "}
                    <button
                      type="button"
                      className="text-accent"
                      onClick={() => setImageFile(null)}
                    >
                      Remove
                    </button>
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="shrink-0 rounded-card border border-border px-3.5 py-2 text-sm text-ink-muted hover:text-ink transition-colors flex items-center justify-center"
                    aria-label="Attach image"
                  >
                    <FontAwesomeIcon icon={faCamera} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  />
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Write a message…"
                    className="flex-1 rounded-card border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <Button type="submit" disabled={sending || (!draft.trim() && !imageFile)}>
                    {sending ? "…" : "Send"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {/* New conversation search modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-card border border-border bg-canvas-raised p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-lg text-ink">New conversation</h2>
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or username…"
              className="mt-4 w-full rounded-card border border-border bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <ul className="mt-3 max-h-64 overflow-y-auto">
              {searchLoading && (
                <li className="py-2 text-sm text-ink-faint">Searching…</li>
              )}
              {!searchLoading && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                <li className="py-2 text-sm text-ink-faint">No users found</li>
              )}
              {searchResults.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => startConversation(u.id)}
                    className="flex w-full items-center gap-3 rounded-card px-2 py-2 text-left hover:bg-canvas-overlay"
                  >
                    <Avatar name={u.full_name} src={u.avatar_url} size="sm" />
                    <div>
                      <p className="text-sm text-ink">{u.full_name}</p>
                      <p className="text-xs text-ink-faint">@{u.username}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<main className="px-4 py-6 text-sm text-ink-faint">Loading…</main>}>
      <MessagesContent />
    </Suspense>
  );
}
