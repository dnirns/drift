import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useAppStore } from '@/store/useAppStore';

export const useTimer = (): void => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef<number | null>(null);

  const clearCountdown = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    endTimeRef.current = null;
  };

  const startCountdown = (remaining: number) => {
    clearCountdown();
    endTimeRef.current = Date.now() + remaining * 1000;

    intervalRef.current = setInterval(() => {
      if (endTimeRef.current === null) return;
      const secondsLeft = Math.max(
        0,
        Math.ceil((endTimeRef.current - Date.now()) / 1000),
      );

      if (secondsLeft <= 0) {
        clearCountdown();
        useAppStore.getState().timerExpired();
      } else {
        useAppStore.getState().setTimerRemaining(secondsLeft);
      }
    }, 1000);
  };

  useEffect(() => {
    // subscribe to store changes for play/pause and timer duration
    const unsubscribe = useAppStore.subscribe((state, prevState) => {
      const { isPlaying, timerDuration, timerRemaining } = state;

      // playback started
      if (isPlaying && !prevState.isPlaying) {
        if (timerDuration !== null) {
          const remaining = timerRemaining ?? timerDuration;
          useAppStore.getState().setTimerRemaining(remaining);
          startCountdown(remaining);
        }
        return;
      }

      // playback stopped (pause or timer expiry)
      if (!isPlaying && prevState.isPlaying) {
        clearCountdown();
        return;
      }

      // timer duration changed while playing
      if (isPlaying && timerDuration !== prevState.timerDuration) {
        if (timerDuration === null) {
          // switched to infinity
          clearCountdown();
          useAppStore.getState().setTimerRemaining(null);
        } else {
          // new duration selected while playing
          useAppStore.getState().setTimerRemaining(timerDuration);
          startCountdown(timerDuration);
        }
      }
    });

    // background recovery via AppState
    const appStateSubscription = AppState.addEventListener(
      'change',
      (nextAppState) => {
        if (nextAppState === 'active' && endTimeRef.current !== null) {
          const { isPlaying } = useAppStore.getState();
          if (!isPlaying) return;

          const secondsLeft = Math.max(
            0,
            Math.ceil((endTimeRef.current - Date.now()) / 1000),
          );

          if (secondsLeft <= 0) {
            clearCountdown();
            useAppStore.getState().timerExpired();
          } else {
            useAppStore.getState().setTimerRemaining(secondsLeft);
            startCountdown(secondsLeft);
          }
        }
      },
    );

    return () => {
      unsubscribe();
      appStateSubscription.remove();
      clearCountdown();
    };
  }, []);
};
