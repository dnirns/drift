import type { NoiseColor } from '@/types';

export const BUFFER_DURATION_SECONDS = 2;
export const TONE_MIN_FREQUENCY = 200;
export const TONE_MAX_FREQUENCY = 10000;
export const DEFAULT_TONE = 0.5;
export const DEFAULT_VOLUME = 0.7;
export const DEFAULT_NOISE_COLOR = 'white' as const;

/** Named presets use a fully open lowpass filter — their character comes from the buffer algorithm. */
export const PRESET_TONES: Record<Exclude<NoiseColor, 'custom'>, number> = {
  white: 1.0,
  pink: 1.0,
  brown: 1.0,
  blue: 1.0,
};
