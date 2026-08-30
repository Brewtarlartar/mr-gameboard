import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { clampString } from '@/lib/ai/limits';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Reports are written with the service role — ai_response_reports has RLS
// enabled and no client policies, so this route is the only write path.
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

interface ReportRequestBody {
  bggId?: number;
  gameName?: string;
  question: string;
  answer: string;
  reason?: string;
  grounded?: boolean;
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const gate = await checkRateLimit(req, 'report', userData.user?.id ?? null);
  if (!gate.ok) return rateLimitResponse(gate);

  let body: ReportRequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const question = clampString(body.question, 4000).trim();
  const answer = clampString(body.answer, 8000).trim();
  if (!question || !answer) {
    return new Response('question and answer are required', { status: 400 });
  }

  const service = getServiceClient();
  if (!service) {
    console.error('[/api/ai/report] service client unavailable');
    return new Response('Reporting is unavailable', { status: 503 });
  }

  const { error } = await service.from('ai_response_reports').insert({
    user_id: userData.user?.id ?? null,
    bgg_id: Number.isFinite(body.bggId) ? body.bggId : null,
    game_name: clampString(body.gameName, 200).trim() || null,
    question,
    answer,
    reason: clampString(body.reason, 500).trim() || null,
    grounded: body.grounded === true,
  });

  if (error) {
    console.error('[/api/ai/report] insert failed:', error.message);
    return new Response('Failed to save report', { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
