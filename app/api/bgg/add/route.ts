/**
 * Manual "Add by BGG link/ID" escape hatch.
 *
 * POST { bggId: number }
 *   → fetches the game from BGG XML API, upserts into bgg_games_cache,
 *     returns { ok, bggId, name } on success or { ok: false, error } on
 *     failure (BGG returned no data, network failure, etc.).
 *
 * Public endpoint — no auth gate. The underlying upsert uses service role
 * because RLS blocks anon writes to bgg_games_cache. Rate-limit is BGG's
 * own (we throttle nothing here; volume is naturally low).
 */

import { NextRequest, NextResponse } from 'next/server';
import { backfillFromBgg } from '@/lib/bgg/backfill';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body {
  bggId?: number | string;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const raw = body.bggId;
  const bggId = typeof raw === 'number' ? raw : parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(bggId) || bggId <= 0) {
    return NextResponse.json(
      { ok: false, error: 'bggId (positive integer) is required' },
      { status: 400 },
    );
  }

  const row = await backfillFromBgg(bggId);
  if (!row) {
    return NextResponse.json(
      {
        ok: false,
        error: `BoardGameGeek doesn't know game ID ${bggId}. Double-check the link.`,
      },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, bggId: row.bgg_id, name: row.name });
}
