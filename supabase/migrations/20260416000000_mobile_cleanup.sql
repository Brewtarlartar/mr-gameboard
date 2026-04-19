-- Mobile launch cleanup: remove unused tables, add score template + session mode.

drop table if exists public.achievements cascade;
drop table if exists public.strategies cascade;
drop table if exists public.wishlist cascade;
drop table if exists public.game_nights cascade;

alter table public.games
  add column if not exists score_template jsonb;

alter table public.play_sessions
  add column if not exists session_mode text
    check (session_mode in ('competitive', 'coop', 'team')) default 'competitive';

alter table public.play_sessions
  add column if not exists coop_outcome text
    check (coop_outcome in ('win', 'loss'));
