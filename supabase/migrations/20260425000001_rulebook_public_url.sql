-- Phase B+: rulebook button now opens real PDFs.
-- Two new columns + a private Storage bucket for re-hosted local PDFs.
-- Run once in Supabase → SQL Editor → New query. Idempotent; safe to re-run.

alter table public.bgg_games_cache
  add column if not exists rulebook_public_url   text,
  add column if not exists rulebook_storage_path text;

-- Private bucket. We never expose it directly; the /api/rulebook/[bggId]
-- route generates short-lived signed URLs (1 hour) on each click,
-- which keeps re-hosted publisher PDFs in personal-use territory.
insert into storage.buckets (id, name, public)
  values ('rulebooks', 'rulebooks', false)
  on conflict (id) do nothing;
