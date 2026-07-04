import { NextRequest, NextResponse } from 'next/server';
import { getGameDetails } from '@/lib/bgg';
import { fetchBggThing } from '@/lib/bgg/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CachePayload {
  bggId?: number;
  // NOTE: a `game` field may still be sent by older clients, but its contents
  // are deliberately IGNORED. This endpoint is public and writes to the global
  // catalog with the service-role key, so it must never trust client-supplied
  // game data (that path allowed anyone to overwrite any game's name/description/
  // images for all users and inject prompt-injection text into every AI answer).
  // We only accept the bggId and fetch the authoritative record from BGG ourselves.
  game?: { bggId?: number };
}

function getServiceClient() {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Warm bgg_games_cache for a single game. The only trusted input is the BGG id;
 * the authoritative record is always fetched server-side from BGG. If the row is
 * already rich, this is a no-op.
 */
export async function POST(req: NextRequest) {
  let body: CachePayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const bggId = Number(body.bggId ?? body.game?.bggId);
  if (!bggId || !Number.isFinite(bggId) || bggId <= 0) {
    return NextResponse.json({ error: 'bggId required' }, { status: 400 });
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    // If we already hold a rich record, don't touch it or hit BGG again.
    const cached = await getGameDetails(bggId);
    const cachedIsRich =
      cached && cached.description && cached.description.length > 200 && cached.image;
    if (cachedIsRich) {
      return NextResponse.json({ ok: true, source: 'cache-hit' });
    }

    // Fetch the authoritative record ourselves — never trust the client payload.
    const payload = await fetchBggThing(bggId);
    if (!payload) {
      return NextResponse.json(
        { ok: false, error: 'Unable to fetch from BGG (token may be missing or BGG unreachable)' },
        { status: 502 },
      );
    }

    // Never write a null rulebook_url over a curated value (Phase B data).
    const { rulebook_url: _drop, ...row } = payload;
    const { error } = await supabase
      .from('bgg_games_cache')
      .upsert(row, { onConflict: 'bgg_id' });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, source: 'bgg-live' });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

