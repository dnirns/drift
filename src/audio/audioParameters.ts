import { TONE_MAX_FREQUENCY, TONE_MIN_FREQUENCY } from '@/constants/audio';

export const HIGHPASS_MIN_FREQUENCY = 20;
export const HIGHPASS_MAX_FREQUENCY = 8000;

export const mapToneToFrequency = (normalized: number): number =>
  TONE_MIN_FREQUENCY *
  Math.pow(TONE_MAX_FREQUENCY / TONE_MIN_FREQUENCY, normalized);

export const mapSpectrumToFilters = (
  position: number,
): {
  lowpassFrequency: number;
  highpassFrequency: number;
} => {
  if (position <= 0.5) {
    const normalizedPosition = position / 0.5;
    const lowpassFrequency =
      TONE_MIN_FREQUENCY *
      Math.pow(TONE_MAX_FREQUENCY / TONE_MIN_FREQUENCY, normalizedPosition);

    return {
      lowpassFrequency,
      highpassFrequency: HIGHPASS_MIN_FREQUENCY,
    };
  }

  const normalizedPosition = (position - 0.5) / 0.5;
  const highpassFrequency =
    HIGHPASS_MIN_FREQUENCY *
    Math.pow(
      HIGHPASS_MAX_FREQUENCY / HIGHPASS_MIN_FREQUENCY,
      normalizedPosition,
    );

  return {
    lowpassFrequency: TONE_MAX_FREQUENCY,
    highpassFrequency,
  };
};
