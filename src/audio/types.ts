export type NoiseColor = 'white' | 'pink' | 'brown' | 'blue' | 'custom';

export type AudioStatus =
  | 'idle'
  | 'starting'
  | 'playing'
  | 'pausing'
  | 'interrupted'
  | 'error';

export type AudioErrorCode =
  | 'context-create-failed'
  | 'context-resume-failed'
  | 'source-start-failed'
  | 'source-stop-failed'
  | 'session-activation-failed'
  | 'unknown';

export interface AudioEngineError {
  code: AudioErrorCode;
  message: string;
}

export interface AudioEngineSnapshot {
  status: AudioStatus;
  error: AudioEngineError | null;
  volume: number;
  spectrum: number;
  noiseColor: NoiseColor;
}

export type AudioCommandType = 'play' | 'pause';

export interface AudioCommand {
  id: number;
  type: AudioCommandType;
}

export interface AudioEngine {
  getSnapshot: () => AudioEngineSnapshot;
  subscribe: (listener: (snapshot: AudioEngineSnapshot) => void) => () => void;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  setVolume: (value: number) => void;
  setSpectrum: (value: number) => void;
  setNoiseColor: (color: NoiseColor) => void;
  dispose: () => Promise<void>;
}

export interface AudioParamDependency {
  value: number;
}

export interface AudioNodeDependency {
  connect: (destination: AudioNodeDependency) => unknown;
  disconnect: () => void;
}

export interface BiquadFilterNodeDependency extends AudioNodeDependency {
  type: 'lowpass' | 'highpass';
  frequency: AudioParamDependency;
}

export interface GainNodeDependency extends AudioNodeDependency {
  gain: AudioParamDependency;
}

export interface AudioBufferDependency {
  getChannelData: (channel: number) => Float32Array;
}

export interface AudioBufferSourceNodeDependency extends AudioNodeDependency {
  buffer: AudioBufferDependency | null;
  loop: boolean;
  start: (when?: number) => void;
  stop: (when?: number) => void;
}

export interface AudioContextDependency {
  sampleRate: number;
  destination: AudioNodeDependency;
  resume: () => Promise<boolean>;
  close: () => Promise<void>;
  createBufferSource: () => AudioBufferSourceNodeDependency;
  createBiquadFilter: () => BiquadFilterNodeDependency;
  createGain: () => GainNodeDependency;
  createBuffer: (
    numberOfChannels: number,
    length: number,
    sampleRate: number,
  ) => AudioBufferDependency;
}

export interface AudioEngineLogger {
  error: (message: string, error: unknown) => void;
}

export type AudioErrorNormalizer = (
  error: unknown,
  fallbackCode: AudioErrorCode,
) => AudioEngineError;

export interface AudioEngineDependencies {
  createContext: () => AudioContextDependency;
  logger: AudioEngineLogger;
  normalizeError: AudioErrorNormalizer;
}
