'use client';

import Link from 'next/link';
import { ChevronLeft, ShieldCheck } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="space-y-6 pt-28 md:pt-32 pb-12 max-w-2xl">
      <Link
        href="/me"
        className="inline-flex items-center gap-1 text-amber-200/70 hover:text-amber-100 text-sm font-serif"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to thy profile
      </Link>

      <div className="flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-amber-400" />
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-amber-100 leading-tight">
          Privacy
        </h1>
      </div>
      <p className="text-amber-200/70 text-sm font-serif italic">
        What The Tome stores, where it goes, and how to remove it. Last updated July 2026.
      </p>

      <section className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 space-y-3 text-amber-100/85 text-sm font-serif leading-relaxed">
        <h2 className="text-xs font-serif font-semibold text-amber-200 uppercase tracking-widest">
          Using The Tome without an account
        </h2>
        <p>
          Thou may use The Tome without signing in. In that case thy library,
          favorites, wishlist, scribed sessions, and AI chat history are stored
          only in this device&apos;s local storage. Clearing the app data or
          uninstalling removes all of it.
        </p>
      </section>

      <section className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 space-y-3 text-amber-100/85 text-sm font-serif leading-relaxed">
        <h2 className="text-xs font-serif font-semibold text-amber-200 uppercase tracking-widest">
          If thou signest in
        </h2>
        <p>
          Signing in (with Google or an emailed magic link) creates an account so
          thy collection can sync across devices. When signed in, we store on our
          servers (via Supabase):
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li>Thy account email and a user identifier.</li>
          <li>Thy game library, favorites, and custom games.</li>
          <li>Thy app preferences.</li>
          <li>Thy AI (Wizard) conversation history.</li>
        </ul>
        <p>
          We use this data only to provide the app and sync it across thy devices.
          We do not sell it or use it for advertising.
        </p>
      </section>

      <section className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 space-y-3 text-amber-100/85 text-sm font-serif leading-relaxed">
        <h2 className="text-xs font-serif font-semibold text-amber-200 uppercase tracking-widest">
          Who we share it with
        </h2>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <span className="font-semibold">Anthropic (PBC)</span> — when thou askest
            the Wizard, the Sage, or the Teacher a question, thy prompt and any
            relevant game context are sent to Anthropic&apos;s Claude API to
            produce an answer. Anthropic processes this as our service provider,
            does not train its models on it by default, and retains it only briefly.
          </li>
          <li>
            <span className="font-semibold">Supabase</span> — our database, auth,
            and storage provider, which holds the account data described above.
          </li>
          <li>
            <span className="font-semibold">Vercel</span> — our hosting provider,
            which processes requests to the app.
          </li>
          <li>
            <span className="font-semibold">BoardGameGeek</span> — searches and game
            detail lookups query BoardGameGeek&apos;s XML API. Only the game queries
            themselves are sent; no personal data accompanies them.
          </li>
        </ul>
        <p>The Tome does not run advertising SDKs or third-party trackers.</p>
      </section>

      <section className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 space-y-3 text-amber-100/85 text-sm font-serif leading-relaxed">
        <h2 className="text-xs font-serif font-semibold text-amber-200 uppercase tracking-widest">
          Thy control &amp; thy rights
        </h2>
        <p>
          The <span className="text-red-200">Perilous Spells</span> section on the
          Me tab clears thy data. <span className="font-semibold">Clear all data</span>{' '}
          erases thy local copy and, if signed in, thy cloud copy too.{' '}
          <span className="font-semibold">Delete my account</span> permanently removes
          thy account and all associated data — thou may also do this at{' '}
          <Link href="/delete-account" className="text-amber-300 underline underline-offset-2">
            /delete-account
          </Link>
          .
        </p>
        <p>
          Thou hast the right to access, correct, export, or delete thy data, and to
          complain to a data-protection authority. To exercise any of these, use the
          controls above or contact us below.
        </p>
      </section>

      <p className="text-[11px] text-amber-200/50 font-serif italic">
        Questions or requests? Contact support@thetome.app.
      </p>
    </div>
  );
}
