-- Add rulebook_url to bgg_games_cache so the Game Detail UI can link
-- directly to a rulebook PDF instead of the BGG files landing page.
-- Populated by scripts/sync-bgg-ranked.js and the daily /api/admin/sync-bgg
-- cron. Null is fine — callers fall back to the BGG files page, then a
-- web-search URL, so the button is always useful.

ALTER TABLE bgg_games_cache
  ADD COLUMN IF NOT EXISTS rulebook_url TEXT;
