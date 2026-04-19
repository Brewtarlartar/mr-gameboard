/**
 * Research Agent - Background Scheduler
 * Manages periodic updates of trending data
 */

import { fetchAllTrendingData, TrendingData } from './service';
import { getCachedTrendingData, cacheTrendingData, isCacheValid } from './cache';

let updateInterval: NodeJS.Timeout | null = null;
let isUpdating = false;

/**
 * Get trending data (from cache or fetch)
 */
export async function getTrendingData(): Promise<TrendingData | null> {
  // Check cache first
  const cached = getCachedTrendingData();
  if (cached) {
    return cached;
  }
  
  // If no cache or expired, fetch fresh data
  console.log('[Research Agent] Fetching fresh trending data...');
  try {
    const data = await fetchAllTrendingData();
    cacheTrendingData(data);
    return data;
  } catch (error) {
    console.error('[Research Agent] Failed to fetch trending data:', error);
    return null;
  }
}

/**
 * Update trending data in background
 */
async function updateTrendingData(): Promise<void> {
  if (isUpdating) {
    console.log('[Research Agent] Update already in progress, skipping...');
    return;
  }
  
  isUpdating = true;
  console.log('[Research Agent] Background update started...');
  
  try {
    const data = await fetchAllTrendingData();
    cacheTrendingData(data);
    console.log('[Research Agent] Background update completed');
    
    // Dispatch custom event for UI to update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('trending-updated', { detail: data }));
    }
  } catch (error) {
    console.error('[Research Agent] Background update failed:', error);
  } finally {
    isUpdating = false;
  }
}

/**
 * Start background scheduler
 * Updates every 6 hours
 */
export function startScheduler(): void {
  if (typeof window === 'undefined') return;
  
  // Don't start multiple schedulers
  if (updateInterval) {
    console.log('[Research Agent] Scheduler already running');
    return;
  }
  
  console.log('[Research Agent] Starting background scheduler (6hr interval)');
  
  // Initial update if cache is invalid
  const cached = getCachedTrendingData();
  if (!cached) {
    updateTrendingData();
  }
  
  // Set up 6-hour interval
  updateInterval = setInterval(() => {
    updateTrendingData();
  }, 6 * 60 * 60 * 1000); // 6 hours
  
  console.log('[Research Agent] Scheduler started');
}

/**
 * Stop background scheduler
 */
export function stopScheduler(): void {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
    console.log('[Research Agent] Scheduler stopped');
  }
}

/**
 * Force immediate update
 */
export async function forceUpdate(): Promise<TrendingData | null> {
  console.log('[Research Agent] Force update triggered');
  await updateTrendingData();
  return getCachedTrendingData();
}

/**
 * Initialize research agent
 * Call this once on app startup
 */
export function initializeResearchAgent(): void {
  if (typeof window === 'undefined') return;
  
  console.log('[Research Agent] Initializing...');
  startScheduler();
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    stopScheduler();
  });
}
