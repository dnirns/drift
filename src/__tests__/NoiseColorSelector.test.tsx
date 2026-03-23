import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import NoiseColorSelector from '@/components/NoiseColorSelector';
import { useAppStore } from '@/store/useAppStore';
import { PRESET_TONES, DEFAULT_VOLUME, DEFAULT_NOISE_COLOR } from '@/constants/audio';

beforeEach(() => {
  useAppStore.setState({
    isPlaying: false,
    tone: PRESET_TONES[DEFAULT_NOISE_COLOR],
    volume: DEFAULT_VOLUME,
    noiseColor: DEFAULT_NOISE_COLOR,
    customTone: 0.5,
  });
});

describe('NoiseColorSelector', () => {
  it('renders all noise color options', () => {
    render(<NoiseColorSelector />);

    expect(screen.getByText('White')).toBeTruthy();
    expect(screen.getByText('Pink')).toBeTruthy();
    expect(screen.getByText('Brown')).toBeTruthy();
    expect(screen.getByText('Blue')).toBeTruthy();
    expect(screen.getByText('Custom')).toBeTruthy();
  });

  it('renders the Noise label', () => {
    render(<NoiseColorSelector />);
    expect(screen.getByText('Noise')).toBeTruthy();
  });

  it('pressing a pill updates the store noise color', () => {
    render(<NoiseColorSelector />);

    fireEvent.press(screen.getByText('Pink'));
    expect(useAppStore.getState().noiseColor).toBe('pink');
  });

  it('pressing Custom sets noise color to custom', () => {
    render(<NoiseColorSelector />);

    fireEvent.press(screen.getByText('Custom'));
    expect(useAppStore.getState().noiseColor).toBe('custom');
  });
});
