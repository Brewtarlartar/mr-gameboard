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
        What The Tome stores, and what it sends. Last updated April 2026.
      </p>

      <section className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 space-y-3 text-amber-100/85 text-sm font-serif leading-relaxed">
        <h2 className="text-xs font-serif font-semibold text-amber-200 uppercase tracking-widest">
          What stays on thy device
        </h2>
        <p>
          The Tome has no accounts and no server-side profile of thee. Thy library,
          thy favorites, thy wishlist, thy scribed sessions, and thy AI chat
          history are stored entirely in this device&apos;s local storage.
        </p>
        <p>
          Clearing the app data or uninstalling the app removes all of it — there
          is no cloud copy.
        </p>
      </section>

      <section className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 space-y-3 text-amber-100/85 text-sm font-serif leading-relaxed">
        <h2 className="text-xs font-serif font-semibold text-amber-200 uppercase tracking-widest">
          What leaves thy device
        </h2>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <span className="font-semibold">Anthropic</span> — when thou askest the
            Wizard, the Sage, or the Teacher a question, the prompt and any
            relevant game context are sent to Anthropic&apos;s Claude API to
            produce an answer. Anthropic does not train on this data by default.
          </li>
          <li>
            <span className="font-semibold">BoardGameGeek</span> — searches,
            catalog browsing, and game detail fetches query BoardGameGeek&apos;s
            public XML API and cached mirrors. Only the game queries themselves
            are sent; no personal data accompanies them.
          </li>
        </ul>
        <p>
          The Tome does not run analytics, ad SDKs, or third-party trackers.
        </p>
      </section>

      <section className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 space-y-3 text-amber-100/85 text-sm font-serif leading-relaxed">
        <h2 className="text-xs font-serif font-semibold text-amber-200 uppercase tracking-widest">
          Thy control
        </h2>
        <p>
          The <span className="text-red-200">Perilous Spells</span> section on the
          Me tab erases everything local with a single tap. There is no &ldquo;undo&rdquo; —
          the erasure is final.
        </p>
      </section>

      <p className="text-[11px] text-amber-200/50 font-serif italic">
        Questions? This app is a personal project; reach the maintainer through
        the app store listing.
      </p>
    </div>
  );
}
