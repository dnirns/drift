import { bindAudioEngine } from '@/audio/AudioEngineBinding';
import type {
  AudioEngine,
  AudioEngineSnapshot,
  NoiseColor,
} from '@/audio/types';
import { DEFAULT_VOLUME, PRESET_TONES } from '@/constants/audio';
import { useAppStore } from '@/store/useAppStore';

class FakeAudioEngine implements AudioEngine {
  private snapshot: AudioEngineSnapshot = {
    status: 'idle',
    error: null,
    volume: DEFAULT_VOLUME,
    spectrum: PRESET_TONES.white,
    noiseColor: 'white',
  };

  public listeners = new Set<(snapshot: AudioEngineSnapshot) => void>();
  public play = jest.fn(async (): Promise<void> => undefined);
  public pause = jest.fn(async (): Promise<void> => undefined);
  public setVolume = jest.fn((value: number): void => {
    this.snapshot = { ...this.snapshot, volume: value };
  });
  public setSpectrum = jest.fn((value: number): void => {
    this.snapshot = { ...this.snapshot, spectrum: value };
  });
  public setNoiseColor = jest.fn((noiseColor: NoiseColor): void => {
    this.snapshot = { ...this.snapshot, noiseColor };
  });
  public dispose = jest.fn(async (): Promise<void> => undefined);

  public getSnapshot = (): AudioEngineSnapshot => this.snapshot;

  public subscribe = (
    listener: (snapshot: AudioEngineSnapshot) => void,
  ): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public emit = (snapshot: Partial<AudioEngineSnapshot>): void => {
    this.snapshot = { ...this.snapshot, ...snapshot };
    for (const listener of [...this.listeners]) {
      listener(this.snapshot);
    }
  };
}

beforeEach(() => {
  useAppStore.setState({
    audioStatus: 'idle',
    audioError: null,
    audioCommand: null,
    tone: 0.35,
    volume: 0.45,
    noiseColor: 'custom',
    timerDuration: null,
    timerRemaining: null,
  });
});

describe('bindAudioEngine', () => {
  it('synchronizes controls before executing an initial play command', () => {
    useAppStore.getState().requestPlay();
    const engine = new FakeAudioEngine();
    engine.play.mockImplementationOnce(async () => {
      expect(engine.setVolume).toHaveBeenCalledWith(0.45);
      expect(engine.setSpectrum).toHaveBeenCalledWith(0.35);
      expect(engine.setNoiseColor).toHaveBeenCalledWith('custom');
    });

    const unbind = bindAudioEngine(useAppStore, engine);

    expect(engine.play).toHaveBeenCalledTimes(1);
    unbind();
  });

  it('flows actual engine status and errors back to the store', () => {
    const engine = new FakeAudioEngine();
    const unbind = bindAudioEngine(useAppStore, engine);
    const error = {
      code: 'context-resume-failed' as const,
      message: 'resume failed',
    };

    engine.emit({ status: 'starting' });
    expect(useAppStore.getState().audioStatus).toBe('starting');

    engine.emit({ status: 'error', error });
    expect(useAppStore.getState()).toMatchObject({
      audioStatus: 'error',
      audioError: error,
    });
    unbind();
  });

  it('forwards explicit commands and control changes', () => {
    const engine = new FakeAudioEngine();
    const unbind = bindAudioEngine(useAppStore, engine);
    jest.clearAllMocks();

    useAppStore.getState().requestPlay();
    useAppStore.getState().setVolume(0.8);
    useAppStore.getState().setTone(0.6);
    useAppStore.getState().requestPause();

    expect(engine.play).toHaveBeenCalledTimes(1);
    expect(engine.pause).toHaveBeenCalledTimes(1);
    expect(engine.setVolume).toHaveBeenCalledWith(0.8);
    expect(engine.setSpectrum).toHaveBeenCalledWith(0.6);
    unbind();
  });

  it('does not retain duplicate subscriptions after remount', () => {
    const engine = new FakeAudioEngine();
    const firstUnbind = bindAudioEngine(useAppStore, engine);
    expect(engine.listeners.size).toBe(1);

    firstUnbind();
    const secondUnbind = bindAudioEngine(useAppStore, engine);
    expect(engine.listeners.size).toBe(1);

    secondUnbind();
    expect(engine.listeners.size).toBe(0);
  });
});
