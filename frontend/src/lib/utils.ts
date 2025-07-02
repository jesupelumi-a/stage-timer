import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  format as formatDateFns,
  parse as parseDateFns,
  addMinutes,
  addMilliseconds,
  isValid,
} from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format time in milliseconds to HH:MM:SS or MM:SS format
 */
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(Math.abs(ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const sign = ms < 0 ? '-' : '';

  if (hours > 0) {
    return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${sign}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}

/**
 * Parse time string (HH:MM:SS or MM:SS) to milliseconds
 */
export function parseTime(timeStr: string): number {
  const parts = timeStr.split(':').map((part) => parseInt(part, 10));

  if (parts.length === 2) {
    // MM:SS format
    const [minutes, seconds] = parts;
    return (minutes * 60 + seconds) * 1000;
  } else if (parts.length === 3) {
    // HH:MM:SS format
    const [hours, minutes, seconds] = parts;
    return (hours * 3600 + minutes * 60 + seconds) * 1000;
  }

  return 0;
}

/**
 * Format duration for display (e.g., "5 minutes", "1 hour 30 minutes")
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  }

  if (minutes > 0) {
    parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  }

  if (seconds > 0 && hours === 0) {
    parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
  }

  if (parts.length === 0) {
    return '0 seconds';
  }

  return parts.join(' ');
}

/**
 * Get relative time string (e.g., "2 minutes ago", "in 5 minutes")
 */
export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = timestamp - now;
  const absDiff = Math.abs(diff);

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return diff > 0
      ? `in ${days} day${days !== 1 ? 's' : ''}`
      : `${days} day${days !== 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return diff > 0
      ? `in ${hours} hour${hours !== 1 ? 's' : ''}`
      : `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return diff > 0
      ? `in ${minutes} minute${minutes !== 1 ? 's' : ''}`
      : `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else {
    return diff > 0 ? 'in a few seconds' : 'a few seconds ago';
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Check if a value is a valid time format (HH:MM:SS or MM:SS)
 */
export function isValidTimeFormat(value: string): boolean {
  const timeRegex = /^(\d{1,2}):([0-5]\d):([0-5]\d)$|^([0-5]?\d):([0-5]\d)$/;
  return timeRegex.test(value);
}

/**
 * Clamp a number between min and max values
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Additional time utilities from old implementation

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
 * Creates a time string for display based on remaining time
 */
export function getDisplayTime(
  currentTime: number,
  _showHours: boolean = true,
  _showMilliseconds: boolean = false
): string {
  // Handle negative time properly
  const isNegative = currentTime < 0;
  const absoluteTime = Math.abs(currentTime);

  // Convert from seconds to milliseconds if needed
  const timeInMs = absoluteTime < 1000000 ? absoluteTime * 1000 : absoluteTime;

  const timeString = formatTime(timeInMs);

  return isNegative ? `-${timeString}` : timeString;
}

// --- Date helpers using date-fns ---

/**
 * Adds minutes to a given Date or time string (12-hour format)
 */
export function addMinutesToTime(time: Date | string, minutes: number): Date {
  let dateObj: Date;
  if (typeof time === 'string') {
    dateObj = parse12HourTime(time);
  } else {
    dateObj = time;
  }
  return addMinutes(dateObj, minutes);
}

/**
 * Formats a Date to 12-hour time string (e.g., '11:45:30 PM')
 */
export function formatTo12Hour(date: Date): string {
  return formatDateFns(date, 'hh:mm:ss a');
}

/**
 * Formats a Date to 12-hour time string, only showing seconds when they're not zero
 * (e.g., '11:45 PM' or '11:45:30 PM')
 */
export function formatTo12HourOptionalSeconds(date: Date): string {
  const seconds = date.getSeconds();
  if (seconds === 0) {
    return formatDateFns(date, 'hh:mm a');
  } else {
    return formatDateFns(date, 'hh:mm:ss a');
  }
}

/**
 * Parses a 12-hour time string (e.g., '11:45:30 PM' or '11:45 PM') to a Date object (today's date)
 */
export function parse12HourTime(timeStr: string): Date {
  // Use today's date for context
  const today = new Date();
  
  // Try parsing with seconds first (HH:MM:SS AM/PM)
  let parsed = parseDateFns(timeStr, 'hh:mm:ss a', today);
  
  // If that fails, try without seconds (HH:MM AM/PM) for backward compatibility
  if (!isValid(parsed)) {
    parsed = parseDateFns(timeStr, 'hh:mm a', today);
  }
  
  return isValid(parsed) ? parsed : today;
}

/**
 * Adds a duration in ms to a start time string (12-hour) and returns a new Date
 */
export function addDurationToStartTime(
  startTime: string,
  durationMs: number
): Date {
  const startDate = parse12HourTime(startTime);
  return addMilliseconds(startDate, durationMs);
}

/**
 * Checks if a string is an ISO date string
 */
function isIsoDateString(str: string): boolean {
  // Simple ISO 8601 check
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d+)?Z?$/.test(str);
}

/**
 * Given a list of timers, returns the correct startTime for a new timer (last timer's startTime + duration)
 * If no timers, returns current time.
 * Assumes timers are sorted in order.
 */
export function getNextTimerStartTime(
  timers: Array<{ startTime?: string | Date; durationMs: number }>
): Date {
  if (!timers || timers.length === 0) {
    return new Date();
  }
  const lastTimer = timers[timers.length - 1];
  if (!lastTimer.startTime) return new Date();
  let lastStart: Date;
  if (typeof lastTimer.startTime === 'string') {
    if (isIsoDateString(lastTimer.startTime)) {
      lastStart = new Date(lastTimer.startTime);
    } else {
      lastStart = parse12HourTime(lastTimer.startTime);
    }
  } else {
    lastStart = lastTimer.startTime;
  }
  return addMilliseconds(lastStart, lastTimer.durationMs);
}
