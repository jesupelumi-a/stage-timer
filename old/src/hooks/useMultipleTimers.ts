import { useState, useCallback, useEffect, useRef } from 'react';
import type { Timer, TimerCollection, TimerType, TimerStatus } from '../types';
import { DEFAULT_TIMER_COLLECTION } from '../types';

interface UseMultipleTimersReturn {
  timers: Timer[];
  activeTimer: Timer | null;
  activeTimerId: string | null;
  initializeTimerCollection: (collection: TimerCollection) => void;
  addTimer: (
    name: string,
    duration: number,
    type: TimerType,
    startTime?: string
  ) => string;
  deleteTimer: (timerId: string) => void;
  selectTimer: (timerId: string) => void;
  startTimer: (timerId?: string) => void;
  pauseTimer: (timerId?: string) => void;
  resetTimer: (timerId?: string) => void;
  stopTimer: (timerId?: string) => void;
  updateTimer: (timerId: string, updates: Partial<Timer>) => void;
  updateTimerTime: (timerId: string, newTime: number) => void;
  updateTimerDuration: (timerId: string, newDuration: number) => void;
  updateTimerType: (timerId: string, newType: TimerType) => void;
  reorderTimers: (timerIds: string[]) => void;
  adjustTime: (timerId: string, seconds: number) => void;
  isTimerRunning: (timerId: string) => boolean;
  isTimerPaused: (timerId: string) => boolean;
  isTimerExpired: (timerId: string) => boolean;
}

