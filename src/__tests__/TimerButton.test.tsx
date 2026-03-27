import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { useAppStore } from '@/store/useAppStore';
import TimerButton from '@/components/TimerButton';
import {
  DEFAULT_VOLUME,
  DEFAULT_NOISE_COLOR,
  PRESET_TONES,
} from '@/constants/audio';

beforeEach(() => {
  useAppStore.setState({
    isPlaying: false,
    tone: PRESET_TONES[DEFAULT_NOISE_COLOR],
    volume: DEFAULT_VOLUME,
    noiseColor: DEFAULT_NOISE_COLOR,
    customTone: 0.5,
    savedPresets: [],
    activePresetId: null,
    timerDuration: null,
    timerRemaining: null,
  });
});

describe('TimerButton', () => {
  it('renders infinity symbol when no timer is set', () => {
    render(<TimerButton />);
    expect(screen.getByText('∞')).toBeTruthy();
  });

  it('shows formatted duration when timer is set but not playing', () => {
    useAppStore.setState({ timerDuration: 3600, timerRemaining: 3600 });
    render(<TimerButton />);
    expect(screen.getByText('1:00:00')).toBeTruthy();
  });

  it('shows remaining time when timer is active and counting down', () => {
    useAppStore.setState({
      timerDuration: 3600,
      timerRemaining: 2700,
      isPlaying: true,
    });
    render(<TimerButton />);
    expect(screen.getByText('45:00')).toBeTruthy();
  });

  it('opens TimerModal when pressed', () => {
    render(<TimerButton />);
    fireEvent.press(screen.getByText('∞'));
    expect(screen.getByText('Sleep Timer')).toBeTruthy();
  });
});
