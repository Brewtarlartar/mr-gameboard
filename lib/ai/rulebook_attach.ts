/**
 * Read-only helper for chat/teach routes: given a bggId, return the
 * anthropic_file_id for the rulebook if one has been pre-uploaded, or null.
 *
 * Does NOT trigger an upload — pre-warming is an explicit admin action via
 * /api/admin/upload-rulebook(s). Lazy upload was rejected to avoid
 * degrading the first wizard answer.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface RulebookAttachment {
  fileId: string;
}

export async function getRulebookAttachment(
  supabase: SupabaseClient,
  bggId: number | null | undefined,
): Promise<RulebookAttachment | null> {
  if (!bggId || !Number.isFinite(bggId)) return null;
  const { data, error } = await supabase
    .from('bgg_games_cache')
    .select('anthropic_file_id')
    .eq('bgg_id', bggId)
    .maybeSingle<{ anthropic_file_id: string | null }>();
  if (error || !data?.anthropic_file_id) return null;
  return { fileId: data.anthropic_file_id };
}
