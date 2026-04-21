'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Clock,
  Hourglass,
  Users,
  Layers,
  Swords,
  Crown,
  Medal,
  Calendar,
  Flame,
} from 'lucide-react';
import { usePlayHistoryStore } from '@/lib/store/playHistoryStore';
import { format, subDays } from 'date-fns';

interface PlayerStanding {
  name: string;
  displayName: string;
  plays: number;
  wins: number;
  winRate: number;
}

export default function InsightsDashboard() {
  const {
    sessions,
    getTotalPlayTime,
    getMostPlayedGames,
    getPlayFrequency,
    getDaysSince,
    getHIndex,
  } = usePlayHistoryStore();

  const insights = useMemo(() => {
    const totalPlayTime = getTotalPlayTime();
    const mostPlayed = getMostPlayedGames(8);
    const playFrequency = getPlayFrequency();

    const today = new Date();
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = subDays(today, 29 - i);
      const key = d.toISOString().split('T')[0];
      const match = playFrequency.find((f) => f.date === key);
      return { date: key, count: match?.count ?? 0 };
    });
    const maxFrequency = Math.max(...last30Days.map((d) => d.count), 1);

    const avgDuration =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length
        : 0;

    const playerRoster = (() => {
      const stats = new Map<string, { displayName: string; plays: number; wins: number }>();
      sessions.forEach((s) => {
        s.players.forEach((p) => {
          const key = p.name.trim().toLowerCase();
          if (!key) return;
          const entry = stats.get(key) ?? { displayName: p.name.trim(), plays: 0, wins: 0 };
          entry.plays += 1;
          if (s.mode === 'coop') {
            if (s.coopOutcome === 'win') entry.wins += 1;
          } else if (p.isWinner) {
            entry.wins += 1;
          }
          stats.set(key, entry);
        });
      });
      return Array.from(stats.entries())
        .map<PlayerStanding>(([name, v]) => ({
          name,
          displayName: v.displayName,
          plays: v.plays,
          wins: v.wins,
          winRate: v.plays > 0 ? (v.wins / v.plays) * 100 : 0,
        }))
        .sort((a, b) => (b.wins - a.wins) || (b.winRate - a.winRate) || (b.plays - a.plays));
    })();

    const uniqueGameCount = new Set(sessions.map((s) => s.gameId)).size;
    const uniquePlayers = playerRoster.length;
    const champion = playerRoster.find((p) => p.wins > 0) ?? null;

    const streak = (() => {
      const daySet = new Set(
        sessions.map((s) => new Date(s.date).toISOString().split('T')[0])
      );
      let n = 0;
      let cursor = new Date();
      while (n < 365) {
        const key = cursor.toISOString().split('T')[0];
        if (daySet.has(key)) {
          n += 1;
          cursor = subDays(cursor, 1);
        } else {
          break;
        }
      }
      return n;
    })();

    return {
      totalPlayTime,
      totalSessions: sessions.length,
      mostPlayed,
      avgDuration,
      uniquePlayers,
      uniqueGameCount,
      hIndex: getHIndex(),
      last30Days,
      maxFrequency,
      champion,
      playerRoster,
      streak,
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
          Play a game through on the Play tab — it shall be scribed here
          automatically. Or use Scribe a Session above to log one by hand.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Swords}
          label="Sessions"
          value={insights.totalSessions}
          tooltip="Total sessions scribed to thy chronicle"
        />
        <StatCard
          icon={Hourglass}
          label="Hours played"
          value={Math.round(insights.totalPlayTime / 60)}
          tooltip="Total time spent at the table"
        />
        <StatCard
          icon={Users}
          label="Fellowship"
          value={insights.uniquePlayers}
          tooltip="Unique adventurers you've played with"
        />
        <StatCard
          icon={Layers}
          label="Variety"
          value={insights.hIndex}
          tooltip="You've played H games at least H times each — a measure of rotation depth"
        />
      </div>

      {/* Streak + Reigning Champion */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {insights.champion ? (
          <div className="lg:col-span-3 bg-gradient-to-br from-amber-900/25 via-stone-900/70 to-stone-950/80 border border-amber-500/40 rounded-2xl p-5 shadow-lg shadow-amber-900/20 flex items-center gap-4">
            <div className="shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 border border-amber-300/50 flex items-center justify-center shadow-inner shadow-amber-200/40">
              <Crown className="w-7 h-7 text-stone-950" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[11px] font-serif font-semibold text-amber-200/80 uppercase tracking-widest mb-0.5">
                Reigning Champion
              </h3>
              <p className="text-xl font-serif font-bold text-amber-100 capitalize truncate">
                {insights.champion.displayName}
              </p>
              <p className="text-[11px] text-amber-200/60 font-serif italic">
                {insights.champion.wins}{' '}
                {insights.champion.wins === 1 ? 'victory' : 'victories'} ·{' '}
                {Math.round(insights.champion.winRate)}% win rate across{' '}
                {insights.champion.plays} plays
              </p>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-3 bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 flex items-center gap-4">
            <div className="shrink-0 w-14 h-14 rounded-full bg-stone-900/80 border border-amber-900/50 flex items-center justify-center">
              <Crown className="w-7 h-7 text-amber-400/50" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[11px] font-serif font-semibold text-amber-200/80 uppercase tracking-widest mb-0.5">
                Reigning Champion
              </h3>
              <p className="text-sm font-serif italic text-amber-200/70">
                No victor crowned yet — mark a winner on thy next session.
              </p>
            </div>
          </div>
        )}

        <div className="lg:col-span-2 bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 flex items-center gap-4">
          <div className="shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-red-500/60 to-amber-700/50 border border-amber-500/40 flex items-center justify-center shadow-inner shadow-amber-200/20">
            <Flame className="w-6 h-6 text-amber-100" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[11px] font-serif font-semibold text-amber-200/80 uppercase tracking-widest mb-0.5">
              Current streak
            </h3>
            <p className="text-xl font-serif font-bold text-amber-100 tabular-nums">
              {insights.streak}
              <span className="text-amber-200/50 text-sm font-normal italic">
                {' '}
                {insights.streak === 1 ? 'day' : 'days'}
              </span>
            </p>
            <p className="text-[11px] text-amber-200/60 font-serif italic">
              {insights.streak === 0
                ? 'Play today to light it again'
                : 'Consecutive days with a session'}
            </p>
          </div>
        </div>
      </div>

      {/* Tavern Roster — per-player standings */}
      {insights.playerRoster.length > 0 && (
        <div className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 shadow-lg shadow-black/20">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-serif font-semibold text-amber-200 uppercase tracking-widest">
              Tavern Roster
            </h3>
          </div>
          <div className="space-y-2">
            {insights.playerRoster.slice(0, 8).map((player, index) => (
              <motion.div
                key={player.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  index === 0
                    ? 'bg-amber-500/10 border-amber-500/40'
                    : 'bg-stone-950/50 border-amber-900/30'
                }`}
              >
                <RankBadge rank={index + 1} />
                <div className="flex-1 min-w-0">
                  <p className="font-serif font-semibold text-amber-100 truncate text-sm capitalize">
                    {player.displayName}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-stone-400">
                    <span>
                      {player.plays} {player.plays === 1 ? 'play' : 'plays'}
                    </span>
                    <span className="text-amber-300">
                      {player.wins} {player.wins === 1 ? 'win' : 'wins'}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-serif font-bold text-amber-200 tabular-nums">
                    {Math.round(player.winRate)}%
                  </p>
                  <p className="text-[10px] text-amber-200/50 uppercase tracking-wider font-serif">
                    win rate
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Most Played */}
      <div className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 shadow-lg shadow-black/20">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-serif font-semibold text-amber-200 uppercase tracking-widest">
            Most Played Games
          </h3>
        </div>
        <div className="space-y-2">
          {insights.mostPlayed.map((game, index) => {
            const daysSince = getDaysSince(game.gameId);
            const maxCount = insights.mostPlayed[0]?.playCount ?? 1;
            return (
              <motion.div
                key={game.gameId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  index === 0
                    ? 'bg-amber-500/10 border-amber-500/40'
                    : 'bg-stone-950/50 border-amber-900/30'
                }`}
              >
                <RankBadge rank={index + 1} />
                <div className="flex-1 min-w-0">
                  <p className="font-serif font-semibold text-amber-100 truncate text-sm">
                    {game.gameName}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-stone-400">
                    <span>
                      {game.playCount} {game.playCount === 1 ? 'play' : 'plays'}
                    </span>
                    {daysSince !== null && (
                      <span>
                        {daysSince === 0
                          ? 'played today'
                          : daysSince === 1
                          ? 'yesterday'
                          : `${daysSince}d ago`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-1.5 w-16 bg-stone-900 border border-amber-900/40 rounded-full overflow-hidden shrink-0">
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

      {/* Last 30 Days — with date labels */}
      <div className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 shadow-lg shadow-black/20">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-serif font-semibold text-amber-200 uppercase tracking-widest">
            Last 30 Days
          </h3>
        </div>
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}>
          {insights.last30Days.map((day, index) => {
            const intensity = day.count / insights.maxFrequency;
            return (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01 }}
                className="aspect-square rounded-sm"
                style={{
                  backgroundColor:
                    day.count === 0
                      ? 'rgba(41, 37, 36, 0.7)'
                      : `rgba(245, 158, 11, ${0.25 + intensity * 0.75})`,
                }}
                title={`${format(new Date(day.date + 'T12:00:00'), 'MMM d')}: ${day.count} ${day.count === 1 ? 'play' : 'plays'}`}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-3 text-[11px] text-amber-200/50 font-serif italic">
          <span>{format(new Date(insights.last30Days[0].date), 'MMM d')}</span>
          <div className="flex items-center gap-1">
            <span className="mr-1">Less</span>
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
            <span className="ml-1">More</span>
          </div>
          <span>Today</span>
        </div>
      </div>

      {/* Secondary stats */}
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
            <Layers className="w-4 h-4 text-amber-400" />
            <h3 className="text-[11px] font-serif font-semibold text-amber-200/80 uppercase tracking-widest">
              Unique Games
            </h3>
          </div>
          <p className="text-2xl font-serif font-bold text-amber-100 tabular-nums">
            {insights.uniqueGameCount}
          </p>
        </div>
      </div>
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

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 border border-amber-200/60 flex items-center justify-center shadow-md shadow-amber-900/40">
        <Crown className="w-4 h-4 text-stone-950" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-stone-300 to-stone-500 border border-stone-200/40 flex items-center justify-center shadow-md shadow-black/40">
        <Medal className="w-4 h-4 text-stone-900" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 border border-amber-600/40 flex items-center justify-center shadow-md shadow-black/40">
        <Medal className="w-4 h-4 text-amber-100" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 shrink-0 rounded-full bg-stone-900/80 border border-amber-900/40 flex items-center justify-center font-serif font-bold text-sm text-amber-200/70">
      {rank}
    </div>
  );
}
