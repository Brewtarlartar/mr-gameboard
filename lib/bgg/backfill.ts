/**
 * Shared "fetch from BGG XML API + upsert into bgg_games_cache" helper.
 *
 * Used by:
 *   - GET /api/bgg/game/[id]   — backfills sparse/missing rows on detail-load
 *   - POST /api/bgg/add        — manual "Add by BGG link/ID" escape hatch
 *
 * Service-role Supabase client because RLS blocks anon writes to
 * bgg_games_cache (cache is global, only server can write).
 */

import { fetchBggThing, type BggCacheRow } from './api';
export type { BggCacheRow };

function getServiceClient() {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Upsert a row we already have (e.g. from a batch /thing fetch) into the
 * cache. Use this when the search route enriches BGG hits with thumbnails
 * via `fetchBggThingsBatch` and we don't want to refetch them one-by-one.
 */
export async function upsertBggRow(row: BggCacheRow): Promise<void> {
  const supabase = getServiceClient();
  if (!supabase) return;
  // Strip rulebook_url before upserting. A live BGG /thing fetch never carries a
  // rulebook URL (it's always null), so including it here would overwrite the
  // curated Phase B rulebook links on every public write path (add-by-link,
  // detail backfill, search enrichment). Leaving the column out preserves any
  // existing value on the row.
  const { rulebook_url: _omitRulebookUrl, ...writable } = row;
  const { error } = await supabase
    .from('bgg_games_cache')
    .upsert(writable, { onConflict: 'bgg_id' });
  if (error) console.warn(`[BGG backfill] upsert ${row.bgg_id}:`, error.message);
}

export async function backfillFromBgg(bggId: number): Promise<BggCacheRow | null> {
  const row = await fetchBggThing(bggId);
  if (!row) return null;
  await upsertBggRow(row);
  return row;
}
