/**
 * Library Agent - Research Agent Integration
 * Syncs trending data with library
 */

import { Game } from '@/types/game';
import { TrendingGame, TrendingData } from '../research/service';
import { getTrendingData } from '../research/scheduler';

/**
 * Check if a game is trending
 */
export function isGameTrending(gameId: string, trendingData?: TrendingData): boolean {
  if (!trendingData) return false;
  
  const id = parseInt(gameId);
  return trendingData.hot.some(g => g.id === id) || 
         trendingData.trending.some(g => g.id === id);
}

/**
 * Check if a game is new
 */
export function isGameNew(gameId: string, trendingData?: TrendingData): boolean {
  if (!trendingData) return false;
  
  const id = parseInt(gameId);
  return trendingData.new.some(g => g.id === id);
}

/**
 * Get trending rank for a game
 */
export function getTrendingRank(gameId: string, trendingData?: TrendingData): number | null {
  if (!trendingData) return null;
  
  const id = parseInt(gameId);
  const hotGame = trendingData.hot.find(g => g.id === id);
  if (hotGame) return hotGame.rank;
  
  const trendingGame = trendingData.trending.find(g => g.id === id);
  if (trendingGame) return trendingGame.rank;
  
  return null;
}

/**
 * Enrich games with trending metadata
 */
export function enrichGamesWithTrending(
  games: Game[],
  trendingData?: TrendingData
): (Game & { isTrending?: boolean; isNew?: boolean; trendingRank?: number })[] {
  if (!trendingData) return games;
  
  return games.map(game => ({
    ...game,
    isTrending: isGameTrending(game.id, trendingData),
    isNew: isGameNew(game.id, trendingData),
    trendingRank: getTrendingRank(game.id, trendingData) || undefined,
  }));
}

/**
 * Get suggested games from trending data
 */
export function getSuggestedTrendingGames(
  currentLibrary: Game[],
  trendingData?: TrendingData
): TrendingGame[] {
  if (!trendingData) return [];
  
  // Get trending games not in library
  const libraryIds = new Set(currentLibrary.map(g => parseInt(g.id)));
  
  const suggestions = [
    ...trendingData.hot,
    ...trendingData.new,
  ].filter(g => !libraryIds.has(g.id));
  
  // Remove duplicates
  const unique = Array.from(
    new Map(suggestions.map(g => [g.id, g])).values()
  );
  
  // Sort by rank
  return unique.sort((a, b) => a.rank - b.rank).slice(0, 20);
}

/**
 * Initialize library with trending data
 */
export async function initializeLibraryWithTrending(): Promise<TrendingData | null> {
  try {
    const trendingData = await getTrendingData();
    if (trendingData) {
      console.log('[Library Agent] Loaded trending data:', {
        hot: trendingData.hot.length,
        new: trendingData.new.length,
        trending: trendingData.trending.length,
      });
    }
    return trendingData;
  } catch (error) {
    console.error('[Library Agent] Failed to load trending data:', error);
    return null;
  }
}

/**
 * Listen for trending updates
 */
export function subscribeTrendingUpdates(
  callback: (data: TrendingData) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<TrendingData>;
    callback(customEvent.detail);
  };
  
  window.addEventListener('trending-updated', handler as EventListener);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('trending-updated', handler as EventListener);
  };
}
