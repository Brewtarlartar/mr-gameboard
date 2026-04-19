/**
 * Library Agent - Enhanced Search Service
 * Improved search with debouncing, fuzzy matching, and error handling
 */

export interface SearchResult {
  id: number;
  name: string;
  yearPublished?: number;
  thumbnail?: string;
  score?: number; // Relevance score
}

// Simple fuzzy matching implementation
function fuzzyMatch(search: string, target: string): number {
  const searchLower = search.toLowerCase();
  const targetLower = target.toLowerCase();
  
  // Exact match
  if (targetLower === searchLower) return 100;
  
  // Starts with
  if (targetLower.startsWith(searchLower)) return 90;
  
  // Contains
  if (targetLower.includes(searchLower)) return 70;
  
  // Calculate Levenshtein-like score
  let score = 0;
  let searchIndex = 0;
  
  for (let i = 0; i < targetLower.length && searchIndex < searchLower.length; i++) {
    if (targetLower[i] === searchLower[searchIndex]) {
      score += 10;
      searchIndex++;
    }
  }
  
  // If all search characters found
  if (searchIndex === searchLower.length) {
    return Math.min(score, 60);
  }
  
  return 0;
}

/**
 * Search with fuzzy matching and scoring
 */
export function fuzzySearch(query: string, items: { id: number; name: string }[]): SearchResult[] {
  if (!query || query.length < 2) return [];
  
  const results = items
    .map(item => ({
      ...item,
      score: fuzzyMatch(query, item.name),
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);
  
  return results;
}

/**
 * Search BGG via our API route, which transparently falls back to a local
 * seed catalog when BGG is rate-limited or unreachable. Going through the
 * server avoids CORS, gives consistent results, and lets the server attach
 * thumbnails from the seed cache when BGG omits them.
 */
export async function searchBGG(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const response = await fetch(
      `/api/bgg/search?query=${encodeURIComponent(query)}`,
      {
        method: 'GET',
        signal: AbortSignal.timeout(12000),
      },
    );

    if (response.ok) {
      const data = (await response.json()) as { games?: SearchResult[] };
      const games = data.games || [];
      console.log('[BGG Search] API route returned', games.length, 'games');
      return games.slice(0, 20);
    }

    console.warn('[BGG Search] API route failed with status:', response.status);
    return [];
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[BGG Search] Request timed out');
    } else {
      console.error('[BGG Search] Search error:', error);
    }
    return [];
  }
}

/**
 * Get search suggestions (did you mean...)
 */
export function getSearchSuggestions(query: string, recentSearches: string[]): string[] {
  if (!query || query.length < 3) return [];
  
  const suggestions = recentSearches
    .map(search => ({
      text: search,
      score: fuzzyMatch(query, search),
    }))
    .filter(item => item.score > 30 && item.score < 100) // Not exact, but close
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.text);
  
  return suggestions;
}

/**
 * Debounced search function
 */
let searchTimeout: NodeJS.Timeout | null = null;

export function debouncedSearch(
  query: string,
  callback: (results: SearchResult[]) => void,
  delay: number = 400
): void {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  
  searchTimeout = setTimeout(async () => {
    const results = await searchBGG(query);
    callback(results);
  }, delay);
}

/**
 * Save search to history
 */
const SEARCH_HISTORY_KEY = 'bgb_search_history';
const MAX_HISTORY = 20;

export function saveSearchHistory(query: string): void {
  if (typeof window === 'undefined' || !query || query.length < 2) return;
  
  try {
    const history = getSearchHistory();
    
    // Remove if already exists
    const filtered = history.filter(h => h !== query);
    
    // Add to front
    filtered.unshift(query);
    
    // Limit size
    const limited = filtered.slice(0, MAX_HISTORY);
    
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(limited));
  } catch (error) {
    console.error('[Library Agent] Failed to save search history:', error);
  }
}

export function getSearchHistory(): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!stored) return [];
    
    return JSON.parse(stored);
  } catch (error) {
    console.error('[Library Agent] Failed to load search history:', error);
    return [];
  }
}

export function clearSearchHistory(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error('[Library Agent] Failed to clear search history:', error);
  }
}
