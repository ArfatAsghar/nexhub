"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@nexhub/ui";
import { useUser } from "@/hooks/useUser";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faLock,
  faBell,
  faEyeSlash,
  faPalette,
  faTrash,
  faSpinner,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";

type SettingsSection =
  | "account"
  | "profile"
  | "privacy"
  | "notifications"
  | "appearance"
  | "danger";

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile: userProfile, loading: userLoading } = useUser();
  const { updateProfile, pending: profilePending, error: profileError } = useUpdateProfile();

  const [activeSection, setActiveSection] = useState<SettingsSection>("account");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Account inputs
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Profile inputs
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [nicheTags, setNicheTags] = useState<string[]>([]);
  const [role, setRole] = useState<"developer" | "student" | "tutor">("student");
  const [newTagInput, setNewTagInput] = useState("");

  // Privacy inputs
  const [isPrivate, setIsPrivate] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);

  // Notifications inputs
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);

  // Theme
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");

  // Danger zone
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync profile details into inputs on load
  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username || "");
      setEmail(user?.email || "");
      setFullName(userProfile.full_name || "");
      setBio(userProfile.bio || "");
      setNicheTags(userProfile.niche_tags || []);
      setRole((userProfile.role as any) || "student");
      setIsPrivate(userProfile.is_private || false);
      setShowOnlineStatus(userProfile.show_online_status ?? true);
    }
  }, [userProfile, user]);

  function triggerSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  // Account submit handler
  async function handleAccountSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setPending(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();

    // 1. Update username
    if (username !== userProfile?.username) {
      const { error: usernameErr } = await supabase
        .from("profiles")
        .update({ username: username.trim().toLowerCase() })
        .eq("id", user.id);

      if (usernameErr) {
        setError(usernameErr.message);
        setPending(false);
        return;
      }
    }

    // 2. Update Auth details (email/password)
    const updateObj: { email?: string; password?: string } = {};
    if (email && email !== user.email) updateObj.email = email;
    if (password) updateObj.password = password;

    if (Object.keys(updateObj).length > 0) {
      const { error: authErr } = await supabase.auth.updateUser(updateObj);
      if (authErr) {
        setError(authErr.message);
        setPending(false);
        return;
      }
    }

    setPending(false);
    setPassword("");
    triggerSuccess("Account credentials updated successfully.");
  }

  // Profile submit handler
  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const ok = await updateProfile({
      fullName,
      bio,
      nicheTags,
    });

    if (ok) {
      // Update role in DB
      const supabase = createSupabaseBrowserClient();
      const { error: roleErr } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", user?.id);

      if (roleErr) {
        setError(roleErr.message);
      } else {
        triggerSuccess("Profile information saved.");
      }
    } else {
      setError(profileError);
    }
  }

  // Privacy submit handler
  async function handlePrivacySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setPending(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: privacyErr } = await supabase
      .from("profiles")
      .update({
        is_private: isPrivate,
        show_online_status: showOnlineStatus,
      })
      .eq("id", user.id);

    setPending(false);

    if (privacyErr) {
      setError(privacyErr.message);
      return;
    }

    triggerSuccess("Privacy preferences updated.");
  }

  // Add niche tag helper
  function addNicheTag() {
    const trimmed = newTagInput.trim().toLowerCase();
    if (trimmed && !nicheTags.includes(trimmed)) {
      if (nicheTags.length >= 5) {
        setError("You can select up to 5 interest tags.");
        return;
      }
      setNicheTags([...nicheTags, trimmed]);
      setNewTagInput("");
    }
  }

  // Remove tag helper
  function removeNicheTag(tagToRemove: string) {
    setNicheTags(nicheTags.filter((t) => t !== tagToRemove));
  }

  // Delete account handler
  async function handleDeleteAccount() {
    if (!user) return;
    setPending(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    
    // Delete profile (cascades or deletes posts/comments/likes/stories)
    const { error: delError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", user.id);

    if (delError) {
      setError(delError.message);
      setPending(false);
      return;
    }

    // Sign out
    await supabase.auth.signOut();
    setPending(false);
    router.push("/login");
  }

  const sections: { id: SettingsSection; label: string; icon: any }[] = [
    { id: "account", label: "Account Credentials", icon: faLock },
    { id: "profile", label: "Profile Details", icon: faUser },
    { id: "privacy", label: "Privacy Settings", icon: faEyeSlash },
    { id: "notifications", label: "Notifications", icon: faBell },
    { id: "appearance", label: "Appearance", icon: faPalette },
    { id: "danger", label: "Danger Zone", icon: faTrash },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <h1 className="font-display text-xl text-ink">Account Settings</h1>
        <p className="text-sm text-ink-muted">
          Manage your account profile, credentials, and preferences.
        </p>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-60 shrink-0">
          <nav className="flex flex-col gap-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setActiveSection(s.id);
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex items-center gap-3 rounded-card px-3.5 py-2.5 text-left text-xs font-semibold transition-colors ${
                  activeSection === s.id
                    ? "bg-canvas-overlay text-accent border-l-2 border-accent"
                    : "text-ink-muted hover:bg-canvas-raised hover:text-ink"
                }`}
              >
                <FontAwesomeIcon icon={s.icon} className="h-3.5 w-3.5" />
                <span>{s.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 rounded-card border border-border bg-canvas-raised p-6">
          {/* Notifications banner */}
          {successMsg && (
            <div className="mb-4 rounded-card bg-success/10 border border-success/30 p-3 text-xs text-success flex items-center gap-2">
              <FontAwesomeIcon icon={faCheckCircle} />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <p className="mb-4 text-xs text-danger border border-danger/30 rounded-card p-3 bg-danger/10">
              Error: {error}
            </p>
          )}

          {/* 1. ACCOUNT CREDENTIALS */}
          {activeSection === "account" && (
            <div>
              <h2 className="text-sm font-bold text-ink mb-4">Account Credentials</h2>
              <form onSubmit={handleAccountSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="mb-1 block text-xs text-ink-muted font-medium">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-card border border-border bg-canvas px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-ink-muted font-medium">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-card border border-border bg-canvas px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-ink-muted font-medium">New Password</label>
                  <input
                    type="password"
                    placeholder="Leave empty to keep current password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-card border border-border bg-canvas px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <Button type="submit" disabled={pending} className="w-fit text-xs px-4">
                  {pending ? "Saving Changes…" : "Update Credentials"}
                </Button>
              </form>
            </div>
          )}

          {/* 2. PROFILE DETAILS */}
          {activeSection === "profile" && (
            <div>
              <h2 className="text-sm font-bold text-ink mb-4">Profile Details</h2>
              <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="mb-1 block text-xs text-ink-muted font-medium">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-card border border-border bg-canvas px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-ink-muted font-medium">Role Type</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full rounded-card border border-border bg-canvas px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="student">Student</option>
                    <option value="developer">Developer</option>
                    <option value="tutor">Tutor</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-ink-muted font-medium">Bio</label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="w-full resize-none rounded-card border border-border bg-canvas px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-ink-muted font-medium">Topic Interests (Max 5)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. react"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addNicheTag())}
                      className="flex-1 rounded-card border border-border bg-canvas px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <Button type="button" onClick={addNicheTag} className="text-xs">
                      Add
                    </Button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {nicheTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-pill bg-canvas px-2.5 py-1 text-xs text-accent border border-border"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeNicheTag(tag)}
                          className="hover:text-ink text-[10px] ml-0.5"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <Button type="submit" disabled={profilePending} className="w-fit text-xs px-4">
                  {profilePending ? "Saving Changes…" : "Save Profile Details"}
                </Button>
              </form>
            </div>
          )}

          {/* 3. PRIVACY SETTINGS */}
          {activeSection === "privacy" && (
            <div>
              <h2 className="text-sm font-bold text-ink mb-4">Privacy Preferences</h2>
              <form onSubmit={handlePrivacySubmit} className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div>
                    <label className="text-xs font-bold text-ink block">Private Profile Account</label>
                    <span className="text-[10px] text-ink-muted">
                      When active, only accepted followers can view your detailed activities.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-border text-accent focus:ring-accent"
                  />
                </div>

                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div>
                    <label className="text-xs font-bold text-ink block">Show Online Activity</label>
                    <span className="text-[10px] text-ink-muted">
                      Allows colleagues to check your active connection badge status.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showOnlineStatus}
                    onChange={(e) => setShowOnlineStatus(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-border text-accent focus:ring-accent"
                  />
                </div>

                <Button type="submit" disabled={pending} className="w-fit text-xs px-4">
                  {pending ? "Saving Changes…" : "Update Privacy Preferences"}
                </Button>
              </form>
            </div>
          )}

          {/* 4. NOTIFICATIONS */}
          {activeSection === "notifications" && (
            <div>
              <h2 className="text-sm font-bold text-ink mb-4">Notification Preferences</h2>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div>
                    <label className="text-xs font-bold text-ink block">Email Notifications</label>
                    <span className="text-[10px] text-ink-muted">
                      Receive weekly digests, message requests, and scheduled tutoring alerts.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotifs}
                    onChange={(e) => setEmailNotifs(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-border text-accent focus:ring-accent"
                  />
                </div>

                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div>
                    <label className="text-xs font-bold text-ink block">Push Alerts</label>
                    <span className="text-[10px] text-ink-muted">
                      Receive instant chat message bubbles and notification banners in the app.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushNotifs}
                    onChange={(e) => setPushNotifs(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-border text-accent focus:ring-accent"
                  />
                </div>

                <Button
                  onClick={() => triggerSuccess("Notification preferences saved.")}
                  className="w-fit text-xs px-4"
                >
                  Save Notification Toggles
                </Button>
              </div>
            </div>
          )}

          {/* 5. APPEARANCE */}
          {activeSection === "appearance" && (
            <div>
              <h2 className="text-sm font-bold text-ink mb-4">Appearance Theme</h2>
              <div className="flex flex-col gap-4">
                <p className="text-xs text-ink-muted mb-2">
                  Choose the color mode that matches your workspace.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setThemeMode("dark")}
                    className={`rounded-card border p-4 flex flex-col items-center justify-center gap-2 transition-all ${
                      themeMode === "dark"
                        ? "border-accent bg-accent/10"
                        : "border-border bg-canvas hover:border-ink-faint"
                    }`}
                  >
                    <span className="text-xs font-semibold text-ink">Obsidian Dark</span>
                    <span className="text-[10px] text-ink-muted">Active theme (recommended)</span>
                  </button>

                  <button
                    onClick={() => {
                      setThemeMode("light");
                      triggerSuccess("Light theme support is coming soon! Obsidian Dark remains active.");
                    }}
                    className={`rounded-card border p-4 flex flex-col items-center justify-center gap-2 transition-all ${
                      themeMode === "light"
                        ? "border-accent bg-accent/10"
                        : "border-border bg-canvas hover:border-ink-faint"
                    }`}
                  >
                    <span className="text-xs font-semibold text-ink">Aurora Light</span>
                    <span className="text-[10px] text-ink-muted">Light mode mockup</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 6. DANGER ZONE */}
          {activeSection === "danger" && (
            <div>
              <h2 className="text-sm font-bold text-danger mb-2">Danger Zone</h2>
              <p className="text-xs text-ink-muted mb-4">
                Permanently delete your profile account and all related database records (posts, messages, and hosted tutoring sessions). This action cannot be undone.
              </p>

              {!confirmDelete ? (
                <Button
                  variant="danger"
                  onClick={() => setConfirmDelete(true)}
                  className="text-xs px-4"
                >
                  Delete Account...
                </Button>
              ) : (
                <div className="rounded-card border border-danger/40 bg-danger/5 p-4 flex flex-col gap-3">
                  <p className="text-xs font-bold text-danger">
                    Are you absolutely sure you want to delete your account?
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    This will clean up your entire database footprint.
                  </p>
                  <div className="flex gap-2.5">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={pending}
                      className="rounded-card bg-danger hover:bg-danger/90 px-3.5 py-2 text-xs font-bold text-white transition-colors"
                    >
                      {pending ? "Deleting Account…" : "Yes, Delete Account"}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      disabled={pending}
                      className="rounded-card border border-border bg-canvas px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:border-ink-faint"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
