import { NextRequest, NextResponse } from 'next/server';
import { getRouteUser } from '@/lib/supabase/routeAuth';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Permanently delete the signed-in user's account and all associated data.
 * Required for App Store (Guideline 5.1.1(v)) and Google Play. The caller must
 * have a valid session; the account is identified from that session, never from
 * the request body, so one user can never delete another.
 */
export async function POST(req: NextRequest) {
  // Works from the web (cookie session) AND the native shells (bearer token) —
  // in-app account deletion must function inside the Capacitor WebView too.
  const user = await getRouteUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Server not configured for deletion' }, { status: 500 });
  }

  const { createClient } = require('@supabase/supabase-js');
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Delete the user's rows first, then the auth user itself. Most user tables
  // reference auth.users with ON DELETE CASCADE, but the legacy public.users
  // table (initial schema) references auth.users with NO ACTION, so its row must
  // be removed before deleteUser() or the delete fails with an FK violation.
  // Deleting public.users cascades to its own children (games, play_sessions, …).
  await Promise.allSettled([
    admin.from('library_games').delete().eq('user_id', user.id),
    admin.from('custom_games').delete().eq('user_id', user.id),
    admin.from('user_preferences').delete().eq('user_id', user.id),
    admin.from('wizard_conversations').delete().eq('user_id', user.id),
    admin.from('play_sessions').delete().eq('user_id', user.id),
    admin.from('wishlist_items').delete().eq('user_id', user.id),
    admin.from('users').delete().eq('id', user.id),
  ]);

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Clear the web cookie session if one exists. Native (bearer) callers have
  // nothing server-side to clear — their tokens die with the deleted user.
  await createSupabaseServerClient().auth.signOut();

  return NextResponse.json({ ok: true });
}
