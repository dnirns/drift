import { useEffect } from 'react';
import { audioEngine } from '@/audio/audioEngine';
import type { AudioEngine, AudioEngineSnapshot } from '@/audio/types';
import { useAppStore } from '@/store/useAppStore';
import type { StoreState } from '@/types';

interface AudioEngineStore {
  getState: () => StoreState;
  subscribe: (
    listener: (state: StoreState, previousState: StoreState) => void,
  ) => () => void;
}

export const bindAudioEngine = (
  store: AudioEngineStore,
  engine: AudioEngine,
): (() => void) => {
  let isActive = true;
  const initialState = store.getState();

  engine.setVolume(initialState.volume);
  engine.setSpectrum(initialState.tone);
  engine.setNoiseColor(initialState.noiseColor);

  const synchronizeSnapshot = (snapshot: AudioEngineSnapshot): void => {
    if (!isActive) return;
    store.getState().setAudioEngineSnapshot(snapshot.status, snapshot.error);
  };

  const unsubscribeEngine = engine.subscribe(synchronizeSnapshot);
  synchronizeSnapshot(engine.getSnapshot());

  const executeCommand = (command: StoreState['audioCommand']): void => {
    if (!command) return;

    if (command.type === 'play') {
      void engine.play();
      return;
    }

    void engine.pause();
  };

  const unsubscribeStore = store.subscribe((state, previousState) => {
    if (state.volume !== previousState.volume) {
      engine.setVolume(state.volume);
    }

    if (state.tone !== previousState.tone) {
      engine.setSpectrum(state.tone);
    }

    if (state.noiseColor !== previousState.noiseColor) {
      engine.setNoiseColor(state.noiseColor);
    }

    if (state.audioCommand?.id !== previousState.audioCommand?.id) {
      executeCommand(state.audioCommand);
    }
  });

  executeCommand(initialState.audioCommand);

  return () => {
    isActive = false;
    unsubscribeStore();
    unsubscribeEngine();
  };
};

const AudioEngineBinding = (): null => {
  useEffect(() => bindAudioEngine(useAppStore, audioEngine), []);
  return null;
};

export default AudioEngineBinding;
