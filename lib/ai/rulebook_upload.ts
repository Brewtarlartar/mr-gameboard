/**
 * Upload a game's rulebook PDF to Anthropic Files API and persist the
 * resulting file_id on bgg_games_cache. Idempotent: if the row already has
 * a file_id, returns it without re-uploading.
 *
 * URL resolution order:
 *   1. RULEBOOK_OVERRIDES (curated publisher PDFs)
 *   2. bgg_games_cache.rulebook_url (BGG /files endpoint, often HTML)
 *
 * Validation in fetchRulebookPdf rejects HTML pages, so step 2 will fail
 * cleanly for the many games whose stored URL points at a files-listing
 * page. The error is recorded so we don't spin retrying.
 */

import { toFile } from '@anthropic-ai/sdk';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getAnthropic } from './client';
import { getRulebookOverride } from './rulebook_overrides';
import { fetchRulebookPdf, loadLocalRulebookPdf } from './rulebook_fetch';

export type EnsureRulebookResult =
  | { ok: true; fileId: string; bytes: number; sourceUrl: string; reused: boolean }
  | { ok: false; error: string };

interface CacheRow {
  bgg_id: number;
  name: string | null;
  rulebook_url: string | null;
  anthropic_file_id: string | null;
  rulebook_pdf_bytes: number | null;
  rulebook_source_url: string | null;
}

async function loadRow(supabase: SupabaseClient, bggId: number): Promise<CacheRow | null> {
  const { data, error } = await supabase
    .from('bgg_games_cache')
    .select('bgg_id, name, rulebook_url, anthropic_file_id, rulebook_pdf_bytes, rulebook_source_url')
    .eq('bgg_id', bggId)
    .maybeSingle<CacheRow>();
  if (error) {
    console.error(`[rulebook] loadRow ${bggId}:`, error.message);
    return null;
  }
  return data;
}

interface ResolvedSource {
  kind: 'url' | 'file';
  value: string;
  /** Stable identifier we persist to rulebook_source_url for audit. */
  audit: string;
}

function resolveSource(row: CacheRow): ResolvedSource | null {
  const override = getRulebookOverride(row.bgg_id);
  if (override?.filePath) {
    return { kind: 'file', value: override.filePath, audit: `file:${override.filePath}` };
  }
  if (override?.url) {
    return { kind: 'url', value: override.url, audit: override.url };
  }
  if (row.rulebook_url && row.rulebook_url.trim()) {
    const url = row.rulebook_url.trim();
    return { kind: 'url', value: url, audit: url };
  }
  return null;
}

async function recordError(
  supabase: SupabaseClient,
  bggId: number,
  error: string,
  sourceUrl: string | null,
): Promise<void> {
  const { error: dbErr } = await supabase
    .from('bgg_games_cache')
    .update({
      rulebook_upload_error: error,
      rulebook_source_url: sourceUrl,
    })
    .eq('bgg_id', bggId);
  if (dbErr) console.error(`[rulebook] recordError ${bggId}:`, dbErr.message);
}

export async function ensureRulebookUploaded(
  supabase: SupabaseClient,
  bggId: number,
  opts: { force?: boolean } = {},
): Promise<EnsureRulebookResult> {
  const row = await loadRow(supabase, bggId);
  if (!row) return { ok: false, error: 'game_not_in_cache' };

  if (!opts.force && row.anthropic_file_id) {
    return {
      ok: true,
      fileId: row.anthropic_file_id,
      bytes: row.rulebook_pdf_bytes ?? 0,
      sourceUrl: row.rulebook_source_url ?? '',
      reused: true,
    };
  }

  const source = resolveSource(row);
  if (!source) {
    await recordError(supabase, bggId, 'no_source_url', null);
    return { ok: false, error: 'no_source_url' };
  }

  const fetched =
    source.kind === 'file'
      ? await loadLocalRulebookPdf(source.value)
      : await fetchRulebookPdf(source.value);
  if (!fetched.ok) {
    await recordError(supabase, bggId, fetched.error, source.audit);
    return { ok: false, error: fetched.error };
  }

  const filename = `bgg-${bggId}-rulebook.pdf`;
  const client = getAnthropic();

  let uploaded;
  try {
    uploaded = await client.beta.files.upload({
      file: await toFile(fetched.buffer, filename, { type: 'application/pdf' }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    const error = `anthropic_upload_failed: ${msg}`.slice(0, 500);
    await recordError(supabase, bggId, error, source.audit);
    return { ok: false, error };
  }

  // Phase B+: populate the columns the rulebook button reads.
  // - URL-based override → store the publisher URL directly.
  // - File-based override → re-host to private Supabase Storage so the
  //   button can serve it via /api/rulebook/[bggId] with a signed URL.
  let rulebookPublicUrl: string | null = null;
  let rulebookStoragePath: string | null = null;

  if (source.kind === 'url') {
    rulebookPublicUrl = source.value;
  } else {
    const storagePath = `${bggId}.pdf`;
    const { error: storageErr } = await supabase.storage
      .from('rulebooks')
      .upload(storagePath, fetched.buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });
    if (storageErr) {
      // Don't fail the whole upload — Anthropic file is already stored,
      // wizard still works. Just record the storage failure for observability.
      console.error(`[rulebook] storage upload ${bggId}:`, storageErr.message);
    } else {
      rulebookStoragePath = storagePath;
    }
  }

  const { error: dbErr } = await supabase
    .from('bgg_games_cache')
    .update({
      anthropic_file_id: uploaded.id,
      rulebook_uploaded_at: new Date().toISOString(),
      rulebook_pdf_bytes: uploaded.size_bytes ?? fetched.bytes,
      rulebook_source_url: source.audit,
      rulebook_upload_error: null,
      rulebook_public_url: rulebookPublicUrl,
      rulebook_storage_path: rulebookStoragePath,
    })
    .eq('bgg_id', bggId);

  if (dbErr) {
    console.error(`[rulebook] persist ${bggId}:`, dbErr.message);
    return { ok: false, error: `db_persist_failed: ${dbErr.message}`.slice(0, 500) };
  }

  return {
    ok: true,
    fileId: uploaded.id,
    bytes: uploaded.size_bytes ?? fetched.bytes,
    sourceUrl: source.audit,
    reused: false,
  };
}
