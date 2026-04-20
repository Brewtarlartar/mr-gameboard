'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  RefreshCw,
  Users,
  Clock,
  Tag,
  Eye,
} from 'lucide-react';
import type { Game } from '@/types/game';

interface Props {
  isOpen: boolean;
  games: Game[];
  onClose: () => void;
  onSelectGame?: (game: Game) => void;
}

type PlayersFilter = 'any' | 1 | 2 | 3 | 4 | 5 | 6;
type TimeFilter = 'any' | 30 | 60 | 90 | 120;

const PLAYER_OPTIONS: { value: PlayersFilter; label: string }[] = [
  { value: 'any', label: 'Any' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
  { value: 6, label: '6+' },
];

const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: 'any', label: 'Any' },
  { value: 30, label: '≤ 30m' },
  { value: 60, label: '30–60m' },
  { value: 90, label: '60–90m' },
  { value: 120, label: '90m+' },
];

function gameMatches(
  game: Game,
  players: PlayersFilter,
  time: TimeFilter,
  moods: string[]
): boolean {
  if (players !== 'any') {
    const min = game.minPlayers ?? 1;
    const max = game.maxPlayers ?? 99;
    const target = players === 6 ? 6 : players;
    if (players === 6) {
      if (max < 6) return false;
    } else {
      if (target < min || target > max) return false;
    }
  }

  if (time !== 'any') {
    const t = game.playingTime ?? game.maxPlayingTime ?? game.minPlayingTime;
    if (typeof t !== 'number') {
      // No time data — be lenient (include) so libraries with sparse data still work
    } else {
      switch (time) {
        case 30:
          if (t > 30) return false;
          break;
        case 60:
          if (t < 30 || t > 60) return false;
          break;
        case 90:
          if (t < 60 || t > 90) return false;
          break;
        case 120:
          if (t < 90) return false;
          break;
      }
    }
  }

  if (moods.length > 0) {
    const tags = new Set([
      ...(game.genres ?? []),
      ...(game.categories ?? []),
      ...(game.mechanics ?? []),
    ]);
    const hit = moods.some((m) => tags.has(m));
    if (!hit) return false;
  }

  return true;
}

