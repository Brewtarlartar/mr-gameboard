'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronLeft, Loader2, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const urlError = new URLSearchParams(window.location.search).get('error');
    if (urlError) {
      setStatus('error');
      setErrorMessage(urlError);
    }
  }, []);

  const handleGoogleSignIn = async () => {
    if (googleLoading || status === 'sending') return;
    setGoogleLoading(true);
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus('error');
      setErrorMessage(error.message);
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || status === 'sending') return;

    setStatus('sending');
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus('error');
      setErrorMessage(error.message);
      return;
    }

    setStatus('sent');
  };

  return (
    <div className="space-y-6 pt-28 md:pt-32 pb-12 max-w-md mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          href="/me"
          className="inline-flex items-center gap-1 text-amber-200/70 hover:text-amber-100 text-sm font-serif mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Me
        </Link>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-amber-100 leading-tight">
          Enter Thy Keep
        </h1>
        <p className="text-amber-200/70 text-sm font-serif italic">
          Sign in to sync thy library, custom games, and preferences across devices.
        </p>
      </motion.div>

      <section className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 shadow-lg shadow-black/20">
        {status === 'sent' ? (
          <div className="text-center py-4">
            <Image
              src="/tome-book.png"
              alt=""
              width={72}
              height={72}
              className="w-16 h-16 mx-auto mb-3 object-contain drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]"
            />
            <h2 className="text-xl font-serif font-bold text-amber-100 mb-1">
              A scroll hath been sent
            </h2>
            <p className="text-amber-200/70 text-sm font-serif leading-relaxed">
              Check <span className="text-amber-100 font-semibold">{email}</span> for a
              magic link. Click it to enter thy keep.
            </p>
            <button
              type="button"
              onClick={() => {
                setStatus('idle');
                setEmail('');
              }}
              className="mt-4 text-xs font-semibold text-amber-300 hover:text-amber-200 underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || status === 'sending'}
              className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-3 bg-white hover:bg-stone-100 disabled:bg-stone-300 disabled:text-stone-500 text-stone-800 font-serif font-semibold rounded-xl transition-colors border border-stone-300 shadow-sm"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                </svg>
              )}
              <span>{googleLoading ? 'Redirecting…' : 'Continue with Google'}</span>
            </button>

            <div className="flex items-center gap-3" aria-hidden="true">
              <div className="flex-1 h-px bg-amber-900/40" />
              <span className="text-[11px] font-serif italic text-amber-200/50 uppercase tracking-widest">
                or
              </span>
              <div className="flex-1 h-px bg-amber-900/40" />
            </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="block text-xs font-serif font-semibold text-amber-200 uppercase tracking-widest mb-2">
                Thy email address
              </span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="wizard@example.com"
                disabled={status === 'sending'}
                className="w-full bg-stone-950/70 border border-amber-900/50 rounded-xl px-3 py-2.5 text-amber-100 text-sm font-serif placeholder-amber-200/30 focus:outline-none focus:border-amber-500/60 disabled:opacity-60"
              />
            </label>

            {errorMessage && status === 'error' && (
              <div className="bg-red-900/30 border border-red-700/50 text-red-200 text-xs font-serif rounded-lg px-3 py-2">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={!email.trim() || status === 'sending'}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-800 disabled:text-stone-500 text-stone-950 font-serif font-semibold rounded-xl transition-colors"
            >
              {status === 'sending' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending…</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  <span>Send magic link</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-amber-200/50 font-serif italic text-center">
              No password required. We&rsquo;ll email thee a link to sign in.
            </p>
          </form>
          </div>
        )}
      </section>
    </div>
  );
}
