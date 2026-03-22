export interface AppState {
  isPlaying: boolean;
  tone: number; // normalized 0–1
  volume: number; // normalized 0–1
  togglePlayback: () => void;
  setTone: (value: number) => void;
  setVolume: (value: number) => void;
}
