import { cn } from '../lib/utils';
import type { TimerState, Message, DisplaySettings } from '../types';
import { getCurrentTime, getDisplayTime } from '../utils/time';
import { useEffect, useState, useRef } from 'react';

interface TimerPreviewProps {
  timer: TimerState;
  timerName?: string;
  currentMessage: Message | null;
  settings: DisplaySettings;
  isExpired: boolean;
  isActive?: boolean;
  className?: string;
  displayMode?: 'preview' | 'display'; // 'preview' for control interface, 'display' for TV
}

export function TimerPreview({
  timer,
  timerName,
  currentMessage,
  settings,
  isExpired,
  isActive = false,
  className = '',
  displayMode = 'preview',
}: TimerPreviewProps) {
  const isDarkTheme = settings.theme === 'dark';
  const [currentTime, setCurrentTime] = useState(
    getCurrentTime(settings.timeFormat)
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 400,
    height: 225,
  });

  // Update current time every second
  useEffect(() => {
    const updateCurrentTime = () => {
      setCurrentTime(getCurrentTime(settings.timeFormat));
    };

    // Update immediately
    updateCurrentTime();

    // Update every second
    const interval = setInterval(updateCurrentTime, 1000);

    return () => clearInterval(interval);
  }, [settings.timeFormat]);

  // Track container size for responsive font sizing
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateContainerSize();

    const resizeObserver = new ResizeObserver(() => {
      updateContainerSize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Also listen to window resize for immediate updates
    window.addEventListener('resize', updateContainerSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateContainerSize);
    };
  }, []);

  // Get timer display text
  const getTimerText = () => {
    if (timer.type === 'stopwatch') {
      // For "Time of Day", show current time in 12-hour format
      return getCurrentTime('12h');
    }

    if (timer.type === 'countdown') {
      // For countdown: calculate display time based on duration - elapsed time
      const displayTime = timer.initialTime - timer.elapsedTime;
      return getDisplayTime(displayTime, true, false);
    }

    // For countup, use elapsed time directly
    return getDisplayTime(timer.elapsedTime, true, false);
  };

  // Calculate responsive font size based on container dimensions
  const getResponsiveFontSize = () => {
    // Different scaling factors for preview vs display mode
    const scaleFactor = displayMode === 'display' ? 0.6 : 0.4; // Larger fonts for TV display

    // Calculate based on both width and height for better responsiveness
    const widthBasedSize = containerDimensions.width * scaleFactor;
    const heightBasedSize = containerDimensions.height * scaleFactor;

    // Use the smaller of the two to ensure text always fits
    let baseFontSize = Math.min(widthBasedSize, heightBasedSize);

    // Reduce font size when hours are showing (HH:MM:SS vs MM:SS)
    const timerText = getTimerText();
    const hasHours =
      timerText.includes(':') && timerText.split(':').length === 3;

    if (hasHours) {
      baseFontSize *= 0.75; // Reduce by 25% when showing hours
    }

    // Different min/max values for display mode
    const minSize = displayMode === 'display' ? 32 : 16;
    const maxSize = displayMode === 'display' ? 400 : 200;

    // Clamp between reasonable min/max values
    return Math.min(Math.max(baseFontSize, minSize), maxSize);
  };

  const responsiveFontSize = getResponsiveFontSize();

  const timerText = getTimerText();

  // Calculate progress percentage for countdown (0% = depleted, 100% = full)
  const getProgressPercentage = () => {
    if (timer.type !== 'countdown' || timer.initialTime <= 0) return 100;
    // Calculate the display time (duration - elapsed time)
    const displayTime = timer.initialTime - timer.elapsedTime;
    // When timer goes negative, show 0% (fully depleted)
    if (displayTime <= 0) return 0;
    return Math.max(0, Math.min(100, (displayTime / timer.initialTime) * 100));
  };

  const progressPercentage = getProgressPercentage();

  return (
    <div
      className={`timer-preview h-full w-full ${className}`}
      ref={containerRef}
    >
      {/* Fixed dimensions container - no aspect ratio needed */}
      <div className="relative h-full w-full">
        <div
          className={cn(
            'absolute inset-0 flex flex-col overflow-hidden rounded-md border-2',
            isActive && timer.status === 'running'
              ? 'border-red-500'
              : 'border-neutral-800',
            isDarkTheme ? 'bg-[#1D1918] text-white' : 'bg-white text-gray-900'
          )}
        >
          {/* Header with timer name and current time */}
          <div className="relative flex h-[8%] items-start justify-between p-3">
            {/* Timer Name */}
            <div className="absolute left-1/2 top-4 -translate-x-1/2 text-left">
              {timerName && (
                <div
                  className={cn(
                    'font-bold',
                    displayMode === 'display' ? 'text-3xl' : 'text-sm'
                  )}
                >
                  {timerName}
                </div>
              )}
            </div>
            {/* Current Time */}
            <div className="absolute right-4 top-4 text-right">
              <div
                className={cn(
                  'font-bold',
                  displayMode === 'display' ? 'text-3xl' : 'text-sm'
                )}
              >
                {currentTime}
              </div>
            </div>
          </div>

          {/* Main timer display - takes up most space */}
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">
            <div className="w-full text-center">
              <div
                className={cn(
                  'text-center font-black leading-none',
                  isDarkTheme ? 'text-white' : 'text-gray-900',
                  timer.type === 'countdown' &&
                    timer.initialTime - timer.elapsedTime < 0 &&
                    'text-red-500'
                )}
                style={{
                  fontSize: `${responsiveFontSize}px`,
                  letterSpacing: '-0.02em',
                }}
              >
                {timerText}
              </div>
            </div>
          </div>

          {/* Message display area */}
          {currentMessage && (
            <div className="px-4 pb-2">
              <div className="mx-auto max-w-full rounded bg-black/20 px-2 py-1 backdrop-blur-sm">
                <p className="line-clamp-2 overflow-hidden break-words text-center text-xs leading-tight text-white">
                  {currentMessage.text}
                </p>
              </div>
            </div>
          )}

          {/* Progress bar for countdown timers - at the bottom */}
          {timer.type === 'countdown' && timer.initialTime > 0 && (
            <div className="h-[8%] overflow-hidden bg-gray-300">
              {/* Segmented progress bar with three color sections */}
              <div className="relative h-full w-full">
                {/* Green section (80%) */}
                <div className="absolute left-0 top-0 h-full w-[80%] bg-green-500"></div>
                {/* Yellow section (15%) */}
                <div className="absolute left-[80%] top-0 h-full w-[15%] bg-amber-500"></div>
                {/* Red section (5%) */}
                <div className="absolute left-[95%] top-0 h-full w-[5%] bg-red-500"></div>

                {/* Progress overlay that covers from left, showing depletion from left to right */}
                <div
                  className="absolute left-0 top-0 h-full bg-[#262A25] transition-all duration-75 ease-out"
                  style={{
                    width: `${100 - progressPercentage}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
