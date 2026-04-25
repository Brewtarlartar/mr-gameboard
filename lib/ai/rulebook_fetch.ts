/**
 * Download a rulebook PDF from a URL — or read one from local disk —
 * with safety checks.
 *
 * - HEAD probe (URL only): only proceed if Content-Type is application/pdf
 *   (BGG often returns HTML files-listing pages instead of the actual PDF).
 * - Size cap: refuse anything over MAX_PDF_BYTES. Stonemaier's larger
 *   "Complete Rulebook" PDFs run ~58 MB; Anthropic Files supports 500 MB,
 *   but we cap at 100 MB to flag mistakes early.
 * - PDF magic-byte check: rejects anything that isn't actually a PDF.
 *
 * Returns the buffer + bytes on success, or a structured error string we
 * can persist to bgg_games_cache.rulebook_upload_error for debugging.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

const MAX_PDF_BYTES = 100 * 1024 * 1024; // 100 MB
const FETCH_TIMEOUT_MS = 60_000;

export type RulebookFetchResult =
  | { ok: true; buffer: Buffer; bytes: number; contentType: string }
  | { ok: false; error: string };

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctl.signal });
  } finally {
    clearTimeout(t);
  }
}

export async function fetchRulebookPdf(url: string): Promise<RulebookFetchResult> {
  if (!url || !/^https?:\/\//i.test(url)) {
    return { ok: false, error: `invalid_url: ${url.slice(0, 80)}` };
  }

  let headRes: Response;
  try {
    headRes = await fetchWithTimeout(url, { method: 'HEAD', redirect: 'follow' }, 15_000);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    return { ok: false, error: `head_failed: ${msg}` };
  }

  if (!headRes.ok) {
    return { ok: false, error: `head_status_${headRes.status}` };
  }

  const contentType = (headRes.headers.get('content-type') || '').toLowerCase();
  if (!contentType.includes('application/pdf')) {
    return {
      ok: false,
      error: `not_pdf: content-type=${contentType.slice(0, 60) || 'missing'}`,
    };
  }

  const declaredLength = parseInt(headRes.headers.get('content-length') || '', 10);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_PDF_BYTES) {
    return { ok: false, error: `too_large: ${declaredLength} bytes` };
  }

  let getRes: Response;
  try {
    getRes = await fetchWithTimeout(url, { method: 'GET', redirect: 'follow' }, FETCH_TIMEOUT_MS);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    return { ok: false, error: `get_failed: ${msg}` };
  }

  if (!getRes.ok) {
    return { ok: false, error: `get_status_${getRes.status}` };
  }

  const ab = await getRes.arrayBuffer();
  if (ab.byteLength > MAX_PDF_BYTES) {
    return { ok: false, error: `too_large: ${ab.byteLength} bytes` };
  }

  const buffer = Buffer.from(ab);
  // Sanity: PDF magic bytes are %PDF-
  if (buffer.length < 5 || buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
    return { ok: false, error: 'bad_magic_bytes' };
  }

  return { ok: true, buffer, bytes: buffer.length, contentType };
}

/**
 * Load a rulebook PDF from local disk. Used for publisher PDFs that
 * aren't directly hostable (Stonemaier Dropbox, files behind login pages).
 * Pre-warm runs locally, so this only matters on the dev machine.
 *
 * filePath may be absolute or relative to the project root (CWD when the
 * Next.js server is running). Spaces and parens are tolerated.
 */
export async function loadLocalRulebookPdf(filePath: string): Promise<RulebookFetchResult> {
  if (!filePath || typeof filePath !== 'string') {
    return { ok: false, error: 'invalid_file_path' };
  }
  const abs = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

  let buffer: Buffer;
  try {
    buffer = await readFile(abs);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    return { ok: false, error: `read_failed: ${msg}`.slice(0, 200) };
  }

  if (buffer.length > MAX_PDF_BYTES) {
    return { ok: false, error: `too_large: ${buffer.length} bytes` };
  }
  if (buffer.length < 5 || buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
    return { ok: false, error: 'bad_magic_bytes' };
  }

  return { ok: true, buffer, bytes: buffer.length, contentType: 'application/pdf' };
}