export default function OracleChoiceModal({
  isOpen,
  games,
  onClose,
  onSelectGame,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [players, setPlayers] = useState<PlayersFilter>('any');
  const [time, setTime] = useState<TimeFilter>('any');
  const [moods, setMoods] = useState<string[]>([]);
  const [pickedGame, setPickedGame] = useState<Game | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  useEffect(() => setMounted(true), []);

  // Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setPickedGame(null);
      setIsRolling(false);
    }
  }, [isOpen]);

  const moodOptions = useMemo(() => {
    const counts = new Map<string, number>();
    games.forEach((g) => {
      [...(g.genres ?? []), ...(g.categories ?? [])].forEach((tag) => {
        if (!tag) return;
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);
  }, [games]);

  const eligibleGames = useMemo(
    () => games.filter((g) => gameMatches(g, players, time, moods)),
    [games, players, time, moods]
  );

  const handleConsult = () => {
    if (eligibleGames.length === 0) return;
    setIsRolling(true);
    setPickedGame(null);
    window.setTimeout(() => {
      const choice =
        eligibleGames[Math.floor(Math.random() * eligibleGames.length)];
      setPickedGame(choice);
      setIsRolling(false);
    }, 900);
  };

  const handleReroll = () => {
    if (eligibleGames.length === 0) return;
    if (eligibleGames.length === 1) {
      handleConsult();
      return;
    }
    setIsRolling(true);
    const previousId = pickedGame?.id;
    window.setTimeout(() => {
      const pool = eligibleGames.filter((g) => g.id !== previousId);
      const fromPool = pool.length > 0 ? pool : eligibleGames;
      const choice = fromPool[Math.floor(Math.random() * fromPool.length)];
      setPickedGame(choice);
      setIsRolling(false);
    }, 600);
  };

  const handleViewDetails = () => {
    if (pickedGame && onSelectGame) {
      onSelectGame(pickedGame);
      onClose();
    }
  };

  const toggleMood = (mood: string) => {
    setMoods((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]
    );
    setPickedGame(null);
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-start sm:items-center justify-center px-2 sm:px-4 overflow-y-auto"
      style={{
        paddingTop: 'max(calc(env(safe-area-inset-top, 0px) + 8px), 16px)',
        paddingBottom: 'max(calc(env(safe-area-inset-bottom, 0px) + 8px), 16px)',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="oracle-title"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight:
            'calc(100dvh - max(calc(env(safe-area-inset-top, 0px) + 8px), 16px) - max(calc(env(safe-area-inset-bottom, 0px) + 8px), 16px))',
        }}
        className="bg-gradient-to-b from-stone-900 to-stone-950 border border-amber-900/50 rounded-2xl shadow-2xl shadow-black/50 w-full max-w-2xl flex flex-col"
      >
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-stone-950/95 backdrop-blur-sm border-b border-amber-900/40 rounded-t-2xl">
          <div className="min-w-0 flex items-center gap-3">
            <div className="w-10 h-10 shrink-0 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-center overflow-hidden">
              <Image
                src="/Wizard.png"
                alt=""
                width={32}
                height={32}
                className="object-contain drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
              />
            </div>
            <div className="min-w-0">
              <h2
                id="oracle-title"
                className="text-xl sm:text-2xl font-serif font-bold text-amber-100"
              >
                Wizard&apos;s Choice
              </h2>
              <p className="text-amber-200/60 text-[11px] sm:text-sm font-serif italic whitespace-nowrap overflow-hidden">
                Let the Wizard decide thy fate
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Wizard's Choice"
            title="Close (Esc)"
            className="flex items-center gap-2 px-3 py-2 bg-stone-800/70 hover:bg-red-900/40 border border-amber-900/40 hover:border-red-700/50 text-amber-100 hover:text-red-200 rounded-lg text-sm font-serif transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">
          {/* Filters */}
          <section className="space-y-4">
            <FilterRow icon={Users} label="Players">
              {PLAYER_OPTIONS.map((opt) => (
                <Chip
                  key={String(opt.value)}
                  active={players === opt.value}
                  onClick={() => {
                    setPlayers(opt.value);
                    setPickedGame(null);
                  }}
                >
                  {opt.label}
                </Chip>
              ))}
            </FilterRow>

            <FilterRow icon={Clock} label="Time">
              {TIME_OPTIONS.map((opt) => (
                <Chip
                  key={String(opt.value)}
                  active={time === opt.value}
                  onClick={() => {
                    setTime(opt.value);
                    setPickedGame(null);
                  }}
                >
                  {opt.label}
                </Chip>
              ))}
            </FilterRow>

            {moodOptions.length > 0 && (
              <FilterRow icon={Tag} label="Mood">
                {moodOptions.map((mood) => (
                  <Chip
                    key={mood}
                    active={moods.includes(mood)}
                    onClick={() => toggleMood(mood)}
                  >
                    {mood}
                  </Chip>
                ))}
                {moods.length > 0 && (
                  <button
                    onClick={() => {
                      setMoods([]);
                      setPickedGame(null);
                    }}
                    className="px-2.5 py-1 text-xs text-amber-200/60 hover:text-amber-200 underline-offset-2 hover:underline font-serif italic"
                  >
                    clear
                  </button>
                )}
              </FilterRow>
            )}

            <p className="text-xs text-amber-200/60 font-serif italic">
              {eligibleGames.length} eligible{' '}
              {eligibleGames.length === 1 ? 'tome' : 'tomes'} of {games.length}.
            </p>
          </section>

          {/* Consult button */}
          <button
            onClick={handleConsult}
            disabled={eligibleGames.length === 0 || isRolling}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-100 rounded-xl text-base font-serif transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Image
              src="/Wizard.png"
              alt=""
              width={28}
              height={28}
              className={`w-7 h-7 object-contain drop-shadow-[0_0_4px_rgba(251,191,36,0.5)] ${
                isRolling ? 'animate-pulse' : ''
              }`}
            />
            {isRolling
              ? 'Casting the runes…'
              : pickedGame
                ? 'Consult again'
                : 'Consult the Wizard'}
          </button>

          {/* Result */}
          <AnimatePresence mode="wait">
            {isRolling ? (
              <motion.div
                key="rolling"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border border-amber-900/40 bg-stone-900/60 p-8 text-center"
              >
                <div className="text-5xl mb-3 animate-pulse">🔮</div>
                <p className="text-amber-200/80 font-serif italic">
                  The runes spin…
                </p>
              </motion.div>
            ) : pickedGame ? (
              <motion.div
                key={pickedGame.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border border-amber-700/50 bg-gradient-to-br from-stone-900 via-stone-950 to-amber-950/30 p-4 sm:p-5 shadow-lg shadow-black/40"
              >
                <p className="text-[10px] uppercase tracking-widest text-amber-300/70 font-serif mb-2 text-center">
                  The Wizard has chosen
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-40 sm:w-44 aspect-square shrink-0 mx-auto sm:mx-0 rounded-lg overflow-hidden bg-stone-950 border border-amber-900/40 flex items-center justify-center p-2">
                    {pickedGame.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={pickedGame.image}
                        alt={pickedGame.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <span className="text-4xl">🎲</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-amber-100 leading-tight break-words">
                      {pickedGame.name}
                    </h3>
                    {pickedGame.yearPublished && (
                      <p className="text-amber-200/60 text-xs font-serif italic mt-0.5">
                        {pickedGame.yearPublished}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                      {(pickedGame.minPlayers || pickedGame.maxPlayers) && (
                        <Pill icon={Users}>
                          {pickedGame.minPlayers === pickedGame.maxPlayers
                            ? pickedGame.minPlayers
                            : `${pickedGame.minPlayers ?? '?'}–${pickedGame.maxPlayers ?? '?'}`}
                        </Pill>
                      )}
                      {pickedGame.playingTime && (
                        <Pill icon={Clock}>{pickedGame.playingTime}m</Pill>
                      )}
                      {typeof pickedGame.rating === 'number' &&
                        pickedGame.rating > 0 && (
                          <Pill>★ {pickedGame.rating.toFixed(1)}</Pill>
                        )}
                    </div>
                    {(pickedGame.genres?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2 justify-center sm:justify-start">
                        {pickedGame.genres!.slice(0, 3).map((g) => (
                          <span
                            key={g}
                            className="px-2 py-0.5 text-[10px] rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-200 font-serif"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button
                    onClick={handleReroll}
                    disabled={eligibleGames.length < 2}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-stone-900/70 hover:bg-stone-800 border border-amber-900/50 text-amber-100 rounded-lg text-sm font-serif transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reroll
                  </button>
                  <button
                    onClick={handleViewDetails}
                    disabled={!onSelectGame}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-100 rounded-lg text-sm font-serif transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Eye className="w-4 h-4" />
                    View details
                  </button>
                </div>
              </motion.div>
            ) : eligibleGames.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border border-amber-900/40 bg-stone-900/60 p-6 text-center"
              >
                <p className="text-amber-200/70 font-serif italic">
                  The Wizard finds no tome matching thy demands. Loosen thy filters.
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-4 sm:px-6 py-3 bg-stone-950/95 backdrop-blur-sm border-t border-amber-900/40 rounded-b-2xl flex items-center justify-end">
          <button
            onClick={onClose}
            className="flex items-center justify-center gap-2 px-4 py-2 h-10 whitespace-nowrap bg-stone-800/70 hover:bg-stone-800 border border-amber-900/40 text-amber-100 rounded-lg text-sm font-serif transition-colors"
          >
            <X className="w-4 h-4" />
            Close
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

function FilterRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<any>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-amber-200/60 font-serif mb-2 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-serif transition-colors border ${
        active
          ? 'bg-amber-500/25 border-amber-500/60 text-amber-50'
          : 'bg-stone-900/60 border-amber-900/40 text-amber-200/70 hover:border-amber-500/40 hover:text-amber-100'
      }`}
    >
      {children}
    </button>
  );
}

function Pill({
  icon: Icon,
  children,
}: {
  icon?: React.ComponentType<any>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full bg-stone-900/70 border border-amber-900/40 text-amber-200 font-serif">
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
}
