import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Game, Player } from '@/types/game';
import { usePlayHistoryStore, SessionMode } from './playHistoryStore';

export type PlayModeStep = 'select' | 'setup' | 'playing';

export interface ScorePlayerRow {
  id: string;
  name: string;
  team?: string;
  categories: Record<string, number>;
}

export interface ScoreState {
  mode: SessionMode;
  templateId: string;
  players: ScorePlayerRow[];
  coopOutcome: 'win' | 'loss' | null;
}

interface ActiveDraft {
  game: Game | null;
  players: Player[];
  step: PlayModeStep;
  startedAt: number | null;
  updatedAt: number;
  scoreState: ScoreState;
}

type ScorePlayersUpdater =
  | ScorePlayerRow[]
  | ((prev: ScorePlayerRow[]) => ScorePlayerRow[]);

interface PlaySessionStore {
  draft: ActiveDraft;
  setGame: (game: Game | null) => void;
  setPlayers: (players: Player[]) => void;
  setStep: (step: PlayModeStep) => void;
  startSession: () => void;
  clearDraft: () => void;
  hasResumableDraft: () => boolean;
  setScoreMode: (mode: SessionMode) => void;
  setScoreTemplate: (templateId: string) => void;
  setScorePlayers: (updater: ScorePlayersUpdater) => void;
  setCoopOutcome: (outcome: 'win' | 'loss' | null) => void;
  completeSession: () => void;
}

const emptyScoreState: ScoreState = {
  mode: 'competitive',
  templateId: 'simple',
  players: [],
  coopOutcome: null,
};

const emptyDraft: ActiveDraft = {
  game: null,
  players: [],
  step: 'select',
  startedAt: null,
  updatedAt: 0,
  scoreState: emptyScoreState,
};

const seedScoreRowsFromSetup = (
  players: Player[],
  prev: ScorePlayerRow[],
  mode: SessionMode,
): ScorePlayerRow[] =>
  players.map((p, idx) => {
    const existing = prev.find((sp) => sp.name.trim() === p.name.trim() && p.name.trim().length > 0);
    if (existing) return existing;
    return {
      id: `seed-${p.id}`,
      name: p.name,
      team: mode === 'team' ? (idx % 2 === 0 ? 'A' : 'B') : undefined,
      categories: {},
    };
  });

const totalFor = (p: ScorePlayerRow) =>
  Object.values(p.categories).reduce((sum, v) => sum + (v || 0), 0);

