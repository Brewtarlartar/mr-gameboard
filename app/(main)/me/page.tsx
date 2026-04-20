'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Library,
  Heart,
  BarChart3,
  Trash2,
  Compass,
  Play,
  ChevronRight,
} from 'lucide-react';
import { useGameStore } from '@/lib/store/gameStore';
import { usePlayHistoryStore } from '@/lib/store/playHistoryStore';

export default function MePage() {
  const { games, favorites, resetLibrary } = useGameStore();
  const { sessions, clearHistory } = usePlayHistoryStore();
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClearAll = () => {
    resetLibrary();
    clearHistory();
    setConfirmClear(false);
  };

  const totalHours = Math.round(
    sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60,
  );

  return (
    <div className="space-y-6 pt-28 md:pt-32 pb-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-amber-100 leading-tight">
          Thy Profile
        </h1>
        <p className="text-amber-200/70 text-sm font-serif italic">
          A glance at thy collection, thy deeds, and thy keep.
        </p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Games"
          value={games.length}
          icon={<Library className="w-4 h-4 text-amber-400" />}
        />
        <StatCard
          label="Favorites"
          value={favorites.length}
          icon={<Heart className="w-4 h-4 text-amber-400" />}
        />
        <StatCard
          label="Sessions"
          value={sessions.length}
          icon={<BarChart3 className="w-4 h-4 text-amber-400" />}
        />
        <StatCard
          label="Hours Played"
          value={totalHours}
          icon={<Play className="w-4 h-4 text-amber-400" />}
        />
      </div>

      {/* Quick links */}
      <section className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 shadow-lg shadow-black/20">
        <h2 className="text-xs font-serif font-semibold text-amber-200 uppercase tracking-widest mb-4">
          Thy Halls
        </h2>
        <div className="space-y-2">
          <QuickLink
            href="/library"
            title="Thy Library"
            description={`${games.length} ${games.length === 1 ? 'tome' : 'tomes'} in thy collection`}
            icon="/tome-book.png"
          />
          <QuickLink
            href="/discover"
            title="The Catalog"
            description="Browse the vast hall of games"
            icon="/map.png"
          />
          <QuickLink
            href="/play"
            title="The Arena"
            description="Begin a new game at thy table"
            icon="/crystal-ball.png"
          />
          <QuickLink
            href="/analytics"
            title="The Chronicle"
            description={`${sessions.length} ${sessions.length === 1 ? 'tale' : 'tales'} scribed`}
            icon="/skip-the-rules.png"
          />
        </div>
      </section>

      {/* About */}
      <section className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 shadow-lg shadow-black/20">
        <h2 className="text-xs font-serif font-semibold text-amber-200 uppercase tracking-widest mb-3">
          About The Tome
        </h2>
        <p className="text-amber-100/80 text-sm font-serif leading-relaxed mb-2">
          The Tome is thy tabletop companion — keeper of thy library, guide through
          games, and scribe of thy chronicles. It works fully offline and stores
          everything on this very device.
        </p>
        <p className="text-[11px] text-amber-200/50 font-serif italic">
          v1.0 · beta · Forged for tabletop nights and long campaigns alike.
        </p>
        <div className="mt-3 flex items-center gap-3 text-[11px] font-serif">
          <Link
            href="/about/privacy"
            className="text-amber-200/70 hover:text-amber-100 underline underline-offset-2"
          >
            Privacy
          </Link>
          <span className="text-amber-200/30">·</span>
          <Link
            href="/about/terms"
            className="text-amber-200/70 hover:text-amber-100 underline underline-offset-2"
          >
            Terms
          </Link>
        </div>
      </section>

      {/* Danger zone */}
      <section className="bg-gradient-to-b from-red-950/30 to-stone-950/80 border border-red-900/50 rounded-2xl p-5 shadow-lg shadow-black/20">
        <div className="flex items-center gap-2 mb-2">
          <Trash2 className="w-4 h-4 text-red-400" />
          <h2 className="text-xs font-serif font-semibold text-red-200 uppercase tracking-widest">
            Perilous Spells
          </h2>
        </div>
        <p className="text-amber-100/75 text-sm font-serif mb-4 leading-relaxed">
          Erase thy entire library, favorites, and every scribed session. This deed
          cannot be undone — no revival spell shall bring them back.
        </p>
        {confirmClear ? (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-serif font-semibold rounded-lg text-sm border border-red-500/50 transition-colors"
            >
              Yes, erase everything
            </button>
            <button
              onClick={() => setConfirmClear(false)}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 border border-amber-900/50 text-amber-100 font-serif rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClear(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-950/60 hover:bg-red-900/70 border border-red-800/60 text-red-200 font-serif rounded-lg text-sm transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear all data</span>
          </button>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-b from-stone-900/80 to-stone-950/90 border border-amber-900/50 rounded-2xl p-4 shadow-lg shadow-black/20"
    >
      <div className="mb-2">{icon}</div>
      <p className="text-2xl font-serif font-bold text-amber-100 tabular-nums">{value}</p>
      <p className="text-[11px] text-amber-200/60 font-serif uppercase tracking-wider">{label}</p>
    </motion.div>
  );
}

function QuickLink({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 p-3 bg-stone-950/50 hover:bg-stone-900/70 border border-amber-900/40 hover:border-amber-500/50 rounded-xl transition-colors"
    >
      <div className="shrink-0 w-10 h-10 rounded-lg bg-stone-900 border border-amber-900/40 flex items-center justify-center">
        <Image
          src={icon}
          alt=""
          width={28}
          height={28}
          className="w-7 h-7 object-contain drop-shadow-[0_0_4px_rgba(251,191,36,0.4)]"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-serif font-semibold text-amber-100 text-sm truncate">{title}</p>
        <p className="text-[11px] text-amber-200/60 font-serif italic truncate">
          {description}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-amber-700 group-hover:text-amber-400 transition-colors shrink-0" />
    </Link>
  );
}
