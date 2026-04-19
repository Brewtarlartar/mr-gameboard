import Anthropic from '@anthropic-ai/sdk';

let cached: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (cached) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set. Add it to .env.local.');
  }
  cached = new Anthropic({ apiKey });
  return cached;
}

export const MODELS = {
  wizard: 'claude-haiku-4-5',
  overview: 'claude-sonnet-4-6',
  deep: 'claude-opus-4-7',
  teach: 'claude-sonnet-4-6',
} as const;
