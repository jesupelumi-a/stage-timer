import { useState, useEffect, useCallback } from 'react';
import { socketClient } from '../lib/socket-client';

interface GlobalTimerState {
  timerId: number | null;
  isRunning: boolean;
  currentTime: number;
  kickoff: number | null;
  deadline: number | null;
  status: 'running' | 'paused' | 'stopped';
  lastUpdated: number;
}

// Global state - single instance
let globalTimerState: GlobalTimerState = {
  timerId: null,
  isRunning: false,
  currentTime: 0,
  kickoff: null,
  deadline: null,
  status: 'stopped',
  lastUpdated: Date.now(),
};

// Frontend broadcasting handles pause events directly

// Subscribers for state changes
const subscribers = new Set<(state: GlobalTimerState) => void>();

// Global state updater
const updateGlobalTimerState = (newState: Partial<GlobalTimerState>) => {
  globalTimerState = { ...globalTimerState, ...newState, lastUpdated: Date.now() };
  subscribers.forEach(callback => callback(globalTimerState));
};

// Event handlers (only set up once)
let eventHandlersSetup = false;

const setupEventHandlers = () => {
  if (eventHandlersSetup) return;
  eventHandlersSetup = true;

  console.log('🔧 [GlobalTimerState] Setting up event handlers');

  // Handle timer started event
  const handleTimerStarted = (data: any) => {
    console.log('🚀 [GlobalTimerState] Timer started:', data);

    if (data.sessionData?.timeset) {
      updateGlobalTimerState({
        timerId: data.timerId,
        isRunning: true,
        currentTime: data.sessionData.timer.currentTime || 0,
        kickoff: data.sessionData.timeset.kickoff || null,
        deadline: data.sessionData.timeset.deadline || null,
        status: 'running',
      });
    }
  };

  // Handle timer paused event - DISABLED since we use frontend broadcasting for pause
  const handleTimerPaused = () => {
    console.log('⏸️ [GlobalTimerState] Ignoring backend pause event - using frontend broadcast instead');
    // We ignore backend pause events since frontend broadcasting handles this
    return;
  };

  // Handle timer stopped/reset event
  const handleTimerStopped = (data: any) => {
    console.log('⏹️ [GlobalTimerState] Timer stopped:', data);
    updateGlobalTimerState({
      timerId: data.timerId,
      isRunning: false,
      currentTime: 0,
      kickoff: null,
      deadline: null,
      status: 'stopped',
    });
  };

  // Handle timer reset event
  const handleTimerReset = (data: any) => {
    console.log('🔄 [GlobalTimerState] Timer reset:', data);
    updateGlobalTimerState({
      timerId: data.timerId,
      isRunning: false,
      currentTime: 0,
      kickoff: null,
      deadline: null,
      status: 'stopped',
    });
  };

  // Handle timer updated event
  const handleTimerUpdated = (data: any) => {
    console.log('🔄 [GlobalTimerState] Timer updated:', data);
    if (data.sessionData?.timeset) {
      updateGlobalTimerState({
        timerId: data.timerId,
        currentTime: data.sessionData.timer.currentTime || globalTimerState.currentTime,
        kickoff: data.sessionData.timeset.kickoff || globalTimerState.kickoff,
        deadline: data.sessionData.timeset.deadline || globalTimerState.deadline,
      });
    }
  };

  // Setup WebSocket listeners
  socketClient.on('timer-started', handleTimerStarted);
  socketClient.on('timer-paused', handleTimerPaused);
  socketClient.on('timer-stopped', handleTimerStopped);
  socketClient.on('timer-reset', handleTimerReset);
  socketClient.on('timer-updated', handleTimerUpdated);
};

/**
 * Hook for global timer state synchronization
 * Only one instance of event listeners, shared state across all components
 */
