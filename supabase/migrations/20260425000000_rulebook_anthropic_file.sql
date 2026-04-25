-- Phase B: rulebook PDFs for the wizard, uploaded to Anthropic Files API.
-- Run once in Supabase → SQL Editor → New query. Idempotent; safe to re-run.

alter table public.bgg_games_cache
  add column if not exists anthropic_file_id     text,
  add column if not exists rulebook_uploaded_at  timestamptz,
  add column if not exists rulebook_pdf_bytes    integer,
  add column if not exists rulebook_source_url   text,
  add column if not exists rulebook_upload_error text;

create index if not exists bgg_games_cache_anthropic_file_id_idx
  on public.bgg_games_cache (anthropic_file_id)
  where anthropic_file_id is not null;
