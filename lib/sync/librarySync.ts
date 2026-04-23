/**
 * Cloud sync for library/favorites/custom-games/preferences.
 *
 * All functions are no-ops when there is no signed-in session or when running
 * on the server. Mutations are fire-and-forget: local state updates win, and
 * the server mirror is best-effort. Errors are logged, not thrown.
 */

import { createClient } from '@/lib/supabase/client';
import type { Game } from '@/types/game';
import type { UserPreferences, GameLibrary } from '@/lib/storage';

export async function getCurrentUserId(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export interface ServerLibrarySnapshot {
  libraryGames: Game[];
  favorites: string[];
  customGames: Game[];
  preferences: UserPreferences;
}

/**
 * Pull the signed-in user's data from Supabase. Returns an empty snapshot if
 * the tables are empty for this user (first sign-in on a new device).
 */
export async function pullFromServer(userId: string): Promise<ServerLibrarySnapshot> {
  const supabase = createClient();

  const [libraryRes, customRes, prefsRes] = await Promise.all([
    supabase.from('library_games').select('*').eq('user_id', userId),
    supabase.from('custom_games').select('*').eq('user_id', userId),
    supabase.from('user_preferences').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  const libraryRows = libraryRes.data ?? [];
  const customRows = customRes.data ?? [];

  const libraryGames = libraryRows.map((r): Game => ({
    ...(r.data as Game),
    isFavorite: r.is_favorite,
  }));
  const favorites = libraryRows.filter((r) => r.is_favorite).map((r) => r.game_id);
  const customGames = customRows.map((r) => r.data as Game);
  const preferences = (prefsRes.data?.preferences as UserPreferences) ?? {};

  return { libraryGames, favorites, customGames, preferences };
}

/**
 * Merge local and server state. Union by id; server wins on is_favorite conflicts
 * (assumes server reflects a more-recent cross-device change). Custom games are
 * also unioned by id. Preferences: server fields override undefined local fields,
 * but local non-undefined fields are preserved.
 */
export function mergeLibrary(local: GameLibrary, server: ServerLibrarySnapshot): {
  games: Game[];
  favorites: string[];
  customGames: Game[];
} {
  const gamesById = new Map<string, Game>();
  for (const g of local.games) gamesById.set(g.id, g);
  for (const g of server.libraryGames) {
    const existing = gamesById.get(g.id);
    gamesById.set(g.id, existing ? { ...existing, ...g } : g);
  }

  const favoritesSet = new Set<string>(local.favorites);
  for (const id of server.favorites) favoritesSet.add(id);
  // Server authority: if a game exists on server and is NOT favorited there,
  // but locally it is, we keep local favorite (union semantics — never destroy).

  const customsById = new Map<string, Game>();
  for (const g of local.customGames) customsById.set(g.id, g);
  for (const g of server.customGames) {
    if (!customsById.has(g.id)) customsById.set(g.id, g);
  }

  return {
    games: Array.from(gamesById.values()),
    favorites: Array.from(favoritesSet),
    customGames: Array.from(customsById.values()),
  };
}

/**
 * Push the current local library up to the server. Used on first sign-in when
 * the server is empty, or as a reconciliation step after merge.
 */
export async function pushFullLibrary(userId: string, local: GameLibrary): Promise<void> {
  const supabase = createClient();

  if (local.games.length > 0) {
    const rows = local.games.map((g) => ({
      user_id: userId,
      game_id: g.id,
      data: g as unknown,
      is_favorite: local.favorites.includes(g.id),
    }));
    const { error } = await supabase.from('library_games').upsert(rows, {
      onConflict: 'user_id,game_id',
    });
    if (error) console.error('[sync] pushFullLibrary games:', error.message);
  }

  if (local.customGames.length > 0) {
    const rows = local.customGames.map((g) => ({
      user_id: userId,
      id: g.id,
      data: g as unknown,
    }));
    const { error } = await supabase.from('custom_games').upsert(rows, {
      onConflict: 'user_id,id',
    });
    if (error) console.error('[sync] pushFullLibrary customs:', error.message);
  }
}

// ── Per-mutation push operations (fire-and-forget) ──

export async function pushLibraryGame(game: Game, isFavorite = false): Promise<void> {
  if (typeof window === 'undefined') return;
  const userId = await getCurrentUserId();
  if (!userId) return;

  const supabase = createClient();
  const { error } = await supabase.from('library_games').upsert(
    { user_id: userId, game_id: game.id, data: game as unknown, is_favorite: isFavorite },
    { onConflict: 'user_id,game_id' },
  );
  if (error) console.error('[sync] pushLibraryGame:', error.message);
}

export async function removeLibraryGame(gameId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const userId = await getCurrentUserId();
  if (!userId) return;

  const supabase = createClient();
  const { error } = await supabase
    .from('library_games')
    .delete()
    .eq('user_id', userId)
    .eq('game_id', gameId);
  if (error) console.error('[sync] removeLibraryGame:', error.message);
}

export async function setLibraryGameFavorite(
  gameId: string,
  isFavorite: boolean,
): Promise<void> {
  if (typeof window === 'undefined') return;
  const userId = await getCurrentUserId();
  if (!userId) return;

  const supabase = createClient();
  const { error } = await supabase
    .from('library_games')
    .update({ is_favorite: isFavorite })
    .eq('user_id', userId)
    .eq('game_id', gameId);
  if (error) console.error('[sync] setLibraryGameFavorite:', error.message);
}

export async function pushCustomGame(game: Game): Promise<void> {
  if (typeof window === 'undefined') return;
  const userId = await getCurrentUserId();
  if (!userId) return;

  const supabase = createClient();
  const { error } = await supabase.from('custom_games').upsert(
    { user_id: userId, id: game.id, data: game as unknown },
    { onConflict: 'user_id,id' },
  );
  if (error) console.error('[sync] pushCustomGame:', error.message);
}

export async function pushPreferences(prefs: UserPreferences): Promise<void> {
  if (typeof window === 'undefined') return;
  const userId = await getCurrentUserId();
  if (!userId) return;

  const supabase = createClient();
  const { error } = await supabase.from('user_preferences').upsert(
    { user_id: userId, preferences: prefs as unknown },
    { onConflict: 'user_id' },
  );
  if (error) console.error('[sync] pushPreferences:', error.message);
}

/**
 * Called from the "clear all data" flow. Wipes this user's server rows.
 * Does not delete the auth user; that's a separate operation.
 */
export async function clearAllServerData(): Promise<void> {
  if (typeof window === 'undefined') return;
  const userId = await getCurrentUserId();
  if (!userId) return;

  const supabase = createClient();
  await Promise.allSettled([
    supabase.from('library_games').delete().eq('user_id', userId),
    supabase.from('custom_games').delete().eq('user_id', userId),
    supabase.from('user_preferences').delete().eq('user_id', userId),
  ]);
}
