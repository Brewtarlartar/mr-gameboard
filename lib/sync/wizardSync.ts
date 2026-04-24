/**
 * Cloud sync for wizard conversations.
 *
 * Mirrors librarySync.ts: signed-out / SSR calls are silent no-ops, mutations
 * are fire-and-forget, errors are logged not thrown.
 */

import { createClient } from '@/lib/supabase/client';
import type { WizardMessage } from '@/lib/store/aiStore';
import { getCurrentUserId } from './librarySync';

export interface WizardConversationRow {
  id: string;
  user_id: string;
  game_id: string | null;
  title: string | null;
  messages: WizardMessage[];
  created_at: string;
  updated_at: string;
}

export interface PushWizardConversationInput {
  id: string;
  messages: WizardMessage[];
  gameId?: string;
  title?: string;
}

export async function pushWizardConversation(
  input: PushWizardConversationInput,
): Promise<void> {
  if (typeof window === 'undefined') return;
  const userId = await getCurrentUserId();
  if (!userId) return;

  const supabase = createClient();
  const { error } = await supabase.from('wizard_conversations').upsert(
    {
      id: input.id,
      user_id: userId,
      game_id: input.gameId ?? null,
      title: input.title ?? null,
      messages: input.messages as unknown,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );
  if (error) console.error('[sync] pushWizardConversation:', error.message);
}

export async function pullWizardConversations(): Promise<WizardConversationRow[]> {
  if (typeof window === 'undefined') return [];
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from('wizard_conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) {
    console.error('[sync] pullWizardConversations:', error.message);
    return [];
  }
  return (data ?? []) as WizardConversationRow[];
}

export async function deleteWizardConversation(id: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const userId = await getCurrentUserId();
  if (!userId) return;

  const supabase = createClient();
  const { error } = await supabase
    .from('wizard_conversations')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) console.error('[sync] deleteWizardConversation:', error.message);
}
