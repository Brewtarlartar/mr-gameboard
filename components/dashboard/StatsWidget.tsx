'use client';

import { motion } from 'framer-motion';
import { Trophy, Clock, Star, Gamepad2 } from 'lucide-react';
import { useGameStore } from '@/lib/store/gameStore';

export default function StatsWidget() {
  const { games, favorites } = useGameStore();

  const stats = [
    {
      label: 'Games Owned',
      value: games.length,
      icon: Gamepad2,
      iconBg: 'from-amber-600 to-amber-800',
    },
    {
      label: 'Favorites',
      value: favorites.length,
      icon: Star,
      iconBg: 'from-yellow-500 to-amber-700',
    },
    {
      label: 'Avg Playtime',
      value:
        games.length > 0
          ? Math.round(games.reduce((acc, g) => acc + (g.playingTime || 0), 0) / games.length) + 'm'
          : '0m',
      icon: Clock,
      iconBg: 'from-amber-500 to-yellow-700',
    },
    {
      label: 'Avg Rating',
      value:
        games.length > 0
          ? (games.reduce((acc, g) => acc + (g.rating || 0), 0) / games.length).toFixed(1)
          : '0.0',
      icon: Trophy,
      iconBg: 'from-amber-700 to-orange-900',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-6xl">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-stone-950/70 backdrop-blur-sm border border-amber-500/30 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.45)] p-6 hover:border-amber-400/50 hover:shadow-[0_8px_32px_rgba(245,158,11,0.12)] transition-all duration-300 cursor-default"
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.iconBg} shadow-[0_4px_14px_rgba(217,119,6,0.35)]`}>
              <stat.icon className="w-5 h-5 text-amber-50" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-black bg-gradient-to-br from-amber-100 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_1px_0_rgba(0,0,0,0.5)]">
              {stat.value}
            </p>
            <p className="text-sm text-amber-200/75 font-medium font-display tracking-wide">{stat.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
