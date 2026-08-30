import { NextRequest } from 'next/server';
import type Anthropic from '@anthropic-ai/sdk';
import { getAnthropic, MODELS } from '@/lib/ai/client';
import { teachSystem, buildGameContext, type AiVoice } from '@/lib/ai/prompts';
import { buildHydratedGameContext } from '@/lib/ai/gameContext';
import { getRulebookAttachment } from '@/lib/ai/rulebook_attach';
import type { TeachPlan, TeachChapter, TeachPlayer } from '@/lib/ai/types';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { AI_LIMITS, clampString } from '@/lib/ai/limits';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

const FILES_BETA = 'files-api-2025-04-14';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TeachRequestBody {
  gameName: string;
  playerCount: number;
  players: TeachPlayer[];
  voice?: AiVoice;
  bggId?: number;
}

function extractJson(text: string): TeachPlan | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(raw.slice(start, end + 1));
    if (
      parsed &&
      typeof parsed.title === 'string' &&
      Array.isArray(parsed.chapters) &&
      parsed.chapters.every(
        (c: unknown) =>
          typeof (c as TeachChapter)?.heading === 'string' &&
          typeof (c as TeachChapter)?.body === 'string',
      )
    ) {
      return parsed as TeachPlan;
    }
  } catch {
    return null;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const gate = await checkRateLimit(req, 'teach', userData.user?.id ?? null);
  if (!gate.ok) return rateLimitResponse(gate);

  let body: TeachRequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { gameName, playerCount, players, voice, bggId } = body;
  if (!gameName || !playerCount || !Array.isArray(players) || players.length === 0) {
    return new Response('gameName, playerCount, and players[] are required', {
      status: 400,
    });
  }
  if (players.length > AI_LIMITS.teach.maxPlayers) {
    return new Response(`Too many players (max ${AI_LIMITS.teach.maxPlayers}).`, {
      status: 413,
    });
  }
  const resolvedVoice: AiVoice = voice === 'plain' ? 'plain' : 'wizard';

  // Cap free-text inputs so they can't bloat the prompt (they're interpolated verbatim).
  const safeGameName = clampString(gameName, AI_LIMITS.teach.maxGameNameChars);
  const safePlayers = players.slice(0, AI_LIMITS.teach.maxPlayers).map((p) => ({
    ...p,
    name: clampString(p?.name, AI_LIMITS.teach.maxNameChars),
  }));
  const extras = { gameName: safeGameName, playerCount, players: safePlayers };
  // Rulebook attachment (full PDF in context) is signed-in-only, matching chat.
  const [hydrated, rulebook] = await Promise.all([
    bggId ? buildHydratedGameContext(supabase, bggId, extras) : Promise.resolve(null),
    bggId && userData.user ? getRulebookAttachment(supabase, bggId) : Promise.resolve(null),
  ]);
  const context = hydrated || buildGameContext(extras);
  const userPrompt = `${context}\n\nTeach this specific group how to play. Return only the JSON object described in the system prompt.`;

  const client = getAnthropic();

  let text: string;

  if (rulebook) {
    const firstContent: Anthropic.Beta.BetaContentBlockParam[] = [
      {
        type: 'document',
        source: { type: 'file', file_id: rulebook.fileId },
        cache_control: { type: 'ephemeral' },
      },
      { type: 'text', text: userPrompt },
    ];
    const response = await client.beta.messages.create({
      model: MODELS.teach,
      max_tokens: 4096,
      system: teachSystem(resolvedVoice, true),
      messages: [{ role: 'user', content: firstContent }],
      betas: [FILES_BETA],
    });
    const textBlock = response.content.find((b) => b.type === 'text');
    text = textBlock && textBlock.type === 'text' ? textBlock.text : '';
  } else {
    const response = await client.messages.create({
      model: MODELS.teach,
      max_tokens: 4096,
      system: teachSystem(resolvedVoice, false),
      messages: [{ role: 'user', content: userPrompt }],
    });
    const textBlock = response.content.find((b) => b.type === 'text');
    text = textBlock && textBlock.type === 'text' ? textBlock.text : '';
  }

  const plan = extractJson(text);
  if (!plan) {
    return Response.json(
      { error: 'Model returned unparseable output', raw: text.slice(0, 500) },
      { status: 502 },
    );
  }

  return Response.json(plan);
}
