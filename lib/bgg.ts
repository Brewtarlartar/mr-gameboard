// BGG Library - Local Cache Only
// All queries go to the local Supabase cache, NO BGG API calls at runtime

import { createClient } from '@/lib/supabase/client';
import { GameSearchResult, GameDetail } from '@/types/game';
import { rulebookUrlWithFallback } from '@/lib/bgg/api';

// Create a server-side Supabase client for API routes
const getSupabaseClient = () => {
  if (typeof window === 'undefined') {
    // Server-side: use service role for full access
    const { createClient: createServerClient } = require('@supabase/supabase-js');
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
  }
  // Client-side: use browser client
  return createClient();
};

export interface CachedGame {
  bgg_id: number;
  name: string;
  description: string | null;
  image: string | null;
  thumbnail: string | null;
  min_players: number | null;
  max_players: number | null;
  playing_time: number | null;
  min_playing_time: number | null;
  max_playing_time: number | null;
  complexity: number | null;
  rating: number | null;
  year_published: number | null;
  rank: number | null;
  categories: string[];
  mechanics: string[];
  designers: string[];
  artists: string[];
  publishers: string[];
  rulebook_url: string | null;
  last_synced_at: string;
}

// Convert cached game to GameDetail format
function toGameDetail(cached: CachedGame): GameDetail {
  return {
    id: `bgg-${cached.bgg_id}`,
    bggId: cached.bgg_id,
    name: cached.name,
    description: cached.description || undefined,
    image: cached.image || undefined,
    thumbnail: cached.thumbnail || undefined,
    minPlayers: cached.min_players || undefined,
    maxPlayers: cached.max_players || undefined,
    playingTime: cached.playing_time || undefined,
    minPlayingTime: cached.min_playing_time || undefined,
    maxPlayingTime: cached.max_playing_time || undefined,
    complexity: cached.complexity || undefined,
    rating: cached.rating || undefined,
    yearPublished: cached.year_published || undefined,
    categories: cached.categories || [],
    mechanics: cached.mechanics || [],
    genres: cached.categories || [], // Alias for categories
    designers: cached.designers || [],
    artists: cached.artists || [],
    rulebookUrl: rulebookUrlWithFallback(cached.bgg_id, cached.name, cached.rulebook_url),
  };
}

// Convert cached game to GameSearchResult format
function toSearchResult(cached: CachedGame): GameSearchResult {
  return {
    id: cached.bgg_id,
    name: cached.name,
    yearPublished: cached.year_published || undefined,
    thumbnail: cached.thumbnail || undefined,
  };
}

/**
 * Search games in the local cache using PostgreSQL full-text search
 */
export async function searchGames(query: string): Promise<GameSearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const supabase = getSupabaseClient();
  
  try {
    // Use the custom search function we created in the migration
    const { data, error } = await supabase.rpc('search_bgg_games', {
      search_query: query.trim(),
      result_limit: 50
    });

    if (error) {
      console.error('Search error:', error);
      // Fallback to simple ILIKE search
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('bgg_games_cache')
        .select('bgg_id, name, year_published, rating, rank, thumbnail')
        .ilike('name', `%${query}%`)
        .order('rank', { ascending: true, nullsFirst: false })
        .limit(50);
      
      if (fallbackError) {
        console.error('Fallback search error:', fallbackError);
        return [];
      }
      
      return (fallbackData || []).map((game: CachedGame) => ({
        id: game.bgg_id,
        name: game.name,
        yearPublished: game.year_published,
        thumbnail: game.thumbnail,
      }));
    }

    return (data || []).map((game: any) => ({
      id: game.bgg_id,
      name: game.name,
      yearPublished: game.year_published,
      thumbnail: game.thumbnail,
      rating: game.rating,
      rank: game.rank,
    }));
  } catch (error) {
    console.error('Search games error:', error);
    return [];
  }
}

/**
 * Get game details from the local cache
 */
export async function getGameDetails(bggId: number): Promise<GameDetail | null> {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('bgg_games_cache')
      .select('*')
      .eq('bgg_id', bggId)
      .single();

    if (error || !data) {
      console.error('Get game details error:', error);
      return null;
    }

    return toGameDetail(data as CachedGame);
  } catch (error) {
    console.error('Get game details error:', error);
    return null;
  }
}

/**
 * Get multiple games by their BGG IDs
 */
export async function getGamesByIds(bggIds: number[]): Promise<GameDetail[]> {
  if (bggIds.length === 0) return [];
  
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('bgg_games_cache')
      .select('*')
      .in('bgg_id', bggIds);

    if (error) {
      console.error('Get games by IDs error:', error);
      return [];
    }

    return (data || []).map((game: CachedGame) => toGameDetail(game));
  } catch (error) {
    console.error('Get games by IDs error:', error);
    return [];
  }
}

