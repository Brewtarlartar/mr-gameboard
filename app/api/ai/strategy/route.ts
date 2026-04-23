import { NextRequest } from 'next/server';
import { getAnthropic, MODELS } from '@/lib/ai/client';
import { strategySystem, buildGameContext } from '@/lib/ai/prompts';
import { textStreamToResponse } from '@/lib/ai/stream';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface StrategyRequestBody {
  gameName: string;
  /** Optional — when omitted or empty, returns whole-game strategy. */
  faction?: string;
  depth: 'overview' | 'deep';
}

export async function POST(req: NextRequest) {
  const gate = await checkRateLimit(req, 'strategy');
  if (!gate.ok) return rateLimitResponse(gate);

  let body: StrategyRequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { gameName, faction, depth } = body;
  const gName = typeof gameName === 'string' ? gameName.trim() : '';
  const factionTrimmed = typeof faction === 'string' ? faction.trim() : '';
  if (!gName || (depth !== 'overview' && depth !== 'deep')) {
    return new Response('gameName and depth are required', { status: 400 });
  }

  const context = buildGameContext({
    gameName: gName,
    ...(factionTrimmed ? { faction: factionTrimmed } : {}),
  });
  const generalGame = !factionTrimmed;
  const userPrompt = generalGame
    ? depth === 'overview'
      ? `${context}\n\nGive me a Strategy Overview for this game as a whole — not focused on a single faction or role unless the game truly has only one path.`
      : `${context}\n\nGive me a Deep Strategy dive for this game as a whole — not focused on a single faction or role unless the game truly has only one path.`
    : depth === 'overview'
      ? `${context}\n\nGive me the Strategy Overview for this faction in this game.`
      : `${context}\n\nGive me the Deep Strategy dive for this faction in this game.`;

  const client = getAnthropic();
  const model = depth === 'deep' ? MODELS.deep : MODELS.overview;

  const createParams: Parameters<typeof client.messages.stream>[0] = {
    model,
    max_tokens: depth === 'deep' ? 4096 : 1500,
    system: strategySystem(depth, { generalGame }),
    messages: [{ role: 'user', content: userPrompt }],
  };

  if (depth === 'deep') {
    createParams.thinking = { type: 'adaptive' };
  }

  const stream = client.messages.stream(createParams);
  return textStreamToResponse(stream);
}
