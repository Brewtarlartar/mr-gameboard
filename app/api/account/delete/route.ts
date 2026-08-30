import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Permanently delete the signed-in user's account and all associated data.
 * Required for App Store (Guideline 5.1.1(v)) and Google Play. The caller must
 * have a valid session; the account is identified from that session, never from
 * the request body, so one user can never delete another.
 */
export async function POST() {
  const supabase = createSupabaseServerClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();
  const user = userData.user;
  if (authError || !user) {
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

  // Sign the current session out so the client is fully logged out.
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
