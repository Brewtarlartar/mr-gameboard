'use client';

import { motion } from 'framer-motion';
import { Library, Heart, BarChart3, Download, Trash2, Cloud, User } from 'lucide-react';
import { useGameStore } from '@/lib/store/gameStore';
import { usePlayHistoryStore } from '@/lib/store/playHistoryStore';
import { useState } from 'react';

export default function MePage() {
  const { games, favorites, resetLibrary } = useGameStore();
  const { sessions, clearHistory } = usePlayHistoryStore();
  const [confirmClear, setConfirmClear] = useState(false);

  const downloadJson = (filename: string, data: unknown) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCsv = (filename: string, rows: Record<string, unknown>[]) => {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const escape = (v: unknown) => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearAll = () => {
    resetLibrary();
    clearHistory();
    setConfirmClear(false);
  };

  return (
    <div className="space-y-8 pb-12">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <User className="w-7 h-7 text-amber-400" />
          <h1 className="text-3xl md:text-4xl font-bold text-stone-100">Profile</h1>
        </div>
        <p className="text-stone-400 text-sm">Your stats, data, and settings.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Games" value={games.length} icon={<Library className="w-5 h-5 text-amber-400" />} />
        <StatCard label="Favorites" value={favorites.length} icon={<Heart className="w-5 h-5 text-pink-400" />} />
        <StatCard label="Sessions" value={sessions.length} icon={<BarChart3 className="w-5 h-5 text-sky-400" />} />
      </div>

      <section className="bg-stone-800/40 border border-stone-700/40 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Cloud className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-stone-100">Cloud sync</h2>
        </div>
        <p className="text-stone-400 text-sm mb-4">
          Sign in to back up your library and play history across devices. The Tome works fully offline without an account.
        </p>
        <button
          disabled
          className="px-4 py-2 bg-stone-700/60 border border-stone-600/40 text-stone-300 rounded-lg text-sm cursor-not-allowed"
        >
          Sign in (coming soon)
        </button>
      </section>

      <section className="bg-stone-800/40 border border-stone-700/40 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Download className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-stone-100">Export data</h2>
        </div>
        <p className="text-stone-400 text-sm mb-4">Download your collection and play history as JSON or CSV.</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => downloadJson('mr-gameboard-library.json', { games, favorites })}
            className="px-3 py-2 bg-stone-700/60 hover:bg-stone-600/60 border border-stone-600/40 text-stone-200 rounded-lg text-sm"
          >
            Library (JSON)
          </button>
          <button
            onClick={() => downloadCsv('mr-gameboard-library.csv', games.map(g => ({
              id: g.id,
              bggId: g.bggId,
              name: g.name,
              minPlayers: g.minPlayers,
              maxPlayers: g.maxPlayers,
              playingTime: g.playingTime,
              rating: g.rating,
              favorite: favorites.includes(g.id) ? 'yes' : 'no',
            })))}
            disabled={games.length === 0}
            className="px-3 py-2 bg-stone-700/60 hover:bg-stone-600/60 border border-stone-600/40 text-stone-200 rounded-lg text-sm disabled:opacity-50"
          >
            Library (CSV)
          </button>
          <button
            onClick={() => downloadJson('mr-gameboard-sessions.json', sessions)}
            disabled={sessions.length === 0}
            className="px-3 py-2 bg-stone-700/60 hover:bg-stone-600/60 border border-stone-600/40 text-stone-200 rounded-lg text-sm disabled:opacity-50"
          >
            Sessions (JSON)
          </button>
          <button
            onClick={() => downloadCsv('mr-gameboard-sessions.csv', sessions.map(s => ({
              gameId: s.gameId,
              gameName: s.gameName,
              date: s.date,
              duration: s.duration,
              players: (s.players || []).map((p: any) => p.name).join('|'),
              winner: (s.players || []).find((p: any) => p.isWinner)?.name || '',
            })))}
            disabled={sessions.length === 0}
            className="px-3 py-2 bg-stone-700/60 hover:bg-stone-600/60 border border-stone-600/40 text-stone-200 rounded-lg text-sm disabled:opacity-50"
          >
            Sessions (CSV)
          </button>
        </div>
      </section>

      <section className="bg-red-950/30 border border-red-900/40 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Trash2 className="w-5 h-5 text-red-400" />
          <h2 className="text-lg font-semibold text-stone-100">Clear all data</h2>
        </div>
        <p className="text-stone-400 text-sm mb-4">
          Delete all local games, favorites, and session history. This cannot be undone.
        </p>
        {confirmClear ? (
          <div className="flex gap-2">
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm"
            >
              Yes, delete everything
            </button>
            <button
              onClick={() => setConfirmClear(false)}
              className="px-4 py-2 bg-stone-700/60 hover:bg-stone-600/60 text-stone-200 rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClear(true)}
            className="px-4 py-2 bg-red-900/40 hover:bg-red-900/60 border border-red-800/40 text-red-200 rounded-lg text-sm"
          >
            Clear all data
          </button>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-stone-800/40 border border-stone-700/40 rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-stone-700/40 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-stone-400 text-xs uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-stone-100">{value}</p>
        </div>
      </div>
    </div>
  );
}
