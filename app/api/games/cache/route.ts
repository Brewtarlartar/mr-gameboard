import { NextRequest, NextResponse } from 'next/server';
import { getGameDetails } from '@/lib/bgg';
import { fetchBggThing } from '@/lib/bgg/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CachePayload {
  bggId?: number;
  game?: {
    bggId?: number;
    name?: string;
    description?: string;
    image?: string;
    thumbnail?: string;
    minPlayers?: number;
    maxPlayers?: number;
    playingTime?: number;
    minPlayingTime?: number;
    maxPlayingTime?: number;
    complexity?: number;
    rating?: number;
    yearPublished?: number;
    rank?: number;
    categories?: string[];
    genres?: string[];
    mechanics?: string[];
    designers?: string[];
    artists?: string[];
    publishers?: string[];
  };
}

function getServiceClient() {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Upsert a game into bgg_games_cache so it lives on our server.
 * If the payload is sparse, fall back to BGG live fetch and store the result.
 */
export async function POST(req: NextRequest) {
  let body: CachePayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const bggId = body.bggId ?? body.game?.bggId;
  if (!bggId || !Number.isFinite(bggId)) {
    return NextResponse.json({ error: 'bggId required' }, { status: 400 });
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const { data: existing } = await supabase
      .from('bgg_games_cache')
      .select('bgg_id, description, image')
      .eq('bgg_id', bggId)
      .maybeSingle();

    const incoming = body.game || {};

    const incomingHasGoodData =
      incoming.name &&
      incoming.description &&
      incoming.description.length > 200 &&
      (incoming.image || incoming.thumbnail);

    const existingHasGoodData =
      existing && existing.description && existing.description.length > 200 && existing.image;

    if (existingHasGoodData && !incomingHasGoodData) {
      return NextResponse.json({ ok: true, source: 'already-cached' });
    }

    let payload: any = null;

    if (incomingHasGoodData) {
      payload = {
        bgg_id: bggId,
        name: incoming.name,
        description: incoming.description,
        image: incoming.image ?? null,
        thumbnail: incoming.thumbnail ?? null,
        min_players: incoming.minPlayers ?? null,
        max_players: incoming.maxPlayers ?? null,
        playing_time: incoming.playingTime ?? null,
        min_playing_time: incoming.minPlayingTime ?? null,
        max_playing_time: incoming.maxPlayingTime ?? null,
        complexity: incoming.complexity ?? null,
        rating: incoming.rating ?? null,
        year_published: incoming.yearPublished ?? null,
        rank: incoming.rank ?? null,
        categories: incoming.categories ?? incoming.genres ?? [],
        mechanics: incoming.mechanics ?? [],
        designers: incoming.designers ?? [],
        artists: incoming.artists ?? [],
        publishers: incoming.publishers ?? [],
        last_synced_at: new Date().toISOString(),
      };
    } else {
      // Sparse client payload — only refetch from BGG if the cache row is also sparse.
      const cached = await getGameDetails(bggId);
      const cachedIsRich =
        cached && cached.description && cached.description.length > 200 && cached.image;
      if (cachedIsRich) {
        return NextResponse.json({ ok: true, source: 'cache-hit' });
      }

      payload = await fetchBggThing(bggId);
      if (!payload) {
        return NextResponse.json(
          { ok: false, error: 'Unable to fetch from BGG (token may be missing or BGG unreachable)' },
          { status: 502 },
        );
      }
    }

    const { error } = await supabase
      .from('bgg_games_cache')
      .upsert(payload, { onConflict: 'bgg_id' });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, source: incomingHasGoodData ? 'client-payload' : 'bgg-live' });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

