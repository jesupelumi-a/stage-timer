import { useEffect, useState, useRef, useMemo } from 'react';
import { formatTime, getCurrentTime, getDisplayTime, cn } from '../lib/utils';
import { MdFullscreen, MdFullscreenExit } from 'react-icons/md';
import { Button } from '@heroui/react';
import whiteLogo from '../assets/white-logo.png';
import type { Timer } from '@stage-timer/db';
import { useGlobalTimerState } from '../hooks/use-global-timer-state';

interface TimerPreviewProps {
  timer: Timer;
  timerName?: string;
  currentMessage?: { text: string } | null;
  isExpired?: boolean;
  className?: string;
  isActive?: boolean;
  showControls?: boolean;
  displayMode?: 'preview' | 'display'; // 'preview' for control interface, 'display' for TV
  onToggleFullscreen?: () => void; // Optional fullscreen toggle function
  // Server-calculated timer state (when available)
  serverTimerState?: {
    currentTime: number;
    isRunning: boolean;
    kickoff: number | null;
    deadline: number | null;
    lastStop: number | null;
    elapsedTime: number;
  };
}

export function TimerPreview({
  timer,
  timerName,
  currentMessage,
  className = '',
  isActive = false,
  displayMode = 'preview',
  onToggleFullscreen,
  serverTimerState,
}: TimerPreviewProps) {
  // Use global timer state for real-time updates (single event listener)
  const { getRealTimeCurrentTime, isTimerActive, isTimerRunning } = useGlobalTimerState(timer.roomId);

  const [clockTime, setClockTime] = useState(getCurrentTime('12h'));
  const [, setForceUpdate] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 400,
    height: 225,
  });

  // Force re-render for real-time updates
  const [updateCounter, setUpdateCounter] = useState(0);

  // Determine if this timer is active and running using WebSocket state
  const isActiveTimer = isTimerActive(timer.id);
  const isRunningTimer = isTimerRunning(timer.id);

  // Get current time using WebSocket sync - recalculates on every update for active timers
  const currentTime = useMemo(() => {
    if (isActiveTimer) {
      const realTime = getRealTimeCurrentTime(timer);
      // If timer is stopped/reset and shows 0, use the timer's duration instead
      if (realTime <= 0 && !isRunningTimer) {
        return timer.durationMs;
      }
      return realTime;
    }
    return timer.durationMs;
  }, [isActiveTimer, getRealTimeCurrentTime, timer, isRunningTimer, updateCounter]);

  // Track fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Update current time every second
  useEffect(() => {
    const updateClockTime = () => {
      setClockTime(getCurrentTime('12h'));
    };

    // Update immediately
    updateClockTime();

    // Update every second
    const interval = setInterval(updateClockTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // Real-time updates for running timers
  useEffect(() => {
    // Only update if this specific timer is both active AND running
    if (!isActiveTimer || !isRunningTimer) return;

    const interval = setInterval(() => {
      // Force re-render to update the display time
      setUpdateCounter(prev => prev + 1);
    }, 100);

    return () => clearInterval(interval);
  }, [isActiveTimer, isRunningTimer]);

  // Update timer text every second for stopwatch (Time of Day) type
  useEffect(() => {
    if (timer.appearance === 'TOD') {
      // Force re-render every second for live time updates
      const interval = setInterval(() => {
        setForceUpdate((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timer.appearance]);

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

  // No additional useEffect needed - WebSocket sync handles everything!

  // Calculate progress percentage (allow negative for overtime)
  const progressPercentage =
    timer.durationMs > 0
      ? Math.min(100, (currentTime / timer.durationMs) * 100)
      : 0;

  // Get timer display text - use same logic as TimerCard for consistency
  const getTimerText = () => {
    if (timer.appearance === 'HIDDEN') {
      // For "Hidden", return empty string to hide the timer text
      return '';
    }

    if (timer.appearance === 'TOD') {
      // For "Time of Day", show current time in hour:minutes:seconds format
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');

      // Convert to 12-hour format
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

      return `${displayHours}:${minutes}:${seconds}`;
    }

    // For countdown timers, calculate the remaining time directly from currentTime
    if (timer.appearance === 'COUNTDOWN') {
      return getDisplayTime(currentTime / 1000, true, false);
    }

    // For countup timers
    if (timer.appearance === 'COUNTUP') {
      const elapsedTime = timer.durationMs - currentTime;
      return getDisplayTime(elapsedTime / 1000, true, false);
    }

    // Default
    return formatTime(currentTime);
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
      baseFontSize *= 0.7; // Reduce by 30% when showing hours
    }

    // Different min/max values for display mode
    const minSize = displayMode === 'display' ? 32 : 16;
    const maxSize = displayMode === 'display' ? 400 : 200;

    // Clamp between reasonable min/max values
    return Math.min(Math.max(baseFontSize, minSize), maxSize);
  };

  const responsiveFontSize = getResponsiveFontSize();
  const timerText = getTimerText();

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
            isActive && isRunningTimer && displayMode === 'preview'
              ? 'border-red-500'
              : 'border-neutral-800',
            'bg-[#1D1918] text-white'
          )}
        >
          {/* Header with timer name and current time */}
          <div className="relative flex h-[8%] items-start justify-between p-3">
            {/* App Icon (White Logo) in top left */}
            <div className="absolute left-4 top-4">
              <img
                src={whiteLogo}
                alt="App Icon"
                className={cn(
                  displayMode === 'display' ? 'size-12' : 'h-6 w-6'
                )}
              />
            </div>

            {/* Timer Name */}
            <div className="absolute left-1/2 top-4 -translate-x-1/2 text-left">
              {(timerName || timer.name) && (
                <div
                  className={cn(
                    'font-bold text-cyan-500',
                    displayMode === 'display' ? 'text-3xl' : 'text-sm'
                  )}
                >
                  {timerName || timer.name}
                </div>
              )}
            </div>

            {/* Current Time */}
            <div className="absolute right-4 top-4 flex items-center gap-2 text-right">
              <div
                className={cn(
                  'font-bold',
                  displayMode === 'display' ? 'text-3xl' : 'text-sm'
                )}
              >
                {clockTime}
              </div>
            </div>
          </div>

          {/* Main timer display - takes up most space */}
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">
            <div className="w-full text-center">
              {timer.appearance !== 'HIDDEN' && (
                <div
                  className={cn(
                    'text-center font-black leading-none text-white',
                    timer.appearance === 'COUNTDOWN' &&
                      currentTime < 0 &&
                      'text-red-500'
                  )}
                  style={{
                    fontSize: `${responsiveFontSize}px`,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {timerText}
                </div>
              )}
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
          <div
            className={cn(
              'h-[8%] overflow-hidden bg-gray-300 opacity-0 transition-opacity duration-200',
              (timer.appearance === 'COUNTDOWN' ||
                timer.appearance === 'COUNTUP') &&
                'opacity-100' // Show progress bar for countdown and countup timers
            )}
          >
            {/* Segmented progress bar with three color sections */}
            <div className="relative h-full w-full">
              {/* Green section (80%) */}
              <div className="absolute left-0 top-0 h-full w-[85%] bg-green-500"></div>
              {/* Yellow section (15%) */}
              <div className="absolute left-[85%] top-0 h-full w-[10%] bg-amber-500"></div>
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

          {/* Fullscreen toggle button - only show in display mode */}
          {displayMode === 'display' && onToggleFullscreen && (
            <Button
              isIconOnly
              onPress={onToggleFullscreen}
              className={cn(
                'absolute bottom-4 right-4 z-10 transition-all duration-200 hover:scale-110',
                'bg-[#1D1918] text-white backdrop-blur-sm hover:bg-black/50'
              )}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <MdFullscreenExit
                  className={cn(
                    displayMode === 'display' ? 'size-8' : 'size-6'
                  )}
                />
              ) : (
                <MdFullscreen
                  className={cn(
                    displayMode === 'display' ? 'size-8' : 'size-6'
                  )}
                />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
