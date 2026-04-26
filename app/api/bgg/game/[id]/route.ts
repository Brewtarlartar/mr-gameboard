import { NextRequest, NextResponse } from 'next/server';
import { getGameDetails } from '@/lib/bgg';
import {
  fetchBggThing,
  hasBggToken,
  type BggCacheRow,
} from '@/lib/bgg/api';
import { getStapleGames } from '@/lib/games/staples';
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

/**
 * Look up a curated staple by BGG id. Staples have known-good
 * cf.geekdo-images.com URLs that are kept fresh in source, so we use them
 * to patch over stale or missing image data in the Supabase cache.
 */
function findStaple(bggId: number): GameDetail | undefined {
  return getStapleGames().find((g) => g.bggId === bggId) as GameDetail | undefined;
}

/**
 * Merge a staple's known-good image/thumbnail (and any other fields it has
 * that the cached row is missing) onto the cached detail. The staple wins
 * for image fields because the Supabase cache has historically held stale
 * geekdo URLs that 404. Description/mechanics from cache still win.
 */
function applyStapleOverlay(detail: GameDetail): GameDetail {
  if (!detail.bggId) return detail;
  const staple = findStaple(detail.bggId);
  if (!staple) return detail;

  return {
    ...detail,
    image: staple.image || detail.image,
    thumbnail: staple.thumbnail || detail.thumbnail,
    description: detail.description || staple.description,
    minPlayers: detail.minPlayers ?? staple.minPlayers,
    maxPlayers: detail.maxPlayers ?? staple.maxPlayers,
    playingTime: detail.playingTime ?? staple.playingTime,
    yearPublished: detail.yearPublished ?? staple.yearPublished,
    rating: detail.rating ?? staple.rating,
    categories:
      detail.categories && detail.categories.length > 0 ? detail.categories : staple.categories,
    genres: detail.genres && detail.genres.length > 0 ? detail.genres : staple.genres,
  };
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
    rulebookUrl: `/api/rulebook/${row.bgg_id}`,
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

    // Fast path: rich cached row, return it directly (with staple overlay so
    // any stale geekdo image URLs get replaced by curated current ones).
    if (isRich(cached)) {
      return NextResponse.json({ game: applyStapleOverlay(cached!), source: 'cache' });
    }

    // Sparse or missing — try to enrich from BGG (uses BGG_API_TOKEN if set).
    const fresh = await backfillFromBgg(bggId);
    if (fresh) {
      return NextResponse.json({
        game: applyStapleOverlay(rowToDetail(fresh)),
        source: cached ? 'cache+backfill' : 'bgg',
      });
    }

    // BGG unreachable. Return the sparse cached row (if any) so the UI still works.
    if (cached) {
      return NextResponse.json({
        game: applyStapleOverlay(cached),
        source: 'cache-sparse',
        warning: hasBggToken()
          ? 'BGG enrichment failed; showing partial cached data.'
          : 'No BGG_API_TOKEN set; showing partial cached data. Add BGG_API_TOKEN to .env.local to backfill rich details.',
      });
    }

    // Nothing in cache and BGG unreachable — fall back to a curated staple
    // record if we have one. Catan, Monopoly, UNO, etc. all live here so the
    // app never returns a 404 for ubiquitous classics.
    const staple = findStaple(bggId);
    if (staple) {
      return NextResponse.json({ game: staple, source: 'staple' });
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
