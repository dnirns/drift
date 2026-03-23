export type NoiseColor = 'white' | 'pink' | 'brown' | 'blue' | 'custom';

export interface AppState {
  isPlaying: boolean;
  tone: number; // normalized 0–1
  volume: number; // normalized 0–1
  noiseColor: NoiseColor;
  customTone: number; // remembered tone for custom mode
  togglePlayback: () => void;
  setTone: (value: number) => void;
  setVolume: (value: number) => void;
  setNoiseColor: (color: NoiseColor) => void;
}
