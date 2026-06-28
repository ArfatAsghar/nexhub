-- ===========================================================================
-- NexHub schema — Phase One
-- Migration 0001: enums, tables, indexes
-- ===========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('student', 'developer', 'tutor');
create type public.post_type as enum ('question', 'project', 'lesson', 'discussion');
create type public.notification_type as enum (
  'like',
  'comment',
  'follow',
  'mention',
  'session_booked'
);

-- ---------------------------------------------------------------------------
-- profiles
-- One row per auth.users row, created automatically by trigger (migration 0002).
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  full_name text not null,
  email text not null,
  role public.user_role not null default 'student',
  bio text,
  avatar_url text,
  cover_url text,
  niche_tags text[] not null default '{}',
  is_private boolean not null default false,
  show_online_status boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint username_format check (username ~ '^[a-z0-9_]{3,20}$'),
  constraint niche_tags_max_five check (array_length(niche_tags, 1) is null or array_length(niche_tags, 1) <= 5)
);

create index profiles_username_idx on public.profiles (username);
create index profiles_role_idx on public.profiles (role);

-- ---------------------------------------------------------------------------
-- posts
-- ---------------------------------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  type public.post_type not null default 'discussion',
  content text not null,
  code_snippet text,
  code_language text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint content_not_blank check (length(trim(content)) > 0),
  constraint tags_max_five check (array_length(tags, 1) is null or array_length(tags, 1) <= 5)
);

create index posts_author_id_idx on public.posts (author_id);
create index posts_created_at_idx on public.posts (created_at desc);
create index posts_type_idx on public.posts (type);
create index posts_tags_idx on public.posts using gin (tags);

-- ---------------------------------------------------------------------------
-- comments (1 level of nesting, per spec: "5 dummy comments with nested
-- reply support, 1 level deep")
-- ---------------------------------------------------------------------------
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  parent_comment_id uuid references public.comments (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),

  constraint comment_not_blank check (length(trim(content)) > 0)
);

create index comments_post_id_idx on public.comments (post_id);
create index comments_parent_comment_id_idx on public.comments (parent_comment_id);

-- Enforce exactly one level of nesting: a reply's parent must itself be a
-- top-level comment (parent_comment_id is null).
create or replace function public.enforce_single_level_comment_nesting()
returns trigger
language plpgsql
as $$
begin
  if new.parent_comment_id is not null then
    if exists (
      select 1 from public.comments
      where id = new.parent_comment_id
        and parent_comment_id is not null
    ) then
      raise exception 'Replies can only be one level deep.';
    end if;
  end if;
  return new;
end;
$$;

create trigger comments_enforce_single_level_nesting
  before insert or update on public.comments
  for each row execute function public.enforce_single_level_comment_nesting();

-- ---------------------------------------------------------------------------
-- likes
-- ---------------------------------------------------------------------------
create table public.likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),

  unique (post_id, user_id)
);

create index likes_post_id_idx on public.likes (post_id);
create index likes_user_id_idx on public.likes (user_id);

-- ---------------------------------------------------------------------------
-- bookmarks
-- ---------------------------------------------------------------------------
create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),

  unique (post_id, user_id)
);

create index bookmarks_user_id_idx on public.bookmarks (user_id);

-- ---------------------------------------------------------------------------
-- follows
-- ---------------------------------------------------------------------------
create table public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),

  unique (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);

create index follows_follower_id_idx on public.follows (follower_id);
create index follows_following_id_idx on public.follows (following_id);

-- ---------------------------------------------------------------------------
-- sessions (tutor-hosted) + session_bookings
-- ---------------------------------------------------------------------------
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 60,
  niche_tag text,
  created_at timestamptz not null default now(),

  constraint duration_positive check (duration_minutes > 0)
);

create index sessions_tutor_id_idx on public.sessions (tutor_id);
create index sessions_scheduled_at_idx on public.sessions (scheduled_at);

create table public.session_bookings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),

  unique (session_id, student_id)
);

create index session_bookings_session_id_idx on public.session_bookings (session_id);
create index session_bookings_student_id_idx on public.session_bookings (student_id);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  post_id uuid references public.posts (id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_recipient_id_idx on public.notifications (recipient_id, created_at desc);
create index notifications_unread_idx on public.notifications (recipient_id) where not is_read;

-- ---------------------------------------------------------------------------
-- conversations + messages
-- ---------------------------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  -- IMPORTANT: callers must normalize the pair before insert, e.g.
  --   const [userOneId, userTwoId] = [a, b].sort();
  -- so that (a,b) and (b,a) always resolve to the same canonical row.
  user_one_id uuid not null references public.profiles (id) on delete cascade,
  user_two_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint no_self_conversation check (user_one_id <> user_two_id),
  -- canonical ordering so (a,b) and (b,a) can't both exist
  constraint ordered_pair check (user_one_id < user_two_id),
  unique (user_one_id, user_two_id)
);

create index conversations_user_one_idx on public.conversations (user_one_id);
create index conversations_user_two_idx on public.conversations (user_two_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),

  constraint message_not_blank check (length(trim(content)) > 0)
);

create index messages_conversation_id_idx on public.messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- updated_at maintenance trigger, reused across tables
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();
