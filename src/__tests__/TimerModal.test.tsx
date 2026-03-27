import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { useAppStore } from '@/store/useAppStore';
import TimerModal from '@/components/TimerModal';
import {
  DEFAULT_VOLUME,
  DEFAULT_NOISE_COLOR,
  PRESET_TONES,
} from '@/constants/audio';

const defaultProps = {
  visible: true,
  onClose: jest.fn(),
};

beforeEach(() => {
  defaultProps.onClose = jest.fn();

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

describe('TimerModal', () => {
  it('renders title and preset options', () => {
    render(<TimerModal {...defaultProps} />);

    expect(screen.getByText('Sleep Timer')).toBeTruthy();
    expect(screen.getByText('∞')).toBeTruthy();
    expect(screen.getByText('1 Hour')).toBeTruthy();
    expect(screen.getByText('4 Hours')).toBeTruthy();
    expect(screen.getByText('8 Hours')).toBeTruthy();
  });

  it('selects 1 hour preset and closes modal', () => {
    render(<TimerModal {...defaultProps} />);

    fireEvent.press(screen.getByText('1 Hour'));

    expect(useAppStore.getState().timerDuration).toBe(3600);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('selects infinity preset and sets timerDuration to null', () => {
    useAppStore.setState({ timerDuration: 3600 });
    render(<TimerModal {...defaultProps} />);

    fireEvent.press(screen.getByText('∞'));

    expect(useAppStore.getState().timerDuration).toBeNull();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('selects 4 hours preset', () => {
    render(<TimerModal {...defaultProps} />);

    fireEvent.press(screen.getByText('4 Hours'));

    expect(useAppStore.getState().timerDuration).toBe(14400);
  });

  it('selects 8 hours preset', () => {
    render(<TimerModal {...defaultProps} />);

    fireEvent.press(screen.getByText('8 Hours'));

    expect(useAppStore.getState().timerDuration).toBe(28800);
  });
});
