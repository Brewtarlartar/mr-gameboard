'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Minus, Plus, Crown, Medal } from 'lucide-react';
import { useHapticFeedback } from '@/lib/hooks/useMobile';

interface Player {
  name: string;
  score: number;
  color: string;
}

interface LiveLeaderboardProps {
  players: string[];
  gameId?: string;
}

export default function LiveLeaderboard({
  players: playerNames,
}: LiveLeaderboardProps) {
  const haptic = useHapticFeedback();
  const [players, setPlayers] = useState<Player[]>(
    playerNames.map((name, index) => ({
      name,
      score: 0,
      color: PLAYER_COLORS[index % PLAYER_COLORS.length],
    }))
  );
  const [showScoreInput, setShowScoreInput] = useState<number | null>(null);

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const updateScore = (index: number, change: number) => {
    haptic.light();
    setPlayers(
      players.map((p, i) =>
        i === index ? { ...p, score: Math.max(0, p.score + change) } : p
      )
    );
  };

  const setScore = (index: number, score: number) => {
    haptic.medium();
    setPlayers(players.map((p, i) => (i === index ? { ...p, score } : p)));
    setShowScoreInput(null);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 shadow-lg shadow-black/30">
        <h2 className="text-base font-serif font-bold text-amber-100 tracking-wide mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          Live Leaderboard
        </h2>

        <div className="space-y-2.5">
          {sortedPlayers.map((player, index) => {
            const originalIndex = players.findIndex(
              (p) => p.name === player.name
            );
            const rank = index + 1;
            const isWinning = rank === 1 && player.score > 0;

            return (
              <motion.div
                key={player.name}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative p-3 pl-5 rounded-xl border transition-colors ${
                  isWinning
                    ? 'bg-amber-500/10 border-amber-500/50'
                    : 'bg-stone-900/60 border-amber-900/40'
                }`}
              >
                {/* Rank Badge */}
                <div className="absolute -left-2 -top-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-serif font-bold text-xs shadow-md ${
                      rank === 1
                        ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 border border-amber-300/40'
                        : rank === 2
                        ? 'bg-gradient-to-br from-stone-400 to-stone-600 text-stone-950 border border-stone-300/40'
                        : rank === 3
                        ? 'bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100 border border-amber-600/40'
                        : 'bg-stone-800 text-amber-200/70 border border-amber-900/40'
                    }`}
                  >
                    {isWinning ? <Crown className="w-3.5 h-3.5" /> : rank}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  {/* Player Info */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full ring-1 ring-stone-950/50 flex-shrink-0"
                      style={{ backgroundColor: player.color }}
                    />
                    <span
                      className={`font-serif font-semibold truncate ${
                        isWinning ? 'text-amber-200' : 'text-amber-100'
                      }`}
                    >
                      {player.name}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {showScoreInput === originalIndex ? (
                      <input
                        type="number"
                        value={player.score}
                        onChange={(e) =>
                          setScore(originalIndex, parseInt(e.target.value) || 0)
                        }
                        onBlur={() => setShowScoreInput(null)}
                        autoFocus
                        className="w-16 px-2 py-1 bg-stone-950/80 border border-amber-500/50 rounded-lg text-amber-100 text-center font-serif text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                      />
                    ) : (
                      <>
                        <button
                          onClick={() => updateScore(originalIndex, -1)}
                          className="p-1.5 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 rounded-md transition-colors"
                          aria-label="Decrease score"
                        >
                          <Minus className="w-3.5 h-3.5 text-red-400" />
                        </button>
                        <button
                          onClick={() => setShowScoreInput(originalIndex)}
                          className={`min-w-[52px] px-3 py-1 bg-stone-950/70 border border-amber-900/40 rounded-md font-serif font-bold text-lg tabular-nums transition-colors ${
                            isWinning ? 'text-amber-300' : 'text-amber-100'
                          }`}
                        >
                          {player.score}
                        </button>
                        <button
                          onClick={() => updateScore(originalIndex, 1)}
                          className="p-1.5 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/30 rounded-md transition-colors"
                          aria-label="Increase score"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-400" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Winning Indicator */}
                {rank === 1 && player.score > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-2 -top-2 bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 rounded-full p-1.5 shadow-md border border-amber-300/40"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-stone-900/60 border border-amber-900/40 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Medal className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-serif font-bold text-amber-200 tabular-nums">
            {sortedPlayers[0]?.score || 0}
          </div>
          <div className="text-[10px] text-amber-200/60 mt-0.5 font-serif uppercase tracking-wider">
            Highest Score
          </div>
        </div>
        <div className="bg-stone-900/60 border border-amber-900/40 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-serif font-bold text-amber-200 tabular-nums">
            {sortedPlayers[0] && sortedPlayers[1]
              ? sortedPlayers[0].score - sortedPlayers[1].score
              : 0}
          </div>
          <div className="text-[10px] text-amber-200/60 mt-0.5 font-serif uppercase tracking-wider">
            Lead Margin
          </div>
        </div>
      </div>
    </div>
  );
}

const PLAYER_COLORS = [
  '#f59e0b',
  '#dc2626',
  '#10b981',
  '#3b82f6',
  '#a855f7',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];
