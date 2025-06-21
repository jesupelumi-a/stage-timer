import type { TimeDisplay } from '../types';

/**
 * Converts seconds to a TimeDisplay object
 */
export function secondsToTimeDisplay(totalSeconds: number): TimeDisplay {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.floor((totalSeconds % 1) * 1000);

  return {
    hours,
    minutes,
    seconds,
    milliseconds,
  };
}

/**
 * Formats time display as a string
 */
export function formatTimeDisplay(
  timeDisplay: TimeDisplay,
  options: {
    showHours?: boolean;
    showMilliseconds?: boolean;
    padHours?: boolean;
  } = {}
): string {
  const {
    showHours = true,
    showMilliseconds = false,
    padHours = true,
  } = options;

  const { hours, minutes, seconds, milliseconds } = timeDisplay;

  let formatted = '';

  if (showHours && (hours > 0 || padHours)) {
    formatted += hours.toString().padStart(2, '0') + ':';
  }

  formatted += minutes.toString().padStart(2, '0') + ':';
  formatted += seconds.toString().padStart(2, '0');

  if (showMilliseconds && milliseconds !== undefined) {
    formatted += '.' + milliseconds.toString().padStart(3, '0');
  }

  return formatted;
}

/**
 * Formats seconds directly as a time string
 */
export function formatTime(
  totalSeconds: number,
  options: {
    showHours?: boolean;
    showMilliseconds?: boolean;
    padHours?: boolean;
  } = {}
): string {
  const timeDisplay = secondsToTimeDisplay(totalSeconds);
  return formatTimeDisplay(timeDisplay, options);
}

/**
 * Parses a time string (MM:SS or HH:MM:SS) into total seconds
 */
export function parseTimeString(timeString: string): number {
  const parts = timeString.split(':').map((part) => parseInt(part, 10));

  if (parts.length === 2) {
    // MM:SS format
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  } else if (parts.length === 3) {
    // HH:MM:SS format
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  throw new Error('Invalid time format. Use MM:SS or HH:MM:SS');
}

/**
 * Gets the current time as a formatted string
 */
export function getCurrentTime(format: '12h' | '24h' = '12h'): string {
  const now = new Date();

  if (format === '12h') {
    return now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } else {
    return now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
}

/**
 * Gets the current date as a formatted string
 */
export function getCurrentDate(): string {
  const now = new Date();
  return now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Calculates the elapsed time since a given timestamp
 */
export function getElapsedTime(startTime: number): number {
  return (Date.now() - startTime) / 1000;
}

/**
 * Validates if a time value is valid (non-negative)
 */
export function isValidTime(seconds: number): boolean {
  return typeof seconds === 'number' && seconds >= 0 && !isNaN(seconds);
}

/**
 * Converts minutes to seconds
 */
export function minutesToSeconds(minutes: number): number {
  return minutes * 60;
}

/**
 * Converts hours to seconds
 */
export function hoursToSeconds(hours: number): number {
  return hours * 3600;
}

/**
 * Creates a time string for display based on remaining time
 */
export function getDisplayTime(
  currentTime: number,
  showHours: boolean = true,
  showMilliseconds: boolean = false
): string {
  // Handle negative time properly
  const isNegative = currentTime < 0;
  const absoluteTime = Math.abs(currentTime);

  const timeString = formatTime(absoluteTime, {
    showHours,
    showMilliseconds,
    padHours: false,
  });

  return isNegative ? `-${timeString}` : timeString;
}
