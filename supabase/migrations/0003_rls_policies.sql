-- ===========================================================================
-- NexHub schema — Phase One
-- Migration 0003: Row Level Security policies
--
-- Principle: every table is readable per its visibility rules and writable
-- only by the row's own owner (or, for follows/likes/bookmarks/messages,
-- by the acting party). Service-role (server-side admin) bypasses RLS by
-- default and is used sparingly, only where noted.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- profiles
-- Public profiles are readable by anyone (incl. anon, for /explore browsing).
-- Private accounts (is_private = true) are still readable here in Phase One
-- — follow-gating of private profiles is a Phase Two concern — but the flag
-- already exists in the schema so the UI toggle in Settings has somewhere
-- to write to.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles_select_all"
  on public.profiles for select
  using (true);

create policy "profiles_insert_self"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_self"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_delete_self"
  on public.profiles for delete
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- posts
-- Readable by anyone signed in (feed/explore). Only the author can write.
-- ---------------------------------------------------------------------------
alter table public.posts enable row level security;

create policy "posts_select_authenticated"
  on public.posts for select
  to authenticated
  using (true);

create policy "posts_insert_own"
  on public.posts for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "posts_update_own"
  on public.posts for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "posts_delete_own"
  on public.posts for delete
  to authenticated
  using (auth.uid() = author_id);

-- ---------------------------------------------------------------------------
-- comments
-- ---------------------------------------------------------------------------
alter table public.comments enable row level security;

create policy "comments_select_authenticated"
  on public.comments for select
  to authenticated
  using (true);

create policy "comments_insert_own"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "comments_update_own"
  on public.comments for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "comments_delete_own"
  on public.comments for delete
  to authenticated
  using (auth.uid() = author_id);

-- ---------------------------------------------------------------------------
-- likes
-- Anyone authenticated can see who liked what (needed for like counts /
-- "liked by" UI) but can only create/delete their own like row.
-- ---------------------------------------------------------------------------
alter table public.likes enable row level security;

create policy "likes_select_authenticated"
  on public.likes for select
  to authenticated
  using (true);

create policy "likes_insert_own"
  on public.likes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "likes_delete_own"
  on public.likes for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- bookmarks
-- Private to the user who made them — bookmarks are never shown to others.
-- ---------------------------------------------------------------------------
alter table public.bookmarks enable row level security;

create policy "bookmarks_select_own"
  on public.bookmarks for select
  to authenticated
  using (auth.uid() = user_id);

create policy "bookmarks_insert_own"
  on public.bookmarks for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "bookmarks_delete_own"
  on public.bookmarks for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- follows
-- Follow graph is public (needed for follower/following counts on any
-- profile) but only the follower can create/delete their own edge.
-- ---------------------------------------------------------------------------
alter table public.follows enable row level security;

create policy "follows_select_authenticated"
  on public.follows for select
  to authenticated
  using (true);

create policy "follows_insert_own"
  on public.follows for insert
  to authenticated
  with check (auth.uid() = follower_id);

create policy "follows_delete_own"
  on public.follows for delete
  to authenticated
  using (auth.uid() = follower_id);

-- ---------------------------------------------------------------------------
-- sessions
-- Readable by anyone authenticated (browsing available tutor sessions).
-- Only a tutor can create a session, and only for themselves.
-- ---------------------------------------------------------------------------
alter table public.sessions enable row level security;

create policy "sessions_select_authenticated"
  on public.sessions for select
  to authenticated
  using (true);

create policy "sessions_insert_own_if_tutor"
  on public.sessions for insert
  to authenticated
  with check (
    auth.uid() = tutor_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'tutor'
    )
  );

create policy "sessions_update_own"
  on public.sessions for update
  to authenticated
  using (auth.uid() = tutor_id)
  with check (auth.uid() = tutor_id);

create policy "sessions_delete_own"
  on public.sessions for delete
  to authenticated
  using (auth.uid() = tutor_id);

