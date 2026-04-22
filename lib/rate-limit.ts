import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { NextRequest } from 'next/server';

type RouteKey = 'chat' | 'strategy' | 'teach';

const LIMITS: Record<RouteKey, { minute: number; day: number }> = {
  chat: { minute: 20, day: 200 },
  strategy: { minute: 10, day: 50 },
  teach: { minute: 5, day: 20 },
};

let redisSingleton: Redis | null = null;
function getRedis(): Redis | null {
  if (redisSingleton) return redisSingleton;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
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

export async function checkRateLimit(
  req: NextRequest,
  route: RouteKey,
): Promise<RateLimitResult> {
  const limits = LIMITS[route];
  const ip = getClientIp(req);
  const key = `ip:${ip}`;

  const perMinute = getLimiter(`${route}:min`, limits.minute, '1 m');
  if (!perMinute) return { ok: true };

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

  const perDay = getLimiter(`${route}:day`, limits.day, '1 d');
  if (!perDay) return { ok: true };

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
