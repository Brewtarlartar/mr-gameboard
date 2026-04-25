import { NextRequest, NextResponse } from 'next/server';
import { fetchBggThingsBatch, hasBggToken } from '@/lib/bgg/api';

// BGG's XML API works without a token (commercial approval may or may not
// issue one). The cron runs either way; we log which mode we're in so the
// sync log makes it obvious if anonymous requests are getting blocked.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Daily refresh: walks the N games with the oldest last_synced_at and
// re-fetches their BGG data. Rulebook URLs are left alone — they rarely
// change and the full re-population lives in scripts/sync-bgg-cache.js.
//
// Auth: Vercel Cron sends the configured CRON_SECRET as a Bearer token.
// Manual hits also work with the same header.

const BATCH_SIZE = 20;
const THROTTLE_MS = 1100;
const DEFAULT_REFRESH_COUNT = 500;

function getServiceClient() {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get('authorization') || '';
  return header === `Bearer ${secret}`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const authMode = hasBggToken() ? 'token' : 'anonymous';

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase service client not configured' },
      { status: 500 },
    );
  }

  const url = new URL(req.url);
  const limit = Math.min(
    Math.max(parseInt(url.searchParams.get('limit') || '', 10) || DEFAULT_REFRESH_COUNT, 1),
    2000,
  );

  const { data: syncLog } = await supabase
    .from('bgg_sync_log')
    .insert({ status: 'running', details: { source: 'cron', limit, authMode } })
    .select()
    .single();
  const syncId = syncLog?.id;

  const { data: staleRows, error: pickError } = await supabase
    .from('bgg_games_cache')
    .select('bgg_id')
    .order('last_synced_at', { ascending: true, nullsFirst: true })
    .limit(limit);

  if (pickError || !staleRows?.length) {
    if (syncId) {
      await supabase
        .from('bgg_sync_log')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: pickError?.message || 'No rows to refresh',
        })
        .eq('id', syncId);
    }
    return NextResponse.json(
      { error: pickError?.message || 'No rows to refresh' },
      { status: 500 },
    );
  }

  const ids: number[] = staleRows.map((r: { bgg_id: number }) => r.bgg_id);
  let synced = 0;
  let failed = 0;

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    const rows = await fetchBggThingsBatch(batch);
    const returnedIds = new Set(rows.map((r) => r.bgg_id));
    failed += batch.filter((id) => !returnedIds.has(id)).length;

    if (rows.length > 0) {
      // Strip rulebook_url and the Phase B rulebook_* / anthropic_file_id
      // columns so the daily cron doesn't clobber them with null. The bulk
      // sync script and the upload-rulebook admin endpoints are the
      // authorities on these columns.
      const stripped = rows.map(({ rulebook_url: _rulebook, ...rest }) => rest);
      const { error } = await supabase
        .from('bgg_games_cache')
        .upsert(stripped, { onConflict: 'bgg_id' });
      if (error) {
        failed += rows.length;
      } else {
        synced += rows.length;
      }
    }
    await sleep(THROTTLE_MS);
  }

  if (syncId) {
    await supabase
      .from('bgg_sync_log')
      .update({
        status: failed > 0 ? 'partial' : 'completed',
        completed_at: new Date().toISOString(),
        games_synced: synced,
        games_failed: failed,
      })
      .eq('id', syncId);
  }

  return NextResponse.json({ ok: true, synced, failed, limit, authMode });
}
