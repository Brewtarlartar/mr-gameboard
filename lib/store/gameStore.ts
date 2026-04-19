import { create } from 'zustand';
import { Game, ChatMessage, PlaySession } from '@/types/game';
import { SeedGame } from '@/types/seedGame';
import {
  getGameLibrary,
  addGameToLibrary as saveGame,
  removeGameFromLibrary as removeGame,
  toggleFavorite as toggleFavoriteStorage,
  addCustomGame as saveCustomGame,
  clearAllData,
  updateGameLibrary,
  getGamesNeedingEnrichment,
} from '@/lib/storage';

interface DiscoverCategory {
  name: string;
  games: SeedGame[];
  count: number;
}

interface DiscoverCategories {
  top500: DiscoverCategory;
  party: DiscoverCategory;
  family: DiscoverCategory;
  strategy: DiscoverCategory;
}

interface GameStore {
  // Library state
  games: Game[];
  favorites: string[];
  customGames: Game[];
  isLoading: boolean;

  // Discover state (categorized games)
  discoverCategories: DiscoverCategories | null;
  allDiscoverGames: SeedGame[];
  discoverLoaded: boolean;

  // Chat state
  chatMessages: ChatMessage[];

  // Play session state
  currentSession: PlaySession | null;

  // Subscription state (Freemium)
  isProMember: boolean;
  sessionMessageCount: number; // Track messages per session for free users

  // Actions
  loadLibrary: () => void;
  loadDiscoverGames: () => Promise<void>;
  addGame: (game: Game) => void;
  addGameFromSeed: (seedGame: SeedGame) => void;
  removeGame: (gameId: string) => void;
  toggleFavorite: (gameId: string) => void;
  addCustomGame: (game: Game) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;
  setCurrentSession: (session: PlaySession | null) => void;
  isGameOwned: (bggId: string) => boolean;
  resetLibrary: () => void;
  hydrateRecommendation: (gameName: string) => SeedGame | null;
  toggleProStatus: () => void;
  incrementMessageCount: () => void;
  resetMessageCount: () => void;
  enrichLibrary: () => Promise<{ success: boolean; enriched: number; errors?: any[] }>;
  getGamesNeedingEnrichment: () => Game[];
  autoEnrichLibrary: () => Promise<{ enriched: number; needed: number }>;
}

