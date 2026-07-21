import {
  AudioEngineService,
  normalizeAudioError,
} from '@/audio/AudioEngineService';
import {
  HIGHPASS_MIN_FREQUENCY,
  mapSpectrumToFilters,
} from '@/audio/audioParameters';
import type {
  AudioBufferDependency,
  AudioBufferSourceNodeDependency,
  AudioContextDependency,
  AudioEngineLogger,
  AudioNodeDependency,
  BiquadFilterNodeDependency,
  GainNodeDependency,
} from '@/audio/types';

class FakeAudioNode implements AudioNodeDependency {
  public connect = jest.fn(
    (_destination: AudioNodeDependency): undefined => undefined,
  );
  public disconnect = jest.fn((): void => undefined);
}

class FakeBiquadFilterNode
  extends FakeAudioNode
  implements BiquadFilterNodeDependency
{
  public type: 'lowpass' | 'highpass' = 'lowpass';
  public frequency = { value: 0 };
}

class FakeGainNode extends FakeAudioNode implements GainNodeDependency {
  public gain = { value: 1 };
}

class FakeAudioBuffer implements AudioBufferDependency {
  private readonly data: Float32Array;

  public constructor(length: number) {
    this.data = new Float32Array(length);
  }

  public getChannelData = (_channel: number): Float32Array => this.data;
}

class FakeAudioBufferSourceNode
  extends FakeAudioNode
  implements AudioBufferSourceNodeDependency
{
  public buffer: AudioBufferDependency | null = null;
  public loop = false;
  public start = jest.fn((_when?: number): void => undefined);
  public stop = jest.fn((_when?: number): void => undefined);
}

class FakeAudioContext implements AudioContextDependency {
  public sampleRate = 8;
  public destination = new FakeAudioNode();
  public resume = jest.fn(async (): Promise<boolean> => true);
  public close = jest.fn(async (): Promise<void> => undefined);
  public sources: FakeAudioBufferSourceNode[] = [];
  public filters: FakeBiquadFilterNode[] = [];
  public gains: FakeGainNode[] = [];

  public createBufferSource = (): FakeAudioBufferSourceNode => {
    const source = new FakeAudioBufferSourceNode();
    this.sources.push(source);
    return source;
  };

  public createBiquadFilter = (): FakeBiquadFilterNode => {
    const filter = new FakeBiquadFilterNode();
    this.filters.push(filter);
    return filter;
  };

  public createGain = (): FakeGainNode => {
    const gain = new FakeGainNode();
    this.gains.push(gain);
    return gain;
  };

  public createBuffer = (
    _numberOfChannels: number,
    length: number,
    _sampleRate: number,
  ): FakeAudioBuffer => new FakeAudioBuffer(length);
}

const createDeferred = <Value>() => {
  let resolvePromise: (value: Value) => void = () => undefined;
  let rejectPromise: (reason: unknown) => void = () => undefined;
  const promise = new Promise<Value>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  return { promise, resolve: resolvePromise, reject: rejectPromise };
};

const createService = (
  createContext: () => AudioContextDependency,
  logger: AudioEngineLogger = { error: jest.fn() },
): AudioEngineService =>
  new AudioEngineService({
    createContext,
    logger,
    normalizeError: normalizeAudioError,
  });

