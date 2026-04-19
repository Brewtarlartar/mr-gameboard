'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Clock, Target, Calendar, Users, Star, Percent } from 'lucide-react';
import { usePlayHistoryStore } from '@/lib/store/playHistoryStore';

export default function InsightsDashboard() {
  const {
    sessions,
    getTotalPlayTime,
    getMostPlayedGames,
    getPlayFrequency,
    getDaysSince,
    getHIndex,
    getGameWinRate,
  } = usePlayHistoryStore();

  const primaryPlayer = useMemo<string | null>(() => {
    const counts = new Map<string, number>();
    sessions.forEach((s) =>
      s.players.forEach((p) => {
        const key = p.name.toLowerCase();
        counts.set(key, (counts.get(key) ?? 0) + 1);
      })
    );
    let bestName: string | null = null;
    let bestCount = 0;
    counts.forEach((count, name) => {
      if (count > bestCount) {
        bestCount = count;
        bestName = name;
      }
    });
    return bestName;
  }, [sessions]);

  const insights = useMemo(() => {
    const totalPlayTime = getTotalPlayTime();
    const mostPlayed = getMostPlayedGames(8);
    const playFrequency = getPlayFrequency();
    const last30Days = playFrequency.slice(-30);
    const maxFrequency = Math.max(...last30Days.map((d) => d.count), 1);

    const avgDuration =
      sessions.length > 0 ? sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length : 0;

    const uniquePlayers = new Set(sessions.flatMap((s) => s.players.map((p) => p.name)));

    return {
      totalPlayTime,
      totalSessions: sessions.length,
      mostPlayed,
      avgDuration,
      uniquePlayers: uniquePlayers.size,
      hIndex: getHIndex(),
      last30Days,
      maxFrequency,
    };
  }, [sessions, getTotalPlayTime, getMostPlayedGames, getPlayFrequency, getHIndex]);

  if (sessions.length === 0) {
    return (
      <div className="bg-stone-800/50 border border-stone-700/40 rounded-2xl p-12 text-center">
        <TrendingUp className="w-14 h-14 text-amber-400 mx-auto mb-4 opacity-60" />
        <h3 className="text-xl font-bold text-stone-100 mb-2">No stats yet</h3>
        <p className="text-stone-400 text-sm">
          Log your first play session to unlock analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-stone-100 mb-1">Stats</h2>
        <p className="text-stone-400 text-sm">Your tabletop track record at a glance.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Calendar} label="Sessions" value={insights.totalSessions} />
        <StatCard icon={Clock} label="Hours" value={Math.round(insights.totalPlayTime / 60)} />
        <StatCard icon={Users} label="Players" value={insights.uniquePlayers} />
        <StatCard
          icon={Target}
          label="H-Index"
          value={insights.hIndex}
          tooltip="Played H games at least H times each"
        />
      </div>

      <div className="bg-stone-800/50 border border-stone-700/40 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-stone-100 uppercase tracking-wider">
            Most played
          </h3>
        </div>
        <div className="space-y-2">
          {insights.mostPlayed.map((game, index) => {
            const daysSince = getDaysSince(game.gameId);
            const winRate = primaryPlayer ? getGameWinRate(game.gameId, primaryPlayer) : null;
            const maxCount = insights.mostPlayed[0]?.playCount ?? 1;
            return (
              <motion.div
                key={game.gameId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                className="flex items-center gap-3 p-3 bg-stone-900/40 rounded-lg"
              >
                <div
                  className={`text-lg font-bold w-6 flex-shrink-0 ${
                    index === 0
                      ? 'text-amber-400'
                      : index === 1
                      ? 'text-stone-300'
                      : index === 2
                      ? 'text-amber-700'
                      : 'text-stone-500'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-100 truncate text-sm">{game.gameName}</p>
                  <div className="flex items-center gap-3 text-xs text-stone-400">
                    <span>{game.playCount} {game.playCount === 1 ? 'play' : 'plays'}</span>
                    {daysSince !== null && (
                      <span>
                        {daysSince === 0 ? 'today' : `${daysSince}d ago`}
                      </span>
                    )}
                    {winRate !== null && winRate > 0 && (
                      <span className="text-emerald-400">{Math.round(winRate)}% win</span>
                    )}
                  </div>
                </div>
                <div className="h-1.5 w-16 bg-stone-700/60 rounded-full overflow-hidden flex-shrink-0">
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: `${(game.playCount / maxCount) * 100}%` }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="bg-stone-800/50 border border-stone-700/40 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-stone-100 uppercase tracking-wider">
            Last 30 days
          </h3>
        </div>
        <div className="flex flex-wrap gap-1">
          {insights.last30Days.map((day, index) => {
            const intensity = day.count / insights.maxFrequency;
            return (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01 }}
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor:
                    day.count === 0
                      ? 'rgba(68, 64, 60, 0.6)'
                      : `rgba(245, 158, 11, ${0.25 + intensity * 0.75})`,
                }}
                title={`${day.date}: ${day.count} ${day.count === 1 ? 'play' : 'plays'}`}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-4 text-xs text-stone-500">
          <span>Less</span>
          <div className="flex items-center gap-1">
            {[0, 0.25, 0.5, 0.75, 1].map((intensity) => (
              <div
                key={intensity}
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor:
                    intensity === 0
                      ? 'rgba(68, 64, 60, 0.6)'
                      : `rgba(245, 158, 11, ${0.25 + intensity * 0.75})`,
                }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-stone-800/50 border border-stone-700/40 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-semibold text-stone-300 uppercase tracking-wider">
              Average session
            </h3>
          </div>
          <p className="text-2xl font-bold text-stone-100">
            {Math.round(insights.avgDuration)}<span className="text-stone-500 text-base"> min</span>
          </p>
        </div>
        <div className="bg-stone-800/50 border border-stone-700/40 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-semibold text-stone-300 uppercase tracking-wider">
              Unique games
            </h3>
          </div>
          <p className="text-2xl font-bold text-stone-100">{insights.mostPlayed.length}</p>
        </div>
      </div>

      {primaryPlayer && (
        <p className="text-xs text-stone-500 text-center">
          <Percent className="w-3 h-3 inline mr-1" />
          Win rate tracked for <span className="text-stone-300 capitalize">{primaryPlayer}</span> (most frequent player).
        </p>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tooltip,
}: {
  icon: React.ComponentType<any>;
  label: string;
  value: number;
  tooltip?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-stone-800/50 border border-stone-700/40 rounded-2xl p-4"
      title={tooltip}
    >
      <Icon className="w-4 h-4 text-amber-400 mb-2" />
      <p className="text-2xl font-bold text-stone-100 tabular-nums">{value}</p>
      <p className="text-xs text-stone-400">{label}</p>
    </motion.div>
  );
}
