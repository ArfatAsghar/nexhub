import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/** Returns true when posts newer than `sinceIso` exist (for the feed refresh banner). */
export async function checkForNewPosts(sinceIso: string): Promise<boolean> {
  const supabase = createSupabaseBrowserClient();

  const { count, error } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .gt("created_at", sinceIso);

  if (error) return false;
  return (count ?? 0) > 0;
}
