import type Anthropic from '@anthropic-ai/sdk';

type SupportedStream =
  | ReturnType<Anthropic['messages']['stream']>
  | ReturnType<Anthropic['beta']['messages']['stream']>;

export const AI_UNAVAILABLE_MESSAGE =
  'The Oracle cannot be reached right now. This is on our end, not yours \u2014 please try again later.';

export function textStreamToResponse(
  stream: SupportedStream,
  extraHeaders?: Record<string, string>,
): Response {
  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      let sentText = false;
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
            sentText = true;
          }
        }
        controller.close();
      } catch (err) {
        // The upstream call can fail before the first token (exhausted quota,
        // provider outage) or midway through an answer. Erroring the stream
        // surfaces as a blank 500 page, so close with a readable sentence
        // instead — appended on its own line if an answer had already begun.
        console.error('[ai] stream failed', err);
        controller.enqueue(
          encoder.encode((sentText ? '\n\n' : '') + AI_UNAVAILABLE_MESSAGE),
        );
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      'X-Accel-Buffering': 'no',
      ...extraHeaders,
    },
  });
}
