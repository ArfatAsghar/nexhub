-- ===========================================================================
-- NexHub schema — Phase One
-- Migration 0002: handle_new_user trigger
--
-- Populates public.profiles automatically whenever a row is inserted into
-- auth.users. Covers BOTH auth flows:
--   - Email signup: metadata comes from supabase.auth.signUp({ options.data })
--     in auth-actions.ts (full_name, username, role, niche_tags).
--   - Google OAuth: metadata comes from Google's profile (full_name, avatar
--     in user_metadata) — username/role won't be set yet, so we generate a
--     safe placeholder username and default role; the user can complete
--     their profile from /settings afterward.
-- ===========================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := new.raw_user_meta_data;
  candidate_username text;
  final_username text;
  suffix int := 0;
begin
  candidate_username := lower(coalesce(
    meta ->> 'username',
    split_part(new.email, '@', 1)
  ));
  -- strip characters outside the allowed set, trim to 20 chars
  candidate_username := regexp_replace(candidate_username, '[^a-z0-9_]', '', 'g');
  candidate_username := substr(candidate_username, 1, 20);
  if length(candidate_username) < 3 then
    candidate_username := candidate_username || repeat('0', 3 - length(candidate_username));
  end if;

  final_username := candidate_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    suffix := suffix + 1;
    final_username := substr(candidate_username, 1, 17) || suffix::text;
  end loop;

  insert into public.profiles (
    id, username, full_name, email, role, niche_tags, avatar_url
  )
  values (
    new.id,
    final_username,
    coalesce(meta ->> 'full_name', meta ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((meta ->> 'role')::public.user_role, 'student'),
    case
      when meta -> 'niche_tags' is not null
        then array(select jsonb_array_elements_text(meta -> 'niche_tags'))
      else '{}'::text[]
    end,
    meta ->> 'avatar_url'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
