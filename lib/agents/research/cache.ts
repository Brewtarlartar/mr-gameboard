/**
 * Research Agent - Caching Layer
 * Manages localStorage caching for trending data with TTL
 */

import { TrendingData } from './service';

const CACHE_KEY = 'bgb_trending_cache';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

export interface CachedData {
  data: TrendingData;
  timestamp: number;
}

/**
 * Check if cache is valid
 */
export function isCacheValid(timestamp: number): boolean {
  const now = Date.now();
  return (now - timestamp) < CACHE_TTL;
}

/**
 * Get trending data from cache
 */
export function getCachedTrendingData(): TrendingData | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const parsed: CachedData = JSON.parse(cached);
    
    // Check if cache is still valid
    if (!isCacheValid(parsed.timestamp)) {
      console.log('[Research Agent] Cache expired, clearing...');
      clearTrendingCache();
      return null;
    }
    
    console.log('[Research Agent] Using cached trending data');
    return parsed.data;
  } catch (error) {
    console.error('[Research Agent] Failed to read cache:', error);
    return null;
  }
}

/**
 * Save trending data to cache
 */
export function cacheTrendingData(data: TrendingData): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cached: CachedData = {
      data,
      timestamp: Date.now(),
    };
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
    console.log('[Research Agent] Cached trending data');
  } catch (error) {
    console.error('[Research Agent] Failed to cache data:', error);
  }
}

/**
 * Clear trending cache
 */
export function clearTrendingCache(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(CACHE_KEY);
    console.log('[Research Agent] Cache cleared');
  } catch (error) {
    console.error('[Research Agent] Failed to clear cache:', error);
  }
}

/**
 * Get cache age in hours
 */
export function getCacheAge(): number {
  if (typeof window === 'undefined') return -1;
  
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return -1;
    
    const parsed: CachedData = JSON.parse(cached);
    const ageMs = Date.now() - parsed.timestamp;
    return Math.floor(ageMs / (60 * 60 * 1000)); // Convert to hours
  } catch (error) {
    return -1;
  }
}

/**
 * Force refresh (clear cache and trigger refetch)
 */
export function forceRefresh(): void {
  clearTrendingCache();
  console.log('[Research Agent] Force refresh triggered');
}
