import { NextRequest, NextResponse } from 'next/server';
import { ensureRulebookUploaded } from '@/lib/ai/rulebook_upload';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

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
  bggId?: number;
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

  const bggId = body.bggId;
  if (!bggId || !Number.isFinite(bggId)) {
    return NextResponse.json({ error: 'bggId (number) is required' }, { status: 400 });
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase service client not configured' },
      { status: 500 },
    );
  }

  const result = await ensureRulebookUploaded(supabase, bggId, { force: !!body.force });
  if (!result.ok) {
    return NextResponse.json({ ok: false, bggId, error: result.error }, { status: 422 });
  }

  return NextResponse.json({
    ok: true,
    bggId,
    fileId: result.fileId,
    bytes: result.bytes,
    sourceUrl: result.sourceUrl,
    reused: result.reused,
  });
}
