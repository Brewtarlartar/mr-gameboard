import type { NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

/**
 * Resolve the signed-in user for an API route from EITHER auth transport:
 * - Authorization: Bearer <jwt> — the Capacitor shells (cookies never cross
 *   the capacitor://localhost origin). Verified against Supabase Auth.
 * - Cookies — the web app, via the existing @supabase/ssr server client.
 *
 * Returns null for anonymous callers. Routes that also need a data client for
 * public-table reads keep using createClient from ./server as before.
 */
export async function getRouteUser(req: NextRequest): Promise<User | null> {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) return null;
    const supabase = createSupabaseJsClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await supabase.auth.getUser(token);
    if (error) return null;
    return data.user ?? null;
  }

  const supabase = createServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
