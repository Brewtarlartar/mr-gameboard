'use client';

import { motion } from 'framer-motion';
import { Plus, Star, Sparkles, Clock } from 'lucide-react';
import { useGameStore } from '@/lib/store/gameStore';
import { useMemo } from 'react';

interface Activity {
  id: string;
  type: 'added' | 'favorited' | 'played';
  game: string;
  time: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export default function RecentActivity() {
  const { games, favorites } = useGameStore();

  const recentActivities = useMemo<Activity[]>(() => {
    const activities: Activity[] = [];

    games.slice(0, 3).forEach((game, index) => {
      activities.push({
        id: `add-${game.id}`,
        type: 'added',
        game: game.name,
        time: `${index + 1} day${index > 0 ? 's' : ''} ago`,
        icon: Plus,
        color: 'text-amber-300',
      });
    });

    games
      .filter((g) => favorites.includes(g.id))
      .slice(0, 2)
      .forEach((game, index) => {
        activities.push({
          id: `fav-${game.id}`,
          type: 'favorited',
          game: game.name,
          time: `${index + 2} days ago`,
          icon: Star,
          color: 'text-yellow-300',
        });
      });

    return activities.slice(0, 5);
  }, [games, favorites]);

  const cardClass =
    'bg-stone-950/70 backdrop-blur-sm border border-amber-500/30 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.45)] p-6 sm:p-8 w-full max-w-2xl';

  if (recentActivities.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardClass}>
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-6 h-6 text-amber-400" />
          <h3 className="text-xl font-bold font-display gradient-text">Recent Activity</h3>
        </div>
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-amber-500/50 mx-auto mb-3" />
          <p className="text-amber-100/90">No recent activity yet</p>
          <p className="text-amber-200/60 text-sm mt-1">Start adding games to your library!</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={cardClass}>
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
        <h3 className="text-xl font-bold font-display gradient-text">Recent Activity</h3>
      </div>

      <div className="space-y-3">
        {recentActivities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.05 }}
            className="flex items-center gap-4 p-3 rounded-xl bg-stone-900/60 border border-amber-500/20 hover:border-amber-400/40 hover:bg-stone-900/80 transition-colors"
          >
            <div className={`p-2 rounded-lg bg-amber-950/50 border border-amber-500/25 ${activity.color}`}>
              <activity.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-amber-50 font-medium truncate">{activity.game}</p>
              <p className="text-amber-200/65 text-sm">
                {activity.type === 'added' && 'Added to library'}
                {activity.type === 'favorited' && 'Marked as favorite'}
                {activity.type === 'played' && 'Played'}
              </p>
            </div>
            <span className="text-amber-400/70 text-xs whitespace-nowrap">{activity.time}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
