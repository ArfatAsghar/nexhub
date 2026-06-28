-- ===========================================================================
-- Messaging enhancements, post reports, profile/message storage policies
-- ===========================================================================

alter table public.messages
  add column if not exists image_url text,
  add column if not exists read_at timestamptz;

alter table public.messages drop constraint if exists message_not_blank;
alter table public.messages add constraint message_has_content check (
  length(trim(content)) > 0 or image_url is not null
);

create table if not exists public.conversation_read_state (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

alter table public.conversation_read_state enable row level security;

create policy "read_state_select_own"
  on public.conversation_read_state for select
  to authenticated
  using (auth.uid() = user_id);

create policy "read_state_insert_own"
  on public.conversation_read_state for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "read_state_update_own"
  on public.conversation_read_state for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "messages_update_read_by_recipient"
  on public.messages for update
  to authenticated
  using (
    sender_id <> auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (auth.uid() = c.user_one_id or auth.uid() = c.user_two_id)
    )
  )
  with check (true);

create table if not exists public.post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (post_id, reporter_id),
  constraint report_reason_not_blank check (length(trim(reason)) > 0)
);

alter table public.post_reports enable row level security;

create policy "post_reports_insert_own"
  on public.post_reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('message-images', 'message-images', true, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp']),
  ('covers', 'covers', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "message_images_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'message-images');

create policy "message_images_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'message-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

create policy "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "covers_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'covers');

create policy "covers_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "covers_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
