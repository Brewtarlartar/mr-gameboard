import { NextRequest } from 'next/server';
import { getAnthropic, MODELS } from '@/lib/ai/client';
import { strategySystem, buildGameContext, type AiVoice } from '@/lib/ai/prompts';
import { buildHydratedGameContext } from '@/lib/ai/gameContext';
import { textStreamToResponse } from '@/lib/ai/stream';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { AI_LIMITS, clampString } from '@/lib/ai/limits';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { getRouteUser } from '@/lib/supabase/routeAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface StrategyRequestBody {
  gameName: string;
  /** Optional — when omitted or empty, returns whole-game strategy. */
  faction?: string;
  depth: 'overview' | 'deep';
  voice?: AiVoice;
  bggId?: number;
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const user = await getRouteUser(req); // cookie (web) or bearer (native shell)
  const gate = await checkRateLimit(req, 'strategy', user?.id ?? null);
  if (!gate.ok) return rateLimitResponse(gate);

  let body: StrategyRequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { gameName, faction, voice, bggId } = body;
  const gName = clampString(gameName, AI_LIMITS.strategy.maxGameNameChars).trim();
  const factionTrimmed = clampString(faction, AI_LIMITS.strategy.maxFactionChars).trim();
  if (!gName || (body.depth !== 'overview' && body.depth !== 'deep')) {
    return new Response('gameName and depth are required', { status: 400 });
  }
  // Deep strategy (the longer, pricier call) is signed-in only. Anonymous
  // requests degrade gracefully to the overview tier.
  const depth = body.depth === 'deep' && user ? 'deep' : 'overview';
  const resolvedVoice: AiVoice = voice === 'plain' ? 'plain' : 'wizard';

  const extras = {
    gameName: gName,
    ...(factionTrimmed ? { faction: factionTrimmed } : {}),
  };
  const hydrated = bggId ? await buildHydratedGameContext(supabase, bggId, extras) : null;
  const context = hydrated || buildGameContext(extras);
  const generalGame = !factionTrimmed;
  const userPrompt = generalGame
    ? depth === 'overview'
      ? `${context}\n\nGive me a Strategy Overview for this game as a whole — not focused on a single faction or role unless the game truly has only one path.`
      : `${context}\n\nGive me a Deep Strategy dive for this game as a whole — not focused on a single faction or role unless the game truly has only one path.`
    : depth === 'overview'
      ? `${context}\n\nGive me the Strategy Overview for this faction in this game.`
      : `${context}\n\nGive me the Deep Strategy dive for this faction in this game.`;

  const client = getAnthropic();

  // Both depths run on Sonnet — the Opus tier was the most expensive call in
  // the app for content that can't cite a rulebook; the deep dive keeps its
  // longer format, just on the cheaper model.
  const stream = client.messages.stream({
    model: MODELS.overview,
    max_tokens: depth === 'deep' ? 4096 : 1500,
    system: strategySystem(depth, { generalGame, voice: resolvedVoice }),
    messages: [{ role: 'user', content: userPrompt }],
  });
  return textStreamToResponse(stream);
}
