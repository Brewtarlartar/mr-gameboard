-- Accounts + cloud sync for Mr. GameBoard / The Tome.
-- Run once in Supabase → SQL Editor → New query. Idempotent; safe to re-run.

---------------------------------------------------------------
-- Tables
---------------------------------------------------------------

-- One profile row per auth user, auto-created on signup via trigger below.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

-- One row per (user, game) in the user's library.
-- game_id is the app's client-side id (e.g. "bgg-12345" or "custom-...").
create table if not exists public.library_games (
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null,
  data jsonb not null,
  is_favorite boolean not null default false,
  added_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

-- User-authored games (separate from library entries so we can distinguish).
create table if not exists public.custom_games (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- Single-row preferences blob (ai_voice, theme, etc.).
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

---------------------------------------------------------------
-- Row-Level Security
---------------------------------------------------------------

alter table public.profiles          enable row level security;
alter table public.library_games     enable row level security;
alter table public.custom_games      enable row level security;
alter table public.user_preferences  enable row level security;

-- Drop-then-create so the migration is idempotent.
drop policy if exists "own profile"      on public.profiles;
drop policy if exists "own library"      on public.library_games;
drop policy if exists "own custom games" on public.custom_games;
drop policy if exists "own preferences"  on public.user_preferences;

create policy "own profile"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "own library"
  on public.library_games for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own custom games"
  on public.custom_games for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own preferences"
  on public.user_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

---------------------------------------------------------------
-- Auto-create profile row when a new auth user signs up
---------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
    values (new.id, new.email)
    on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
