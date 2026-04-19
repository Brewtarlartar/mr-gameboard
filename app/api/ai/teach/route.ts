import { NextRequest } from 'next/server';
import { getAnthropic, MODELS } from '@/lib/ai/client';
import { teachSystem, buildGameContext } from '@/lib/ai/prompts';
import type { TeachPlan, TeachChapter, TeachPlayer } from '@/lib/ai/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TeachRequestBody {
  gameName: string;
  playerCount: number;
  players: TeachPlayer[];
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
  let body: TeachRequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { gameName, playerCount, players } = body;
  if (!gameName || !playerCount || !Array.isArray(players) || players.length === 0) {
    return new Response('gameName, playerCount, and players[] are required', {
      status: 400,
    });
  }

  const context = buildGameContext({ gameName, playerCount, players });
  const userPrompt = `${context}\n\nTeach this specific group how to play. Return only the JSON object described in the system prompt.`;

  const client = getAnthropic();
  const response = await client.messages.create({
    model: MODELS.teach,
    max_tokens: 4096,
    system: teachSystem(),
    messages: [{ role: 'user', content: userPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  const text = textBlock && textBlock.type === 'text' ? textBlock.text : '';

  const plan = extractJson(text);
  if (!plan) {
    return Response.json(
      { error: 'Model returned unparseable output', raw: text.slice(0, 500) },
      { status: 502 },
    );
  }

  return Response.json(plan);
}
