import { AudioContext } from 'react-native-audio-api';
import { AudioEngineService, normalizeAudioError } from './AudioEngineService';
import type { AudioContextDependency, AudioEngineLogger } from './types';

const logger: AudioEngineLogger = {
  error: (message, error) => {
    console.error(message, error);
  },
};

const createContext = (): AudioContextDependency =>
  new AudioContext() as unknown as AudioContextDependency;

export const audioEngine = new AudioEngineService({
  createContext,
  logger,
  normalizeError: normalizeAudioError,
});
