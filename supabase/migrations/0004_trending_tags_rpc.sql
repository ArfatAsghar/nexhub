-- ===========================================================================
-- NexHub schema — Phase One
-- Migration 0004: trending tags RPC
--
-- Aggregates the most-used tags across posts. Implemented as a Postgres
-- function (rather than counted client-side) so it scales with the table
-- instead of pulling every post's tags over the wire to count in JS.
-- ===========================================================================

create or replace function public.trending_tags(tag_limit int default 5)
returns table (tag text, post_count bigint)
language sql
stable
as $$
  select unnest(tags) as tag, count(*) as post_count
  from public.posts
  group by tag
  order by post_count desc, tag asc
  limit tag_limit;
$$;

-- Allow any authenticated user to call it (read-only aggregate, no RLS
-- bypass needed since it only touches public.posts.tags which is already
-- readable by any authenticated user per posts_select_authenticated).
grant execute on function public.trending_tags(int) to authenticated;