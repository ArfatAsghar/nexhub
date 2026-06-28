"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AuthActionResult {
  error?: string;
}

export async function signInWithEmail(
  _prev: AuthActionResult,
  formData: FormData,
): Promise<AuthActionResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/feed");
}

export async function signUpWithEmail(
  _prev: AuthActionResult,
  formData: FormData,
): Promise<AuthActionResult> {
  const fullName = String(formData.get("fullName") ?? "");
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "student");
  const nicheTags = formData.getAll("nicheTags").map(String);

  if (!fullName || !username || !email || !password) {
    return { error: "All fields are required." };
  }

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return {
      error:
        "Username must be 3–20 characters: lowercase letters, numbers, underscore.",
    };
  }

  if (nicheTags.length > 5) {
    return { error: "Choose up to 5 niche tags." };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Picked up by the `handle_new_user` trigger (see migration 0002)
      // to populate the public.profiles row automatically.
      data: {
        full_name: fullName,
        username,
        role,
        niche_tags: nicheTags,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/feed");
}

export async function signInWithGoogle() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error || !data.url) {
    redirect("/login?error=oauth_failed");
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
