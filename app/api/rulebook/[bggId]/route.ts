import { NextRequest, NextResponse } from 'next/server';
import { rulebookUrlWithFallback } from '@/lib/bgg/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

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
  rulebook_storage_path: string | null;
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
    .select('bgg_id, name, rulebook_public_url, rulebook_storage_path, rulebook_url')
    .eq('bgg_id', bggId)
    .maybeSingle();
  const data = rawData as CacheRow | null;

  if (error) {
    console.error(`[/api/rulebook/${bggId}] db error:`, error.message);
  }

  // 1. Direct publisher URL — preferred.
  if (data?.rulebook_public_url) {
    return NextResponse.redirect(data.rulebook_public_url, 302);
  }

  // 2. Local file re-hosted to Supabase Storage — sign a short-lived URL.
  if (data?.rulebook_storage_path) {
    const { data: signed, error: signErr } = await supabase.storage
      .from('rulebooks')
      .createSignedUrl(data.rulebook_storage_path, SIGNED_URL_TTL_SECONDS);
    if (signed?.signedUrl) {
      return NextResponse.redirect(signed.signedUrl, 302);
    }
    console.error(`[/api/rulebook/${bggId}] sign error:`, signErr?.message);
  }

  // 3. Legacy / Google fallback — same as before, just dynamic.
  const fallback = rulebookUrlWithFallback(bggId, data?.name ?? null, data?.rulebook_url ?? null);
  return NextResponse.redirect(fallback, 302);
}
