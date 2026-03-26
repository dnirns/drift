import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import SavedPresetsList from '@/components/SavedPresetsList';
import { useAppStore } from '@/store/useAppStore';
import { COLORS } from '@/constants/theme';
import {
  DEFAULT_VOLUME,
  DEFAULT_NOISE_COLOR,
  PRESET_TONES,
} from '@/constants/audio';

const mockPresets = [
  { id: 'preset-1', name: 'Deep Sleep', tone: 0.2 },
  { id: 'preset-2', name: 'Ocean', tone: 0.6 },
  { id: 'preset-3', name: 'Static', tone: 0.9 },
];

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
  jest.restoreAllMocks();
});

describe('SavedPresetsList', () => {
  it('returns null when there are no saved presets', () => {
    const { toJSON } = render(<SavedPresetsList />);
    expect(toJSON()).toBeNull();
  });

  it('renders all saved preset names', () => {
    useAppStore.setState({ savedPresets: mockPresets });
    render(<SavedPresetsList />);

    expect(screen.getByText('Deep Sleep')).toBeTruthy();
    expect(screen.getByText('Ocean')).toBeTruthy();
    expect(screen.getByText('Static')).toBeTruthy();
  });

  it('calls loadPreset with correct id on press', () => {
    useAppStore.setState({ savedPresets: mockPresets });
    render(<SavedPresetsList />);

    fireEvent.press(screen.getByText('Ocean'));

    const state = useAppStore.getState();
    expect(state.activePresetId).toBe('preset-2');
    expect(state.noiseColor).toBe('custom');
    expect(state.tone).toBe(0.6);
  });

  it('shows delete confirmation alert on long press', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    useAppStore.setState({ savedPresets: mockPresets });
    render(<SavedPresetsList />);

    fireEvent(screen.getByText('Deep Sleep'), 'longPress');

    expect(alertSpy).toHaveBeenCalledWith(
      'Delete Preset',
      'Delete "Deep Sleep"?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
        expect.objectContaining({ text: 'Delete', style: 'destructive' }),
      ]),
    );
  });

  it('deletes preset when delete confirmation is accepted', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    useAppStore.setState({ savedPresets: mockPresets });
    render(<SavedPresetsList />);

    fireEvent(screen.getByText('Ocean'), 'longPress');

    // invoke the destructive button's onPress callback
    const buttons = alertSpy.mock.calls[0][2] as Array<{ onPress?: () => void }>;
    const deleteButton = buttons.find((b) => 'onPress' in b && b.onPress);
    act(() => {
      deleteButton?.onPress?.();
    });

    const remaining = useAppStore.getState().savedPresets;
    expect(remaining).toHaveLength(2);
    expect(remaining.find((p) => p.id === 'preset-2')).toBeUndefined();
  });

  it('applies active style to the active preset', () => {
    useAppStore.setState({ savedPresets: mockPresets, activePresetId: 'preset-2' });
    render(<SavedPresetsList />);

    const activeText = screen.getByText('Ocean');
    const inactiveText = screen.getByText('Deep Sleep');

    // active preset text should have white color (pillTextActive)
    const activeStyles = [activeText.props.style].flat(Infinity);
    const inactiveStyles = [inactiveText.props.style].flat(Infinity);

    expect(activeStyles).toContainEqual(
      expect.objectContaining({ color: '#FFFFFF' }),
    );
    expect(inactiveStyles).not.toContainEqual(
      expect.objectContaining({ color: '#FFFFFF' }),
    );
  });
});
