import { NextRequest, NextResponse } from 'next/server';
import { getGameDetails } from '@/lib/bgg';
import { fetchBggThing, hasBggToken, type BggCacheRow } from '@/lib/bgg/api';
import { GameDetail } from '@/types/game';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getServiceClient() {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';
  if (!url || !key) return null;
  return createClient(url, key);
}

/** A cached row is "rich" if it has both a real description and an image. */
function isRich(d: GameDetail | null): boolean {
  if (!d) return false;
  return Boolean(d.description && d.description.length > 200 && (d.image || d.thumbnail));
}

function rowToDetail(row: BggCacheRow): GameDetail {
  return {
    id: `bgg-${row.bgg_id}`,
    bggId: row.bgg_id,
    name: row.name,
    description: row.description || undefined,
    image: row.image || undefined,
    thumbnail: row.thumbnail || undefined,
    minPlayers: row.min_players ?? undefined,
    maxPlayers: row.max_players ?? undefined,
    playingTime: row.playing_time ?? undefined,
    minPlayingTime: row.min_playing_time ?? undefined,
    maxPlayingTime: row.max_playing_time ?? undefined,
    complexity: row.complexity ?? undefined,
    rating: row.rating ?? undefined,
    yearPublished: row.year_published ?? undefined,
    categories: row.categories || [],
    mechanics: row.mechanics || [],
    genres: row.categories || [],
    designers: row.designers || [],
    artists: row.artists || [],
    rulebookUrl: `https://boardgamegeek.com/boardgame/${row.bgg_id}/files`,
  };
}

async function backfillFromBgg(bggId: number): Promise<BggCacheRow | null> {
  const row = await fetchBggThing(bggId);
  if (!row) return null;

  const supabase = getServiceClient();
  if (supabase) {
    const { error } = await supabase
      .from('bgg_games_cache')
      .upsert(row, { onConflict: 'bgg_id' });
    if (error) console.warn('[BGG backfill] upsert error:', error.message);
  }
  return row;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const gameId = params.id;
  if (!gameId) {
    return NextResponse.json({ error: 'Game ID required' }, { status: 400 });
  }
  const bggId = parseInt(gameId, 10);
  if (!Number.isFinite(bggId) || bggId <= 0) {
    return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 });
  }

  try {
    const cached = await getGameDetails(bggId);

    // Fast path: rich cached row, return it directly.
    if (isRich(cached)) {
      return NextResponse.json({ game: cached, source: 'cache' });
    }

    // Sparse or missing — try to enrich from BGG (uses BGG_API_TOKEN if set).
    const fresh = await backfillFromBgg(bggId);
    if (fresh) {
      return NextResponse.json({
        game: rowToDetail(fresh),
        source: cached ? 'cache+backfill' : 'bgg',
      });
    }

    // BGG unreachable. Return the sparse cached row (if any) so the UI still works.
    if (cached) {
      return NextResponse.json({
        game: cached,
        source: 'cache-sparse',
        warning: hasBggToken()
          ? 'BGG enrichment failed; showing partial cached data.'
          : 'No BGG_API_TOKEN set; showing partial cached data. Add BGG_API_TOKEN to .env.local to backfill rich details.',
      });
    }

    return NextResponse.json(
      {
        error: 'Game not found',
        suggestion: hasBggToken()
          ? 'BGG returned no data for this ID.'
          : 'No BGG_API_TOKEN set; cannot fetch new games. Add BGG_API_TOKEN to .env.local.',
      },
      { status: 404 },
    );
  } catch (err) {
    console.error(`[BGG API] game ${bggId} failed:`, err);
    return NextResponse.json(
      {
        error: 'Failed to fetch game.',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
