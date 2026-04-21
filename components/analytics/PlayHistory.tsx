'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Trophy, Users, Star, Trash2, Crown, HeartHandshake } from 'lucide-react';
import { usePlayHistoryStore } from '@/lib/store/playHistoryStore';
import { format } from 'date-fns';

export default function PlayHistory() {
  const { sessions, deleteSession } = usePlayHistoryStore();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (sessions.length === 0) {
    return (
      <div className="bg-gradient-to-b from-stone-900/70 to-stone-950/80 border border-amber-900/50 rounded-2xl p-10 sm:p-12 text-center shadow-lg shadow-black/30">
        <div className="text-5xl mb-4">📜</div>
        <h3 className="text-2xl font-serif font-bold text-amber-100 mb-2">
          No tales to tell yet
        </h3>
        <p className="text-amber-200/70 text-sm font-serif italic max-w-md mx-auto">
          Scribe thy first session with the button above to begin thy chronicle.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-amber-200/70 text-sm font-serif italic">
          {sessions.length} {sessions.length === 1 ? 'tale scribed' : 'tales scribed'}
        </p>
        <span className="px-3 py-1 bg-amber-500/10 text-amber-200 text-xs font-serif font-semibold rounded-full border border-amber-500/40">
          {sessions.length} {sessions.length === 1 ? 'Session' : 'Sessions'}
        </span>
      </div>

      <div className="space-y-3">
        {sortedSessions.map((session, index) => {
          const isExpanded = selectedSession === session.id;
          const winners = session.players.filter((p) => p.isWinner);
          const isCoop = session.mode === 'coop';
          const coopWon = isCoop && session.coopOutcome === 'win';
          const coopLost = isCoop && session.coopOutcome === 'loss';
          return (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.03, 0.3) }}
              className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 hover:border-amber-500/50 rounded-2xl p-4 shadow-lg shadow-black/20 transition-colors cursor-pointer"
              onClick={() => setSelectedSession(isExpanded ? null : session.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-serif font-bold text-amber-100 mb-1.5 truncate">
                    {session.gameName}
                  </h3>

                  {winners.length > 0 && !isCoop && (
                    <div className="flex items-center gap-1.5 text-xs font-serif mb-2">
                      <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-amber-200/90 font-semibold capitalize truncate">
                        {winners.map((w) => w.name).join(' & ')} won
                      </span>
                    </div>
                  )}
                  {coopWon && (
                    <div className="flex items-center gap-1.5 text-xs font-serif mb-2">
                      <HeartHandshake className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-emerald-200/90 font-semibold">
                        Group victory
                      </span>
                    </div>
                  )}
                  {coopLost && (
                    <div className="flex items-center gap-1.5 text-xs font-serif mb-2">
                      <HeartHandshake className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span className="text-red-200/80 font-semibold">
                        Group defeat
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-amber-200/70 mb-3 font-serif">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400/80" />
                      <span>{format(new Date(session.date), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400/80" />
                      <span>{session.duration} min</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-400/80" />
                      <span>
                        {session.players.length}{' '}
                        {session.players.length === 1 ? 'player' : 'players'}
                      </span>
                    </div>
                    {session.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>{session.rating}/5</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {session.players.map((player, idx) => (
                      <div
                        key={idx}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-serif font-semibold border ${
                          player.isWinner
                            ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                            : 'bg-stone-950/70 border-amber-900/40 text-amber-100/80'
                        }`}
                      >
                        {player.isWinner && <Trophy className="w-3 h-3" />}
                        <span className="capitalize">{player.name}</span>
                        {player.score !== undefined && (
                          <span className="text-amber-200/60">({player.score})</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {isExpanded && session.notes && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 pt-3 border-t border-amber-900/40"
                    >
                      <p className="text-sm text-amber-100/80 italic font-serif leading-relaxed">
                        &ldquo;{session.notes}&rdquo;
                      </p>
                    </motion.div>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (typeof window !== 'undefined' && window.confirm('Erase this tale from the chronicle?')) {
                      deleteSession(session.id);
                    }
                  }}
                  className="p-2 bg-red-950/60 hover:bg-red-900/70 border border-red-800/60 rounded-lg transition-colors shrink-0"
                  aria-label="Delete session"
                  title="Delete session"
                >
                  <Trash2 className="w-4 h-4 text-red-200" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
