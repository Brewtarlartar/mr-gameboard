import { NextRequest } from 'next/server';
import { getAnthropic, MODELS } from '@/lib/ai/client';
import { strategySystem, buildGameContext } from '@/lib/ai/prompts';
import { textStreamToResponse } from '@/lib/ai/stream';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface StrategyRequestBody {
  gameName: string;
  faction: string;
  depth: 'overview' | 'deep';
}

export async function POST(req: NextRequest) {
  let body: StrategyRequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { gameName, faction, depth } = body;
  if (!gameName || !faction || (depth !== 'overview' && depth !== 'deep')) {
    return new Response('gameName, faction, and depth are required', { status: 400 });
  }

  const context = buildGameContext({ gameName, faction });
  const userPrompt =
    depth === 'overview'
      ? `${context}\n\nGive me the Strategy Overview for this faction in this game.`
      : `${context}\n\nGive me the Deep Strategy dive for this faction in this game.`;

  const client = getAnthropic();
  const model = depth === 'deep' ? MODELS.deep : MODELS.overview;

  const createParams: Parameters<typeof client.messages.stream>[0] = {
    model,
    max_tokens: depth === 'deep' ? 4096 : 1500,
    system: strategySystem(depth),
    messages: [{ role: 'user', content: userPrompt }],
  };

  if (depth === 'deep') {
    createParams.thinking = { type: 'adaptive' };
  }

  const stream = client.messages.stream(createParams);
  return textStreamToResponse(stream);
}
