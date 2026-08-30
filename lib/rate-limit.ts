import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { NextRequest } from 'next/server';

type RouteKey = 'chat' | 'strategy' | 'teach' | 'report';

// Anonymous tiers are a teaser, not a product: anon chat runs Haiku-only (the
// rulebook/Sonnet path requires sign-in — see app/api/ai/chat/route.ts), so the
// worst-case anonymous spend per IP/day stays under ~$0.50.
const LIMITS_ANON: Record<RouteKey, { minute: number; day: number }> = {
  chat: { minute: 5, day: 10 },
  strategy: { minute: 2, day: 2 },
  teach: { minute: 2, day: 2 },
  report: { minute: 3, day: 10 },
};

// Abuse ceilings, not product caps — far above real game-night usage but low
// enough that one hostile account can't run up a meaningful Anthropic bill.
const LIMITS_SIGNED_IN: Record<RouteKey, { minute: number; day: number }> = {
  chat: { minute: 15, day: 100 },
  strategy: { minute: 10, day: 30 },
  teach: { minute: 10, day: 20 },
  report: { minute: 5, day: 30 },
};

let redisSingleton: Redis | null = null;
function getRedis(): Redis | null {
  if (redisSingleton) return redisSingleton;
  // Vercel Marketplace's Upstash integration provisions KV_REST_API_*.
  // Accept both names so manual setups (UPSTASH_REDIS_REST_*) also work.
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redisSingleton = new Redis({ url, token });
  return redisSingleton;
}

const limiterCache = new Map<string, Ratelimit>();
function getLimiter(
  cacheKey: string,
  limit: number,
  window: `${number} s` | `${number} m` | `${number} h` | `${number} d`,
): Ratelimit | null {
  const client = getRedis();
  if (!client) return null;
  let limiter = limiterCache.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: `ratelimit:${cacheKey}`,
      analytics: false,
    });
    limiterCache.set(cacheKey, limiter);
  }
  return limiter;
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

export type RateLimitDeny = {
  ok: false;
  retryAfterSeconds: number;
  message: string;
  scope: 'minute' | 'day';
};

export type RateLimitResult = { ok: true } | RateLimitDeny;

// When Redis isn't configured we can't enforce limits. In production that must
// FAIL CLOSED — an unconfigured limiter would otherwise silently grant every
// anonymous caller unlimited access to the (billed) Anthropic API. In local
// dev we fail open so the app is usable without provisioning Upstash.
let warnedUnconfigured = false;
function limiterUnavailable(): RateLimitResult {
  // Fail closed only in real production (Vercel prod, or a non-Vercel prod build).
  // Vercel PREVIEW deployments and local dev fail open so they stay usable without
  // provisioning Redis.
  const isProd =
    process.env.VERCEL_ENV === 'production' ||
    (process.env.NODE_ENV === 'production' && !process.env.VERCEL);
  if (!warnedUnconfigured) {
    warnedUnconfigured = true;
    console.error(
      '[rate-limit] Redis not configured (KV_REST_API_URL / UPSTASH_REDIS_REST_URL missing).' +
        (isProd ? ' Failing CLOSED in production.' : ' Failing open in development.'),
    );
  }
  if (isProd) {
    return {
      ok: false,
      scope: 'minute',
      retryAfterSeconds: 60,
      message: 'The Tome is briefly unavailable. Please try again in a moment.',
    };
  }
  return { ok: true };
}

export async function checkRateLimit(
  req: NextRequest,
  route: RouteKey,
  userId?: string | null,
): Promise<RateLimitResult> {
  const signedIn = Boolean(userId);
  const limits = signedIn ? LIMITS_SIGNED_IN[route] : LIMITS_ANON[route];
  const key = signedIn ? `user:${userId}` : `ip:${getClientIp(req)}`;
  const tier = signedIn ? 'signedin' : 'anon';

  const perMinute = getLimiter(`${route}:${tier}:min`, limits.minute, '1 m');
  if (!perMinute) return limiterUnavailable();

  const minResult = await perMinute.limit(key);
  if (!minResult.success) {
    const waitMs = Math.max(0, minResult.reset - Date.now());
    const retryAfterSeconds = Math.max(1, Math.ceil(waitMs / 1000));
    return {
      ok: false,
      scope: 'minute',
      retryAfterSeconds,
      message: `The Tome must rest a moment. Try again in ${retryAfterSeconds}s.`,
    };
  }

  const perDay = getLimiter(`${route}:${tier}:day`, limits.day, '1 d');
  if (!perDay) return limiterUnavailable();

  const dayResult = await perDay.limit(key);
  if (!dayResult.success) {
    const waitMs = Math.max(0, dayResult.reset - Date.now());
    const retryAfterSeconds = Math.max(60, Math.ceil(waitMs / 1000));
    return {
      ok: false,
      scope: 'day',
      retryAfterSeconds,
      message: `Thou hast reached thy daily quota. Rest and return on the morrow.`,
    };
  }

  return { ok: true };
}

export function rateLimitResponse(deny: RateLimitDeny): Response {
  return new Response(
    JSON.stringify({
      error: 'rate_limited',
      scope: deny.scope,
      message: deny.message,
      retryAfterSeconds: deny.retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(deny.retryAfterSeconds),
      },
    },
  );
}
