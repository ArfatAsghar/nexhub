import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@nexhub/types";

type Supabase = SupabaseClient<Database>;

export function canonicalUserPair(
  userA: string,
  userB: string,
): [string, string] {
  return userA < userB ? [userA, userB] : [userB, userA];
}

export async function getOrCreateConversation(
  supabase: Supabase,
  currentUserId: string,
  otherUserId: string,
): Promise<string> {
  if (currentUserId === otherUserId) {
    throw new Error("Cannot start a conversation with yourself.");
  }

  const [user_one_id, user_two_id] = canonicalUserPair(currentUserId, otherUserId);

  const { data: existing, error: lookupError } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_one_id", user_one_id)
    .eq("user_two_id", user_two_id)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existing) return existing.id;

  const { data: created, error: insertError } = await supabase
    .from("conversations")
    .insert({ user_one_id, user_two_id })
    .select("id")
    .single();

  if (insertError) throw insertError;
  return created.id;
}