export function useMultipleTimers(
  onTimerExpire?: (timerId: string) => void,
  onTimerTick?: (timerId: string, currentTime: number) => void
): UseMultipleTimersReturn {
  const [timerCollection, setTimerCollection] = useState<TimerCollection>(
    DEFAULT_TIMER_COLLECTION
  );
  const intervalRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const startTimeRefs = useRef<Map<string, number>>(new Map());
  const pausedTimeRefs = useRef<Map<string, number>>(new Map());

  // Clear all intervals on unmount
  useEffect(() => {
    return () => {
      intervalRefs.current.forEach((intervalId) => {
        clearInterval(intervalId);
      });
    };
  }, []);

  // Get elapsed time helper
  const getElapsedTime = useCallback((startTime: number): number => {
    return (Date.now() - startTime) / 1000;
  }, []);

  // Main timer tick function
  const tick = useCallback(
    (timerId: string) => {
      setTimerCollection((prev) => {
        const timer = prev.timers.find((t) => t.id === timerId);
        if (!timer || timer.state.status !== 'running') {
          return prev;
        }

        const startTime = startTimeRefs.current.get(timerId);
        if (!startTime) return prev;

        const elapsed = getElapsedTime(startTime);
        let newElapsedTime = elapsed;
        let newCurrentTime: number;
        let hasJustExpired = false;

        // Add a small delay (1 second) before starting countdown to show full duration first
        if (elapsed < 1) {
          newElapsedTime = 0;
        } else {
          newElapsedTime = elapsed - 1;
        }

        switch (timer.state.type) {
          case 'countdown':
            // For countdown: current time = initial time - elapsed time
            newCurrentTime = timer.state.initialTime - newElapsedTime;
            // Check if timer just crossed zero for callbacks
            if (newCurrentTime <= 0 && timer.state.currentTime > 0) {
              hasJustExpired = true;
            }
            break;

          case 'countup':
            newCurrentTime = newElapsedTime;
            break;

          case 'stopwatch':
            newCurrentTime = newElapsedTime;
            break;

          default:
            newCurrentTime = timer.state.currentTime;
        }

        const updatedTimers = prev.timers.map((t) =>
          t.id === timerId
            ? {
                ...t,
                state: {
                  ...t.state,
                  currentTime: newCurrentTime,
                  elapsedTime: newElapsedTime,
                  status: 'running' as TimerStatus, // Always keep status as running
                },
              }
            : t
        );

        // Call callbacks
        if (onTimerTick) {
          onTimerTick(timerId, newCurrentTime);
        }

        if (hasJustExpired && onTimerExpire) {
          onTimerExpire(timerId);

          // Auto-start next timer if linked
          const currentIndex = prev.timers.findIndex((t) => t.id === timerId);
          const nextTimer = prev.timers[currentIndex + 1];
          if (nextTimer && nextTimer.autoLinkToPrevious) {
            setTimeout(() => startTimer(nextTimer.id), 100);
          }
        }

        return {
          ...prev,
          timers: updatedTimers,
        };
      });
    },
    [getElapsedTime, onTimerTick, onTimerExpire]
  );

  // Start timer
  const startTimer = useCallback(
    (timerId?: string) => {
      const targetId = timerId || timerCollection.activeTimerId;
      if (!targetId) return;

      setTimerCollection((prev) => {
        const timer = prev.timers.find((t) => t.id === targetId);
        if (!timer || timer.state.status === 'running') {
          return prev;
        }

        // Pause all other running timers first
        prev.timers.forEach((t) => {
          if (t.id !== targetId && t.state.status === 'running') {
            const intervalId = intervalRefs.current.get(t.id);
            if (intervalId) {
              clearInterval(intervalId);
              intervalRefs.current.delete(t.id);
            }
          }
        });

        // Set start time
        if (timer.state.status === 'idle') {
          startTimeRefs.current.set(targetId, Date.now());
          pausedTimeRefs.current.set(targetId, 0);
        } else if (
          timer.state.status === 'paused' ||
          timer.state.status === 'expired'
        ) {
          // Resume from pause or expired state
          // Calculate how much time should be "subtracted" to maintain current timer position
          const currentTime = timer.state.currentTime;
          let adjustedElapsed: number;

          if (timer.state.type === 'countdown') {
            // For countdown: if timer shows 00:39, and initial was 10:00 (600s),
            // then elapsed time should be 600 - 39 = 561 seconds
            adjustedElapsed = timer.state.initialTime - currentTime;
            // Add 1 second for the initial delay we implemented
            adjustedElapsed += 1;
          } else {
            // For countup/stopwatch: elapsed time equals current time
            adjustedElapsed = currentTime;
          }

          // Set new start time as if the timer had been running for adjustedElapsed seconds
          const newStartTime = Date.now() - adjustedElapsed * 1000;
          startTimeRefs.current.set(targetId, newStartTime);
          pausedTimeRefs.current.set(targetId, 0);
        }

        // Start interval
        const intervalId = setInterval(() => tick(targetId), 100);
        intervalRefs.current.set(targetId, intervalId);

        const updatedTimers = prev.timers.map((t) =>
          t.id === targetId
            ? {
                ...t,
                state: {
                  ...t.state,
                  status: 'running' as TimerStatus,
                  startTime: startTimeRefs.current.get(targetId),
                  pausedTime: undefined, // Clear paused time when resuming
                },
              }
            : t.state.status === 'running'
              ? {
                  ...t,
                  state: {
                    ...t.state,
                    status: 'paused' as TimerStatus,
                    pausedTime: Date.now(),
                  },
                }
              : t
        );

        return {
          ...prev,
          timers: updatedTimers,
        };
      });
    },
    [timerCollection.activeTimerId, tick]
  );

  // Pause timer
  const pauseTimer = useCallback(
    (timerId?: string) => {
      const targetId = timerId || timerCollection.activeTimerId;
      if (!targetId) return;

      // Clear interval
      const intervalId = intervalRefs.current.get(targetId);
      if (intervalId) {
        clearInterval(intervalId);
        intervalRefs.current.delete(targetId);
      }

      setTimerCollection((prev) => {
        const updatedTimers = prev.timers.map((t) =>
          t.id === targetId
            ? {
                ...t,
                state: {
                  ...t.state,
                  status: 'paused' as TimerStatus,
                  pausedTime: Date.now(),
                },
              }
            : t
        );

        return {
          ...prev,
          timers: updatedTimers,
        };
      });
    },
    [timerCollection.activeTimerId]
  );

  // Reset timer
  const resetTimer = useCallback(
    (timerId?: string) => {
      const targetId = timerId || timerCollection.activeTimerId;
      if (!targetId) return;

      // Clear interval
      const intervalId = intervalRefs.current.get(targetId);
      if (intervalId) {
        clearInterval(intervalId);
        intervalRefs.current.delete(targetId);
      }

      // Clear refs
      startTimeRefs.current.delete(targetId);
      pausedTimeRefs.current.delete(targetId);

      setTimerCollection((prev) => {
        const timer = prev.timers.find((t) => t.id === targetId);
        if (!timer) return prev;

        const currentTime =
          timer.state.type === 'countdown' ? timer.state.initialTime : 0;

        const updatedTimers = prev.timers.map((t) =>
          t.id === targetId
            ? {
                ...t,
                state: {
                  ...t.state,
                  status: 'idle' as TimerStatus,
                  currentTime,
                  elapsedTime: 0,
                  startTime: undefined,
                  pausedTime: undefined,
                },
              }
            : t
        );

        return {
          ...prev,
          timers: updatedTimers,
        };
      });
    },
    [timerCollection.activeTimerId]
  );

  // Stop timer (alias for pause)
  const stopTimer = useCallback(
    (timerId?: string) => {
      pauseTimer(timerId);
    },
    [pauseTimer]
  );

  // Initialize timer collection (for loading from Firebase)
  const initializeTimerCollection = useCallback(
    (collection: TimerCollection) => {
      // Clear all existing intervals first
      intervalRefs.current.forEach((intervalId) => {
        clearInterval(intervalId);
      });
      intervalRefs.current.clear();
      startTimeRefs.current.clear();
      pausedTimeRefs.current.clear();

      setTimerCollection(collection);
    },
    []
  );

  // Add new timer
  const addTimer = useCallback(
    (
      name: string,
      duration: number,
      type: TimerType,
      startTime?: string
    ): string => {
      const newId = `timer-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const newOrder =
        Math.max(...timerCollection.timers.map((t) => t.order), 0) + 1;

      const newTimer: Timer = {
        id: newId,
        name,
        state: {
          type,
          status: 'idle',
          currentTime: type === 'countdown' ? duration : 0,
          initialTime: duration,
          elapsedTime: 0,
        },
        order: newOrder,
        startTime,
      };

      setTimerCollection((prev) => ({
        ...prev,
        timers: [...prev.timers, newTimer],
      }));

      return newId;
    },
    [timerCollection.timers]
  );

  // Delete timer
  const deleteTimer = useCallback((timerId: string) => {
    // Clear interval if running
    const intervalId = intervalRefs.current.get(timerId);
    if (intervalId) {
      clearInterval(intervalId);
      intervalRefs.current.delete(timerId);
    }

    // Clear refs
    startTimeRefs.current.delete(timerId);
    pausedTimeRefs.current.delete(timerId);

    setTimerCollection((prev) => {
      const updatedTimers = prev.timers.filter((t) => t.id !== timerId);
      let newActiveId = prev.activeTimerId;

      // If we deleted the active timer, select the first available timer
      if (prev.activeTimerId === timerId) {
        newActiveId = updatedTimers.length > 0 ? updatedTimers[0].id : null;
      }

      return {
        ...prev,
        timers: updatedTimers,
        activeTimerId: newActiveId,
      };
    });
  }, []);

  // Select timer
  const selectTimer = useCallback((timerId: string) => {
    setTimerCollection((prev) => {
      // If selecting the same timer, just return current state
      if (prev.activeTimerId === timerId) {
        return prev;
      }

      // Find the timer being selected
      const timer = prev.timers.find((t) => t.id === timerId);
      if (!timer) return prev;

      // Clear any running intervals for the newly selected timer
      const intervalId = intervalRefs.current.get(timerId);
      if (intervalId) {
        clearInterval(intervalId);
        intervalRefs.current.delete(timerId);
      }

      // Clear refs for the newly selected timer
      startTimeRefs.current.delete(timerId);
      pausedTimeRefs.current.delete(timerId);

      // Reset the newly selected timer to its initial state
      const currentTime =
        timer.state.type === 'countdown' ? timer.state.initialTime : 0;

      const updatedTimers = prev.timers.map((t) =>
        t.id === timerId
          ? {
              ...t,
              state: {
                ...t.state,
                status: 'idle' as TimerStatus,
                currentTime,
                elapsedTime: 0,
                startTime: undefined,
                pausedTime: undefined,
              },
            }
          : t
      );

      return {
        ...prev,
        timers: updatedTimers,
        activeTimerId: timerId,
      };
    });
  }, []);

  // Update timer
  const updateTimer = useCallback(
    (timerId: string, updates: Partial<Timer>) => {
      setTimerCollection((prev) => {
        const updatedTimers = prev.timers.map((t) =>
          t.id === timerId ? { ...t, ...updates } : t
        );

        return {
          ...prev,
          timers: updatedTimers,
        };
      });
    },
    []
  );

  // Update timer time
  const updateTimerTime = useCallback((timerId: string, newTime: number) => {
    setTimerCollection((prev) => {
      const updatedTimers = prev.timers.map((t) =>
        t.id === timerId
          ? {
              ...t,
              state: {
                ...t.state,
                currentTime: newTime,
              },
            }
          : t
      );

      return {
        ...prev,
        timers: updatedTimers,
      };
    });
  }, []);

  // Update timer duration
  const updateTimerDuration = useCallback(
    (timerId: string, newDuration: number) => {
      setTimerCollection((prev) => {
        const updatedTimers = prev.timers.map((t) =>
          t.id === timerId
            ? {
                ...t,
                state: {
                  ...t.state,
                  initialTime: newDuration,
                  currentTime:
                    t.state.type === 'countdown'
                      ? newDuration
                      : t.state.currentTime,
                },
              }
            : t
        );

        return {
          ...prev,
          timers: updatedTimers,
        };
      });
    },
    []
  );

  // Update timer type
  const updateTimerType = useCallback((timerId: string, newType: TimerType) => {
    setTimerCollection((prev) => {
      const timer = prev.timers.find((t) => t.id === timerId);
      if (!timer) return prev;

      // Handle different timer types appropriately
      let newCurrentTime: number;
      switch (newType) {
        case 'countdown':
          newCurrentTime = timer.state.initialTime;
          break;
        case 'countup':
        case 'stopwatch':
        case 'hidden':
          newCurrentTime = 0;
          break;
        default:
          newCurrentTime = 0;
      }

      const updatedTimers = prev.timers.map((t) =>
        t.id === timerId
          ? {
              ...t,
              state: {
                ...t.state,
                type: newType,
                currentTime: newCurrentTime,
                status: 'idle' as TimerStatus,
              },
            }
          : t
      );

      return {
        ...prev,
        timers: updatedTimers,
      };
    });
  }, []);

  // Reorder timers
  const reorderTimers = useCallback((timerIds: string[]) => {
    setTimerCollection((prev) => {
      const reorderedTimers = timerIds
        .map((id, index) => {
          const timer = prev.timers.find((t) => t.id === id);
          return timer ? { ...timer, order: index + 1 } : null;
        })
        .filter(Boolean) as Timer[];

      return {
        ...prev,
        timers: reorderedTimers,
      };
    });
  }, []);

  // Adjust time
  const adjustTime = useCallback((timerId: string, seconds: number) => {
    setTimerCollection((prev) => {
      const timer = prev.timers.find((t) => t.id === timerId);
      if (!timer) return prev;

      const newTime = Math.max(0, timer.state.currentTime + seconds);

      const updatedTimers = prev.timers.map((t) =>
        t.id === timerId
          ? {
              ...t,
              state: {
                ...t.state,
                currentTime: newTime,
              },
            }
          : t
      );

      return {
        ...prev,
        timers: updatedTimers,
      };
    });
  }, []);

  // Helper functions
  const isTimerRunning = useCallback(
    (timerId: string): boolean => {
      const timer = timerCollection.timers.find((t) => t.id === timerId);
      return timer?.state.status === 'running' || false;
    },
    [timerCollection.timers]
  );

  const isTimerPaused = useCallback(
    (timerId: string): boolean => {
      const timer = timerCollection.timers.find((t) => t.id === timerId);
      return timer?.state.status === 'paused' || false;
    },
    [timerCollection.timers]
  );

  const isTimerExpired = useCallback(
    (timerId: string): boolean => {
      const timer = timerCollection.timers.find((t) => t.id === timerId);
      return timer?.state.status === 'expired' || false;
    },
    [timerCollection.timers]
  );

  // Get active timer
  const activeTimer = timerCollection.activeTimerId
    ? timerCollection.timers.find(
        (t) => t.id === timerCollection.activeTimerId
      ) || null
    : null;

  return {
    timers: timerCollection.timers.sort((a, b) => a.order - b.order),
    activeTimer,
    activeTimerId: timerCollection.activeTimerId,
    initializeTimerCollection,
    addTimer,
    deleteTimer,
    selectTimer,
    startTimer,
    pauseTimer,
    resetTimer,
    stopTimer,
    updateTimer,
    updateTimerTime,
    updateTimerDuration,
    updateTimerType,
    reorderTimers,
    adjustTime,
    isTimerRunning,
    isTimerPaused,
    isTimerExpired,
  };
}
