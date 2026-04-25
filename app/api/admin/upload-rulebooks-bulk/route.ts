import { NextRequest, NextResponse } from 'next/server';
import { ensureRulebookUploaded, type EnsureRulebookResult } from '@/lib/ai/rulebook_upload';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CONCURRENCY = 3;

function getServiceClient() {
  const { createClient } = require('@supabase/supabase-js');
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

interface Body {
  bggIds?: number[];
  force?: boolean;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const ids = (body.bggIds || []).filter((n) => Number.isFinite(n) && n > 0);
  if (ids.length === 0) {
    return NextResponse.json({ error: 'bggIds (number[]) is required' }, { status: 400 });
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase service client not configured' },
      { status: 500 },
    );
  }

  const results: Array<{ bggId: number } & ({ ok: true; fileId: string; bytes: number; reused: boolean } | { ok: false; error: string })> = [];

  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    const slice = ids.slice(i, i + CONCURRENCY);
    const settled = await Promise.all(
      slice.map(async (bggId): Promise<EnsureRulebookResult & { bggId: number }> => {
        const r = await ensureRulebookUploaded(supabase, bggId, { force: !!body.force });
        return { ...r, bggId };
      }),
    );
    for (const r of settled) {
      if (r.ok) {
        results.push({ bggId: r.bggId, ok: true, fileId: r.fileId, bytes: r.bytes, reused: r.reused });
      } else {
        results.push({ bggId: r.bggId, ok: false, error: r.error });
      }
    }
  }

  const summary = {
    total: results.length,
    succeeded: results.filter((r) => r.ok).length,
    reused: results.filter((r) => r.ok && r.reused).length,
    failed: results.filter((r) => !r.ok).length,
  };

  return NextResponse.json({ ok: true, summary, results });
}
