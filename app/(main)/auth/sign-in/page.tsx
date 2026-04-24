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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const urlError = new URLSearchParams(window.location.search).get('error');
    if (urlError) {
      setStatus('error');
      setErrorMessage(urlError);
    }
  }, []);

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
        )}
      </section>
    </div>
  );
}