-- ---------------------------------------------------------------------------
-- session_bookings
-- A student can see and manage only their own bookings. A tutor can see
-- bookings made against their own sessions (to know who's coming).
-- ---------------------------------------------------------------------------
alter table public.session_bookings enable row level security;

create policy "session_bookings_select_own_or_tutor"
  on public.session_bookings for select
  to authenticated
  using (
    auth.uid() = student_id
    or auth.uid() in (
      select tutor_id from public.sessions where id = session_id
    )
  );

create policy "session_bookings_insert_own"
  on public.session_bookings for insert
  to authenticated
  with check (auth.uid() = student_id);

create policy "session_bookings_delete_own"
  on public.session_bookings for delete
  to authenticated
  using (auth.uid() = student_id);

-- ---------------------------------------------------------------------------
-- notifications
-- A user can only ever see their own notifications. Notifications are
-- inserted by other users' actions (e.g. liking a post creates a
-- notification for the post author) via SECURITY DEFINER trigger functions
-- below, since a "liker" otherwise has no insert rights into someone
-- else's notification row.
-- ---------------------------------------------------------------------------
alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (auth.uid() = recipient_id);

create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

create policy "notifications_delete_own"
  on public.notifications for delete
  to authenticated
  using (auth.uid() = recipient_id);

-- Trigger functions create notification rows as SECURITY DEFINER so they
-- run with elevated privilege regardless of who performed the triggering
-- action (e.g. someone else liking your post).
create or replace function public.notify_on_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_author uuid;
begin
  select author_id into post_author from public.posts where id = new.post_id;
  if post_author is not null and post_author <> new.user_id then
    insert into public.notifications (recipient_id, actor_id, type, post_id)
    values (post_author, new.user_id, 'like', new.post_id);
  end if;
  return new;
end;
$$;

create trigger likes_notify
  after insert on public.likes
  for each row execute function public.notify_on_like();

create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_author uuid;
begin
  select author_id into post_author from public.posts where id = new.post_id;
  if post_author is not null and post_author <> new.author_id then
    insert into public.notifications (recipient_id, actor_id, type, post_id)
    values (post_author, new.author_id, 'comment', new.post_id);
  end if;
  return new;
end;
$$;

create trigger comments_notify
  after insert on public.comments
  for each row execute function public.notify_on_comment();

create or replace function public.notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (recipient_id, actor_id, type)
  values (new.following_id, new.follower_id, 'follow');
  return new;
end;
$$;

create trigger follows_notify
  after insert on public.follows
  for each row execute function public.notify_on_follow();

create or replace function public.notify_on_session_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  tutor uuid;
begin
  select tutor_id into tutor from public.sessions where id = new.session_id;
  if tutor is not null then
    insert into public.notifications (recipient_id, actor_id, type)
    values (tutor, new.student_id, 'session_booked');
  end if;
  return new;
end;
$$;

create trigger session_bookings_notify
  after insert on public.session_bookings
  for each row execute function public.notify_on_session_booking();

-- ---------------------------------------------------------------------------
-- conversations
-- Only the two participants can see or create a conversation between them.
-- ---------------------------------------------------------------------------
alter table public.conversations enable row level security;

create policy "conversations_select_participant"
  on public.conversations for select
  to authenticated
  using (auth.uid() = user_one_id or auth.uid() = user_two_id);

create policy "conversations_insert_participant"
  on public.conversations for insert
  to authenticated
  with check (auth.uid() = user_one_id or auth.uid() = user_two_id);

-- ---------------------------------------------------------------------------
-- messages
-- Only participants of the parent conversation can read; only the sender
-- (who must also be a participant) can insert.
-- ---------------------------------------------------------------------------
alter table public.messages enable row level security;

create policy "messages_select_participant"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (auth.uid() = c.user_one_id or auth.uid() = c.user_two_id)
    )
  );

create policy "messages_insert_participant"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (auth.uid() = c.user_one_id or auth.uid() = c.user_two_id)
    )
  );
