import { Game } from '@/types/game';

const STORAGE_KEYS = {
  GAME_LIBRARY: 'mr-boardgame-library',
  FAVORITES: 'mr-boardgame-favorites',
  CUSTOM_GAMES: 'mr-boardgame-custom-games',
  PREFERENCES: 'mr-boardgame-preferences',
} as const;

export interface GameLibrary {
  games: Game[];
  favorites: string[]; // Array of game IDs
  customGames: Game[];
}

export interface UserPreferences {
  theme?: string;
  notifications?: boolean;
}

// Get all games in library
export function getGameLibrary(): GameLibrary {
  if (typeof window === 'undefined') {
    return { games: [], favorites: [], customGames: [] };
  }

  try {
    const libraryJson = localStorage.getItem(STORAGE_KEYS.GAME_LIBRARY);
    const favoritesJson = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    const customGamesJson = localStorage.getItem(STORAGE_KEYS.CUSTOM_GAMES);

    const library: GameLibrary = {
      games: libraryJson ? JSON.parse(libraryJson) : [],
      favorites: favoritesJson ? JSON.parse(favoritesJson) : [],
      customGames: customGamesJson ? JSON.parse(customGamesJson) : [],
    };

    return library;
  } catch (error) {
    console.error('Error loading game library:', error);
    return { games: [], favorites: [], customGames: [] };
  }
}

// Save game to library
export function addGameToLibrary(game: Game): void {
  if (typeof window === 'undefined') return;

  try {
    const library = getGameLibrary();
    
    // Check if game already exists
    if (!library.games.some(g => g.id === game.id)) {
      library.games.push(game);
      localStorage.setItem(STORAGE_KEYS.GAME_LIBRARY, JSON.stringify(library.games));
    }
  } catch (error) {
    console.error('Error adding game to library:', error);
  }
}

// Remove game from library
export function removeGameFromLibrary(gameId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const library = getGameLibrary();
    library.games = library.games.filter(g => g.id !== gameId);
    library.favorites = library.favorites.filter(id => id !== gameId);
    
    localStorage.setItem(STORAGE_KEYS.GAME_LIBRARY, JSON.stringify(library.games));
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(library.favorites));
  } catch (error) {
    console.error('Error removing game from library:', error);
  }
}

// Toggle favorite status
export function toggleFavorite(gameId: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const library = getGameLibrary();
    const isFavorite = library.favorites.includes(gameId);

    if (isFavorite) {
      library.favorites = library.favorites.filter(id => id !== gameId);
    } else {
      library.favorites.push(gameId);
    }

    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(library.favorites));

    // Update game in library
    library.games = library.games.map(game => ({
      ...game,
      isFavorite: library.favorites.includes(game.id),
    }));
    localStorage.setItem(STORAGE_KEYS.GAME_LIBRARY, JSON.stringify(library.games));

    return !isFavorite;
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return false;
  }
}

// Get favorite games
export function getFavoriteGames(): Game[] {
  const library = getGameLibrary();
  return library.games.filter(game => library.favorites.includes(game.id));
}

// Add custom game
export function addCustomGame(game: Game): void {
  if (typeof window === 'undefined') return;

  try {
    const library = getGameLibrary();
    const customGame = { ...game, isCustom: true, id: `custom-${Date.now()}` };
    
    library.customGames.push(customGame);
    library.games.push(customGame);
    
    localStorage.setItem(STORAGE_KEYS.CUSTOM_GAMES, JSON.stringify(library.customGames));
    localStorage.setItem(STORAGE_KEYS.GAME_LIBRARY, JSON.stringify(library.games));
  } catch (error) {
    console.error('Error adding custom game:', error);
  }
}

// Get user preferences
export function getPreferences(): UserPreferences {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const prefsJson = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    return prefsJson ? JSON.parse(prefsJson) : {};
  } catch (error) {
    console.error('Error loading preferences:', error);
    return {};
  }
}

// Save user preferences
export function savePreferences(preferences: UserPreferences): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving preferences:', error);
  }
}

// Clear all data
export function clearAllData(): void {
  if (typeof window === 'undefined') return;

  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}

// Update entire library (useful for batch enrichment)
export function updateGameLibrary(games: Game[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEYS.GAME_LIBRARY, JSON.stringify(games));
  } catch (error) {
    console.error('Error updating game library:', error);
  }
}

// Get games that need enrichment (missing or short descriptions)
export function getGamesNeedingEnrichment(): Game[] {
  const library = getGameLibrary();
  return library.games.filter(game => {
    // Only enrich games with BGG IDs
    if (!game.bggId) return false;
    
    // Enrich if description is missing or too short
    if (!game.description || game.description.length < 200) return true;
    
    return false;
  });
}
