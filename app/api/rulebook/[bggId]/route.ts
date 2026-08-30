import { NextRequest, NextResponse } from 'next/server';
import { rulebookUrlWithFallback } from '@/lib/bgg/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Domains that re-host publisher PDFs without permission. Linking users to
// them outsources our licensing problem instead of solving it — treat these
// rows as unlinked and fall through to the BGG files page.
const MIRROR_DOMAINS = ['1j1ju.com', '1jour-1jeu.com'];

function isMirrorUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return MIRROR_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return true; // unparseable URL — don't redirect users to it
  }
}

function getServiceClient() {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

interface CacheRow {
  bgg_id: number;
  name: string | null;
  rulebook_public_url: string | null;
  rulebook_url: string | null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { bggId: string } },
) {
  const bggId = parseInt(params.bggId, 10);
  if (!Number.isFinite(bggId) || bggId <= 0) {
    return NextResponse.json({ error: 'Invalid bggId' }, { status: 400 });
  }

  const supabase = getServiceClient();
  if (!supabase) {
    // Misconfigured server — fall back to BGG / Google so the button is still useful.
    const fallback = rulebookUrlWithFallback(bggId, null, null);
    return NextResponse.redirect(fallback, 302);
  }

  const { data: rawData, error } = await supabase
    .from('bgg_games_cache')
    .select('bgg_id, name, rulebook_public_url, rulebook_url')
    .eq('bgg_id', bggId)
    .maybeSingle();
  const data = rawData as CacheRow | null;

  if (error) {
    console.error(`[/api/rulebook/${bggId}] db error:`, error.message);
  }

  // 1. Direct publisher URL — preferred. Mirror-hosted URLs are skipped: we
  // link only to official sources. (The Supabase Storage tier that used to sit
  // here re-distributed publisher PDFs without permission and was removed —
  // private AI grounding via anthropic_file_id is unaffected.)
  if (data?.rulebook_public_url && !isMirrorUrl(data.rulebook_public_url)) {
    return NextResponse.redirect(data.rulebook_public_url, 302);
  }

  // 2. Legacy / Google fallback — same as before, just dynamic.
  const fallback = rulebookUrlWithFallback(bggId, data?.name ?? null, data?.rulebook_url ?? null);
  return NextResponse.redirect(fallback, 302);
}
