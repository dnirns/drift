import { fillNoiseBuffer } from '@/audio/noiseGenerators';
import {
  HIGHPASS_MIN_FREQUENCY,
  mapSpectrumToFilters,
  mapToneToFrequency,
} from '@/audio/audioParameters';
import {
  BUFFER_DURATION_SECONDS,
  DEFAULT_NOISE_COLOR,
  DEFAULT_VOLUME,
  PRESET_TONES,
} from '@/constants/audio';
import type {
  AudioBufferDependency,
  AudioBufferSourceNodeDependency,
  AudioContextDependency,
  AudioEngine,
  AudioEngineDependencies,
  AudioEngineError,
  AudioEngineSnapshot,
  AudioErrorCode,
  AudioNodeDependency,
  BiquadFilterNodeDependency,
  GainNodeDependency,
  NoiseColor,
} from '@/audio/types';

const createInitialSnapshot = (): AudioEngineSnapshot =>
  Object.freeze({
    status: 'idle',
    error: null,
    volume: DEFAULT_VOLUME,
    spectrum: PRESET_TONES[DEFAULT_NOISE_COLOR],
    noiseColor: DEFAULT_NOISE_COLOR,
  });

export const normalizeAudioError = (
  error: unknown,
  fallbackCode: AudioErrorCode,
): AudioEngineError => ({
  code: fallbackCode,
  message: error instanceof Error ? error.message : String(error),
});

export class AudioEngineService implements AudioEngine {
  private readonly dependencies: AudioEngineDependencies;
  private readonly listeners = new Set<
    (snapshot: AudioEngineSnapshot) => void
  >();

  private snapshot = createInitialSnapshot();
  private context: AudioContextDependency | null = null;
  private buffer: AudioBufferDependency | null = null;
  private source: AudioBufferSourceNodeDependency | null = null;
  private lowpass: BiquadFilterNodeDependency | null = null;
  private highpass: BiquadFilterNodeDependency | null = null;
  private gain: GainNodeDependency | null = null;
  private operationToken = 0;
  private pendingPlay: Promise<void> | null = null;

  public constructor(dependencies: AudioEngineDependencies) {
    this.dependencies = dependencies;
  }

  public getSnapshot = (): AudioEngineSnapshot => this.snapshot;

  public subscribe = (
    listener: (snapshot: AudioEngineSnapshot) => void,
  ): (() => void) => {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  };

  public play = (): Promise<void> => {
    if (this.snapshot.status === 'playing') {
      return Promise.resolve();
    }

    if (this.snapshot.status === 'starting' && this.pendingPlay) {
      return this.pendingPlay;
    }

    const operationToken = ++this.operationToken;
    this.publish({ status: 'starting', error: null });

    const operation = this.startPlayback(operationToken);
    const trackedOperation = operation.finally(() => {
      if (this.pendingPlay === trackedOperation) {
        this.pendingPlay = null;
      }
    });

    this.pendingPlay = trackedOperation;
    return trackedOperation;
  };

  public pause = async (): Promise<void> => {
    if (this.snapshot.status === 'idle' || this.snapshot.status === 'pausing') {
      return;
    }

    ++this.operationToken;
    this.pendingPlay = null;

    if (this.snapshot.status === 'error' && this.source === null) {
      this.publish({ status: 'idle', error: null });
      return;
    }

    this.publish({ status: 'pausing', error: null });

    try {
      this.stopAndDisconnectSource();
      this.publish({ status: 'idle', error: null });
    } catch (error) {
      this.publishError(error, 'source-stop-failed');
    }
  };

  public setVolume = (value: number): void => {
    if (this.snapshot.volume === value) return;

    this.publish({ volume: value });
    if (this.gain) {
      this.gain.gain.value = value;
    }
  };

  public setSpectrum = (value: number): void => {
    if (this.snapshot.spectrum === value) return;

    this.publish({ spectrum: value });
    this.applyFilterValues(value, this.snapshot.noiseColor);
  };

