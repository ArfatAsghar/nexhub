-- ===========================================================================
-- NexHub seed data — Phase One
-- Matches the dummy users / posts called out in the product spec, so local
-- dev (`supabase db reset`) starts with a realistic feed.
--
-- Note: inserting directly into auth.users (rather than via supabase.auth.signUp)
-- is a local-dev-only shortcut. All rows use a fixed dummy password hash for
-- 'password123' so you can log in locally as any seed user during dev.
-- ===========================================================================

do $$
declare
  pw_hash text := extensions.crypt('password123', extensions.gen_salt('bf'));
begin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) values
    ('11111111-1111-1111-1111-111111111101', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'arfat@example.com', pw_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Arfat Asghar","username":"arfat_dev","role":"developer","niche_tags":["React","Python","Machine Learning"]}', now(), now()),
    ('11111111-1111-1111-1111-111111111102', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sara@example.com', pw_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sara Khan","username":"sara_learns","role":"student","niche_tags":["DSA","Mathematics","Python"]}', now(), now()),
    ('11111111-1111-1111-1111-111111111103', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'usman@example.com', pw_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Usman Ali","username":"usman_tutors","role":"tutor","niche_tags":["Physics","Mathematics"]}', now(), now()),
    ('11111111-1111-1111-1111-111111111104', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'zara@example.com', pw_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Zara Ahmed","username":"zara_ui","role":"developer","niche_tags":["UI/UX","React"]}', now(), now()),
    ('11111111-1111-1111-1111-111111111105', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ali@example.com', pw_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ali Hassan","username":"ali_codes","role":"developer","niche_tags":["DSA","Web Dev","Python"]}', now(), now()),
    ('11111111-1111-1111-1111-111111111106', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fatima@example.com', pw_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Fatima Malik","username":"fatima_study","role":"student","niche_tags":["Machine Learning","Python"]}', now(), now()),
    ('11111111-1111-1111-1111-111111111107', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bilal@example.com', pw_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Bilal Raza","username":"bilal_teaches","role":"tutor","niche_tags":["Web Dev","React"]}', now(), now()),
    ('11111111-1111-1111-1111-111111111108', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'hina@example.com', pw_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Hina Shah","username":"hina_dev","role":"developer","niche_tags":["React","TypeScript"]}', now(), now())
  on conflict (id) do nothing;
end $$;

-- handle_new_user trigger fires on the inserts above and creates matching
-- public.profiles rows automatically. Add bios for a more realistic profile page.
update public.profiles set bio = 'Full-stack dev. React, Python, and occasionally yelling at TypeScript.' where username = 'arfat_dev';
update public.profiles set bio = 'CS sophomore grinding DSA. Always down to pair-program.' where username = 'sara_learns';
update public.profiles set bio = 'Physics & Math tutor, 6 years. I make derivatives less scary.' where username = 'usman_tutors';
update public.profiles set bio = 'Frontend dev obsessed with clean UI and tiny interactions.' where username = 'zara_ui';
update public.profiles set bio = 'DSA enthusiast. Currently building a job board on the side.' where username = 'ali_codes';
update public.profiles set bio = 'ML student. Currently deep in transformer architectures.' where username = 'fatima_study';
update public.profiles set bio = 'I teach React the way I wish someone had taught me — no fluff.' where username = 'bilal_teaches';
update public.profiles set bio = 'TypeScript/Next.js dev. Building NexHub-adjacent side projects.' where username = 'hina_dev';

-- ---------------------------------------------------------------------------
-- 8 dummy posts, matching the spec's content list exactly
-- ---------------------------------------------------------------------------
insert into public.posts (author_id, type, content, code_snippet, code_language, tags, created_at) values
  (
    '11111111-1111-1111-1111-111111111101', 'project',
    'Shipped a React optimization tip today: wrap expensive list renders in useMemo and watch your re-render count drop. Saved us 40% on the dashboard re-render time.',
    'const sortedItems = useMemo(\n  () => items.slice().sort((a, b) => a.priority - b.priority),\n  [items]\n);',
    'javascript',
    array['React','Performance'],
    now() - interval '2 hours'
  ),
  (
    '11111111-1111-1111-1111-111111111102', 'question',
    'Can someone explain why my recursive solution for the longest increasing subsequence is O(2^n) instead of O(n log n)? I think I''m missing the DP insight.',
    null, null,
    array['DSA','Python'],
    now() - interval '5 hours'
  ),
  (
    '11111111-1111-1111-1111-111111111103', 'lesson',
    'Announcing a free live session this weekend: "Python for Data Analysis — From Zero to Pandas." Bring your laptop, we''ll build a real dataset analysis together.',
    null, null,
    array['Python','Tutoring'],
    now() - interval '8 hours'
  ),
  (
    '11111111-1111-1111-1111-111111111104', 'project',
    'Just launched a personal project: a Figma-to-React component generator. Paste your Figma frame, get clean Tailwind JSX out. Still rough but the core pipeline works.',
    null, null,
    array['UI/UX','React'],
    now() - interval '1 day'
  ),
  (
    '11111111-1111-1111-1111-111111111106', 'discussion',
    'Sharing my study notes from this week on gradient descent variants (SGD, momentum, Adam). Happy to share the full doc if anyone wants it.',
    null, null,
    array['Machine Learning','Python'],
    now() - interval '1 day 4 hours'
  ),
  (
    '11111111-1111-1111-1111-111111111105', 'discussion',
    'What''s actually the best resource for learning DSA in 2026 — NeetCode, LeetCode premium, or just grinding CLRS? Curious what worked for people here.',
    null, null,
    array['DSA','Web Dev'],
    now() - interval '2 days'
  ),
  (
    '11111111-1111-1111-1111-111111111107', 'lesson',
    'Quick lesson on React hooks: useEffect cleanup functions are not optional once you''re dealing with subscriptions or timers. Here''s the pattern I always reach for.',
    'useEffect(() => {\n  const id = setInterval(tick, 1000);\n  return () => clearInterval(id);\n}, []);',
    'javascript',
    array['React','Web Dev'],
    now() - interval '2 days 6 hours'
  ),
  (
    '11111111-1111-1111-1111-111111111108', 'question',
    'Deploying an ML model to production for the first time — should I go with a FastAPI + Docker setup or just use a managed endpoint? Latency matters more than cost here.',
    null, null,
    array['Machine Learning'],
    now() - interval '3 days'
  );
