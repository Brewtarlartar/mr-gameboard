'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  X,
  Plus,
  Save,
  Calendar,
  Clock,
  Users,
  Star,
  Trophy,
} from 'lucide-react';
import { usePlayHistoryStore } from '@/lib/store/playHistoryStore';
import { useGameStore } from '@/lib/store/gameStore';
import { Game } from '@/types/game';

interface LogSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedGame?: Game;
}

const inputClass =
  'w-full px-3 py-2 bg-stone-950/70 border border-amber-900/50 text-amber-100 placeholder-stone-500 rounded-lg font-serif focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60 transition-colors';

const labelClass =
  'block text-xs sm:text-sm font-serif font-semibold text-amber-200/90 mb-1.5 tracking-wide uppercase';

export default function LogSessionModal({
  isOpen,
  onClose,
  preselectedGame,
}: LogSessionModalProps) {
  const { games } = useGameStore();
  const { addSession } = usePlayHistoryStore();
  const [mounted, setMounted] = useState(false);

  const [selectedGame, setSelectedGame] = useState<Game | null>(
    preselectedGame || null
  );
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState(60);
  const [players, setPlayers] = useState<
    Array<{ name: string; score?: number; isWinner: boolean }>
  >([{ name: '', score: undefined, isWinner: false }]);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<number | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  const handleSubmit = () => {
    if (!selectedGame || players.some((p) => !p.name.trim())) {
      alert('Please fill in all required fields');
      return;
    }

    addSession({
      gameId: selectedGame.id,
      gameName: selectedGame.name,
      date: new Date(date),
      duration,
      players: players.filter((p) => p.name.trim()),
      notes: notes.trim() || undefined,
      rating,
    });

    onClose();
    setSelectedGame(null);
    setDate(new Date().toISOString().split('T')[0]);
    setDuration(60);
    setPlayers([{ name: '', score: undefined, isWinner: false }]);
    setNotes('');
    setRating(undefined);
  };

  const addPlayer = () => {
    setPlayers([...players, { name: '', score: undefined, isWinner: false }]);
  };

  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const updatePlayer = (index: number, field: string, value: any) => {
    const updated = [...players];
    updated[index] = { ...updated[index], [field]: value };
    setPlayers(updated);
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-session-title"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-b from-stone-900 to-stone-950 border border-amber-900/50 rounded-2xl shadow-2xl shadow-black/50 w-full max-w-2xl my-4 sm:my-8 flex flex-col max-h-[95vh]"
      >
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-stone-950/95 backdrop-blur-sm border-b border-amber-900/40 rounded-t-2xl">
          <div className="min-w-0">
            <h2
              id="log-session-title"
              className="text-xl sm:text-2xl font-serif font-bold text-amber-100"
            >
              Log a Play Session
            </h2>
            <p className="text-amber-200/60 text-[11px] sm:text-sm font-serif italic">
              Record a game already played
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            title="Close (Esc)"
            className="flex items-center gap-2 px-3 py-2 bg-stone-800/70 hover:bg-red-900/40 border border-amber-900/40 hover:border-red-700/50 text-amber-100 hover:text-red-200 rounded-lg text-sm font-serif transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">
          <div>
            <label htmlFor="session-game" className={labelClass}>
              Game <span className="text-amber-400">*</span>
            </label>
            <select
              id="session-game"
              value={selectedGame?.id || ''}
              onChange={(e) => {
                const game = games.find((g) => g.id === e.target.value);
                setSelectedGame(game || null);
              }}
              className={inputClass}
              required
            >
              <option value="">Select a game…</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="session-date" className={labelClass}>
                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                Date <span className="text-amber-400">*</span>
              </label>
              <input
                id="session-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`${inputClass} [color-scheme:dark]`}
                required
              />
            </div>
            <div>
              <label htmlFor="session-duration" className={labelClass}>
                <Clock className="w-3.5 h-3.5 inline mr-1" />
                Duration (min) <span className="text-amber-400">*</span>
              </label>
              <input
                id="session-duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                min="1"
                className={inputClass}
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className={labelClass + ' mb-0'}>
                <Users className="w-3.5 h-3.5 inline mr-1" />
                Players <span className="text-amber-400">*</span>
              </span>
              <button
                type="button"
                onClick={addPlayer}
                className="flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200 font-serif transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Player
              </button>
            </div>
            <div className="space-y-2">
              {players.map((player, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Player name"
                    value={player.name}
                    onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                    className={`${inputClass} flex-1`}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Score"
                    value={player.score ?? ''}
                    onChange={(e) =>
                      updatePlayer(
                        index,
                        'score',
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    className={`${inputClass} w-24 text-center`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updatePlayer(index, 'isWinner', !player.isWinner)
                    }
                    className={`p-2 rounded-lg border transition-all ${
                      player.isWinner
                        ? 'bg-amber-500/25 border-amber-400/60'
                        : 'bg-stone-800/70 border-amber-900/40 hover:bg-stone-700/70'
                    }`}
                    title="Mark as winner"
                    aria-label="Mark as winner"
                  >
                    <Trophy
                      className={`w-4 h-4 ${
                        player.isWinner
                          ? 'text-amber-300 fill-amber-400/40'
                          : 'text-amber-200/60'
                      }`}
                    />
                  </button>
                  {players.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePlayer(index)}
                      className="p-2 rounded-lg bg-stone-800/70 hover:bg-red-900/40 border border-amber-900/40 hover:border-red-700/50 text-amber-200 hover:text-red-200 transition-colors"
                      aria-label="Remove player"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <span className={labelClass}>
              <Star className="w-3.5 h-3.5 inline mr-1" />
              Your Rating
            </span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(rating === star ? undefined : star)}
                  className="transition-transform hover:scale-110"
                  aria-label={`Rate ${star}`}
                >
                  <Star
                    className={`w-7 h-7 ${
                      rating && star <= rating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-stone-600'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="session-notes" className={labelClass}>
              Notes
            </label>
            <textarea
              id="session-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any memorable moments or thoughts about the game…"
              className={`${inputClass} resize-y min-h-[100px]`}
            />
          </div>
        </div>

        <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-stone-950/95 backdrop-blur-sm border-t border-amber-900/40 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-800/70 hover:bg-stone-700/70 border border-amber-900/40 text-amber-100 rounded-lg font-serif text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 border border-amber-400/40 text-stone-950 rounded-lg font-serif font-semibold text-sm shadow-md shadow-amber-900/30 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Session
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
