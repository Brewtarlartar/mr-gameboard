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

    const topWinner = (() => {
      const wins = new Map<string, number>();
      sessions.forEach((s) =>
        s.players.forEach((p) => {
          if (p.isWinner) {
            const key = p.name;
            wins.set(key, (wins.get(key) ?? 0) + 1);
          }
        })
      );
      let bestName: string | null = null;
      let bestCount = 0;
      wins.forEach((count, name) => {
        if (count > bestCount) {
          bestCount = count;
          bestName = name;
        }
      });
      return bestName ? { name: bestName, wins: bestCount } : null;
    })();

    return {
      totalPlayTime,
      totalSessions: sessions.length,
      mostPlayed,
      avgDuration,
      uniquePlayers: uniquePlayers.size,
      hIndex: getHIndex(),
      last30Days,
      maxFrequency,
      topWinner,
    };
  }, [sessions, getTotalPlayTime, getMostPlayedGames, getPlayFrequency, getHIndex]);

  if (sessions.length === 0) {
    return (
      <div className="bg-gradient-to-b from-stone-900/70 to-stone-950/80 border border-amber-900/50 rounded-2xl p-10 sm:p-12 text-center shadow-lg shadow-black/30">
        <div className="text-5xl mb-4">📜</div>
        <h3 className="text-2xl font-serif font-bold text-amber-100 mb-2">
          The chronicle is blank
        </h3>
        <p className="text-amber-200/70 text-sm font-serif italic max-w-md mx-auto">
          Scribe thy first session with the button above, and this page shall bloom
          with thy tabletop deeds.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
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

      <div className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 shadow-lg shadow-black/20">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-serif font-semibold text-amber-200 uppercase tracking-widest">
            Most Played
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
                className="flex items-center gap-3 p-3 bg-stone-950/50 border border-amber-900/30 rounded-lg"
              >
                <div
                  className={`text-lg font-serif font-bold w-6 flex-shrink-0 ${
                    index === 0
                      ? 'text-amber-300'
                      : index === 1
                      ? 'text-amber-100/80'
                      : index === 2
                      ? 'text-amber-600'
                      : 'text-stone-500'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-serif font-semibold text-amber-100 truncate text-sm">
                    {game.gameName}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-stone-400">
                    <span>
                      {game.playCount} {game.playCount === 1 ? 'play' : 'plays'}
                    </span>
                    {daysSince !== null && (
                      <span>{daysSince === 0 ? 'today' : `${daysSince}d ago`}</span>
                    )}
                    {winRate !== null && winRate > 0 && (
                      <span className="text-emerald-400">{Math.round(winRate)}% win</span>
                    )}
                  </div>
                </div>
                <div className="h-1.5 w-16 bg-stone-900 border border-amber-900/40 rounded-full overflow-hidden flex-shrink-0">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-600"
                    style={{ width: `${(game.playCount / maxCount) * 100}%` }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 shadow-lg shadow-black/20">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-serif font-semibold text-amber-200 uppercase tracking-widest">
            Last 30 Days
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
                      ? 'rgba(41, 37, 36, 0.7)'
                      : `rgba(245, 158, 11, ${0.25 + intensity * 0.75})`,
                }}
                title={`${day.date}: ${day.count} ${day.count === 1 ? 'play' : 'plays'}`}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-4 text-[11px] text-amber-200/50 font-serif italic">
          <span>Less</span>
          <div className="flex items-center gap-1">
            {[0, 0.25, 0.5, 0.75, 1].map((intensity) => (
              <div
                key={intensity}
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor:
                    intensity === 0
                      ? 'rgba(41, 37, 36, 0.7)'
                      : `rgba(245, 158, 11, ${0.25 + intensity * 0.75})`,
                }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 shadow-lg shadow-black/20">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-[11px] font-serif font-semibold text-amber-200/80 uppercase tracking-widest">
              Average Session
            </h3>
          </div>
          <p className="text-2xl font-serif font-bold text-amber-100 tabular-nums">
            {Math.round(insights.avgDuration)}
            <span className="text-amber-200/50 text-base font-normal italic"> min</span>
          </p>
        </div>
        <div className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 shadow-lg shadow-black/20">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-amber-400" />
            <h3 className="text-[11px] font-serif font-semibold text-amber-200/80 uppercase tracking-widest">
              Unique Games
            </h3>
          </div>
          <p className="text-2xl font-serif font-bold text-amber-100 tabular-nums">
            {insights.mostPlayed.length}
          </p>
        </div>
      </div>

      {insights.topWinner && (
        <div className="bg-gradient-to-br from-amber-900/25 via-stone-900/70 to-stone-950/80 border border-amber-500/40 rounded-2xl p-5 shadow-lg shadow-amber-900/20 flex items-center gap-4">
          <div className="shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 border border-amber-300/50 flex items-center justify-center shadow-inner shadow-amber-200/30">
            <Trophy className="w-6 h-6 text-stone-950" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[11px] font-serif font-semibold text-amber-200/80 uppercase tracking-widest mb-0.5">
              Reigning Champion
            </h3>
            <p className="text-lg font-serif font-bold text-amber-100 capitalize truncate">
              {insights.topWinner.name}
            </p>
            <p className="text-[11px] text-amber-200/60 font-serif italic">
              {insights.topWinner.wins} {insights.topWinner.wins === 1 ? 'victory' : 'victories'} to thy name
            </p>
          </div>
        </div>
      )}

      {primaryPlayer && (
        <p className="text-[11px] text-amber-200/50 text-center font-serif italic">
          <Percent className="w-3 h-3 inline mr-1" />
          Win rate tracked for <span className="text-amber-200/80 capitalize not-italic">{primaryPlayer}</span> (most frequent player).
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
      className="bg-gradient-to-b from-stone-900/80 to-stone-950/90 border border-amber-900/50 rounded-2xl p-4 shadow-lg shadow-black/20"
      title={tooltip}
    >
      <Icon className="w-4 h-4 text-amber-400 mb-2" />
      <p className="text-2xl font-serif font-bold text-amber-100 tabular-nums">{value}</p>
      <p className="text-[11px] text-amber-200/60 font-serif uppercase tracking-wider">{label}</p>
    </motion.div>
  );
}
