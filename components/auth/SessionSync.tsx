'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  pullFromServer,
  mergeLibrary,
  pushFullLibrary,
} from '@/lib/sync/librarySync';
import {
  getGameLibrary,
  getPreferences,
  savePreferences,
} from '@/lib/storage';
import { useGameStore } from '@/lib/store/gameStore';

const STORAGE_KEYS = {
  GAME_LIBRARY: 'mr-boardgame-library',
  FAVORITES: 'mr-boardgame-favorites',
  CUSTOM_GAMES: 'mr-boardgame-custom-games',
} as const;

// Every local key that holds a signed-in user's personal data. Cleared on
// sign-out so the next account (or an anonymous user) on the same device can't
// inherit it — and, critically, so the previous user's local library isn't
// merged and uploaded into a different account on the next sign-in.
const LOCAL_USER_DATA_KEYS = [
  'mr-boardgame-library',
  'mr-boardgame-favorites',
  'mr-boardgame-custom-games',
  'mr-boardgame-preferences',
  'wishlist-storage',
  'play-history-storage',
  'play-session-draft',
  'mr-gameboard-ai',
] as const;

/**
 * Wipe local personal data on sign-out. LOCAL ONLY — the server copy is
 * intentionally preserved so the user's data returns when they sign back in.
 */
function clearLocalUserData() {
  if (typeof window === 'undefined') return;
  for (const key of LOCAL_USER_DATA_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  // Reset the in-memory game store so the UI reflects the wipe immediately
  // (localStorage removal alone doesn't clear already-loaded state).
  useGameStore.setState({ games: [], favorites: [], customGames: [] });
}

/**
 * Hidden component that listens for Supabase auth state changes and reconciles
 * localStorage with the server on sign-in. Mount once in the (main) layout.
 */
export default function SessionSync() {
  const hydratedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const run = async (userId: string) => {
      if (hydratedUserIdRef.current === userId) return;
      hydratedUserIdRef.current = userId;

      try {
        const server = await pullFromServer(userId);
        const local = getGameLibrary();
        const merged = mergeLibrary(local, server);

        // Write merged state back to localStorage so the rest of the app sees it.
        localStorage.setItem(STORAGE_KEYS.GAME_LIBRARY, JSON.stringify(merged.games));
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(merged.favorites));
        localStorage.setItem(STORAGE_KEYS.CUSTOM_GAMES, JSON.stringify(merged.customGames));

        // Reconcile: push the merged library back to server so both sides agree.
        // This also handles first-sign-in-with-local-data: server was empty,
        // so pushFullLibrary effectively migrates local → server.
        await pushFullLibrary(userId, {
          games: merged.games,
          favorites: merged.favorites,
          customGames: merged.customGames,
        });

        // Preferences: server fields override undefined local fields; local wins otherwise.
        const localPrefs = getPreferences();
        const mergedPrefs = { ...server.preferences, ...localPrefs };
        savePreferences(mergedPrefs);

        // Reload the Zustand store from the refreshed localStorage.
        useGameStore.getState().loadLibrary();
      } catch (err) {
        console.error('[SessionSync] hydration failed:', err);
      }
    };

    // Run once at mount if a session already exists.
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) void run(data.user.id);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        void run(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        hydratedUserIdRef.current = null;
        clearLocalUserData();
      }
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  return null;
}
