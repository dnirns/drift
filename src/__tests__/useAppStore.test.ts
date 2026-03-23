import { useAppStore } from '@/store/useAppStore';
import { PRESET_TONES, DEFAULT_VOLUME, DEFAULT_NOISE_COLOR } from '@/constants/audio';

// Reset store between tests
beforeEach(() => {
  useAppStore.setState({
    isPlaying: false,
    tone: PRESET_TONES[DEFAULT_NOISE_COLOR],
    volume: DEFAULT_VOLUME,
    noiseColor: DEFAULT_NOISE_COLOR,
    customTone: 0.5,
  });
});

describe('useAppStore', () => {
  it('has correct initial state', () => {
    const state = useAppStore.getState();
    expect(state.isPlaying).toBe(false);
    expect(state.volume).toBe(DEFAULT_VOLUME);
    expect(state.noiseColor).toBe('white');
    expect(state.tone).toBe(PRESET_TONES.white);
  });

  describe('togglePlayback', () => {
    it('toggles isPlaying from false to true', () => {
      useAppStore.getState().togglePlayback();
      expect(useAppStore.getState().isPlaying).toBe(true);
    });

    it('toggles isPlaying from true to false', () => {
      useAppStore.getState().togglePlayback();
      useAppStore.getState().togglePlayback();
      expect(useAppStore.getState().isPlaying).toBe(false);
    });
  });

  describe('setTone', () => {
    it('updates tone value', () => {
      useAppStore.getState().setTone(0.75);
      expect(useAppStore.getState().tone).toBe(0.75);
    });

    it('also updates customTone', () => {
      useAppStore.getState().setTone(0.3);
      expect(useAppStore.getState().customTone).toBe(0.3);
    });
  });

  describe('setVolume', () => {
    it('updates volume value', () => {
      useAppStore.getState().setVolume(0.5);
      expect(useAppStore.getState().volume).toBe(0.5);
    });
  });

  describe('setNoiseColor', () => {
    it('changes noise color and applies preset tone', () => {
      useAppStore.getState().setNoiseColor('pink');
      const state = useAppStore.getState();
      expect(state.noiseColor).toBe('pink');
      expect(state.tone).toBe(PRESET_TONES.pink);
    });

    it('switching to custom restores the remembered custom tone', () => {
      // Set a custom tone first
      useAppStore.getState().setTone(0.25);
      // Switch to a preset
      useAppStore.getState().setNoiseColor('brown');
      expect(useAppStore.getState().tone).toBe(PRESET_TONES.brown);

      // Switch back to custom — should restore 0.25
      useAppStore.getState().setNoiseColor('custom');
      expect(useAppStore.getState().tone).toBe(0.25);
    });

    it('preset tones do not overwrite customTone', () => {
      useAppStore.getState().setTone(0.4);
      useAppStore.getState().setNoiseColor('blue');
      // customTone should still be 0.4
      expect(useAppStore.getState().customTone).toBe(0.4);
    });
  });
});
