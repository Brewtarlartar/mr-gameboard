/**
 * Admin review API for rulebook link candidates.
 *
 * GET  → pending candidates joined with game name/art (oldest first, max 100)
 * POST { id, action: 'approve' | 'reject' }
 *   approve → status='approved', verified_at=now, denormalize url into
 *             bgg_games_cache.rulebook_url (what /api/rulebook serves)
 *   reject  → status='rejected'
 *
 * Auth: same Bearer CRON_SECRET as the other admin routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get('authorization') || '';
  return header === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return new Response('Unauthorized', { status: 401 });
  const supabase = getServiceClient();
  if (!supabase) return new Response('Server misconfigured', { status: 503 });

  const { data: pending, error } = await supabase
    .from('rulebook_links')
    .select('id, bgg_id, url, source_type, label, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = (pending ?? []).map((p) => p.bgg_id);
  const games = new Map<number, { name: string; thumbnail: string | null; rank: number | null }>();
  if (ids.length > 0) {
    const { data: rows } = await supabase
      .from('bgg_games_cache')
      .select('bgg_id, name, thumbnail, rank')
      .in('bgg_id', ids);
    for (const r of rows ?? []) {
      games.set(r.bgg_id, { name: r.name, thumbnail: r.thumbnail, rank: r.rank });
    }
  }

  return NextResponse.json({
    pending: (pending ?? []).map((p) => ({
      ...p,
      game: games.get(p.bgg_id) ?? null,
    })),
  });
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return new Response('Unauthorized', { status: 401 });
  const supabase = getServiceClient();
  if (!supabase) return new Response('Server misconfigured', { status: 503 });

  let body: { id?: string; action?: string };
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }
  const { id, action } = body;
  if (!id || (action !== 'approve' && action !== 'reject')) {
    return new Response('id and action (approve|reject) are required', { status: 400 });
  }

  const { data: link, error: findErr } = await supabase
    .from('rulebook_links')
    .select('id, bgg_id, url')
    .eq('id', id)
    .maybeSingle();
  if (findErr || !link) return new Response('Link not found', { status: 404 });

  const status = action === 'approve' ? 'approved' : 'rejected';
  const { error: upErr } = await supabase
    .from('rulebook_links')
    .update({
      status,
      verified_at: action === 'approve' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  if (action === 'approve') {
    const { error: denErr } = await supabase
      .from('bgg_games_cache')
      .update({ rulebook_url: link.url })
      .eq('bgg_id', link.bgg_id);
    if (denErr) return NextResponse.json({ error: denErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id, status });
}