  public setNoiseColor = (color: NoiseColor): void => {
    if (this.snapshot.noiseColor === color) return;

    this.publish({ noiseColor: color });
    if (!this.buffer) {
      return;
    }

    const bufferData = this.buffer.getChannelData(0);
    fillNoiseBuffer(bufferData, color === 'custom' ? 'white' : color);
    this.applyFilterValues(this.snapshot.spectrum, color);

    if (this.snapshot.status !== 'playing') {
      return;
    }

    try {
      this.stopAndDisconnectSource();
    } catch (error) {
      this.publishError(error, 'source-stop-failed');
      return;
    }

    let source: AudioBufferSourceNodeDependency | null = null;
    try {
      source = this.createSource();
      source.start(0);
      this.source = source;
    } catch (error) {
      this.tryDisconnectNode(source);
      this.publishError(error, 'source-start-failed');
    }
  };

  public dispose = async (): Promise<void> => {
    ++this.operationToken;
    this.pendingPlay = null;

    let cleanupError: unknown = null;

    try {
      this.stopAndDisconnectSource();
    } catch (error) {
      cleanupError = error;
    }

    try {
      await this.closeContext();
    } catch (error) {
      cleanupError ??= error;
    }

    if (cleanupError) {
      this.publishError(cleanupError, 'unknown');
      return;
    }

    this.publish({ status: 'idle', error: null });
  };

  private startPlayback = async (operationToken: number): Promise<void> => {
    let failureCode: AudioErrorCode = 'context-create-failed';

    try {
      const context = this.ensureContext();
      this.ensureGraph();

      failureCode = 'context-resume-failed';
      const didResume = await context.resume();
      if (!didResume) {
        throw new Error('audio context did not resume');
      }

      if (operationToken !== this.operationToken) {
        return;
      }

      failureCode = 'source-start-failed';
      const source = this.createSource();

      try {
        source.start(0);
      } catch (error) {
        this.tryDisconnectNode(source);
        throw error;
      }

      this.source = source;
      this.publish({ status: 'playing', error: null });
    } catch (error) {
      if (operationToken !== this.operationToken) {
        return;
      }

      if (failureCode !== 'source-start-failed') {
        await this.cleanupFailedStartup();
      }

      this.publishError(error, failureCode);
    }
  };

  private ensureContext = (): AudioContextDependency => {
    if (!this.context) {
      this.context = this.dependencies.createContext();
    }

    return this.context;
  };

  private ensureGraph = (): void => {
    if (
      this.context &&
      this.buffer &&
      this.lowpass &&
      this.highpass &&
      this.gain
    ) {
      return;
    }

    const context = this.ensureContext();
    let lowpass: BiquadFilterNodeDependency | null = null;
    let highpass: BiquadFilterNodeDependency | null = null;
    let gain: GainNodeDependency | null = null;

    try {
      lowpass = context.createBiquadFilter();
      highpass = context.createBiquadFilter();
      gain = context.createGain();
      lowpass.type = 'lowpass';
      highpass.type = 'highpass';
      gain.gain.value = this.snapshot.volume;

      lowpass.connect(highpass);
      highpass.connect(gain);
      gain.connect(context.destination);

      const buffer = context.createBuffer(
        1,
        context.sampleRate * BUFFER_DURATION_SECONDS,
        context.sampleRate,
      );
      const bufferData = buffer.getChannelData(0);
      const noiseColor = this.snapshot.noiseColor;
      fillNoiseBuffer(
        bufferData,
        noiseColor === 'custom' ? 'white' : noiseColor,
      );

      this.lowpass = lowpass;
      this.highpass = highpass;
      this.gain = gain;
      this.buffer = buffer;
      this.applyFilterValues(this.snapshot.spectrum, noiseColor);
    } catch (error) {
      this.tryDisconnectNode(lowpass);
      this.tryDisconnectNode(highpass);
      this.tryDisconnectNode(gain);
      throw error;
    }
  };

