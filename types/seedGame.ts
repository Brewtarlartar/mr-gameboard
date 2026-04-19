// Type definition for games from seed data (Wikidata or BGG)
export interface SeedGame {
  // Identifiers (supports both BGG and Wikidata)
  bggId: string; // For BGG data or Wikidata ID for compatibility
  wikidataId?: string; // Wikidata entity ID (e.g., "Q12345")
  
  // Basic info
  title: string;
  description: string;
  image: string | null;
  thumbnail: string | null;
  imageSource?: 'amazon' | 'wikidata-logo' | 'wikidata-image' | 'placeholder'; // Where the image came from
  amazonAsin?: string | null; // Amazon ASIN for product images
  yearPublished: number | null;
  
  // Player counts
  minPlayers: number | null;
  maxPlayers: number | null;
  
  // Play time
  playingTime: number | null;
  minPlayTime: number | null;
  maxPlayTime: number | null;
  minAge: number | null;
  
  // Ratings (BGG only)
  rating: number | null;
  weight: number | null;
  
  // Metadata
  categories: string[];
  mechanics: string[];
  designers: string[];
  publishers: string[];
  rank: number;
  
  // URLs
  bggUrl?: string;
  wikidataUrl?: string;
  amazonSearchUrl?: string; // Amazon affiliate search link
  
  // Data source info
  dataSource?: 'wikidata' | 'bgg';
  sitelinks?: number; // Wikidata popularity metric
}

export interface SeedGamesData {
  category?: string;
  dataSource?: string;
  license?: string;
  generatedAt: string;
  totalGames: number;
  games: SeedGame[];
}
