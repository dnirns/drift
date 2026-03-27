import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_TONE,
  DEFAULT_VOLUME,
  DEFAULT_NOISE_COLOR,
  PRESET_TONES,
} from '@/constants/audio';
import type { StoreState, CustomPreset, NoiseColor } from '@/types';

export const useAppStore = create<StoreState>()(
  persist(
    (set, get) => ({
      isPlaying: false,
      tone: PRESET_TONES[DEFAULT_NOISE_COLOR],
      volume: DEFAULT_VOLUME,
      noiseColor: DEFAULT_NOISE_COLOR,
      customTone: DEFAULT_TONE,
      savedPresets: [],
      activePresetId: null,
      timerDuration: null,
      timerRemaining: null,
      togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
      setTone: (value: number) =>
        set({ tone: value, customTone: value, activePresetId: null }),
      setVolume: (value: number) => set({ volume: value }),
      setNoiseColor: (color: NoiseColor) =>
        set({
          noiseColor: color,
          tone: color === 'custom' ? get().customTone : PRESET_TONES[color],
          activePresetId: null,
        }),
      savePreset: (name: string) => {
        const { customTone, savedPresets } = get();
        const newPreset: CustomPreset = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2),
          name,
          tone: customTone,
        };
        set({ savedPresets: [...savedPresets, newPreset] });
      },
      deletePreset: (id: string) =>
        set((state) => ({
          savedPresets: state.savedPresets.filter((p) => p.id !== id),
        })),
      loadPreset: (id: string) => {
        const preset = get().savedPresets.find((p) => p.id === id);
        if (!preset) return;
        set({
          noiseColor: 'custom',
          tone: preset.tone,
          customTone: preset.tone,
          activePresetId: id,
        });
      },
      setTimerDuration: (seconds: number | null) =>
        set({ timerDuration: seconds }),
      setTimerRemaining: (seconds: number | null) =>
        set({ timerRemaining: seconds }),
      timerExpired: () =>
        set({ isPlaying: false, timerRemaining: null }),
    }),
    {
      name: 'drift-presets',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ savedPresets: state.savedPresets }),
    },
  ),
);
