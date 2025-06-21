import { useState, useEffect, useCallback, useRef } from "react";
import type { TimerState, TimerType, TimerStatus } from "../types";
import { DEFAULT_TIMER_STATE } from "../types";
import { getElapsedTime, isValidTime } from "../utils/time";

interface UseTimerReturn {
  timer: TimerState;
  start: () => void;
  pause: () => void;
  reset: () => void;
  stop: () => void;
  setTimer: (duration: number, type: TimerType) => void;
  adjustTime: (seconds: number) => void;
  isRunning: boolean;
  isPaused: boolean;
  isExpired: boolean;
  progress: number; // 0-1 for countdown, 0+ for countup
}

export function useTimer(
  onExpire?: () => void,
  onTick?: (currentTime: number) => void
): UseTimerReturn {
  const [timer, setTimerState] = useState<TimerState>(DEFAULT_TIMER_STATE);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Handle timer expiration
  useEffect(() => {
    if (timer.status === "expired" && onExpire) {
      onExpire();
    }
  }, [timer.status, onExpire]);

  // Main timer tick function
  const tick = useCallback(() => {
    setTimerState((prevTimer) => {
      if (prevTimer.status !== "running" || !startTimeRef.current) {
        return prevTimer;
      }

      const elapsed =
        getElapsedTime(startTimeRef.current) - pausedTimeRef.current;
      let newTime: number;
      let newStatus: TimerStatus = "running";

      switch (prevTimer.type) {
        case "countdown":
          newTime = Math.max(0, prevTimer.initialTime - elapsed);
          if (newTime <= 0) {
            newTime = 0;
            newStatus = "expired";
          }
          break;

        case "countup":
          newTime = elapsed;
          break;

        case "stopwatch":
          newTime = elapsed;
          break;

        default:
          newTime = prevTimer.currentTime;
      }

      const updatedTimer = {
        ...prevTimer,
        currentTime: newTime,
        status: newStatus,
      };

      // Call onTick callback if provided
      if (onTick) {
        onTick(newTime);
      }

      return updatedTimer;
    });
  }, [onTick]);

  // Start the timer
  const start = useCallback(() => {
    if (timer.status === "expired") {
      return; // Cannot start an expired timer
    }

    setTimerState((prevTimer) => {
      if (prevTimer.status === "running") {
        return prevTimer; // Already running
      }

      // Set start time
      if (prevTimer.status === "idle") {
        startTimeRef.current = Date.now();
        pausedTimeRef.current = 0;
      } else if (prevTimer.status === "paused") {
        // Resume from pause - adjust start time to account for pause duration
        const pauseDuration = Date.now() - (prevTimer.pausedTime || Date.now());
        pausedTimeRef.current += pauseDuration / 1000;
      }

      return {
        ...prevTimer,
        status: "running",
        startTime: startTimeRef.current || undefined,
      };
    });

    // Start the interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(tick, 100); // Update every 100ms for smooth display
  }, [timer.status, tick]);

  // Pause the timer
  const pause = useCallback(() => {
    if (timer.status !== "running") {
      return;
    }

    setTimerState((prevTimer) => ({
      ...prevTimer,
      status: "paused",
      pausedTime: Date.now(),
    }));

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [timer.status]);

  // Reset the timer
  const reset = useCallback(() => {
    setTimerState((prevTimer) => {
      const resetTime =
        prevTimer.type === "countdown" ? prevTimer.initialTime : 0;
      return {
        ...prevTimer,
        status: "idle",
        currentTime: resetTime,
        startTime: undefined,
        pausedTime: undefined,
      };
    });

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    startTimeRef.current = null;
    pausedTimeRef.current = 0;
  }, []);

  // Stop the timer (same as reset but more explicit)
  const stop = useCallback(() => {
    reset();
  }, [reset]);

  // Set timer duration and type
  const setTimerConfig = useCallback((duration: number, type: TimerType) => {
    console.log("Setting timer to ", duration, " seconds of types ", type);
    if (!isValidTime(duration)) {
      console.error("Invalid timer duration:", duration);
      return;
    }

    // Stop current timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // const initialTime = type === "countdown" ? duration : 0;
    const currentTime = type === "countdown" ? duration : 0;

    setTimerState({
      type,
      status: "idle",
      currentTime,
      initialTime: duration,
      startTime: undefined,
      pausedTime: undefined,
    });

    startTimeRef.current = null;
    pausedTimeRef.current = 0;
  }, []);

  // Adjust timer by adding/subtracting seconds
  const adjustTime = useCallback((seconds: number) => {
    setTimerState(prevTimer => {
      let newTime = prevTimer.currentTime + seconds;

      // For countdown timers, ensure we don't go below 0 or above initial time
      if (prevTimer.type === 'countdown') {
        newTime = Math.max(0, Math.min(prevTimer.initialTime, newTime));
      } else {
        // For count-up and stopwatch, don't allow negative time
        newTime = Math.max(0, newTime);
      }

      return {
        ...prevTimer,
        currentTime: newTime,
      };
    });
  }, []);

  // Computed values
  const isRunning = timer.status === "running";
  const isPaused = timer.status === "paused";
  const isExpired = timer.status === "expired";

  // Calculate progress (0-1 for countdown, 0+ for countup/stopwatch)
  const progress =
    timer.type === "countdown" && timer.initialTime > 0
      ? Math.max(
          0,
          Math.min(
            1,
            (timer.initialTime - timer.currentTime) / timer.initialTime
          )
        )
      : timer.currentTime / Math.max(1, timer.initialTime || 1);

  return {
    timer,
    start,
    pause,
    reset,
    stop,
    setTimer: setTimerConfig,
    adjustTime,
    isRunning,
    isPaused,
    isExpired,
    progress,
  };
}
