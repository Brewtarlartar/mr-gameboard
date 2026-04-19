/**
 * Library Agent - Netflix-Style Categorization
 * Smart categorization logic for game library
 */

import { Game } from '@/types/game';
import { TrendingGame } from '../research/service';

export interface GameCategory {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  games: Game[];
  priority: number; // Higher = shown first
}

/**
 * Generate all categories from game library
 */
export function generateCategories(
  games: Game[],
  favorites: string[],
  trendingData?: {
    hot: TrendingGame[];
    new: TrendingGame[];
  }
): GameCategory[] {
  const categories: GameCategory[] = [];

  // 1. Favorites (if any)
  const favoriteGames = games.filter(g => favorites.includes(g.id));
  if (favoriteGames.length > 0) {
    categories.push({
      id: 'favorites',
      title: '❤️ My Favorites',
      description: 'Your most loved games',
      games: favoriteGames,
      priority: 100,
    });
  }

  // 2. Trending Now (from Research Agent)
  if (trendingData?.hot) {
    const trendingIds = new Set(trendingData.hot.map(g => g.id.toString()));
    const trendingGames = games.filter(g => trendingIds.has(g.id));
    if (trendingGames.length > 0) {
      categories.push({
        id: 'trending',
        title: '🔥 Trending Now',
        description: 'Hot games on BoardGameGeek',
        games: trendingGames,
        priority: 95,
      });
    }
  }

  // 3. New Releases (from Research Agent)
  if (trendingData?.new) {
    const newIds = new Set(trendingData.new.map(g => g.id.toString()));
    const newGames = games.filter(g => newIds.has(g.id));
    if (newGames.length > 0) {
      categories.push({
        id: 'new-releases',
        title: '✨ New Releases',
        description: 'Recently published games in your collection',
        games: newGames,
        priority: 90,
      });
    }
  }

  // 4. Recently Added
  const recentlyAdded = [...games].slice(-8).reverse();
  if (recentlyAdded.length > 0) {
    categories.push({
      id: 'recent',
      title: '📥 Recently Added',
      description: 'Your latest additions',
      games: recentlyAdded,
      priority: 85,
    });
  }

  // 5. Quick Games (< 30 min)
  const quickGames = games.filter(g => g.playingTime && g.playingTime <= 30);
  if (quickGames.length > 0) {
    categories.push({
      id: 'quick',
      title: '⚡ Quick Games for Tonight',
      description: 'Under 30 minutes',
      games: quickGames,
      priority: 80,
    });
  }

  // 6. Short Games (30-60 min)
  const shortGames = games.filter(g => g.playingTime && g.playingTime > 30 && g.playingTime < 60);
  if (shortGames.length > 0) {
    categories.push({
      id: 'short',
      title: '⏱️ Short Sessions',
      description: '30-60 minutes',
      games: shortGames,
      priority: 75,
    });
  }

  // 7. Perfect for 2 Players
  const twoPlayerGames = games.filter(g => 
    (g.minPlayers === 2 && g.maxPlayers === 2) || 
    (g.minPlayers && g.minPlayers <= 2 && g.maxPlayers && g.maxPlayers >= 2)
  );
  if (twoPlayerGames.length > 0) {
    categories.push({
      id: 'two-player',
      title: '👥 Perfect for 2 Players',
      description: 'Great dueling games',
      games: twoPlayerGames,
      priority: 70,
    });
  }

  // 8. Party Games (4+ players)
  const partyGames = games.filter(g => g.maxPlayers && g.maxPlayers >= 6);
  if (partyGames.length > 0) {
    categories.push({
      id: 'party',
      title: '🎉 Party Games',
      description: '6+ players',
      games: partyGames,
      priority: 65,
    });
  }

  // 9. Strategy Games
  const strategyGames = games.filter(g => 
    g.genres?.some(genre => 
      genre.toLowerCase().includes('strategy') || 
      genre.toLowerCase().includes('war')
    ) || (g.complexity && g.complexity > 2.5)
  );
  if (strategyGames.length > 0) {
    categories.push({
      id: 'strategy',
      title: '🎯 Strategy Games',
      description: 'Tactical depth and complex decisions',
      games: strategyGames,
      priority: 60,
    });
  }

  // 10. Heavy Games (Weight > 3.0)
  const heavyGames = games.filter(g => g.complexity && g.complexity >= 3.0);
  if (heavyGames.length > 0) {
    categories.push({
      id: 'heavy',
      title: '🧠 Heavy Games',
      description: 'Brain-burners for experienced players',
      games: heavyGames,
      priority: 55,
    });
  }

  // 11. Epic Adventures (3+ hours)
  const epicGames = games.filter(g => g.playingTime && g.playingTime >= 180);
  if (epicGames.length > 0) {
    categories.push({
      id: 'epic',
      title: '🏔️ Epic Adventures',
      description: '3+ hours of gameplay',
      games: epicGames,
      priority: 50,
    });
  }

  // 12. Light & Accessible
  const lightGames = games.filter(g => g.complexity && g.complexity <= 2.0);
  if (lightGames.length > 0) {
    categories.push({
      id: 'light',
      title: '🌟 Light & Accessible',
      description: 'Easy to learn, fun to play',
      games: lightGames,
      priority: 45,
    });
  }

  // 13. Full Collection (always last)
  categories.push({
    id: 'all',
    title: '📚 Full Collection',
    description: `All ${games.length} games`,
    games: games,
    priority: 0,
  });

  // Sort by priority
  return categories.sort((a, b) => b.priority - a.priority);
}

/**
 * Get "Because You Played X" recommendations
 */
export function getBecauseYouPlayed(
  playedGame: Game,
  allGames: Game[]
): Game[] {
  // Simple recommendation: same genres or similar complexity
  const recommendations = allGames
    .filter(g => g.id !== playedGame.id)
    .map(g => {
      let score = 0;
      
      // Same genres
      if (playedGame.genres && g.genres) {
        const commonGenres = playedGame.genres.filter(genre => 
          g.genres?.includes(genre)
        );
        score += commonGenres.length * 10;
      }
      
      // Similar complexity
      if (playedGame.complexity && g.complexity) {
        const diff = Math.abs(playedGame.complexity - g.complexity);
        score += Math.max(0, 10 - diff * 3);
      }
      
      // Similar player count
      if (playedGame.maxPlayers && g.maxPlayers) {
        const diff = Math.abs(playedGame.maxPlayers - g.maxPlayers);
        score += Math.max(0, 10 - diff * 2);
      }
      
      return { game: g, score };
    })
    .filter(item => item.score > 15)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(item => item.game);
  
  return recommendations;
}