/**
 * Get top-rated games from the cache
 */
export async function getTopGames(limit: number = 100): Promise<GameDetail[]> {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('bgg_games_cache')
      .select('*')
      .not('rank', 'is', null)
      .order('rank', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Get top games error:', error);
      return [];
    }

    return (data || []).map((game: CachedGame) => toGameDetail(game));
  } catch (error) {
    console.error('Get top games error:', error);
    return [];
  }
}

/**
 * Get games suitable for a specific player count
 */
export async function getGamesByPlayerCount(
  playerCount: number, 
  limit: number = 20
): Promise<GameDetail[]> {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase.rpc('get_games_by_player_count', {
      player_count: playerCount,
      result_limit: limit
    });

    if (error) {
      console.error('Get games by player count error:', error);
      return [];
    }

    return (data || []).map((game: CachedGame) => toGameDetail(game));
  } catch (error) {
    console.error('Get games by player count error:', error);
    return [];
  }
}

/**
 * Get games by category
 */
export async function getGamesByCategory(
  category: string, 
  limit: number = 50
): Promise<GameDetail[]> {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('bgg_games_cache')
      .select('*')
      .contains('categories', [category])
      .order('rating', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      console.error('Get games by category error:', error);
      return [];
    }

    return (data || []).map((game: CachedGame) => toGameDetail(game));
  } catch (error) {
    console.error('Get games by category error:', error);
    return [];
  }
}

/**
 * Get games by mechanic
 */
export async function getGamesByMechanic(
  mechanic: string, 
  limit: number = 50
): Promise<GameDetail[]> {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('bgg_games_cache')
      .select('*')
      .contains('mechanics', [mechanic])
      .order('rating', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      console.error('Get games by mechanic error:', error);
      return [];
    }

    return (data || []).map((game: CachedGame) => toGameDetail(game));
  } catch (error) {
    console.error('Get games by mechanic error:', error);
    return [];
  }
}

/**
 * Get games by complexity range
 */
export async function getGamesByComplexity(
  minComplexity: number,
  maxComplexity: number,
  limit: number = 50
): Promise<GameDetail[]> {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('bgg_games_cache')
      .select('*')
      .gte('complexity', minComplexity)
      .lte('complexity', maxComplexity)
      .order('rating', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      console.error('Get games by complexity error:', error);
      return [];
    }

    return (data || []).map((game: CachedGame) => toGameDetail(game));
  } catch (error) {
    console.error('Get games by complexity error:', error);
    return [];
  }
}

/**
 * Get all unique categories in the cache
 */
export async function getAllCategories(): Promise<string[]> {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('bgg_games_cache')
      .select('categories')
      .not('categories', 'eq', '[]')
      .limit(5000);

    if (error) {
      console.error('Get categories error:', error);
      return [];
    }

    const categorySet = new Set<string>();
    for (const row of data || []) {
      for (const cat of row.categories || []) {
        categorySet.add(cat);
      }
    }
    
    return Array.from(categorySet).sort();
  } catch (error) {
    console.error('Get categories error:', error);
    return [];
  }
}

/**
 * Get all unique mechanics in the cache
 */
export async function getAllMechanics(): Promise<string[]> {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('bgg_games_cache')
      .select('mechanics')
      .not('mechanics', 'eq', '[]')
      .limit(5000);

    if (error) {
      console.error('Get mechanics error:', error);
      return [];
    }

    const mechanicSet = new Set<string>();
    for (const row of data || []) {
      for (const mech of row.mechanics || []) {
        mechanicSet.add(mech);
      }
    }
    
    return Array.from(mechanicSet).sort();
  } catch (error) {
    console.error('Get mechanics error:', error);
    return [];
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalGames: number;
  lastSync: string | null;
  oldestGame: string | null;
  newestGame: string | null;
}> {
  const supabase = getSupabaseClient();
  
  try {
    const { count } = await supabase
      .from('bgg_games_cache')
      .select('*', { count: 'exact', head: true });

    const { data: syncLog } = await supabase
      .from('bgg_sync_log')
      .select('completed_at')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    return {
      totalGames: count || 0,
      lastSync: syncLog?.completed_at || null,
      oldestGame: null,
      newestGame: null,
    };
  } catch (error) {
    console.error('Get cache stats error:', error);
    return {
      totalGames: 0,
      lastSync: null,
      oldestGame: null,
      newestGame: null,
    };
  }
}

/**
 * Get rules/files page URL for a game
 */
export async function getRulesPDF(bggId: number): Promise<string | null> {
  return `https://boardgamegeek.com/boardgame/${bggId}/files`;
}
