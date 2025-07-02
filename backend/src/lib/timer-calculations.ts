import type { Timer, TimerSession } from '@stage-timer/db';

export interface TimerState {
  currentTime: number;
  isRunning: boolean;
  kickoff: number | null;
  deadline: number | null;
  lastStop: number | null;
  elapsedTime: number;
}

export interface TimerSessionData {
  timerId: number;
  kickoff: number | null;
  deadline: number | null;
  lastStop: number | null;
  status: 'running' | 'paused' | 'stopped';
}

/**
 * Calculate current timer state based on server timestamps and session data
 * This matches the reference implementation's approach with kickoff/deadline timestamps
 */
export function calculateTimerState(
  timer: Timer,
  session: TimerSession | null
): TimerState {
  const now = Date.now();
  
  // If no session exists, timer is in initial state
  if (!session || !session.kickoff) {
    return {
      currentTime: timer.durationMs,
      isRunning: false,
      kickoff: null,
      deadline: null,
      lastStop: null,
      elapsedTime: 0,
    };
  }

  // Calculate elapsed time based on session status
  let elapsedTime: number;
  
  if (session.status === 'running') {
    // Timer is currently running - elapsed time is from kickoff to now
    elapsedTime = now - session.kickoff;
  } else if (session.lastStop) {
    // Timer was stopped/paused - elapsed time is from kickoff to lastStop
    elapsedTime = session.lastStop - session.kickoff;
  } else {
    // Fallback case
    elapsedTime = 0;
  }

  // Ensure elapsed time is not negative
  elapsedTime = Math.max(0, elapsedTime);

  // Calculate current time based on timer appearance type
  let currentTime: number;
  
  switch (timer.appearance) {
    case 'COUNTDOWN':
      // Countdown: start from duration and count down
      currentTime = Math.max(0, timer.durationMs - elapsedTime);
      break;
    case 'COUNTUP':
      // Count up: start from 0 and count up
      currentTime = elapsedTime;
      break;
    case 'TOD':
      // Time of day: show current time
      currentTime = now;
      break;
    case 'HIDDEN':
      // Hidden: don't show time
      currentTime = 0;
      break;
    default:
      currentTime = timer.durationMs - elapsedTime;
  }

  return {
    currentTime,
    isRunning: session.status === 'running',
    kickoff: session.kickoff,
    deadline: session.deadline,
    lastStop: session.lastStop,
    elapsedTime,
  };
}

/**
 * Create a new timer session for starting a timer
 */
export function createTimerSession(timer: Timer): TimerSessionData {
  const now = Date.now();
  const deadline = now + timer.durationMs;

  return {
    timerId: timer.id,
    kickoff: now,
    deadline,
    lastStop: null,
    status: 'running',
  };
}

/**
 * Update timer session for pausing
 * Uses frontend current time if provided for accurate pause/resume
 */
export function pauseTimerSession(
  session: TimerSession,
  requestTimestamp?: number,
  frontendCurrentTime?: number
): Partial<TimerSessionData> {
  const pauseTime = requestTimestamp || Date.now();

  // If frontend provides current time, calculate elapsed time based on that
  // This ensures the resume will continue from exactly where frontend showed
  let elapsedTime = 0;

  if (frontendCurrentTime !== undefined && session.deadline) {
    // For countdown timers: elapsed = total - remaining
    elapsedTime = (session.deadline - session.kickoff!) - frontendCurrentTime;
  } else if (session.kickoff) {
    // Fallback: calculate elapsed time normally
    elapsedTime = pauseTime - session.kickoff;
  }

  // Store the elapsed time by setting lastStop to kickoff + elapsed
  const lastStop = session.kickoff ? session.kickoff + elapsedTime : pauseTime;

  return {
    lastStop,
    status: 'paused',
  };
}

/**
 * Update timer session for resuming from pause
 */
export function resumeTimerSession(
  timer: Timer,
  session: TimerSession
): Partial<TimerSessionData> {
  const now = Date.now();
  
  if (!session.kickoff || !session.lastStop) {
    // If no previous session data, treat as new start
    return createTimerSession(timer);
  }

  // Calculate how much time was remaining when paused
  const elapsedWhenPaused = session.lastStop - session.kickoff;
  const remainingTime = Math.max(0, timer.durationMs - elapsedWhenPaused);
  
  // Set new kickoff and deadline based on remaining time
  const newKickoff = now;
  const newDeadline = now + remainingTime;

  return {
    kickoff: newKickoff,
    deadline: newDeadline,
    lastStop: null,
    status: 'running',
  };
}

/**
 * Reset timer session
 */
export function resetTimerSession(): Partial<TimerSessionData> {
  return {
    kickoff: null,
    deadline: null,
    lastStop: null,
    status: 'stopped',
  };
}

/**
 * Check if timer has expired based on current time
 */
export function isTimerExpired(timer: Timer, session: TimerSession | null): boolean {
  if (!session || !session.deadline || timer.appearance !== 'COUNTDOWN') {
    return false;
  }

  const now = Date.now();
  return now >= session.deadline;
}

/**
 * Get time remaining in milliseconds
 */
export function getTimeRemaining(timer: Timer, session: TimerSession | null): number {
  if (!session || !session.deadline || timer.appearance !== 'COUNTDOWN') {
    return timer.durationMs;
  }

  const now = Date.now();
  return Math.max(0, session.deadline - now);
}

/**
 * Format timer session data for API responses
 * This matches the reference implementation's timeset structure
 */
export function formatTimerSessionResponse(
  timer: Timer,
  session: TimerSession | null
) {
  const state = calculateTimerState(timer, session);

  return {
    timeset: {
      timerId: timer.id.toString(),
      running: state.isRunning,
      kickoff: state.kickoff,
      deadline: state.deadline,
      lastStop: state.lastStop,
      deadlineWarped: null, // For future time adjustment features
    },
    timer: {
      ...timer,
      currentTime: state.currentTime,
      elapsedTime: state.elapsedTime,
      isExpired: isTimerExpired(timer, session),
      timeRemaining: getTimeRemaining(timer, session),
    },
  };
}

/**
 * Format timer session data for play/pause operations (optimized response)
 * Returns only the timeset for better performance
 */
export function formatTimerSessionTimeset(
  timer: Timer,
  session: TimerSession | null
) {
  const state = calculateTimerState(timer, session);

  return {
    timerId: timer.id.toString(),
    running: state.isRunning,
    kickoff: state.kickoff,
    deadline: state.deadline,
    lastStop: state.lastStop,
    deadlineWarped: null,
  };
}
