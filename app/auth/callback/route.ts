import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Only allow relative, single-slash paths so `next` can't be used as an open
// redirect (e.g. `next=https://evil.com` or `next=//evil.com`).
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) {
    return '/me';
  }
  return raw;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = safeNext(url.searchParams.get('next'));

  if (!code) {
    return NextResponse.redirect(new URL('/auth/sign-in?error=missing_code', url.origin));
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(`/auth/sign-in?error=${encodeURIComponent(error.message)}`, url.origin),
    );
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
