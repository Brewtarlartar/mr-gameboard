import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Game, Player } from '@/types/game';

export type PlayModeStep = 'select' | 'setup' | 'playing';

interface ActiveDraft {
  game: Game | null;
  players: Player[];
  step: PlayModeStep;
  startedAt: number | null;
  updatedAt: number;
}

interface PlaySessionStore {
  draft: ActiveDraft;
  setGame: (game: Game | null) => void;
  setPlayers: (players: Player[]) => void;
  setStep: (step: PlayModeStep) => void;
  startSession: () => void;
  clearDraft: () => void;
  hasResumableDraft: () => boolean;
}

const emptyDraft: ActiveDraft = {
  game: null,
  players: [],
  step: 'select',
  startedAt: null,
  updatedAt: 0,
};

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
        set((state) => ({
          draft: { ...state.draft, players, updatedAt: Date.now() },
        })),

      setStep: (step) =>
        set((state) => ({
          draft: { ...state.draft, step, updatedAt: Date.now() },
        })),

      startSession: () =>
        set((state) => ({
          draft: {
            ...state.draft,
            step: 'playing',
            startedAt: state.draft.startedAt ?? Date.now(),
            updatedAt: Date.now(),
          },
        })),

      clearDraft: () => set({ draft: { ...emptyDraft, updatedAt: Date.now() } }),

      hasResumableDraft: () => {
        const { draft } = get();
        if (!draft.game) return false;
        if (draft.step === 'select') return false;
        // Drop drafts older than 24h so a stale one doesn't ambush the user.
        const ageHours = (Date.now() - draft.updatedAt) / (1000 * 60 * 60);
        return ageHours < 24;
      },
    }),
    {
      name: 'play-session-draft',
    }
  )
);
