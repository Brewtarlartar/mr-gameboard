-- Fix live-DB drift flagged by Supabase security advisor (2026-07-06):
-- RLS had been disabled on the BGG cache tables and the original
-- service-role-only policies replaced with permissive USING(true) ones,
-- leaving both tables writable by anyone with the anon key.
-- Applied to production 2026-07-07. Idempotent on fresh databases.

DROP POLICY IF EXISTS "Enable all for service role" ON public.bgg_games_cache;
DROP POLICY IF EXISTS "Enable all for service role on logs" ON public.bgg_sync_log;

ALTER TABLE public.bgg_games_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bgg_sync_log ENABLE ROW LEVEL SECURITY;

-- Note: no write policies are recreated on purpose. The service role
-- bypasses RLS, so server-side sync/enrichment keeps working; anon and
-- authenticated clients keep read access to bgg_games_cache via the
-- existing "Anyone can read bgg cache" SELECT policy and no access to
-- bgg_sync_log.
