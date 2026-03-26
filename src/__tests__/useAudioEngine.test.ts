import { renderHook, act } from '@testing-library/react-native';
import {
  mapToneToFrequency,
  mapSpectrumToFilters,
  useAudioEngine,
  HIGHPASS_MIN,
  HIGHPASS_MAX,
} from '@/hooks/useAudioEngine';
import { useAppStore } from '@/store/useAppStore';
import { TONE_MIN_FREQUENCY, TONE_MAX_FREQUENCY } from '@/constants/audio';
import { AudioContext } from 'react-native-audio-api';

// ---------------------------------------------------------------------------
// Pure function tests
// ---------------------------------------------------------------------------

describe('mapToneToFrequency', () => {
  it('returns min frequency at 0', () => {
    expect(mapToneToFrequency(0)).toBeCloseTo(TONE_MIN_FREQUENCY);
  });

  it('returns max frequency at 1', () => {
    expect(mapToneToFrequency(1)).toBeCloseTo(TONE_MAX_FREQUENCY);
  });

  it('returns geometric mean at 0.5', () => {
    const expected = Math.sqrt(TONE_MIN_FREQUENCY * TONE_MAX_FREQUENCY);
    expect(mapToneToFrequency(0.5)).toBeCloseTo(expected, 0);
  });

  it('is monotonically increasing', () => {
    const steps = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
    const values = steps.map(mapToneToFrequency);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });

  it('uses logarithmic scaling (quarter ≠ linear quarter)', () => {
    const quarter = mapToneToFrequency(0.25);
    const linearQuarter =
      TONE_MIN_FREQUENCY + 0.25 * (TONE_MAX_FREQUENCY - TONE_MIN_FREQUENCY);
    expect(quarter).not.toBeCloseTo(linearQuarter, 0);
    // Logarithmic: 0.25 maps well below linear midpoint
    expect(quarter).toBeLessThan(linearQuarter);
  });
});

describe('mapSpectrumToFilters', () => {
  it('at 0 lowpass is at min, highpass is off', () => {
    const { lowpassFreq, highpassFreq } = mapSpectrumToFilters(0);
    expect(lowpassFreq).toBeCloseTo(TONE_MIN_FREQUENCY);
    expect(highpassFreq).toBeCloseTo(HIGHPASS_MIN);
  });

  it('at 0.5 lowpass is at max, highpass is off', () => {
    const { lowpassFreq, highpassFreq } = mapSpectrumToFilters(0.5);
    expect(lowpassFreq).toBeCloseTo(TONE_MAX_FREQUENCY);
    expect(highpassFreq).toBeCloseTo(HIGHPASS_MIN);
  });

  it('at 1 lowpass is open, highpass is at max', () => {
    const { lowpassFreq, highpassFreq } = mapSpectrumToFilters(1);
    expect(lowpassFreq).toBeCloseTo(TONE_MAX_FREQUENCY);
    expect(highpassFreq).toBeCloseTo(HIGHPASS_MAX);
  });

  it('left half: lowpass sweeps up, highpass stays at min', () => {
    const a = mapSpectrumToFilters(0.1);
    const b = mapSpectrumToFilters(0.3);
    expect(b.lowpassFreq).toBeGreaterThan(a.lowpassFreq);
    expect(a.highpassFreq).toBeCloseTo(HIGHPASS_MIN);
    expect(b.highpassFreq).toBeCloseTo(HIGHPASS_MIN);
  });

  it('right half: highpass sweeps up, lowpass stays at max', () => {
    const a = mapSpectrumToFilters(0.6);
    const b = mapSpectrumToFilters(0.9);
    expect(b.highpassFreq).toBeGreaterThan(a.highpassFreq);
    expect(a.lowpassFreq).toBeCloseTo(TONE_MAX_FREQUENCY);
    expect(b.lowpassFreq).toBeCloseTo(TONE_MAX_FREQUENCY);
  });

  it('quarter-point on left half uses log scale', () => {
    const { lowpassFreq } = mapSpectrumToFilters(0.25);
    // t = 0.25/0.5 = 0.5 → geometric mean of TONE range
    const expected = Math.sqrt(TONE_MIN_FREQUENCY * TONE_MAX_FREQUENCY);
    expect(lowpassFreq).toBeCloseTo(expected, 0);
  });

  it('three-quarter point on right half uses log scale', () => {
    const { highpassFreq } = mapSpectrumToFilters(0.75);
    // t = (0.75 - 0.5)/0.5 = 0.5 → geometric mean of HIGHPASS range
    const expected = Math.sqrt(HIGHPASS_MIN * HIGHPASS_MAX);
    expect(highpassFreq).toBeCloseTo(expected, 0);
  });
});

// ---------------------------------------------------------------------------
// Hook integration tests
// ---------------------------------------------------------------------------