  private createSource = (): AudioBufferSourceNodeDependency => {
    if (!this.context || !this.buffer || !this.lowpass) {
      throw new Error('audio graph is not initialized');
    }

    const source = this.context.createBufferSource();
    try {
      source.buffer = this.buffer;
      source.loop = true;
      source.connect(this.lowpass);
    } catch (error) {
      this.tryDisconnectNode(source);
      throw error;
    }

    return source;
  };

  private stopAndDisconnectSource = (): void => {
    const source = this.source;
    if (!source) return;

    this.source = null;
    let sourceError: unknown = null;

    try {
      source.stop(0);
    } catch (error) {
      sourceError = error;
    }

    try {
      source.disconnect();
    } catch (error) {
      sourceError ??= error;
    }

    if (sourceError) {
      throw sourceError;
    }
  };

  private closeContext = async (): Promise<void> => {
    const context = this.context;
    const nodes = [this.lowpass, this.highpass, this.gain];

    this.context = null;
    this.buffer = null;
    this.lowpass = null;
    this.highpass = null;
    this.gain = null;

    let cleanupError: unknown = null;
    for (const node of nodes) {
      try {
        this.disconnectNode(node);
      } catch (error) {
        cleanupError ??= error;
      }
    }

    if (context) {
      try {
        await context.close();
      } catch (error) {
        cleanupError ??= error;
      }
    }

    if (cleanupError) {
      throw cleanupError;
    }
  };

  private cleanupFailedStartup = async (): Promise<void> => {
    let cleanupError: unknown = null;

    try {
      this.stopAndDisconnectSource();
    } catch (error) {
      cleanupError = error;
    }

    try {
      await this.closeContext();
    } catch (error) {
      cleanupError ??= error;
    }

    if (cleanupError) {
      this.dependencies.logger.error(
        'audio startup cleanup failed',
        cleanupError,
      );
    }
  };

  private applyFilterValues = (
    spectrum: number,
    noiseColor: NoiseColor,
  ): void => {
    if (!this.lowpass || !this.highpass) return;

    if (noiseColor === 'custom') {
      const { lowpassFrequency, highpassFrequency } =
        mapSpectrumToFilters(spectrum);
      this.lowpass.frequency.value = lowpassFrequency;
      this.highpass.frequency.value = highpassFrequency;
      return;
    }

    this.lowpass.frequency.value = mapToneToFrequency(spectrum);
    this.highpass.frequency.value = HIGHPASS_MIN_FREQUENCY;
  };

  private disconnectNode = (node: AudioNodeDependency | null): void => {
    if (!node) return;
    node.disconnect();
  };

  private tryDisconnectNode = (node: AudioNodeDependency | null): void => {
    try {
      this.disconnectNode(node);
    } catch (error) {
      this.dependencies.logger.error('audio node disconnect failed', error);
    }
  };

  private publishError = (error: unknown, errorCode: AudioErrorCode): void => {
    const normalizedError = this.dependencies.normalizeError(error, errorCode);
    this.dependencies.logger.error(normalizedError.message, error);
    this.publish({ status: 'error', error: normalizedError });
  };

  private publish = (changes: Partial<AudioEngineSnapshot>): void => {
    const nextSnapshot = { ...this.snapshot, ...changes };
    const didChange = Object.keys(changes).some((key) => {
      const snapshotKey = key as keyof AudioEngineSnapshot;
      return this.snapshot[snapshotKey] !== nextSnapshot[snapshotKey];
    });

    if (!didChange) return;

    const publishedSnapshot = Object.freeze(nextSnapshot);
    this.snapshot = publishedSnapshot;
    const listeners = [...this.listeners];

    for (const listener of listeners) {
      try {
        listener(publishedSnapshot);
      } catch (error) {
        this.dependencies.logger.error('audio listener failed', error);
      }
    }
  };
}
