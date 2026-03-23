import { create } from 'zustand';
import {
  DEFAULT_TONE,
  DEFAULT_VOLUME,
  DEFAULT_NOISE_COLOR,
  PRESET_TONES,
} from '@/constants/audio';
import type { AppState, NoiseColor } from '@/types';

export const useAppStore = create<AppState>((set, get) => ({
  isPlaying: false,
  tone: PRESET_TONES[DEFAULT_NOISE_COLOR],
  volume: DEFAULT_VOLUME,
  noiseColor: DEFAULT_NOISE_COLOR,
  customTone: DEFAULT_TONE,
  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setTone: (value: number) => set({ tone: value, customTone: value }),
  setVolume: (value: number) => set({ volume: value }),
  setNoiseColor: (color: NoiseColor) =>
    set({
      noiseColor: color,
      tone: color === 'custom' ? get().customTone : PRESET_TONES[color],
    }),
}));
