/**
 * Cloud sync for the Chronicle (play history) and wishlist.
 *
 * Same contract as librarySync: every function is a no-op when signed out or
 * on the server, mutations are fire-and-forget (local state wins, the server
 * mirror is best-effort), and errors are logged, not thrown.
 */

import { createClient } from '@/lib/supabase/client';
import { getCurrentUserId } from '@/lib/sync/librarySync';
import type { PlaySession } from '@/lib/store/playHistoryStore';
import type { WishlistItem } from '@/lib/store/wishlistStore';

export interface ServerChronicleSnapshot {
  sessions: PlaySession[];
  wishlist: WishlistItem[];
}

export async function pullChronicle(userId: string): Promise<ServerChronicleSnapshot> {
  const supabase = createClient();
  const [sessionsRes, wishlistRes] = await Promise.all([
    supabase.from('play_sessions').select('id, data').eq('user_id', userId),
    supabase.from('wishlist_items').select('id, data').eq('user_id', userId),
  ]);

  const sessions = (sessionsRes.data ?? []).map((r) => {
    const s = r.data as PlaySession;
    return { ...s, date: new Date(s.date) };
  });
  const wishlist = (wishlistRes.data ?? []).map((r) => {
    const w = r.data as WishlistItem;
    return { ...w, addedAt: new Date(w.addedAt) };
  });
  return { sessions, wishlist };
}

/** Union by id; on conflict the server copy wins (assumed most recent cross-device). */
export function mergeById<T extends { id: string }>(local: T[], server: T[]): T[] {
  const byId = new Map<string, T>();
  for (const item of local) byId.set(item.id, item);
  for (const item of server) byId.set(item.id, item);
  return Array.from(byId.values());
}

export async function pushFullChronicle(
  userId: string,
  sessions: PlaySession[],
  wishlist: WishlistItem[],
): Promise<void> {
  const supabase = createClient();

  if (sessions.length > 0) {
    const rows = sessions.map((s) => ({
      user_id: userId,
      id: s.id,
      data: s as unknown,
      played_at: new Date(s.date).toISOString(),
    }));
    const { error } = await supabase.from('play_sessions').upsert(rows, {
      onConflict: 'user_id,id',
    });
    if (error) console.error('[sync] pushFullChronicle sessions:', error.message);
  }

  if (wishlist.length > 0) {
    const rows = wishlist.map((w) => ({
      user_id: userId,
      id: w.id,
      data: w as unknown,
    }));
    const { error } = await supabase.from('wishlist_items').upsert(rows, {
      onConflict: 'user_id,id',
    });
    if (error) console.error('[sync] pushFullChronicle wishlist:', error.message);
  }
}

// ── Per-mutation push operations (fire-and-forget) ──

export async function pushPlaySession(session: PlaySession): Promise<void> {
  if (typeof window === 'undefined') return;
  const userId = await getCurrentUserId();
  if (!userId) return;

  const supabase = createClient();
  const { error } = await supabase.from('play_sessions').upsert(
    {
      user_id: userId,
      id: session.id,
      data: session as unknown,
      played_at: new Date(session.date).toISOString(),
    },
    { onConflict: 'user_id,id' },
  );
  if (error) console.error('[sync] pushPlaySession:', error.message);
}

export async function removePlaySession(sessionId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const userId = await getCurrentUserId();
  if (!userId) return;

  const supabase = createClient();
  const { error } = await supabase
    .from('play_sessions')
    .delete()
    .eq('user_id', userId)
    .eq('id', sessionId);
  if (error) console.error('[sync] removePlaySession:', error.message);
}

export async function pushWishlistItem(item: WishlistItem): Promise<void> {
  if (typeof window === 'undefined') return;
  const userId = await getCurrentUserId();
  if (!userId) return;

  const supabase = createClient();
  const { error } = await supabase.from('wishlist_items').upsert(
    { user_id: userId, id: item.id, data: item as unknown },
    { onConflict: 'user_id,id' },
  );
  if (error) console.error('[sync] pushWishlistItem:', error.message);
}

export async function removeWishlistItem(itemId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const userId = await getCurrentUserId();
  if (!userId) return;

  const supabase = createClient();
  const { error } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('user_id', userId)
    .eq('id', itemId);
  if (error) console.error('[sync] removeWishlistItem:', error.message);
}
