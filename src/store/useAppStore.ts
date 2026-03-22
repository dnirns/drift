import { create } from 'zustand';
import { DEFAULT_TONE, DEFAULT_VOLUME } from '@/constants/audio';
import type { AppState } from '@/types';

export const useAppStore = create<AppState>((set) => ({
  isPlaying: false,
  tone: DEFAULT_TONE,
  volume: DEFAULT_VOLUME,
  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setTone: (value: number) => set({ tone: value }),
  setVolume: (value: number) => set({ volume: value }),
}));
