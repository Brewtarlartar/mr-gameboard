import { createClient } from '@/lib/supabase/client';

/** True inside the Capacitor shell (statically inlined per build). */
export const IS_NATIVE = process.env.NEXT_PUBLIC_CAPACITOR_BUILD === '1';

// Web build: '' → same-origin relative /api calls, auth flows via cookies.
// Native build: absolute base to the hosted Vercel API, auth via bearer token
// (cookies never cross the capacitor://localhost origin).
const API_BASE = IS_NATIVE ? process.env.NEXT_PUBLIC_API_BASE || 'https://the-tome.vercel.app' : '';

/**
 * Drop-in replacement for fetch('/api/...'): prefixes the API base and, in the
 * native shell, attaches the signed-in user's JWT as a bearer token (server
 * routes accept it via lib/supabase/routeAuth).
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  let headers = init.headers;
  const hasExplicitAuth = init.headers
    ? new Headers(init.headers as HeadersInit).has('authorization')
    : false;
  if (IS_NATIVE && !hasExplicitAuth) {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers = {
        ...(init.headers as Record<string, string> | undefined),
        Authorization: `Bearer ${session.access_token}`,
      };
    }
  }
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}
