import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TeachPlan, TeachPlayer } from '@/lib/ai/types';

export interface WizardMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface StrategyEntry {
  gameName: string;
  faction: string;
  depth: 'overview' | 'deep';
  content: string;
  timestamp: number;
}

export interface TeachEntry {
  gameName: string;
  playerCount: number;
  players: TeachPlayer[];
  plan: TeachPlan;
  timestamp: number;
}

interface AIStore {
  wizardMessages: WizardMessage[];
  strategyCache: Record<string, StrategyEntry>;
  teachSessions: Record<string, TeachEntry>;

  appendWizardMessage: (msg: WizardMessage) => void;
  updateLastAssistantMessage: (content: string) => void;
  clearWizard: () => void;

  saveStrategy: (entry: StrategyEntry) => void;
  getStrategy: (gameName: string, faction: string, depth: 'overview' | 'deep') => StrategyEntry | null;

  saveTeach: (key: string, entry: TeachEntry) => void;
  getTeach: (key: string) => TeachEntry | null;
}

export function strategyKey(gameName: string, faction: string, depth: 'overview' | 'deep'): string {
  return `${gameName.toLowerCase().trim()}::${faction.toLowerCase().trim()}::${depth}`;
}

export function teachKey(gameName: string, playerCount: number, players: TeachPlayer[]): string {
  const sig = players
    .map((p) => `${p.name.toLowerCase().trim()}:${(p.faction ?? '').toLowerCase().trim()}`)
    .join('|');
  return `${gameName.toLowerCase().trim()}::${playerCount}::${sig}`;
}

export const useAIStore = create<AIStore>()(
  persist(
    (set, get) => ({
      wizardMessages: [],
      strategyCache: {},
      teachSessions: {},

      appendWizardMessage: (msg) =>
        set((state) => ({ wizardMessages: [...state.wizardMessages, msg] })),

      updateLastAssistantMessage: (content) =>
        set((state) => {
          const msgs = [...state.wizardMessages];
          for (let i = msgs.length - 1; i >= 0; i--) {
            if (msgs[i].role === 'assistant') {
              msgs[i] = { ...msgs[i], content };
              return { wizardMessages: msgs };
            }
          }
          return state;
        }),

      clearWizard: () => set({ wizardMessages: [] }),

      saveStrategy: (entry) =>
        set((state) => ({
          strategyCache: {
            ...state.strategyCache,
            [strategyKey(entry.gameName, entry.faction, entry.depth)]: entry,
          },
        })),

      getStrategy: (gameName, faction, depth) => {
        const k = strategyKey(gameName, faction, depth);
        return get().strategyCache[k] ?? null;
      },

      saveTeach: (key, entry) =>
        set((state) => ({
          teachSessions: { ...state.teachSessions, [key]: entry },
        })),

      getTeach: (key) => get().teachSessions[key] ?? null,
    }),
    {
      name: 'mr-gameboard-ai',
      version: 1,
    },
  ),
);
