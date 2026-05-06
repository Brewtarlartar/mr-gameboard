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

export async function backfillFromBgg(bggId: number): Promise<BggCacheRow | null> {
  const row = await fetchBggThing(bggId);
  if (!row) return null;

  const supabase = getServiceClient();
  if (supabase) {
    const { error } = await supabase
      .from('bgg_games_cache')
      .upsert(row, { onConflict: 'bgg_id' });
    if (error) console.warn(`[BGG backfill] upsert ${bggId}:`, error.message);
  }
  return row;
}
