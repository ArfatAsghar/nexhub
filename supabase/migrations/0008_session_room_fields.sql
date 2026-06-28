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

-- RLS: Drop the old insert policy and create a new one that allows both tutors and developers
drop policy if exists "sessions_insert_own_if_tutor" on public.sessions;

create policy "sessions_insert_own"
  on public.sessions for insert
  to authenticated
  with check (
    auth.uid() = tutor_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('tutor', 'developer')
    )
  );
