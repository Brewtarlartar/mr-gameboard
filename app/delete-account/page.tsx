'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Status = 'loading' | 'signed-out' | 'signed-in' | 'deleting' | 'done' | 'error';

export default function DeleteAccountPage() {
  const [status, setStatus] = useState<Status>('loading');
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email ?? null);
        setStatus('signed-in');
      } else {
        setStatus('signed-out');
      }
    });
  }, []);

  const handleDelete = async () => {
    setStatus('deleting');
    setError(null);
    try {
      const res = await apiFetch('/api/account/delete', { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Deletion failed (${res.status})`);
      }
      await createClient().auth.signOut();
      setStatus('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Deletion failed');
      setStatus('error');
    }
  };

  return (
    <main className="min-h-screen bg-stone-950 text-amber-100 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg space-y-6">
        <h1 className="text-3xl font-serif font-bold text-amber-100">Delete your account</h1>
        <p className="text-amber-200/80 font-serif leading-relaxed">
          This permanently deletes your The Tome account and all associated data — your
          synced library, custom games, preferences, and saved AI conversations. This
          cannot be undone.
        </p>

        {status === 'loading' && (
          <p className="text-amber-200/60 font-serif italic">Checking your session…</p>
        )}

        {status === 'signed-out' && (
          <div className="bg-stone-900/70 border border-amber-900/50 rounded-2xl p-5 space-y-3">
            <p className="text-amber-100/85 font-serif">
              To delete your account, first sign in with the account you want to remove.
            </p>
            <Link
              href="/auth/sign-in?next=/delete-account"
              className="inline-flex px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-semibold rounded-lg text-sm"
            >
              Sign in to continue
            </Link>
          </div>
        )}

        {(status === 'signed-in' || status === 'deleting' || status === 'error') && (
          <div className="bg-stone-900/70 border border-red-900/50 rounded-2xl p-5 space-y-4">
            <p className="text-amber-100/85 font-serif">
              Signed in as <span className="font-semibold">{email ?? 'your account'}</span>.
            </p>
            {!confirm ? (
              <button
                onClick={() => setConfirm(true)}
                className="px-4 py-2 bg-red-950/60 hover:bg-red-900/70 border border-red-800/60 text-red-200 font-serif rounded-lg text-sm"
              >
                Delete my account
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-red-200 font-serif text-sm">
                  Are you absolutely sure? This is permanent.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={status === 'deleting'}
                    className="px-4 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-60 text-white font-serif font-semibold rounded-lg text-sm border border-red-500/50"
                  >
                    {status === 'deleting' ? 'Deleting…' : 'Yes, delete everything'}
                  </button>
                  <button
                    onClick={() => setConfirm(false)}
                    disabled={status === 'deleting'}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 border border-amber-900/50 text-amber-100 font-serif rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                </div>
                {error && <p className="text-red-300 font-serif text-sm">{error}</p>}
              </div>
            )}
          </div>
        )}

        {status === 'done' && (
          <div className="bg-stone-900/70 border border-amber-900/50 rounded-2xl p-5 space-y-3">
            <p className="text-amber-100/90 font-serif">
              Your account and data have been permanently deleted.
            </p>
            <Link
              href="/"
              className="inline-flex px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-semibold rounded-lg text-sm"
            >
              Return home
            </Link>
          </div>
        )}

        <p className="text-[11px] text-amber-200/50 font-serif">
          Need help? Contact {SUPPORT_EMAIL}.
        </p>
      </div>
    </main>
  );
}

const SUPPORT_EMAIL = 'javiermaciasproperties@gmail.com';
