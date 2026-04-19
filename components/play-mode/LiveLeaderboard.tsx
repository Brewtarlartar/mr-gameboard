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

export default function LiveLeaderboard({ players: playerNames, gameId }: LiveLeaderboardProps) {
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
    setPlayers(
      players.map((p, i) => (i === index ? { ...p, score } : p))
    );
    setShowScoreInput(null);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-bold font-display text-gray-900 mb-5 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-purple-500" />
          Live Leaderboard
        </h2>

        <div className="space-y-3">
          {sortedPlayers.map((player, index) => {
            const originalIndex = players.findIndex(p => p.name === player.name);
            const rank = index + 1;
            const isWinning = rank === 1 && player.score > 0;

            return (
              <motion.div
                key={player.name}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative p-4 rounded-xl transition-all ${
                  isWinning
                    ? 'bg-amber-50 border-2 border-amber-300 shadow-lg shadow-amber-100'
                    : 'bg-gray-50 border-2 border-gray-200'
                }`}
              >
                {/* Rank Badge */}
                <div className="absolute -left-2 -top-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg ${
                      rank === 1
                        ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-900'
                        : rank === 2
                        ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700'
                        : rank === 3
                        ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-amber-100'
                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}
                  >
                    {isWinning ? <Crown className="w-4 h-4" /> : rank}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 ml-5">
                  {/* Player Info */}
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-3 h-3 rounded-full shadow-sm"
                      style={{ backgroundColor: player.color }}
                    />
                    <span className={`font-semibold font-ui ${isWinning ? 'text-amber-700 text-lg' : 'text-gray-900'}`}>
                      {player.name}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-1">
                    {showScoreInput === originalIndex ? (
                      <input
                        type="number"
                        value={player.score}
                        onChange={(e) => setScore(originalIndex, parseInt(e.target.value) || 0)}
                        onBlur={() => setShowScoreInput(null)}
                        autoFocus
                        className="w-20 px-2 py-1 bg-white border border-purple-400 rounded-lg text-gray-900 text-center font-ui focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    ) : (
                      <>
                        <button
                          onClick={() => updateScore(originalIndex, -1)}
                          className="p-2 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition-all active:scale-90"
                        >
                          <Minus className="w-4 h-4 text-red-500" />
                        </button>
                        <button
                          onClick={() => setShowScoreInput(originalIndex)}
                          className={`min-w-[60px] px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-bold text-xl font-display ${isWinning ? 'text-amber-600' : 'text-purple-600'}`}
                        >
                          {player.score}
                        </button>
                        <button
                          onClick={() => updateScore(originalIndex, 1)}
                          className="p-2 hover:bg-green-50 border border-transparent hover:border-green-200 rounded-lg transition-all active:scale-90"
                        >
                          <Plus className="w-4 h-4 text-green-500" />
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
                    className="absolute -right-2 -top-2 bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-900 rounded-full p-1.5 shadow-lg shadow-amber-200"
                  >
                    <TrendingUp className="w-4 h-4" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Medal className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 font-display">
            {sortedPlayers[0]?.score || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1 font-ui">Highest Score</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-black text-teal-500 font-display">
            {sortedPlayers[0] && sortedPlayers[1]
              ? sortedPlayers[0].score - sortedPlayers[1].score
              : 0}
          </div>
          <div className="text-xs text-gray-500 mt-1 font-ui">Lead Margin</div>
        </div>
      </div>
    </div>
  );
}

const PLAYER_COLORS = [
  '#8b5cf6', // purple
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#ef4444', // red
  '#3b82f6', // blue
  '#10b981', // green
  '#06b6d4', // cyan
  '#ec4899', // pink
];