export const useGameStore = create<GameStore>((set, get) => ({
  games: [],
  favorites: [],
  customGames: [],
  isLoading: false,
  discoverCategories: null,
  allDiscoverGames: [],
  discoverLoaded: false,
  chatMessages: [],
  currentSession: null,
  
  // Freemium state
  isProMember: false, // Default to free tier
  sessionMessageCount: 0,

  loadLibrary: () => {
    set({ isLoading: true });
    const library = getGameLibrary();
    set({
      games: library.games,
      favorites: library.favorites,
      customGames: library.customGames,
      isLoading: false,
    });
  },

  loadDiscoverGames: async () => {
    if (get().discoverLoaded) return;
    
    try {
      // Fetch the seed games data from the API
      const response = await fetch('/api/discover');
      if (response.ok) {
        const data = await response.json();
        set({
          discoverCategories: data.categories || null,
          allDiscoverGames: data.allGames || [],
          discoverLoaded: true,
        });
      } else {
        throw new Error('Failed to fetch discover games');
      }
    } catch (error) {
      console.error('Failed to load discover games:', error);
      set({ discoverLoaded: true }); // Mark as loaded even on error to prevent retries
    }
  },

  addGame: (game: Game) => {
    saveGame(game);
    const library = getGameLibrary();
    set({
      games: library.games,
      favorites: library.favorites,
    });
    persistGameToServerCache(game);
  },

  addGameFromSeed: (seedGame: SeedGame) => {
    // Convert SeedGame to Game format
    const game: Game = {
      id: `bgg-${seedGame.bggId}`,
      bggId: parseInt(seedGame.bggId, 10),
      name: seedGame.title,
      description: seedGame.description,
      image: seedGame.image || undefined,
      thumbnail: seedGame.thumbnail || undefined,
      minPlayers: seedGame.minPlayers || undefined,
      maxPlayers: seedGame.maxPlayers || undefined,
      playingTime: seedGame.playingTime || seedGame.maxPlayTime || undefined,
      minPlayingTime: seedGame.minPlayTime || undefined,
      maxPlayingTime: seedGame.maxPlayTime || undefined,
      rating: seedGame.rating || undefined,
      yearPublished: seedGame.yearPublished || undefined,
      rank: seedGame.rank || undefined,
      categories: seedGame.categories,
      mechanics: seedGame.mechanics,
    };
    
    saveGame(game);
    const library = getGameLibrary();
    set({
      games: library.games,
      favorites: library.favorites,
    });
    persistGameToServerCache(game);
  },

  removeGame: (gameId: string) => {
    removeGame(gameId);
    const library = getGameLibrary();
    set({
      games: library.games,
      favorites: library.favorites,
    });
  },

  toggleFavorite: (gameId: string) => {
    toggleFavoriteStorage(gameId);
    const library = getGameLibrary();
    set({
      games: library.games,
      favorites: library.favorites,
    });
  },

  addCustomGame: (game: Game) => {
    saveCustomGame(game);
    const library = getGameLibrary();
    set({
      games: library.games,
      customGames: library.customGames,
    });
  },

  addChatMessage: (message: ChatMessage) => {
    set(state => ({
      chatMessages: [...state.chatMessages, message],
    }));
  },

  clearChat: () => {
    set({ chatMessages: [] });
  },

  setCurrentSession: (session: PlaySession | null) => {
    set({ currentSession: session });
  },

  isGameOwned: (bggId: string) => {
    return get().games.some(g => g.bggId?.toString() === bggId || g.id === `bgg-${bggId}`);
  },

  resetLibrary: () => {
    clearAllData();
    set({
      games: [],
      favorites: [],
      customGames: [],
    });
  },

  hydrateRecommendation: (gameName: string) => {
    const { allDiscoverGames } = get();
    
    // Normalize the game name for comparison
    const normalizedName = gameName.toLowerCase().trim();
    
    // Try exact match first
    let match = allDiscoverGames.find(
      g => g.title.toLowerCase() === normalizedName
    );
    
    // If no exact match, try partial match
    if (!match) {
      match = allDiscoverGames.find(
        g => g.title.toLowerCase().includes(normalizedName) ||
             normalizedName.includes(g.title.toLowerCase())
      );
    }
    
    // If still no match, try fuzzy match (first few words)
    if (!match) {
      const nameWords = normalizedName.split(' ').slice(0, 3).join(' ');
      match = allDiscoverGames.find(
        g => g.title.toLowerCase().startsWith(nameWords)
      );
    }
    
    return match || null;
  },

  // Freemium actions
  toggleProStatus: () => {
    set(state => ({ isProMember: !state.isProMember }));
  },

  incrementMessageCount: () => {
    set(state => ({ sessionMessageCount: state.sessionMessageCount + 1 }));
  },

  resetMessageCount: () => {
    set({ sessionMessageCount: 0 });
  },

  // Enrich library with full BGG data
  enrichLibrary: async () => {
    const { games } = get();
    
    try {
      console.log('[GameStore] Starting library enrichment...');
      
      // Call the enrichment API
      const response = await fetch('/api/library/enrich', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ games }),
      });

      if (!response.ok) {
        throw new Error('Enrichment API failed');
      }

      const data = await response.json();
      
      if (data.success && data.enrichedGames) {
        // Update storage with enriched games
        updateGameLibrary(data.enrichedGames);
        
        // Reload library
        const library = getGameLibrary();
        set({
          games: library.games,
          favorites: library.favorites,
        });

        console.log('[GameStore] Library enrichment complete:', data.stats);
        
        return {
          success: true,
          enriched: data.stats.enriched,
          errors: data.errors,
        };
      }
      
      throw new Error('Invalid response from enrichment API');
    } catch (error) {
      console.error('[GameStore] Enrichment failed:', error);
      return {
        success: false,
        enriched: 0,
        errors: [{ error: error instanceof Error ? error.message : 'Unknown error' }],
      };
    }
  },

  // Get games that need enrichment
  getGamesNeedingEnrichment: () => {
    return getGamesNeedingEnrichment();
  },

  // Auto-enrich library on load (if games need enrichment)
  autoEnrichLibrary: async () => {
    const gamesNeedingEnrichment = getGamesNeedingEnrichment();
    
    if (gamesNeedingEnrichment.length === 0) {
      console.log('[GameStore] All games have full descriptions ✅');
      return { enriched: 0, needed: 0 };
    }

    console.log(`[GameStore] Found ${gamesNeedingEnrichment.length} games needing enrichment...`);
    
    // Only auto-enrich up to 5 games at a time to avoid blocking
    const gamesToEnrich = gamesNeedingEnrichment.slice(0, 5);
    
    try {
      const response = await fetch('/api/library/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ games: get().games }),
      });

      if (!response.ok) {
        throw new Error('Enrichment failed');
      }

      const data = await response.json();
      
      if (data.success && data.enrichedGames) {
        updateGameLibrary(data.enrichedGames);
        
        // Reload library with enriched data
        const library = getGameLibrary();
        set({
          games: library.games,
          favorites: library.favorites,
        });

        console.log(`[GameStore] Auto-enriched ${data.stats.enriched} games ✅`);
        
        return {
          enriched: data.stats.enriched,
          needed: gamesNeedingEnrichment.length,
        };
      }
    } catch (error) {
      console.error('[GameStore] Auto-enrichment error:', error);
    }
    
    return { enriched: 0, needed: gamesNeedingEnrichment.length };
  },
}));

/**
 * Fire-and-forget upsert into the server-side bgg_games_cache.
 * Ensures every game any user adds becomes part of our permanent catalog
 * so we stop hitting BGG live for repeat views.
 */
function persistGameToServerCache(game: Game) {
  if (typeof window === 'undefined') return;
  if (!game.bggId || !Number.isFinite(game.bggId)) return;

  try {
    fetch('/api/games/cache', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bggId: game.bggId, game }),
      keepalive: true,
    }).catch(() => {
      /* silent: best-effort persistence */
    });
  } catch {
    /* silent */
  }
}
