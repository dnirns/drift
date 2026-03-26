import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    GestureHandlerRootView: View,
    GestureDetector: ({ children }: { children: React.ReactNode }) => children,
    Gesture: {
      Pan: () => ({
        onStart: () => ({ onUpdate: () => ({ onEnd: () => ({}) }) }),
        onUpdate: () => ({ onEnd: () => ({}) }),
        onEnd: () => ({}),
      }),
      Tap: () => ({
        onStart: () => ({}),
        onEnd: () => ({}),
      }),
    },
  };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View,
      createAnimatedComponent: (component: unknown) => component,
      call: () => {},
    },
    useAnimatedStyle: (fn: () => object) => fn(),
    useSharedValue: (initial: unknown) => ({ value: initial }),
    withSpring: (val: unknown) => val,
    withTiming: (val: unknown) => val,
    runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
  };
});

// Mock react-native-audio-api
jest.mock('react-native-audio-api', () => ({
  AudioContext: jest.fn().mockImplementation(() => ({
    sampleRate: 44100,
    destination: {},
    resume: jest.fn(),
    close: jest.fn(),
    createBufferSource: jest.fn().mockReturnValue({
      buffer: null,
      loop: false,
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      disconnect: jest.fn(),
    }),
    createBiquadFilter: jest.fn().mockReturnValue({
      type: 'lowpass',
      frequency: { value: 0 },
      connect: jest.fn(),
    }),
    createGain: jest.fn().mockReturnValue({
      gain: { value: 1 },
      connect: jest.fn(),
    }),
    createBuffer: jest.fn().mockImplementation((channels, length, sampleRate) => ({
      getChannelData: jest.fn().mockReturnValue(new Float32Array(length)),
      length,
      sampleRate,
      numberOfChannels: channels,
    })),
  })),
  AudioBuffer: jest.fn(),
  AudioBufferSourceNode: jest.fn(),
  BiquadFilterNode: jest.fn(),
  GainNode: jest.fn(),
}));
