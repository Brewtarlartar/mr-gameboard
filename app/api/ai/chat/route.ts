import { NextRequest } from 'next/server';
import { getAnthropic, MODELS } from '@/lib/ai/client';
import { wizardSystem, type AiVoice } from '@/lib/ai/prompts';
import { buildHydratedGameContext } from '@/lib/ai/gameContext';
import { textStreamToResponse } from '@/lib/ai/stream';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ChatRequestBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  gameContext?: string;
  bggId?: number;
  gameName?: string;
  voice?: AiVoice;
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const gate = await checkRateLimit(req, 'chat', userData.user?.id ?? null);
  if (!gate.ok) return rateLimitResponse(gate);

  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { messages, gameContext, bggId, gameName, voice } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response('messages[] is required', { status: 400 });
  }
  const resolvedVoice: AiVoice = voice === 'plain' ? 'plain' : 'wizard';

  const cleaned = messages
    .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
    .map((m) => ({
      role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: m.content,
    }));

  if (cleaned.length === 0 || cleaned[0].role !== 'user') {
    return new Response('First message must be from user', { status: 400 });
  }

  const hydrated = bggId
    ? await buildHydratedGameContext(supabase, bggId, { gameName })
    : null;
  const resolvedContext = hydrated || gameContext;

  if (resolvedContext && cleaned[0].role === 'user') {
    cleaned[0] = {
      role: 'user',
      content: `Context for this question:\n${resolvedContext}\n\n---\n\n${cleaned[0].content}`,
    };
  }

  const client = getAnthropic();
  const stream = client.messages.stream({
    model: MODELS.wizard,
    max_tokens: 1024,
    system: wizardSystem(resolvedVoice),
    messages: cleaned,
  });

  return textStreamToResponse(stream);
}