export const usePlaySessionStore = create<PlaySessionStore>()(
  persist(
    (set, get) => ({
      draft: emptyDraft,

      setGame: (game) =>
        set((state) => ({
          draft: {
            ...state.draft,
            game,
            step: game ? (state.draft.step === 'select' ? 'setup' : state.draft.step) : 'select',
            updatedAt: Date.now(),
          },
        })),

      setPlayers: (players) =>
        set((state) => {
          const isPreGame = state.draft.step !== 'playing';
          const nextScoreState: ScoreState = isPreGame
            ? {
                ...state.draft.scoreState,
                players: seedScoreRowsFromSetup(
                  players,
                  state.draft.scoreState.players,
                  state.draft.scoreState.mode,
                ),
              }
            : state.draft.scoreState;
          return {
            draft: {
              ...state.draft,
              players,
              scoreState: nextScoreState,
              updatedAt: Date.now(),
            },
          };
        }),

      setStep: (step) =>
        set((state) => ({
          draft: { ...state.draft, step, updatedAt: Date.now() },
        })),

      startSession: () =>
        set((state) => {
          const needsSeed =
            state.draft.scoreState.players.length === 0 && state.draft.players.length > 0;
          const nextScoreState: ScoreState = needsSeed
            ? {
                ...state.draft.scoreState,
                players: seedScoreRowsFromSetup(
                  state.draft.players,
                  [],
                  state.draft.scoreState.mode,
                ),
              }
            : state.draft.scoreState;
          return {
            draft: {
              ...state.draft,
              step: 'playing',
              startedAt: state.draft.startedAt ?? Date.now(),
              updatedAt: Date.now(),
              scoreState: nextScoreState,
            },
          };
        }),

      clearDraft: () => set({ draft: { ...emptyDraft, updatedAt: Date.now() } }),

      hasResumableDraft: () => {
        const { draft } = get();
        if (!draft.game) return false;
        if (draft.step === 'select') return false;
        const ageHours = (Date.now() - draft.updatedAt) / (1000 * 60 * 60);
        return ageHours < 24;
      },

      setScoreMode: (mode) =>
        set((state) => ({
          draft: {
            ...state.draft,
            scoreState: {
              ...state.draft.scoreState,
              mode,
              coopOutcome: mode === 'coop' ? state.draft.scoreState.coopOutcome : null,
            },
            updatedAt: Date.now(),
          },
        })),

      setScoreTemplate: (templateId) =>
        set((state) => ({
          draft: {
            ...state.draft,
            scoreState: { ...state.draft.scoreState, templateId },
            updatedAt: Date.now(),
          },
        })),

      setScorePlayers: (updater) =>
        set((state) => {
          const prev = state.draft.scoreState.players;
          const next = typeof updater === 'function' ? updater(prev) : updater;
          return {
            draft: {
              ...state.draft,
              scoreState: { ...state.draft.scoreState, players: next },
              updatedAt: Date.now(),
            },
          };
        }),

      setCoopOutcome: (outcome) =>
        set((state) => ({
          draft: {
            ...state.draft,
            scoreState: { ...state.draft.scoreState, coopOutcome: outcome },
            updatedAt: Date.now(),
          },
        })),

      completeSession: () => {
        const { draft } = get();
        if (!draft.game) {
          set({ draft: { ...emptyDraft, updatedAt: Date.now() } });
          return;
        }

        const startedAt = draft.startedAt ?? Date.now();
        const durationMinutes = Math.max(
          1,
          Math.round((Date.now() - startedAt) / (1000 * 60)),
        );

        const { mode, players: scoreRows, coopOutcome } = draft.scoreState;
        const rosterNames = draft.players.map((p) => p.name).filter((n) => n.trim().length > 0);
        const hasScoreRows = scoreRows.length > 0;

        let historyPlayers: {
          name: string;
          score?: number;
          isWinner: boolean;
          team?: string;
        }[] = [];

        if (hasScoreRows) {
          if (mode === 'competitive') {
            const max = scoreRows.reduce((m, p) => Math.max(m, totalFor(p)), 0);
            historyPlayers = scoreRows.map((p) => {
              const total = totalFor(p);
              return {
                name: p.name,
                score: total,
                isWinner: max > 0 && total === max,
              };
            });
          } else if (mode === 'team') {
            const teamTotals = new Map<string, number>();
            scoreRows.forEach((p) => {
              const t = p.team ?? '—';
              teamTotals.set(t, (teamTotals.get(t) ?? 0) + totalFor(p));
            });
            const sorted = [...teamTotals.entries()].sort((a, b) => b[1] - a[1]);
            const topTeam = sorted[0] && sorted[0][1] > 0 ? sorted[0][0] : null;
            historyPlayers = scoreRows.map((p) => ({
              name: p.name,
              score: totalFor(p),
              team: p.team,
              isWinner: !!topTeam && p.team === topTeam,
            }));
          } else {
            const didWin = coopOutcome === 'win';
            historyPlayers = scoreRows.map((p) => ({
              name: p.name,
              isWinner: didWin,
            }));
          }
        } else if (rosterNames.length > 0) {
          historyPlayers = rosterNames.map((name) => ({ name, isWinner: false }));
        }

        if (historyPlayers.length > 0) {
          usePlayHistoryStore.getState().addSession({
            gameId: draft.game.id,
            gameName: draft.game.name,
            date: new Date(),
            duration: durationMinutes,
            mode,
            coopOutcome:
              mode === 'coop' && coopOutcome ? coopOutcome : undefined,
            players: historyPlayers,
          });
        }

        set({ draft: { ...emptyDraft, updatedAt: Date.now() } });
      },
    }),
    {
      name: 'play-session-draft',
    },
  ),
);
