import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Game } from '@/types/game';

export type SessionMode = 'competitive' | 'coop' | 'team';

export interface PlaySession {
  id: string;
  gameId: string;
  gameName: string;
  date: Date;
  duration: number; // minutes
  mode?: SessionMode;
  coopOutcome?: 'win' | 'loss';
  players: {
    name: string;
    score?: number;
    isWinner: boolean;
    team?: string;
  }[];
  notes?: string;
  rating?: number;
  location?: string;
}

interface PlayHistoryStore {
  sessions: PlaySession[];

  addSession: (session: Omit<PlaySession, 'id'>) => void;
  updateSession: (id: string, session: Partial<PlaySession>) => void;
  deleteSession: (id: string) => void;
  clearHistory: () => void;
  getSessionsByGame: (gameId: string) => PlaySession[];
  getTotalPlayTime: () => number;
  getMostPlayedGames: (limit?: number) => { gameId: string; gameName: string; playCount: number }[];
  getRecentSessions: (limit?: number) => PlaySession[];
  getWinRate: (playerName: string) => number;
  getPlayFrequency: () => { date: string; count: number }[];
  getDaysSince: (gameId: string) => number | null;
  getHIndex: () => number;
  getGameWinRate: (gameId: string, playerName: string) => number;
}

export const usePlayHistoryStore = create<PlayHistoryStore>()(
  persist(
    (set, get) => ({
      sessions: [],

      addSession: (session) => {
        const newSession: PlaySession = {
          ...session,
          id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          date: new Date(session.date),
        };
        set((state) => ({
          sessions: [...state.sessions, newSession],
        }));
      },

      updateSession: (id, updates) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },

      deleteSession: (id) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
        }));
      },

      clearHistory: () => {
        set({ sessions: [] });
      },

      getSessionsByGame: (gameId) => {
        return get().sessions.filter((s) => s.gameId === gameId);
      },

      getTotalPlayTime: () => {
        return get().sessions.reduce((total, session) => total + session.duration, 0);
      },

      getMostPlayedGames: (limit = 10) => {
        const sessions = get().sessions;
        const gamePlayCounts = new Map<string, { gameName: string; count: number }>();

        sessions.forEach((session) => {
          const existing = gamePlayCounts.get(session.gameId);
          if (existing) {
            existing.count++;
          } else {
            gamePlayCounts.set(session.gameId, {
              gameName: session.gameName,
              count: 1,
            });
          }
        });

        return Array.from(gamePlayCounts.entries())
          .map(([gameId, data]) => ({
            gameId,
            gameName: data.gameName,
            playCount: data.count,
          }))
          .sort((a, b) => b.playCount - a.playCount)
          .slice(0, limit);
      },

      getRecentSessions: (limit = 5) => {
        return [...get().sessions]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, limit);
      },

      getWinRate: (playerName) => {
        const sessions = get().sessions;
        const playerSessions = sessions.filter((s) =>
          s.players.some((p) => p.name.toLowerCase() === playerName.toLowerCase())
        );

        if (playerSessions.length === 0) return 0;

        const wins = playerSessions.filter((s) =>
          s.players.some(
            (p) =>
              p.name.toLowerCase() === playerName.toLowerCase() && p.isWinner
          )
        ).length;

        return (wins / playerSessions.length) * 100;
      },

      getPlayFrequency: () => {
        const sessions = get().sessions;
        const frequencyMap = new Map<string, number>();

        sessions.forEach((session) => {
          const dateKey = new Date(session.date).toISOString().split('T')[0];
          frequencyMap.set(dateKey, (frequencyMap.get(dateKey) || 0) + 1);
        });

        return Array.from(frequencyMap.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date));
      },

      getDaysSince: (gameId) => {
        const sessions = get().sessions.filter((s) => s.gameId === gameId);
        if (sessions.length === 0) return null;
        const latest = sessions.reduce((max, s) => {
          const t = new Date(s.date).getTime();
          return t > max ? t : max;
        }, 0);
        const diffMs = Date.now() - latest;
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
      },

      getHIndex: () => {
        const counts = get()
          .getMostPlayedGames(9999)
          .map((g) => g.playCount)
          .sort((a, b) => b - a);
        let h = 0;
        for (let i = 0; i < counts.length; i++) {
          if (counts[i] >= i + 1) h = i + 1;
          else break;
        }
        return h;
      },

      getGameWinRate: (gameId, playerName) => {
        const name = playerName.toLowerCase();
        const gameSessions = get().sessions.filter(
          (s) => s.gameId === gameId && s.players.some((p) => p.name.toLowerCase() === name)
        );
        if (gameSessions.length === 0) return 0;
        const wins = gameSessions.filter((s) => {
          if (s.mode === 'coop') return s.coopOutcome === 'win';
          return s.players.some((p) => p.name.toLowerCase() === name && p.isWinner);
        }).length;
        return (wins / gameSessions.length) * 100;
      },
    }),
    {
      name: 'play-history-storage',
    }
  )
);

