-- =============================================================================
-- NexHub — Migration 0008: Session Room Fields
-- Adds price, live-state, participant cap to sessions.
-- Adds payment tracking to session_bookings.
-- =============================================================================

-- Price and room metadata for sessions
alter table public.sessions
  add column if not exists price_pkr  integer not null default 0,
  add column if not exists is_live    boolean not null default false,
  add column if not exists max_participants integer not null default 20;

alter table public.sessions
  add constraint price_non_negative check (price_pkr >= 0),
  add constraint max_participants_positive check (max_participants > 0);

-- Payment status on bookings (free | pending | paid)
alter table public.session_bookings
  add column if not exists payment_status text not null default 'free';

alter table public.session_bookings
  add constraint payment_status_valid
    check (payment_status in ('free', 'pending', 'paid'));

-- RLS: anyone authenticated can read sessions (already covered by existing policy)
-- Allow tutors/developers to update is_live on their own sessions
create policy "sessions_update_own"
  on public.sessions for update
  to authenticated
  using  (auth.uid() = tutor_id)
  with check (auth.uid() = tutor_id);

-- Allow session owner to insert into sessions
create policy "sessions_insert_own"
  on public.sessions for insert
  to authenticated
  with check (auth.uid() = tutor_id);
