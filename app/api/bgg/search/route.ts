import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { searchSeedGames } from '@/lib/games/seedFallback';
import { fetchBggSearch, hasBggToken } from '@/lib/bgg/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SearchHit {
  id: number;
  name: string;
  yearPublished?: number;
  thumbnail?: string;
  rating?: number;
  rank?: number;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

async function searchSupabase(query: string, limit = 25): Promise<SearchHit[] | null> {
  if (!supabase) return null;

  const cleaned = query
    .replace(/[®™©]/g, '')
    .replace(/:\s*/g, ' ')
    .trim();

  try {
    // Race the query against a short timeout — never block the user on a slow Supabase.
    const queryPromise = (async () => {
      // 1) Try the full-text search RPC for relevance ranking + ILIKE fallback.
      const rpc = await supabase!.rpc('search_bgg_games', {
        search_query: cleaned,
        result_limit: limit,
      });
      if (!rpc.error && Array.isArray(rpc.data) && rpc.data.length > 0) {
        return rpc.data as Array<{
          bgg_id: number;
          name: string;
          year_published: number | null;
          thumbnail: string | null;
          rating: number | null;
          rank: number | null;
        }>;
      }

      // 2) Plain ILIKE fallback — works even if the RPC is missing or tsquery dislikes the input.
      const ilike = await supabase!
        .from('bgg_games_cache')
        .select('bgg_id, name, year_published, thumbnail, rating, rank')
        .ilike('name', `%${cleaned}%`)
        .order('rank', { ascending: true, nullsFirst: false })
        .limit(limit);
      if (!ilike.error && Array.isArray(ilike.data)) return ilike.data;

      return [];
    })();

    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 4000),
    );
    const rows = await Promise.race([queryPromise, timeoutPromise]);
    if (!rows) return null;

    return (rows as Array<{
      bgg_id: number;
      name: string;
      year_published: number | null;
      thumbnail: string | null;
      rating: number | null;
      rank: number | null;
    }>).map((r) => ({
      id: r.bgg_id,
      name: r.name,
      yearPublished: r.year_published ?? undefined,
      thumbnail: r.thumbnail ?? undefined,
      rating: r.rating ?? undefined,
      rank: r.rank ?? undefined,
    }));
  } catch (err) {
    console.error('[BGG Search] Supabase query failed:', err);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ games: [] });
  }

  // Always have a local seed result ready as the ultimate fallback.
  const seedResults = searchSeedGames(query, 20);

  // Run cache + live BGG in parallel — cache returns fast, BGG fills gaps
  // (the user's shelf game might not be in the ~582-row cache but BGG
  // knows about it). Cache wins on duplicates because the row is already
  // validated locally.
  const [cacheHits, bggHits] = await Promise.all([
    searchSupabase(query, 25),
    hasBggToken() ? fetchBggSearch(query, { limit: 25 }) : Promise.resolve(null),
  ]);

  const seedMap = new Map(seedResults.map((s) => [s.id, s]));

  const merged: SearchHit[] = [];
  const seen = new Set<number>();

  // Cache hits first — they're already in the catalog.
  if (cacheHits) {
    for (const g of cacheHits) {
      if (seen.has(g.id)) continue;
      seen.add(g.id);
      if (!g.thumbnail) {
        const seed = seedMap.get(g.id);
        if (seed?.thumbnail) g.thumbnail = seed.thumbnail;
      }
      merged.push(g);
    }
  }

  // BGG-only hits next — these are the games we'd otherwise be missing.
  if (bggHits) {
    for (const h of bggHits) {
      if (seen.has(h.id)) continue;
      seen.add(h.id);
      const seed = seedMap.get(h.id);
      merged.push({ ...h, thumbnail: seed?.thumbnail });
    }
  }

  if (merged.length > 0) {
    let source: 'cache' | 'bgg' | 'mixed';
    if (cacheHits && cacheHits.length > 0 && bggHits && bggHits.length > 0) source = 'mixed';
    else if (cacheHits && cacheHits.length > 0) source = 'cache';
    else source = 'bgg';
    return NextResponse.json({ games: merged.slice(0, 25), source });
  }

  // Final fallback — bundled seed catalog.
  return NextResponse.json({
    games: seedResults,
    source: 'seed',
    ...(cacheHits === null ? { error: 'Cache unavailable' } : {}),
  });
}
