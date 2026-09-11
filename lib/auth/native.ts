/**
 * Native (Capacitor shell) auth flows.
 *
 * Google blocks OAuth inside embedded WebViews (disallowed_useragent), and the
 * web PKCE callback is a server route that doesn't exist in the static export.
 * So the shell signs in via the system browser and returns through a deep link:
 *
 *   signInWithOAuth({ skipBrowserRedirect }) → Browser.open(url)
 *   → provider → Supabase → com.javiermacias.thetome://callback?code=…
 *   → appUrlOpen (or getLaunchUrl on cold start) → exchangeCodeForSession(code)
 *
 * Email uses a 6-digit OTP code typed into the app — zero redirects. The
 * Supabase Magic Link email template must include {{ .Token }} for the code to
 * be present in the email, and the redirect allowlist must contain
 * com.javiermacias.thetome://** (dashboard, one-time).
 */

import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { createClient } from '@/lib/supabase/client';

export const NATIVE_REDIRECT = 'com.javiermacias.thetome://callback';

export async function signInWithGoogleNative(): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: NATIVE_REDIRECT, skipBrowserRedirect: true },
  });
  if (error) throw error;
  // SFSafariViewController / Chrome Custom Tab — allowed by Google, unlike a
  // raw WebView.
  await Browser.open({ url: data.url });
}

async function handleAuthUrl(url: string | null | undefined): Promise<void> {
  if (!url || !url.startsWith(NATIVE_REDIRECT)) return;
  const code = new URL(url).searchParams.get('code');
  if (!code) return;
  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) console.error('[native-auth] code exchange failed:', error.message);
  try {
    await Browser.close();
  } catch {
    // Android Custom Tabs close themselves; Browser.close is iOS-only.
  }
}

let registered = false;

/** Register the deep-link listener once at app bootstrap (native builds only). */
export function initNativeAuthListener(): void {
  if (registered) return;
  registered = true;
  void App.addListener('appUrlOpen', ({ url }) => {
    void handleAuthUrl(url);
  });
  // Cold start: the app may have been launched BY the deep link.
  void App.getLaunchUrl().then((launch) => handleAuthUrl(launch?.url));
}
