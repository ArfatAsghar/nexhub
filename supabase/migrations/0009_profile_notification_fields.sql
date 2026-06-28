-- =============================================================================
-- NexHub — Migration 0009: Profile Settings Preferences
-- Adds notification preferences and theme mode to user profiles.
-- =============================================================================

alter table public.profiles
  add column if not exists email_notifications boolean not null default true,
  add column if not exists push_notifications  boolean not null default true,
  add column if not exists theme_mode          text not null default 'dark';
