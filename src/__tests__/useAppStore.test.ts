import { useAppStore } from '@/store/useAppStore';
import {
  PRESET_TONES,
  DEFAULT_VOLUME,
  DEFAULT_NOISE_COLOR,
} from '@/constants/audio';

// Reset store between tests
beforeEach(() => {
  useAppStore.setState({
    isPlaying: false,
    tone: PRESET_TONES[DEFAULT_NOISE_COLOR],
    volume: DEFAULT_VOLUME,
    noiseColor: DEFAULT_NOISE_COLOR,
    customTone: 0.5,
    savedPresets: [],
    activePresetId: null,
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

  describe('savedPresets', () => {
    it('starts with an empty savedPresets array', () => {
      expect(useAppStore.getState().savedPresets).toEqual([]);
    });

    describe('savePreset', () => {
      it('saves current customTone as a new preset', () => {
        useAppStore.getState().setTone(0.3);
        useAppStore.getState().savePreset('My Preset');
        const presets = useAppStore.getState().savedPresets;
        expect(presets).toHaveLength(1);
        expect(presets[0].name).toBe('My Preset');
        expect(presets[0].tone).toBe(0.3);
      });

      it('generates a unique id for each preset', () => {
        useAppStore.getState().savePreset('First');
        useAppStore.getState().savePreset('Second');
        const presets = useAppStore.getState().savedPresets;
        expect(presets[0].id).not.toBe(presets[1].id);
      });

      it('appends to existing presets without overwriting', () => {
        useAppStore.getState().setTone(0.2);
        useAppStore.getState().savePreset('A');
        useAppStore.getState().setTone(0.8);
        useAppStore.getState().savePreset('B');
        const presets = useAppStore.getState().savedPresets;
        expect(presets).toHaveLength(2);
        expect(presets[0].tone).toBe(0.2);
        expect(presets[1].tone).toBe(0.8);
      });
    });

    describe('deletePreset', () => {
      it('removes a preset by id', () => {
        useAppStore.getState().savePreset('Temp');
        const id = useAppStore.getState().savedPresets[0].id;
        useAppStore.getState().deletePreset(id);
        expect(useAppStore.getState().savedPresets).toHaveLength(0);
      });

      it('does not affect other presets when deleting one', () => {
        useAppStore.getState().savePreset('Keep');
        useAppStore.getState().savePreset('Remove');
        const removeId = useAppStore.getState().savedPresets[1].id;
        useAppStore.getState().deletePreset(removeId);
        const presets = useAppStore.getState().savedPresets;
        expect(presets).toHaveLength(1);
        expect(presets[0].name).toBe('Keep');
      });
    });

    describe('loadPreset', () => {
      it('switches to custom mode and applies tone', () => {
        useAppStore.getState().setTone(0.7);
        useAppStore.getState().savePreset('Deep');
        const id = useAppStore.getState().savedPresets[0].id;

        // Switch away from custom
        useAppStore.getState().setNoiseColor('pink');

        useAppStore.getState().loadPreset(id);
        const state = useAppStore.getState();
        expect(state.noiseColor).toBe('custom');
        expect(state.tone).toBe(0.7);
        expect(state.customTone).toBe(0.7);
      });

      it('does not change volume', () => {
        useAppStore.getState().setVolume(0.9);
        useAppStore.getState().setTone(0.3);
        useAppStore.getState().savePreset('Quiet');
        const id = useAppStore.getState().savedPresets[0].id;

        useAppStore.getState().setVolume(0.5);
        useAppStore.getState().loadPreset(id);
        expect(useAppStore.getState().volume).toBe(0.5);
      });

      it('updates customTone so switching away and back preserves the loaded tone', () => {
        useAppStore.getState().setTone(0.6);
        useAppStore.getState().savePreset('Remember');
        const id = useAppStore.getState().savedPresets[0].id;

        useAppStore.getState().loadPreset(id);
        useAppStore.getState().setNoiseColor('white');
        useAppStore.getState().setNoiseColor('custom');
        expect(useAppStore.getState().tone).toBe(0.6);
      });

      it('does nothing for a non-existent preset id', () => {
        useAppStore.getState().setNoiseColor('pink');
        const before = useAppStore.getState();
        useAppStore.getState().loadPreset('nonexistent');
        const after = useAppStore.getState();
        expect(after.noiseColor).toBe(before.noiseColor);
        expect(after.tone).toBe(before.tone);
      });
    });
  });
});
