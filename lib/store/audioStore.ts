import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AudioStore {
  isMuted: boolean;
  toggleMuted: () => void;
}

export const useAudioStore = create<AudioStore>()(
  persist(
    (set) => ({
      // Default MUTED: background music must never auto-play unmuted (e.g. into a
      // game-night conversation). Users opt in via the floating audio toggle;
      // their choice persists. The intro splash has its own one-shot theme.
      isMuted: true,
      toggleMuted: () => set((s) => ({ isMuted: !s.isMuted })),
    }),
    { name: 'tome-audio' },
  ),
);
