import { NextRequest } from 'next/server';
import type Anthropic from '@anthropic-ai/sdk';
import { getAnthropic, MODELS } from '@/lib/ai/client';
import { wizardSystem, type AiVoice } from '@/lib/ai/prompts';
import { buildHydratedGameContext } from '@/lib/ai/gameContext';
import { getRulebookAttachment } from '@/lib/ai/rulebook_attach';
import { textStreamToResponse } from '@/lib/ai/stream';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FILES_BETA = 'files-api-2025-04-14';

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
      content: m.content as string,
    }));

  if (cleaned.length === 0 || cleaned[0].role !== 'user') {
    return new Response('First message must be from user', { status: 400 });
  }

  const [hydrated, rulebook] = await Promise.all([
    bggId ? buildHydratedGameContext(supabase, bggId, { gameName }) : Promise.resolve(null),
    bggId ? getRulebookAttachment(supabase, bggId) : Promise.resolve(null),
  ]);
  const resolvedContext = hydrated || gameContext;

  const groundedFirst =
    resolvedContext && cleaned[0].role === 'user'
      ? `Context for this question:\n${resolvedContext}\n\n---\n\n${cleaned[0].content}`
      : cleaned[0].content;

  const client = getAnthropic();

  if (rulebook) {
    // Document block must precede the variable game-context text so the
    // cache breakpoint stays stable across questions about the same game.
    const firstContent: Anthropic.Beta.BetaContentBlockParam[] = [
      {
        type: 'document',
        source: { type: 'file', file_id: rulebook.fileId },
        cache_control: { type: 'ephemeral' },
      },
      { type: 'text', text: groundedFirst },
    ];
    const betaMessages: Anthropic.Beta.BetaMessageParam[] = [
      { role: 'user', content: firstContent },
      ...cleaned.slice(1).map((m) => ({ role: m.role, content: m.content })),
    ];

    // When a rulebook PDF is attached, route to Sonnet (overview model)
    // rather than Haiku. Haiku 4.5 caps PDF documents at 100 pages and
    // Anthropic 400s on anything larger; Sonnet 4.6 accepts up to 600.
    // Cost is small for personal use and answers are better-grounded.
    const stream = client.beta.messages.stream({
      model: MODELS.overview,
      max_tokens: 1024,
      system: wizardSystem(resolvedVoice, true),
      messages: betaMessages,
      betas: [FILES_BETA],
    });
    return textStreamToResponse(stream);
  }

  const stream = client.messages.stream({
    model: MODELS.wizard,
    max_tokens: 1024,
    system: wizardSystem(resolvedVoice, false),
    messages: [
      { role: 'user', content: groundedFirst },
      ...cleaned.slice(1),
    ],
  });

  return textStreamToResponse(stream);
}
