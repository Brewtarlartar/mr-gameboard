-- Wizard conversation history for Mr. GameBoard / The Tome.
-- Run once in Supabase → SQL Editor → New query. Idempotent; safe to re-run.

---------------------------------------------------------------
-- Table
---------------------------------------------------------------

-- One row per wizard conversation (= one open/close cycle of the popup).
-- messages stores the full WizardMessage[] from lib/store/aiStore.ts.
create table if not exists public.wizard_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text,
  title text,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wizard_conversations_user_updated_idx
  on public.wizard_conversations (user_id, updated_at desc);

---------------------------------------------------------------
-- Row-Level Security
---------------------------------------------------------------

alter table public.wizard_conversations enable row level security;

drop policy if exists "own wizard conversations" on public.wizard_conversations;

create policy "own wizard conversations"
  on public.wizard_conversations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
