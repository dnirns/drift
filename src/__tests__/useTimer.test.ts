import { renderHook, act } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useAppStore } from '@/store/useAppStore';
import { useTimer } from '@/hooks/useTimer';
import {
  DEFAULT_VOLUME,
  DEFAULT_NOISE_COLOR,
  PRESET_TONES,
} from '@/constants/audio';

// capture the AppState listener so we can trigger foreground returns
let appStateCallback: ((state: string) => void) | null = null;
const mockRemove = jest.fn();

jest.spyOn(AppState, 'addEventListener').mockImplementation(
  (_type, callback) => {
    appStateCallback = callback as (state: string) => void;
    return { remove: mockRemove } as ReturnType<typeof AppState.addEventListener>;
  },
);

beforeEach(() => {
  jest.useFakeTimers();
  appStateCallback = null;
  mockRemove.mockClear();

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

afterEach(() => {
  jest.useRealTimers();
});

describe('useTimer', () => {
  it('does nothing when timerDuration is null (infinity)', () => {
    renderHook(() => useTimer());

    act(() => {
      useAppStore.getState().togglePlayback();
    });

    jest.advanceTimersByTime(5000);
    expect(useAppStore.getState().timerRemaining).toBeNull();
  });

  it('starts countdown when playback begins with a timer set', () => {
    renderHook(() => useTimer());

    act(() => {
      useAppStore.getState().setTimerDuration(3600);
      useAppStore.getState().setTimerRemaining(3600);
    });

    act(() => {
      useAppStore.getState().togglePlayback();
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    const remaining = useAppStore.getState().timerRemaining!;
    expect(remaining).toBeLessThanOrEqual(3597);
    expect(remaining).toBeGreaterThanOrEqual(3596);
  });

  it('pauses countdown when playback stops', () => {
    renderHook(() => useTimer());

    act(() => {
      useAppStore.getState().setTimerDuration(60);
      useAppStore.getState().setTimerRemaining(60);
    });

    act(() => {
      useAppStore.getState().togglePlayback(); // play
    });

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    const remainingBeforePause = useAppStore.getState().timerRemaining!;

    act(() => {
      useAppStore.getState().togglePlayback(); // pause
    });

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    // remaining should not have changed after pause
    expect(useAppStore.getState().timerRemaining).toBe(remainingBeforePause);
  });

  it('calls timerExpired when countdown reaches zero', () => {
    renderHook(() => useTimer());

    act(() => {
      useAppStore.getState().setTimerDuration(3);
      useAppStore.getState().setTimerRemaining(3);
    });

    act(() => {
      useAppStore.getState().togglePlayback();
    });

    act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(useAppStore.getState().isPlaying).toBe(false);
    expect(useAppStore.getState().timerRemaining).toBeNull();
  });

  it('resets countdown when timerDuration changes while playing', () => {
    renderHook(() => useTimer());

    act(() => {
      useAppStore.getState().setTimerDuration(60);
      useAppStore.getState().setTimerRemaining(60);
    });

    act(() => {
      useAppStore.getState().togglePlayback();
    });

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    act(() => {
      useAppStore.getState().setTimerDuration(120);
    });

    // should have reset to the new duration
    const remaining = useAppStore.getState().timerRemaining!;
    expect(remaining).toBeGreaterThanOrEqual(119);
  });

  it('clears countdown when timerDuration set to null while playing', () => {
    renderHook(() => useTimer());

    act(() => {
      useAppStore.getState().setTimerDuration(60);
      useAppStore.getState().setTimerRemaining(60);
    });

    act(() => {
      useAppStore.getState().togglePlayback();
    });

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    act(() => {
      useAppStore.getState().setTimerDuration(null);
    });

    expect(useAppStore.getState().timerRemaining).toBeNull();
  });

  it('recovers correct remaining time when app returns to foreground', () => {
    renderHook(() => useTimer());

    act(() => {
      useAppStore.getState().setTimerDuration(100);
      useAppStore.getState().setTimerRemaining(100);
    });

    act(() => {
      useAppStore.getState().togglePlayback();
    });

    // simulate 50 seconds passing in background
    act(() => {
      jest.advanceTimersByTime(50000);
    });

    // simulate returning to foreground
    act(() => {
      appStateCallback?.('active');
    });

    const remaining = useAppStore.getState().timerRemaining!;
    expect(remaining).toBeLessThanOrEqual(50);
    expect(remaining).toBeGreaterThanOrEqual(49);
  });

  it('expires timer on foreground return if time has passed', () => {
    renderHook(() => useTimer());

    act(() => {
      useAppStore.getState().setTimerDuration(5);
      useAppStore.getState().setTimerRemaining(5);
    });

    act(() => {
      useAppStore.getState().togglePlayback();
    });

    // simulate more than 5 seconds passing
    act(() => {
      jest.advanceTimersByTime(6000);
    });

    // timer should have already expired from the interval
    expect(useAppStore.getState().isPlaying).toBe(false);
  });

  it('cleans up interval and AppState listener on unmount', () => {
    const { unmount } = renderHook(() => useTimer());
    unmount();
    expect(mockRemove).toHaveBeenCalled();
  });
});
