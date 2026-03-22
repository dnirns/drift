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

function mapToneToFrequency(normalized: number): number {
  return (
    TONE_MIN_FREQUENCY *
    Math.pow(TONE_MAX_FREQUENCY / TONE_MIN_FREQUENCY, normalized)
  );
}

function ensureContext(
  contextRef: React.MutableRefObject<AudioContext | null>,
  bufferRef: React.MutableRefObject<AudioBuffer | null>,
  filterRef: React.MutableRefObject<BiquadFilterNode | null>,
  gainRef: React.MutableRefObject<GainNode | null>,
): AudioContext {
  if (!contextRef.current) {
    const ctx = new AudioContext();

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = mapToneToFrequency(useAppStore.getState().tone);

    const gain = ctx.createGain();
    gain.gain.value = useAppStore.getState().volume;

    filter.connect(gain);
    gain.connect(ctx.destination);

    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(
      1,
      sampleRate * BUFFER_DURATION_SECONDS,
      sampleRate,
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    contextRef.current = ctx;
    bufferRef.current = buffer;
    filterRef.current = filter;
    gainRef.current = gain;
  }

  return contextRef.current;
}

function stopSource(
  sourceRef: React.MutableRefObject<AudioBufferSourceNode | null>,
): void {
  if (sourceRef.current) {
    sourceRef.current.stop(0);
    sourceRef.current.disconnect();
    sourceRef.current = null;
  }
}

export function useAudioEngine(): void {
  const contextRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    const unsubscribe = useAppStore.subscribe((state, prevState) => {
      if (state.isPlaying !== prevState.isPlaying) {
        if (state.isPlaying) {
          const ctx = ensureContext(contextRef, bufferRef, filterRef, gainRef);
          stopSource(sourceRef);
          ctx.resume();

          const source = ctx.createBufferSource();
          source.buffer = bufferRef.current;
          source.loop = true;
          source.connect(filterRef.current!);
          source.start(0);
          sourceRef.current = source;
        } else {
          stopSource(sourceRef);
        }
      }

      if (state.tone !== prevState.tone && filterRef.current) {
        filterRef.current.frequency.value = mapToneToFrequency(state.tone);
      }

      if (state.volume !== prevState.volume && gainRef.current) {
        gainRef.current.gain.value = state.volume;
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
}
