/**
 * Request-shape caps for the AI routes. These run BEFORE any Anthropic call so
 * an anonymous caller cannot push megabytes of text into the model (input
 * tokens are billed) or blow up the prompt with an unbounded players[] array.
 * They are intentionally generous for real use and only reject abuse.
 */

export const AI_LIMITS = {
  chat: { maxMessages: 40, maxTotalChars: 24_000, maxMessageChars: 12_000 },
  teach: { maxPlayers: 12, maxNameChars: 120, maxGameNameChars: 200 },
  strategy: { maxGameNameChars: 200, maxFactionChars: 200 },
} as const;

/** Trim a string to a hard ceiling. Non-strings collapse to ''. */
export function clampString(v: unknown, max: number): string {
  return typeof v === 'string' ? v.slice(0, max) : '';
}

/**
 * Validate a chat messages[] array against the caps. Returns an error string
 * (for a 4xx body) or null when the payload is acceptable.
 */
export function checkChatSize(
  messages: Array<{ content?: unknown }>,
): string | null {
  if (messages.length > AI_LIMITS.chat.maxMessages) {
    return `Too many messages (max ${AI_LIMITS.chat.maxMessages}).`;
  }
  let total = 0;
  for (const m of messages) {
    const len = typeof m?.content === 'string' ? m.content.length : 0;
    if (len > AI_LIMITS.chat.maxMessageChars) {
      return `A single message is too long (max ${AI_LIMITS.chat.maxMessageChars} characters).`;
    }
    total += len;
  }
  if (total > AI_LIMITS.chat.maxTotalChars) {
    return `Conversation is too long (max ${AI_LIMITS.chat.maxTotalChars} characters).`;
  }
  return null;
}
