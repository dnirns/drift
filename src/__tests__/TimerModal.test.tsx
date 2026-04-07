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
    expect(screen.getByText('Custom')).toBeTruthy();
    expect(screen.queryByText('Set')).toBeNull();
    expect(screen.queryByTestId('custom-hours-picker')).toBeNull();
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

  it('sets a custom duration from the pickers', () => {
    render(<TimerModal {...defaultProps} />);

    fireEvent.press(screen.getByTestId('custom-timer-option'));
    fireEvent(screen.getByTestId('custom-hours-picker'), 'onValueChange', 2);
    fireEvent(screen.getByTestId('custom-minutes-picker'), 'onValueChange', 30);
    fireEvent.press(screen.getByTestId('set-custom-timer-button'));

    expect(useAppStore.getState().timerDuration).toBe(9000);
    expect(useAppStore.getState().timerRemaining).toBe(9000);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('does not set a zero-length custom duration', () => {
    render(<TimerModal {...defaultProps} />);

    fireEvent.press(screen.getByTestId('custom-timer-option'));
    fireEvent.press(screen.getByTestId('set-custom-timer-button'));

    expect(useAppStore.getState().timerDuration).toBeNull();
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('shows the custom picker only after selecting custom', () => {
    render(<TimerModal {...defaultProps} />);

    expect(screen.queryByTestId('custom-hours-picker')).toBeNull();

    fireEvent.press(screen.getByTestId('custom-timer-option'));

    expect(screen.getByTestId('custom-hours-picker')).toBeTruthy();
    expect(screen.getByTestId('custom-minutes-picker')).toBeTruthy();
    expect(screen.getByText('Set')).toBeTruthy();
  });

  it('keeps the custom picker closed when reopening the modal', () => {
    const { rerender } = render(<TimerModal {...defaultProps} />);

    fireEvent.press(screen.getByTestId('custom-timer-option'));
    fireEvent(screen.getByTestId('custom-hours-picker'), 'onValueChange', 2);
    fireEvent(screen.getByTestId('custom-minutes-picker'), 'onValueChange', 30);
    fireEvent.press(screen.getByTestId('set-custom-timer-button'));

    rerender(<TimerModal visible={false} onClose={defaultProps.onClose} />);
    rerender(<TimerModal visible onClose={defaultProps.onClose} />);

    expect(screen.queryByTestId('custom-hours-picker')).toBeNull();

    fireEvent.press(screen.getByTestId('custom-timer-option'));

    expect(screen.getByText('2 hr 30 min')).toBeTruthy();
  });
});
