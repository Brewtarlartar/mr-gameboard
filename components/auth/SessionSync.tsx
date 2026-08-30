'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  pullFromServer,
  mergeLibrary,
  pushFullLibrary,
} from '@/lib/sync/librarySync';
import {
  pullChronicle,
  mergeById,
  pushFullChronicle,
} from '@/lib/sync/chronicleSync';
import {
  getGameLibrary,
  getPreferences,
  savePreferences,
} from '@/lib/storage';
import { useGameStore } from '@/lib/store/gameStore';
import { usePlayHistoryStore } from '@/lib/store/playHistoryStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';

const STORAGE_KEYS = {
  GAME_LIBRARY: 'mr-boardgame-library',
  FAVORITES: 'mr-boardgame-favorites',
  CUSTOM_GAMES: 'mr-boardgame-custom-games',
} as const;

// Only the keys that are MIRRORED TO THE SERVER. These are the ones that cause
// cross-account bleed: on the next sign-in, SessionSync reads them from
// localStorage, merges them, and uploads them into whatever account signs in.
// Clearing them on sign-out prevents that — and it's safe because the server
// holds the copy, so the signed-out user's data returns when they sign back in.
//
// Play history and wishlist joined this list when Chronicle sync shipped
// (2026-08-30) — they now mirror to play_sessions / wishlist_items. The
// remaining local-only stores (play-session draft, AI caches) stay untouched:
// they never sync, so wiping them here would permanently destroy data.
const SYNCED_KEYS = [
  'mr-boardgame-library',
  'mr-boardgame-favorites',
  'mr-boardgame-custom-games',
  'mr-boardgame-preferences',
  'play-history-storage',
  'wishlist-storage',
] as const;

/**
 * Clear the server-mirrored local data on sign-out. LOCAL ONLY — the server copy
 * is preserved so the user's data returns when they sign back in.
 */
function clearLocalUserData() {
  if (typeof window === 'undefined') return;
  for (const key of SYNCED_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  // Reset the in-memory stores so the UI reflects the wipe immediately
  // (localStorage removal alone doesn't clear already-loaded state).
  useGameStore.setState({ games: [], favorites: [], customGames: [] });
  usePlayHistoryStore.setState({ sessions: [] });
  useWishlistStore.setState({ wishlist: [] });
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

        // Chronicle (play history + wishlist): same pull → merge → reconcile
        // shape as the library. Server wins on id conflicts; union otherwise.
        const serverChronicle = await pullChronicle(userId);
        const mergedSessions = mergeById(
          usePlayHistoryStore.getState().sessions,
          serverChronicle.sessions,
        );
        const mergedWishlist = mergeById(
          useWishlistStore.getState().wishlist,
          serverChronicle.wishlist,
        );
        usePlayHistoryStore.setState({ sessions: mergedSessions });
        useWishlistStore.setState({ wishlist: mergedWishlist });
        await pushFullChronicle(userId, mergedSessions, mergedWishlist);
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
