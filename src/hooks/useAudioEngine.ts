import { useEffect, useRef } from 'react';
import {
  AudioContext,
  AudioBuffer,
  AudioBufferSourceNode,
  BiquadFilterNode,
  GainNode,
} from 'react-native-audio-api';
import {
  BUFFER_DURATION_SECONDS,
  TONE_MIN_FREQUENCY,
  TONE_MAX_FREQUENCY,
} from '@/constants/audio';
import { useAppStore } from '@/store/useAppStore';
import { fillNoiseBuffer } from '@/audio/noiseGenerators';

export const HIGHPASS_MIN = 20;
export const HIGHPASS_MAX = 8000;

export const mapToneToFrequency = (normalized: number): number =>
  TONE_MIN_FREQUENCY *
  Math.pow(TONE_MAX_FREQUENCY / TONE_MIN_FREQUENCY, normalized);

/**
 * Maps the custom spectrum slider (0–1) to lowpass + highpass filter frequencies.
 *
 * 0.0 = deep brown (lowpass at min, highpass off)
 * 0.5 = white (both filters wide open)
 * 1.0 = blue (lowpass open, highpass at max)
 */
export const mapSpectrumToFilters = (
  position: number,
): {
  lowpassFreq: number;
  highpassFreq: number;
} => {
  if (position <= 0.5) {
    // Left half: sweep lowpass from min → max, highpass stays off
    const t = position / 0.5; // 0 → 1
    const lowpassFreq =
      TONE_MIN_FREQUENCY *
      Math.pow(TONE_MAX_FREQUENCY / TONE_MIN_FREQUENCY, t);
    return { lowpassFreq, highpassFreq: HIGHPASS_MIN };
  } else {
    // Right half: lowpass stays open, sweep highpass from min → max
    const t = (position - 0.5) / 0.5; // 0 → 1
    const highpassFreq =
      HIGHPASS_MIN * Math.pow(HIGHPASS_MAX / HIGHPASS_MIN, t);
    return { lowpassFreq: TONE_MAX_FREQUENCY, highpassFreq };
  }
};

const applyCustomFilters = (
  lowpassRef: React.MutableRefObject<BiquadFilterNode | null>,
  highpassRef: React.MutableRefObject<BiquadFilterNode | null>,
  position: number,
): void => {
  const { lowpassFreq, highpassFreq } = mapSpectrumToFilters(position);
  if (lowpassRef.current) {
    lowpassRef.current.frequency.value = lowpassFreq;
  }
  if (highpassRef.current) {
    highpassRef.current.frequency.value = highpassFreq;
  }
};

const ensureContext = (
  contextRef: React.MutableRefObject<AudioContext | null>,
  bufferRef: React.MutableRefObject<AudioBuffer | null>,
  lowpassRef: React.MutableRefObject<BiquadFilterNode | null>,
  highpassRef: React.MutableRefObject<BiquadFilterNode | null>,
  gainRef: React.MutableRefObject<GainNode | null>,
): AudioContext => {
  if (!contextRef.current) {
    const ctx = new AudioContext();
    const { tone, volume, noiseColor } = useAppStore.getState();

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = HIGHPASS_MIN;

    if (noiseColor === 'custom') {
      const { lowpassFreq, highpassFreq } = mapSpectrumToFilters(tone);
      lowpass.frequency.value = lowpassFreq;
      highpass.frequency.value = highpassFreq;
    } else {
      lowpass.frequency.value = mapToneToFrequency(tone);
      highpass.frequency.value = HIGHPASS_MIN;
    }

    const gain = ctx.createGain();
    gain.gain.value = volume;

    // Chain: source → lowpass → highpass → gain → destination
    lowpass.connect(highpass);
    highpass.connect(gain);
    gain.connect(ctx.destination);

    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(
      1,
      sampleRate * BUFFER_DURATION_SECONDS,
      sampleRate,
    );
    const data = buffer.getChannelData(0);
    if (noiseColor === 'custom') {
      fillNoiseBuffer(data, 'white');
    } else {
      fillNoiseBuffer(data, noiseColor);
    }

    contextRef.current = ctx;
    bufferRef.current = buffer;
    lowpassRef.current = lowpass;
    highpassRef.current = highpass;
    gainRef.current = gain;
  }

  return contextRef.current;
};

const stopSource = (
  sourceRef: React.MutableRefObject<AudioBufferSourceNode | null>,
): void => {
  if (sourceRef.current) {
    sourceRef.current.stop(0);
    sourceRef.current.disconnect();
    sourceRef.current = null;
  }
};

const restartSource = (
  contextRef: React.MutableRefObject<AudioContext | null>,
  bufferRef: React.MutableRefObject<AudioBuffer | null>,
  sourceRef: React.MutableRefObject<AudioBufferSourceNode | null>,
  lowpassRef: React.MutableRefObject<BiquadFilterNode | null>,
): void => {
  if (!contextRef.current || !bufferRef.current || !lowpassRef.current) return;
  stopSource(sourceRef);
  const source = contextRef.current.createBufferSource();
  source.buffer = bufferRef.current;
  source.loop = true;
  source.connect(lowpassRef.current);
  source.start(0);
  sourceRef.current = source;
};

export const useAudioEngine = (): void => {
  const contextRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const lowpassRef = useRef<BiquadFilterNode | null>(null);
  const highpassRef = useRef<BiquadFilterNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    const unsubscribe = useAppStore.subscribe((state, prevState) => {
      if (state.isPlaying !== prevState.isPlaying) {
        if (state.isPlaying) {
          const ctx = ensureContext(
            contextRef,
            bufferRef,
            lowpassRef,
            highpassRef,
            gainRef,
          );
          stopSource(sourceRef);
          ctx.resume();

          const source = ctx.createBufferSource();
          source.buffer = bufferRef.current;
          source.loop = true;
          source.connect(lowpassRef.current!);
          source.start(0);
          sourceRef.current = source;
        } else {
          stopSource(sourceRef);
        }
      }

      if (
        state.tone !== prevState.tone &&
        state.noiseColor === prevState.noiseColor
      ) {
        if (state.noiseColor === 'custom') {
          applyCustomFilters(lowpassRef, highpassRef, state.tone);
        } else if (lowpassRef.current) {
          lowpassRef.current.frequency.value = mapToneToFrequency(state.tone);
        }
      }

      if (state.volume !== prevState.volume && gainRef.current) {
        gainRef.current.gain.value = state.volume;
      }

      if (state.noiseColor !== prevState.noiseColor && bufferRef.current) {
        const data = bufferRef.current.getChannelData(0);
        if (state.noiseColor === 'custom') {
          fillNoiseBuffer(data, 'white');
          applyCustomFilters(lowpassRef, highpassRef, state.tone);
        } else {
          fillNoiseBuffer(data, state.noiseColor);
          if (lowpassRef.current) {
            lowpassRef.current.frequency.value = mapToneToFrequency(
              state.tone,
            );
          }
          if (highpassRef.current) {
            highpassRef.current.frequency.value = HIGHPASS_MIN;
          }
        }

        if (state.isPlaying) {
          restartSource(contextRef, bufferRef, sourceRef, lowpassRef);
        }
      }
    });

    return () => {
      unsubscribe();
      stopSource(sourceRef);
      if (contextRef.current) {
        contextRef.current.close();
        contextRef.current = null;
      }
    };
  }, []);
};
