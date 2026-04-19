'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Trophy, Users, TrendingUp, Star, Trash2, Edit } from 'lucide-react';
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
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-12 text-center">
        <Calendar className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Play Sessions Yet</h3>
        <p className="text-gray-500">
          Start logging your game sessions to track your gaming journey!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-purple-600">Play History</h2>
        <span className="px-3 py-1 bg-purple-50 text-purple-600 text-sm font-semibold rounded-full">{sessions.length} Sessions</span>
      </div>

      <div className="space-y-3">
        {sortedSessions.map((session, index) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 hover:bg-gray-50 transition-all cursor-pointer"
            onClick={() => setSelectedSession(session.id === selectedSession ? null : session.id)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{session.gameName}</h3>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(session.date), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{session.duration} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{session.players.length} players</span>
                  </div>
                  {session.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>{session.rating}/5</span>
                    </div>
                  )}
                </div>

                {/* Players */}
                <div className="flex flex-wrap gap-2">
                  {session.players.map((player, idx) => (
                    <div
                      key={idx}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        player.isWinner
                          ? 'bg-amber-50 border border-amber-200 text-amber-600'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {player.isWinner && <Trophy className="w-3 h-3 inline mr-1" />}
                      {player.name}
                      {player.score !== undefined && ` (${player.score})`}
                    </div>
                  ))}
                </div>

                {/* Expanded Details */}
                {selectedSession === session.id && session.notes && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 pt-3 border-t border-gray-200"
                  >
                    <p className="text-sm text-gray-700 italic">{session.notes}</p>
                  </motion.div>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this session?')) {
                    deleteSession(session.id);
                  }
                }}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
