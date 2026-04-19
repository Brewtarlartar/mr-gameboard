import { NextRequest } from 'next/server';
import { getAnthropic, MODELS } from '@/lib/ai/client';
import { wizardSystem } from '@/lib/ai/prompts';
import { textStreamToResponse } from '@/lib/ai/stream';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ChatRequestBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  gameContext?: string;
}

export async function POST(req: NextRequest) {
  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { messages, gameContext } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response('messages[] is required', { status: 400 });
  }

  const cleaned = messages
    .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
    .map((m) => ({
      role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: m.content,
    }));

  if (cleaned.length === 0 || cleaned[0].role !== 'user') {
    return new Response('First message must be from user', { status: 400 });
  }

  if (gameContext && cleaned[0].role === 'user') {
    cleaned[0] = {
      role: 'user',
      content: `Context for this question:\n${gameContext}\n\n---\n\n${cleaned[0].content}`,
    };
  }

  const client = getAnthropic();
  const stream = client.messages.stream({
    model: MODELS.wizard,
    max_tokens: 1024,
    system: wizardSystem(),
    messages: cleaned,
  });

  return textStreamToResponse(stream);
}
