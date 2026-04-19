import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AudioStore {
  isMuted: boolean;
  toggleMuted: () => void;
}

export const useAudioStore = create<AudioStore>()(
  persist(
    (set) => ({
      isMuted: false,
      toggleMuted: () => set((s) => ({ isMuted: !s.isMuted })),
    }),
    { name: 'tome-audio' },
  ),
);
