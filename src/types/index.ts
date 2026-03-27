export type NoiseColor = 'white' | 'pink' | 'brown' | 'blue' | 'custom';

export interface CustomPreset {
  id: string;
  name: string;
  tone: number; // spectrum slider position (0–1)
}

export interface StoreState {
  isPlaying: boolean;
  tone: number; // normalized 0–1
  volume: number; // normalized 0–1
  noiseColor: NoiseColor;
  customTone: number; // remembered tone for custom mode
  savedPresets: CustomPreset[];
  activePresetId: string | null;
  timerDuration: number | null; // selected duration in seconds, null = infinity
  timerRemaining: number | null; // seconds left on active countdown, null = infinity
  togglePlayback: () => void;
  setTone: (value: number) => void;
  setVolume: (value: number) => void;
  setNoiseColor: (color: NoiseColor) => void;
  savePreset: (name: string) => void;
  deletePreset: (id: string) => void;
  loadPreset: (id: string) => void;
  setTimerDuration: (seconds: number | null) => void;
  setTimerRemaining: (seconds: number | null) => void;
  timerExpired: () => void;
}
