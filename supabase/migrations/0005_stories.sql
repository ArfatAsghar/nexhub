-- ===========================================================================
-- NexHub schema — Phase One
-- Migration 0005: stories
--
-- Stories are ephemeral posts (image or text-card) that "expire" 24h after
-- creation. Expiry is enforced at the query layer (created_at > now() - 24h)
-- rather than physically deleting rows on a timer, which keeps this simple
-- and avoids needing a scheduled job for Phase One.
-- ===========================================================================

create type public.story_type as enum ('image', 'text');

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  type public.story_type not null,
  image_url text,
  text text,
  bg text,
  created_at timestamptz not null default now(),

  constraint story_content_matches_type check (
    (type = 'image' and image_url is not null and text is null)
    or
    (type = 'text' and text is not null and image_url is null)
  ),
  constraint story_text_not_blank check (
    type <> 'text' or length(trim(text)) > 0
  )
);

create index stories_author_id_idx on public.stories (author_id);
create index stories_created_at_idx on public.stories (created_at desc);

alter table public.stories enable row level security;

create policy "stories_select_authenticated"
  on public.stories for select
  to authenticated
  using (true);

create policy "stories_insert_own"
  on public.stories for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "stories_delete_own"
  on public.stories for delete
  to authenticated
  using (auth.uid() = author_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('stories', 'stories', true, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "stories_bucket_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'stories');

create policy "stories_bucket_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'stories'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "stories_bucket_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'stories'
    and (storage.foldername(name))[1] = auth.uid()::text
  );