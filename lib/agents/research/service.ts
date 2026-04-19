/**
 * Research Agent - BGG Trending Service
 * Fetches trending games, hot lists, and new releases from BoardGameGeek
 */

export interface TrendingGame {
  id: number;
  name: string;
  rank: number;
  yearPublished?: number;
  thumbnail?: string;
  rating?: number;
  category: 'hot' | 'trending' | 'new' | 'rising';
}

export interface TrendingData {
  hot: TrendingGame[];
  new: TrendingGame[];
  trending: TrendingGame[];
  lastUpdated: number;
}

const BGG_API_BASE = 'https://boardgamegeek.com/xmlapi2';

/**
 * Fetch BGG Hot 50 list
 */
export async function fetchBGGHotList(): Promise<TrendingGame[]> {
  try {
    const response = await fetch(`${BGG_API_BASE}/hot?type=boardgame`, {
      headers: {
        'Accept': 'application/xml',
        'User-Agent': 'BoardGameCompanion/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`BGG API returned ${response.status}`);
    }

    const xml = await response.text();
    const games: TrendingGame[] = [];

    // Parse XML for hot items
    const itemRegex = /<item[^>]*id="(\d+)"[^>]*rank="(\d+)"[^>]*>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const id = parseInt(match[1]);
      const rank = parseInt(match[2]);
      const content = match[3];

      // Extract name
      const nameMatch = content.match(/<name[^>]*value="([^"]*)"[^>]*\/>/i);
      const name = nameMatch ? nameMatch[1] : '';

      // Extract year
      const yearMatch = content.match(/<yearpublished[^>]*value="(\d+)"[^>]*\/>/i);
      const yearPublished = yearMatch ? parseInt(yearMatch[1]) : undefined;

      // Extract thumbnail
      const thumbnailMatch = content.match(/<thumbnail[^>]*value="([^"]*)"[^>]*\/>/i);
      const thumbnail = thumbnailMatch ? thumbnailMatch[1] : undefined;

      if (id && name) {
        games.push({
          id,
          name,
          rank,
          yearPublished,
          thumbnail,
          category: 'hot',
        });
      }
    }

    return games.slice(0, 50);
  } catch (error) {
    console.error('[Research Agent] Failed to fetch BGG hot list:', error);
    return [];
  }
}

/**
 * Fetch new releases (games from current and last year)
 */
export async function fetchNewReleases(): Promise<TrendingGame[]> {
  try {
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    
    // Search for games from current and last year
    const response = await fetch(
      `${BGG_API_BASE}/search?type=boardgame&exact=0&yearpublished=${lastYear},${currentYear}`,
      {
        headers: {
          'Accept': 'application/xml',
          'User-Agent': 'BoardGameCompanion/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`BGG API returned ${response.status}`);
    }

    const xml = await response.text();
    const games: TrendingGame[] = [];

    // Parse XML
    const itemRegex = /<item[^>]*id="(\d+)"[^>]*>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && games.length < 20) {
      const id = parseInt(match[1]);
      const content = match[2];

      const nameMatch = content.match(/<name[^>]*value="([^"]*)"[^>]*\/>/i);
      const name = nameMatch ? nameMatch[1] : '';

      const yearMatch = content.match(/<yearpublished[^>]*value="(\d+)"[^>]*\/>/i);
      const yearPublished = yearMatch ? parseInt(yearMatch[1]) : undefined;

      if (id && name && yearPublished && yearPublished >= lastYear) {
        games.push({
          id,
          name,
          rank: games.length + 1,
          yearPublished,
          category: 'new',
        });
      }
    }

    return games.slice(0, 20);
  } catch (error) {
    console.error('[Research Agent] Failed to fetch new releases:', error);
    return [];
  }
}

/**
 * Fetch all trending data
 */
export async function fetchAllTrendingData(): Promise<TrendingData> {
  const [hot, newGames] = await Promise.all([
    fetchBGGHotList(),
    fetchNewReleases(),
  ]);

  return {
    hot,
    new: newGames,
    trending: hot.slice(0, 20), // Top 20 from hot list
    lastUpdated: Date.now(),
  };
}

/**
 * Get detailed game info from BGG
 */
export async function fetchGameDetails(gameId: number): Promise<any> {
  try {
    const response = await fetch(`${BGG_API_BASE}/thing?id=${gameId}&stats=1`, {
      headers: {
        'Accept': 'application/xml',
        'User-Agent': 'BoardGameCompanion/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`BGG API returned ${response.status}`);
    }

    const xml = await response.text();
    
    // Extract rating
    const ratingMatch = xml.match(/<average[^>]*value="([^"]*)"[^>]*\/>/i);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;
    
    return { rating };
  } catch (error) {
    console.error('[Research Agent] Failed to fetch game details:', error);
    return {};
  }
}