describe('AudioEngineService', () => {
  it('lazily creates one context and reuses its graph', async () => {
    const context = new FakeAudioContext();
    const createContext = jest.fn(() => context);
    const service = createService(createContext);

    service.setVolume(0.2);
    service.setSpectrum(0.8);
    expect(createContext).not.toHaveBeenCalled();

    await service.play();
    await service.pause();
    await service.play();

    expect(createContext).toHaveBeenCalledTimes(1);
    expect(context.filters).toHaveLength(2);
    expect(context.gains).toHaveLength(1);
    expect(context.sources).toHaveLength(2);
  });

  it('coalesces repeated play and pause commands', async () => {
    const context = new FakeAudioContext();
    const deferredResume = createDeferred<boolean>();
    context.resume.mockReturnValueOnce(deferredResume.promise);
    const service = createService(() => context);

    const firstPlay = service.play();
    const secondPlay = service.play();
    expect(firstPlay).toBe(secondPlay);
    expect(context.resume).toHaveBeenCalledTimes(1);

    deferredResume.resolve(true);
    await firstPlay;
    await service.pause();
    await service.pause();

    expect(context.sources).toHaveLength(1);
    expect(context.sources[0].stop).toHaveBeenCalledTimes(1);
  });

  it('ends idle when pause supersedes a pending play', async () => {
    const context = new FakeAudioContext();
    const deferredResume = createDeferred<boolean>();
    context.resume.mockReturnValueOnce(deferredResume.promise);
    const service = createService(() => context);

    const playPromise = service.play();
    await service.pause();
    deferredResume.resolve(true);
    await playPromise;

    expect(service.getSnapshot().status).toBe('idle');
    expect(context.sources).toHaveLength(0);
  });

  it('ignores an older resume after pause and a newer play', async () => {
    const context = new FakeAudioContext();
    const firstResume = createDeferred<boolean>();
    const secondResume = createDeferred<boolean>();
    context.resume
      .mockReturnValueOnce(firstResume.promise)
      .mockReturnValueOnce(secondResume.promise);
    const service = createService(() => context);

    const firstPlay = service.play();
    await service.pause();
    const secondPlay = service.play();

    firstResume.resolve(true);
    await firstPlay;
    expect(context.sources).toHaveLength(0);

    secondResume.resolve(true);
    await secondPlay;
    expect(service.getSnapshot().status).toBe('playing');
    expect(context.sources).toHaveLength(1);
  });

  it('starts one new source when play follows pause', async () => {
    const context = new FakeAudioContext();
    const service = createService(() => context);

    await service.play();
    const pausePromise = service.pause();
    const playPromise = service.play();
    await Promise.all([pausePromise, playPromise]);

    expect(service.getSnapshot().status).toBe('playing');
    expect(context.sources).toHaveLength(2);
    expect(context.sources[0].stop).toHaveBeenCalledTimes(1);
    expect(context.sources[1].start).toHaveBeenCalledTimes(1);
  });

  it('publishes a resume error without starting a source', async () => {
    const context = new FakeAudioContext();
    context.resume.mockRejectedValueOnce(new Error('resume rejected'));
    const service = createService(() => context);
    const statuses: string[] = [];
    service.subscribe((snapshot) => statuses.push(snapshot.status));

    await service.play();

    expect(service.getSnapshot()).toMatchObject({
      status: 'error',
      error: { code: 'context-resume-failed', message: 'resume rejected' },
    });
    expect(statuses).not.toContain('playing');
    expect(context.sources).toHaveLength(0);
    expect(context.close).toHaveBeenCalledTimes(1);
  });

  it('disconnects a failed source and reuses a safe context on retry', async () => {
    const context = new FakeAudioContext();
    const originalCreateSource = context.createBufferSource;
    const failedSource = new FakeAudioBufferSourceNode();
    failedSource.start.mockImplementationOnce(() => {
      throw new Error('start failed');
    });
    context.createBufferSource = jest
      .fn()
      .mockReturnValueOnce(failedSource)
      .mockImplementation(originalCreateSource);
    const createContext = jest.fn(() => context);
    const service = createService(createContext);

    await service.play();
    expect(service.getSnapshot().error?.code).toBe('source-start-failed');
    expect(failedSource.disconnect).toHaveBeenCalledTimes(1);

    await service.play();
    expect(service.getSnapshot().status).toBe('playing');
    expect(createContext).toHaveBeenCalledTimes(1);
  });

  it('publishes a typed error when a source cannot stop', async () => {
    const context = new FakeAudioContext();
    const service = createService(() => context);
    await service.play();
    context.sources[0].stop.mockImplementationOnce(() => {
      throw new Error('stop failed');
    });

    await service.pause();

    expect(service.getSnapshot()).toMatchObject({
      status: 'error',
      error: { code: 'source-stop-failed', message: 'stop failed' },
    });
    expect(context.sources[0].disconnect).toHaveBeenCalledTimes(1);
  });

  it('publishes immutable snapshots and isolates listeners', () => {
    const logger = { error: jest.fn() };
    const service = createService(() => new FakeAudioContext(), logger);
    const firstListener = jest.fn();
    const unsubscribeFirst = service.subscribe(firstListener);
    service.subscribe(() => {
      unsubscribeFirst();
      throw new Error('listener failed');
    });

    const initialSnapshot = service.getSnapshot();
    service.setVolume(0.4);
    service.setVolume(0.4);
    service.setSpectrum(0.7);

    expect(Object.isFrozen(service.getSnapshot())).toBe(true);
    expect(service.getSnapshot()).not.toBe(initialSnapshot);
    expect(firstListener).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      'audio listener failed',
      expect.any(Error),
    );
  });

  it('cleans up a partially initialized graph', async () => {
    const context = new FakeAudioContext();
    context.createGain = jest.fn(() => {
      throw new Error('gain failed');
    });
    const service = createService(() => context);

    await service.play();

    expect(service.getSnapshot().error?.code).toBe('context-create-failed');
    expect(context.filters[0].disconnect).toHaveBeenCalledTimes(1);
    expect(context.filters[1].disconnect).toHaveBeenCalledTimes(1);
    expect(context.close).toHaveBeenCalledTimes(1);
  });

  it('disposes safely while startup is pending', async () => {
    const context = new FakeAudioContext();
    const deferredResume = createDeferred<boolean>();
    context.resume.mockReturnValueOnce(deferredResume.promise);
    const service = createService(() => context);

    const playPromise = service.play();
    await service.dispose();
    await service.dispose();
    deferredResume.resolve(true);
    await playPromise;

    expect(service.getSnapshot().status).toBe('idle');
    expect(context.close).toHaveBeenCalledTimes(1);
    expect(context.sources).toHaveLength(0);
  });

  it('applies parameters before and after graph creation', async () => {
    const context = new FakeAudioContext();
    const service = createService(() => context);
    service.setVolume(0.25);
    service.setSpectrum(0.75);
    service.setNoiseColor('custom');

    await service.play();
    const expectedFilters = mapSpectrumToFilters(0.75);
    expect(context.gains[0].gain.value).toBe(0.25);
    expect(context.filters[0].frequency.value).toBeCloseTo(
      expectedFilters.lowpassFrequency,
    );
    expect(context.filters[1].frequency.value).toBeCloseTo(
      expectedFilters.highpassFrequency,
    );

    service.setNoiseColor('pink');
    service.setVolume(0.6);
    expect(context.gains[0].gain.value).toBe(0.6);
    expect(context.filters[1].frequency.value).toBe(HIGHPASS_MIN_FREQUENCY);
    expect(context.sources).toHaveLength(2);
  });
});