describe('useAudioEngine', () => {
  let mockLowpass: {
    type: string;
    frequency: { value: number };
    connect: jest.Mock;
  };
  let mockHighpass: {
    type: string;
    frequency: { value: number };
    connect: jest.Mock;
  };
  let mockGain: { gain: { value: number }; connect: jest.Mock };
  let mockCtx: Record<string, unknown>;

  beforeEach(() => {
    useAppStore.setState({
      isPlaying: false,
      tone: 0.5,
      volume: 0.7,
      noiseColor: 'white',
    });
    jest.clearAllMocks();

    mockLowpass = {
      type: 'lowpass',
      frequency: { value: 0 },
      connect: jest.fn(),
    };
    mockHighpass = {
      type: 'highpass',
      frequency: { value: 0 },
      connect: jest.fn(),
    };
    mockGain = { gain: { value: 1 }, connect: jest.fn() };

    let filterCount = 0;
    mockCtx = {
      sampleRate: 44100,
      destination: {},
      resume: jest.fn(),
      close: jest.fn(),
      createBufferSource: jest.fn().mockImplementation(() => ({
        buffer: null,
        loop: false,
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        disconnect: jest.fn(),
      })),
      createBiquadFilter: jest.fn().mockImplementation(() => {
        filterCount++;
        return filterCount === 1 ? mockLowpass : mockHighpass;
      }),
      createGain: jest.fn().mockReturnValue(mockGain),
      createBuffer: jest
        .fn()
        .mockImplementation((_ch: number, len: number) => ({
          getChannelData: jest.fn().mockReturnValue(new Float32Array(len)),
          length: len,
          sampleRate: 44100,
          numberOfChannels: 1,
        })),
    };

    (AudioContext as jest.Mock).mockImplementation(() => mockCtx);
  });

  const startPlayback = () => {
    act(() => {
      useAppStore.getState().togglePlayback();
    });
  };

  it('creates AudioContext and starts source when playing', () => {
    renderHook(() => useAudioEngine());

    startPlayback();

    expect(AudioContext).toHaveBeenCalledTimes(1);
    expect(mockCtx.resume as jest.Mock).toHaveBeenCalled();
    expect(mockCtx.createBufferSource as jest.Mock).toHaveBeenCalled();
  });

  it('stops source when pausing', () => {
    renderHook(() => useAudioEngine());

    startPlayback();
    const source = (mockCtx.createBufferSource as jest.Mock).mock.results[0]
      .value;

    act(() => {
      useAppStore.getState().togglePlayback();
    });

    expect(source.stop).toHaveBeenCalled();
    expect(source.disconnect).toHaveBeenCalled();
  });

  it('updates lowpass filter frequency when tone changes', () => {
    renderHook(() => useAudioEngine());

    startPlayback();

    act(() => {
      useAppStore.getState().setTone(0.8);
    });

    expect(mockLowpass.frequency.value).toBeCloseTo(mapToneToFrequency(0.8));
  });

  it('updates both filters when tone changes in custom mode', () => {
    useAppStore.setState({ noiseColor: 'custom' });
    renderHook(() => useAudioEngine());

    startPlayback();

    act(() => {
      useAppStore.getState().setTone(0.7);
    });

    const expected = mapSpectrumToFilters(0.7);
    expect(mockLowpass.frequency.value).toBeCloseTo(expected.lowpassFreq);
    expect(mockHighpass.frequency.value).toBeCloseTo(expected.highpassFreq);
  });

  it('updates gain when volume changes', () => {
    renderHook(() => useAudioEngine());

    startPlayback();

    act(() => {
      useAppStore.getState().setVolume(0.3);
    });

    expect(mockGain.gain.value).toBe(0.3);
  });

  it('restarts source when noise color changes while playing', () => {
    renderHook(() => useAudioEngine());

    startPlayback();
    const firstSource = (mockCtx.createBufferSource as jest.Mock).mock
      .results[0].value;

    act(() => {
      useAppStore.getState().setNoiseColor('brown');
    });

    expect(firstSource.stop).toHaveBeenCalled();
    expect(mockCtx.createBufferSource as jest.Mock).toHaveBeenCalledTimes(2);
  });

  it('resets highpass when switching from custom to named preset', () => {
    useAppStore.setState({ noiseColor: 'custom' });
    renderHook(() => useAudioEngine());

    startPlayback();

    act(() => {
      useAppStore.getState().setNoiseColor('pink');
    });

    expect(mockHighpass.frequency.value).toBeCloseTo(HIGHPASS_MIN);
  });

  it('closes audio context on unmount', () => {
    const { unmount } = renderHook(() => useAudioEngine());

    startPlayback();

    unmount();

    expect(mockCtx.close as jest.Mock).toHaveBeenCalled();
  });

  it('does not create context when not playing', () => {
    renderHook(() => useAudioEngine());

    expect(AudioContext).not.toHaveBeenCalled();
  });
});
