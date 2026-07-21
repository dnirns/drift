import {
  HIGHPASS_MAX_FREQUENCY,
  HIGHPASS_MIN_FREQUENCY,
  mapSpectrumToFilters,
  mapToneToFrequency,
} from '@/audio/audioParameters';
import { TONE_MAX_FREQUENCY, TONE_MIN_FREQUENCY } from '@/constants/audio';

describe('mapToneToFrequency', () => {
  it('returns the minimum frequency at zero', () => {
    expect(mapToneToFrequency(0)).toBeCloseTo(TONE_MIN_FREQUENCY);
  });

  it('returns the maximum frequency at one', () => {
    expect(mapToneToFrequency(1)).toBeCloseTo(TONE_MAX_FREQUENCY);
  });

  it('uses logarithmic scaling', () => {
    const expected = Math.sqrt(TONE_MIN_FREQUENCY * TONE_MAX_FREQUENCY);
    expect(mapToneToFrequency(0.5)).toBeCloseTo(expected, 0);
  });
});

describe('mapSpectrumToFilters', () => {
  it('opens the highpass at the brown end', () => {
    const result = mapSpectrumToFilters(0);
    expect(result.lowpassFrequency).toBeCloseTo(TONE_MIN_FREQUENCY);
    expect(result.highpassFrequency).toBeCloseTo(HIGHPASS_MIN_FREQUENCY);
  });

  it('opens both filters at the center', () => {
    const result = mapSpectrumToFilters(0.5);
    expect(result.lowpassFrequency).toBeCloseTo(TONE_MAX_FREQUENCY);
    expect(result.highpassFrequency).toBeCloseTo(HIGHPASS_MIN_FREQUENCY);
  });

  it('raises the highpass at the blue end', () => {
    const result = mapSpectrumToFilters(1);
    expect(result.lowpassFrequency).toBeCloseTo(TONE_MAX_FREQUENCY);
    expect(result.highpassFrequency).toBeCloseTo(HIGHPASS_MAX_FREQUENCY);
  });
});
