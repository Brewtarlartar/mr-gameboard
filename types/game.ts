export interface Game {
  id: string;
  bggId?: number;
  wikidataId?: string;
  name: string;
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
  rank?: number; // BGG rank (e.g., #5 in Top 500)
  genres?: string[];
  mechanics?: string[];
  categories?: string[];
  rulebookUrl?: string;
  amazonSearchUrl?: string; // Amazon affiliate search link
  isCustom?: boolean;
  isFavorite?: boolean;
}

export interface GameSearchResult {
  id: number;
  name: string;
  yearPublished?: number;
  thumbnail?: string;
}

export interface GameDetail extends Game {
  artists?: string[];
  designers?: string[];
  publishers?: string[];
  expansions?: Game[];
  rulesVideo?: string;
}

export interface Player {
  id: string;
  name: string;
  role?: string;
  class?: string;
  rank?: string;
  race?: string;
  [key: string]: any; // Allow game-specific attributes
}

export interface PlaySession {
  gameId: string;
  game: Game;
  players: Player[];
  currentTurn?: number;
  scores?: Record<string, number>;
  startTime?: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  quickAction?: string;
  strategyPhase?: number; // 1, 2, or 3 for Deep Strategy phases (renders as HUD card)
}
