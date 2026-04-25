/**
 * Download a rulebook PDF from a URL with safety checks.
 *
 * - HEAD probe: only proceed if Content-Type is application/pdf (BGG often
 *   returns HTML files-listing pages instead of the actual PDF).
 * - Size cap: refuse anything over MAX_PDF_BYTES (Anthropic Files supports
 *   500MB; we cap lower because real rulebooks are tiny in comparison and
 *   anything bigger is almost certainly the wrong file).
 *
 * Returns the buffer + bytes on success, or a structured error string we
 * can persist to bgg_games_cache.rulebook_upload_error for debugging.
 */

const MAX_PDF_BYTES = 32 * 1024 * 1024; // 32 MB
const FETCH_TIMEOUT_MS = 30_000;

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
