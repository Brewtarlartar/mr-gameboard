/**
 * BGG collection import: GET ?username=<bgg username>
 *   → { ok: true, items: BggCollectionItem[] }
 *   → { ok: false, error, queued?: true } while BGG is still building the
 *     export (BGG answers 202 for a fresh collection request; we retry a few
 *     times server-side, then ask the client to try again shortly).
 *
 * Public endpoint like /api/bgg/add — collection data is public on BGG and
 * there is no AI cost here; BGG's own rate limits apply upstream.
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchBggCollection } from '@/lib/bgg/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_ITEMS = 500;
const RETRIES = 3;
const RETRY_DELAY_MS = 2500;

const USERNAME_RE = /^[A-Za-z0-9_.\- ]{1,64}$/;

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username')?.trim() ?? '';
  if (!USERNAME_RE.test(username)) {
    return NextResponse.json(
      { ok: false, error: 'A valid BoardGameGeek username is required.' },
      { status: 400 },
    );
  }

  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    const result = await fetchBggCollection(username);

    if (result.status === 'ok') {
      return NextResponse.json({ ok: true, items: result.items.slice(0, MAX_ITEMS) });
    }
    if (result.status === 'not_found') {
      return NextResponse.json(
        { ok: false, error: `BoardGameGeek doesn't know the user "${username}".` },
        { status: 404 },
      );
    }
    if (result.status === 'queued' && attempt < RETRIES) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      continue;
    }
    if (result.status === 'queued') {
      return NextResponse.json(
        {
          ok: false,
          queued: true,
          error: 'BoardGameGeek is preparing the collection — try again in a moment.',
        },
        { status: 202 },
      );
    }
    break;
  }

  return NextResponse.json(
    { ok: false, error: 'BoardGameGeek did not answer. Try again shortly.' },
    { status: 502 },
  );
}
