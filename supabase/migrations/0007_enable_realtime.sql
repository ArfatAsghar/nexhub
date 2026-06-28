-- ===========================================================================
-- NexHub schema — Realtime Publications
-- Enable realtime for messages, conversations, and notifications
-- ===========================================================================

do $$
begin
  -- Ensure the supabase_realtime publication exists
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  -- Add public.messages if not already added
  if not exists (
    select 1 
    from pg_publication_rel pr 
    join pg_class c on pr.prrelid = c.oid 
    join pg_namespace n on c.relnamespace = n.oid 
    where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
      and n.nspname = 'public' 
      and c.relname = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  -- Add public.conversations if not already added
  if not exists (
    select 1 
    from pg_publication_rel pr 
    join pg_class c on pr.prrelid = c.oid 
    join pg_namespace n on c.relnamespace = n.oid 
    where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
      and n.nspname = 'public' 
      and c.relname = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;

  -- Add public.notifications if not already added
  if not exists (
    select 1 
    from pg_publication_rel pr 
    join pg_class c on pr.prrelid = c.oid 
    join pg_namespace n on c.relnamespace = n.oid 
    where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
      and n.nspname = 'public' 
      and c.relname = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end
$$;
