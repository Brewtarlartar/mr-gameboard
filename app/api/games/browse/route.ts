import { NextRequest, NextResponse } from 'next/server';
import { GameDetail } from '@/types/game';
import { buildSeedBrowseSections } from '@/lib/games/seedFallback';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getSupabase() {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key);
}

function seedFallbackResponse(reason: string) {
  const sections = buildSeedBrowseSections(16);
  return NextResponse.json({ ok: true, source: 'seed', reason, sections });
}

function rowToGame(r: any): GameDetail {
  return {
    id: `bgg-${r.bgg_id}`,
    bggId: r.bgg_id,
    name: r.name,
    description: r.description || undefined,
    image: r.image || undefined,
    thumbnail: r.thumbnail || undefined,
    minPlayers: r.min_players ?? undefined,
    maxPlayers: r.max_players ?? undefined,
    playingTime: r.playing_time ?? undefined,
    minPlayingTime: r.min_playing_time ?? undefined,
    maxPlayingTime: r.max_playing_time ?? undefined,
    complexity: r.complexity ?? undefined,
    rating: r.rating ?? undefined,
    yearPublished: r.year_published ?? undefined,
    rank: r.rank ?? undefined,
    categories: r.categories || [],
    mechanics: r.mechanics || [],
    genres: r.categories || [],
    designers: r.designers || [],
    artists: r.artists || [],
  };
}

interface Section {
  id: string;
  title: string;
  description: string;
  games: GameDetail[];
}

export async function GET(_req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return seedFallbackResponse('supabase-not-configured');
  }

  try {
    const limit = 16;

    const probe = await Promise.race([
      supabase
        .from('bgg_games_cache')
        .select('bgg_id', { count: 'exact', head: true }),
      new Promise((resolve) =>
        setTimeout(() => resolve({ data: null, error: { message: 'timeout' }, count: null }), 4000),
      ),
    ]);

    const probeCount = (probe as any)?.count;
    if (
      (probe as any)?.error ||
      typeof probeCount !== 'number' ||
      probeCount < 20
    ) {
      return seedFallbackResponse(
        (probe as any)?.error ? `cache-error:${(probe as any).error.message}` : `cache-thin:${probeCount ?? 'n/a'}`,
      );
    }

    // NOTE: The BGG seed loader captured "categories" but not BGG's
    // "subdomain" labels, so "Family Game" / "Strategy Game" don't appear.
    // These queries use real category labels and weight/playtime proxies.
    const queries = await Promise.all([
      // Top rated by rank
      supabase
        .from('bgg_games_cache')
        .select('*')
        .not('rank', 'is', null)
        .order('rank', { ascending: true })
        .limit(limit),
      // Family / approachable: light weight, well-rated, ~hour or less
      supabase
        .from('bgg_games_cache')
        .select('*')
        .lt('complexity', 2.4)
        .gt('rating', 6.8)
        .lte('playing_time', 75)
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(limit),
      // Strategy / brain-burner: medium-heavy weight + strong rating
      supabase
        .from('bgg_games_cache')
        .select('*')
        .gte('complexity', 2.8)
        .lt('complexity', 4.0)
        .gt('rating', 7.5)
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(limit),
      // Party — categories is jsonb, so use JSON-literal syntax
      supabase
        .from('bgg_games_cache')
        .select('*')
        .filter('categories', 'cs', JSON.stringify(['Party Game']))
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(limit),
      // Quick: <= 30 minutes
      supabase
        .from('bgg_games_cache')
        .select('*')
        .lte('playing_time', 30)
        .gt('rating', 7.0)
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(limit),
      // Two-player only
      supabase
        .from('bgg_games_cache')
        .select('*')
        .eq('max_players', 2)
        .gt('rating', 7.5)
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(limit),
      // Heaviest tomes
      supabase
        .from('bgg_games_cache')
        .select('*')
        .gte('complexity', 3.5)
        .gt('rating', 7.5)
        .order('complexity', { ascending: false, nullsFirst: false })
        .limit(limit),
      // Cooperative — mechanic in jsonb column
      supabase
        .from('bgg_games_cache')
        .select('*')
        .filter('mechanics', 'cs', JSON.stringify(['Cooperative Game']))
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(limit),
    ]);

    const [topRated, family, strategy, party, quick, twoPlayer, heavy, coop] = queries;

    const sections: Section[] = [
      {
        id: 'top-rated',
        title: 'The Hall of Legends',
        description: 'The highest-ranked games on BoardGameGeek',
        games: (topRated.data || []).map(rowToGame),
      },
      {
        id: 'family',
        title: 'For the Whole Table',
        description: 'Family-friendly tomes everyone can join',
        games: (family.data || []).map(rowToGame),
      },
      {
        id: 'strategy',
        title: 'Strategist\u2019s Shelf',
        description: 'Deep, decision-rich tomes',
        games: (strategy.data || []).map(rowToGame),
      },
      {
        id: 'party',
        title: 'The Tavern',
        description: 'Loud, fast, full of laughter',
        games: (party.data || []).map(rowToGame),
      },
      {
        id: 'quick',
        title: 'Under Half an Hour',
        description: 'Quick tomes for short evenings',
        games: (quick.data || []).map(rowToGame),
      },
      {
        id: 'two-player',
        title: 'Duels for Two',
        description: 'Built for head-to-head play',
        games: (twoPlayer.data || []).map(rowToGame),
      },
      {
        id: 'heavy',
        title: 'Tomes of Great Weight',
        description: 'For seasoned strategists only',
        games: (heavy.data || []).map(rowToGame),
      },
      {
        id: 'coop',
        title: 'Stand Together',
        description: 'Cooperative tomes against the table',
        games: (coop.data || []).map(rowToGame),
      },
    ].filter((s) => s.games.length > 0);

    if (sections.length === 0) {
      return seedFallbackResponse('cache-empty');
    }

    return NextResponse.json({ ok: true, source: 'cache', sections });
  } catch (err) {
    return seedFallbackResponse(`exception:${err instanceof Error ? err.message : 'unknown'}`);
  }
}
