'use client';

import Link from 'next/link';
import { ChevronLeft, Scroll } from 'lucide-react';
import BggAttribution from '@/components/ui/BggAttribution';

export default function TermsPage() {
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
        <Scroll className="w-6 h-6 text-amber-400" />
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-amber-100 leading-tight">
          Terms of Use
        </h1>
      </div>
      <p className="text-amber-200/70 text-sm font-serif italic">
        The short-form covenant. Last updated July 2026.
      </p>

      <section className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 space-y-3 text-amber-100/85 text-sm font-serif leading-relaxed">
        <h2 className="text-xs font-serif font-semibold text-amber-200 uppercase tracking-widest">
          What thou may do
        </h2>
        <p>
          Use The Tome for personal tracking of thy board game collection, play
          sessions, and gameplay questions. Thou may share screenshots and session
          summaries as thou wishest. Thou must be at least 13 years of age (or the
          minimum age of digital consent in thy region) to hold an account.
        </p>
        <p>
          Do not misuse the service — no automated abuse of the AI features, no
          attempts to overwhelm or reverse the servers, and nothing unlawful.
        </p>
      </section>

      <section className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 space-y-3 text-amber-100/85 text-sm font-serif leading-relaxed">
        <h2 className="text-xs font-serif font-semibold text-amber-200 uppercase tracking-widest">
          What to expect from the Sage
        </h2>
        <p>
          AI-generated strategy, rules explanations, and teach plans come from a
          large language model. They are best-effort guides, not official rulings
          from publishers. If an answer conflicts with the printed rulebook, the
          rulebook wins.
        </p>
        <p>
          Double-check critical rulings with the actual rulebook or the official
          publisher FAQ before ruling a tournament game or a close match.
        </p>
      </section>

      <section className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 space-y-3 text-amber-100/85 text-sm font-serif leading-relaxed">
        <h2 className="text-xs font-serif font-semibold text-amber-200 uppercase tracking-widest">
          Third-party marks
        </h2>
        <p>
          Game titles, cover art, descriptions, and ratings are the property of
          their respective publishers and BoardGameGeek contributors. The Tome
          displays this information for reference; it does not claim ownership.
        </p>
        <p>
          Game data is sourced from BoardGameGeek&apos;s XML API and displayed with
          attribution in accordance with BoardGameGeek&apos;s API terms of use.
        </p>
        <div className="pt-2">
          <BggAttribution size="md" />
        </div>
      </section>

      <section className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 space-y-3 text-amber-100/85 text-sm font-serif leading-relaxed">
        <h2 className="text-xs font-serif font-semibold text-amber-200 uppercase tracking-widest">
          Accounts &amp; termination
        </h2>
        <p>
          Thou may delete thy account at any time from the Me tab or at{' '}
          <Link href="/delete-account" className="text-amber-300 underline underline-offset-2">
            /delete-account
          </Link>
          . We may suspend or end access that abuses the service or breaks these terms.
        </p>
      </section>

      <section className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 space-y-3 text-amber-100/85 text-sm font-serif leading-relaxed">
        <h2 className="text-xs font-serif font-semibold text-amber-200 uppercase tracking-widest">
          No warranty
        </h2>
        <p>
          The Tome is provided &ldquo;as is,&rdquo; without warranties of any kind, and
          to the extent permitted by law the maintainer is not liable for lost data
          or for reliance on an AI-generated ruling. If a scribed session vanishes due
          to a device wipe, or the Sage gives a creative ruling, the remedy is a sincere
          apology. These terms are governed by the laws of the maintainer&apos;s place of
          residence.
        </p>
      </section>
    </div>
  );
}