export function useGlobalTimerState(roomId?: number) {
  const [timerState, setTimerState] = useState<GlobalTimerState>(globalTimerState);

  // Setup event handlers on first use
  useEffect(() => {
    setupEventHandlers();
  }, []);

  // Subscribe to state changes and setup frontend event listeners
  useEffect(() => {
    const handleStateChange = (newState: GlobalTimerState) => {
      // Only update if this is for the current room (if roomId is specified)
      if (roomId && newState.timerId) {
        // We don't have roomId in the state, so we'll update regardless for now
        // In a real app, you'd want to include roomId in the global state
      }
      setTimerState(newState);
    };

    // Handle frontend-broadcast pause events (for instant multi-controller sync)
    const handleFrontendTimerPause = (data: any) => {
      console.log('⚡ [Frontend-Broadcast] Timer pause received:', data);

      // Only process events for the current room (if roomId is specified)
      if (roomId && data.roomId !== roomId) {
        console.log('⚡ [Frontend-Broadcast] Ignoring event from different room');
        return;
      }

      // Ignore events from self (sender already updated locally)
      if (data.senderId && data.senderId === socketClient.getSocketId()) {
        console.log('⚡ [Frontend-Broadcast] Ignoring event from self');
        return;
      }

      if (data.timerId && data.currentTime !== undefined) {
        console.log('⚡ [Frontend-Broadcast] Updating timer state:', data.timerId, 'to paused at', data.currentTime);
        updateGlobalTimerState({
          timerId: data.timerId,
          isRunning: false,
          status: 'paused',
          currentTime: data.currentTime,
        });
      }
    };

    subscribers.add(handleStateChange);
    socketClient.on('frontend-timer-pause', handleFrontendTimerPause);

    // Set initial state
    setTimerState(globalTimerState);

    return () => {
      subscribers.delete(handleStateChange);
      socketClient.off('frontend-timer-pause', handleFrontendTimerPause);
    };
  }, [roomId]);

  // Calculate real-time current time for running timers
  const getRealTimeCurrentTime = useCallback((timer: { durationMs: number; appearance: string }) => {
    if (!timerState.isRunning) {
      return timerState.currentTime;
    }

    const now = Date.now();
    let calculatedTime;

    if (timer.appearance === 'COUNTDOWN') {
      // For countdown: use deadline if available (handles pause/resume correctly)
      if (timerState.deadline) {
        calculatedTime = Math.max(0, timerState.deadline - now);
      } else if (timerState.kickoff) {
        // Fallback to kickoff calculation
        const elapsed = now - timerState.kickoff;
        calculatedTime = Math.max(0, timer.durationMs - elapsed);
      } else {
        calculatedTime = timerState.currentTime;
      }
    } else if (timer.appearance === 'COUNTUP') {
      // For countup: use elapsed time from kickoff
      if (timerState.kickoff) {
        calculatedTime = now - timerState.kickoff;
      } else {
        calculatedTime = timerState.currentTime;
      }
    } else {
      calculatedTime = timer.durationMs;
    }

    return calculatedTime;
  }, [timerState]);

  // Check if a specific timer is the active one
  const isTimerActive = useCallback((timerId: number) => {
    return timerState.timerId === timerId;
  }, [timerState.timerId]);

  // Check if a specific timer is running
  const isTimerRunning = useCallback((timerId: number) => {
    return timerState.timerId === timerId && timerState.isRunning;
  }, [timerState.timerId, timerState.isRunning]);

  // Note: Pause is handled by frontend broadcasting, not optimistic updates

  // Optimistic reset function
  const optimisticReset = useCallback((timerId: number, timerDurationMs: number) => {
    console.log('🔄 [Optimistic] Resetting timer:', timerId);
    updateGlobalTimerState({
      timerId: timerId,
      isRunning: false,
      status: 'stopped',
      currentTime: timerDurationMs, // Reset to full duration
      kickoff: null,
      deadline: null,
    });
  }, []);

  // Manual state update function for immediate local updates
  const manualPause = useCallback((timerId: number, currentTime: number) => {
    console.log('🔄 [Manual] Pausing timer locally:', timerId, 'at currentTime:', currentTime);
    updateGlobalTimerState({
      timerId: timerId,
      isRunning: false,
      status: 'paused',
      currentTime: currentTime,
    });
  }, []);

  // Initialize global timer state with session data
  const initializeFromSession = useCallback((sessionData: {
    timerId: number;
    isRunning: boolean;
    currentTime: number;
    kickoff?: number;
    deadline?: number;
    status: 'running' | 'paused' | 'stopped';
  }) => {
    console.log('🔄 [Initialize] Setting global timer state from session:', sessionData);
    updateGlobalTimerState({
      timerId: sessionData.timerId,
      isRunning: sessionData.isRunning,
      currentTime: sessionData.currentTime,
      kickoff: sessionData.kickoff || null,
      deadline: sessionData.deadline || null,
      status: sessionData.status,
    });
  }, []);

  return {
    timerState,
    getRealTimeCurrentTime,
    isTimerActive,
    isTimerRunning,
    optimisticReset,
    manualPause,
    initializeFromSession,
  };
}
