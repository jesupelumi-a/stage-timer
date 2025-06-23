import { cn } from '../lib/utils';
import type { TimerState, Message, DisplaySettings } from '../types';
import { getCurrentTime, getDisplayTime } from '../utils/time';
import { useEffect, useState, useRef } from 'react';
import { MdFullscreen, MdFullscreenExit } from 'react-icons/md';
import whiteLogo from '../assets/white-logo.png';

interface TimerPreviewProps {
  timer: TimerState;
  timerName?: string;
  currentMessage: Message | null;
  settings: DisplaySettings;
  isExpired: boolean;
  isActive?: boolean;
  className?: string;
  displayMode?: 'preview' | 'display'; // 'preview' for control interface, 'display' for TV
  onToggleFullscreen?: () => void; // Optional fullscreen toggle function
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
  onToggleFullscreen,
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
    const updateCurrentTime = () => {
      setCurrentTime(getCurrentTime(settings.timeFormat));
    };

    // Update immediately
    updateCurrentTime();

    // Update every second
    const interval = setInterval(updateCurrentTime, 1000);

    return () => clearInterval(interval);
  }, [settings.timeFormat]);

  // Update timer text every second for stopwatch (Time of Day) type
  const [forceUpdate, setForceUpdate] = useState(0);

  useEffect(() => {
    if (timer.type === 'stopwatch') {
      // Force re-render every second for live time updates
      const interval = setInterval(() => {
        setForceUpdate((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timer.type]);

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

  // Get timer display text - use same logic as TimerCard for consistency
  const getTimerText = () => {
    if (timer.type === 'hidden') {
      // For "Hidden", return empty string to hide the timer text
      return '';
    }

    if (timer.type === 'stopwatch') {
      // For "Time of Day", show current time in hour:minutes:seconds format
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');

      // Convert to 12-hour format
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

      return `${displayHours}:${minutes}:${seconds}`;
    }

    // For countdown timers, calculate the remaining time directly from elapsedTime and initialTime
    // This allows negative values to be displayed when the timer has expired
    if (timer.type === 'countdown') {
      const remainingTime = timer.initialTime - timer.elapsedTime;
      return getDisplayTime(remainingTime, true, false);
    }

    // For other timer types, use currentTime
    return getDisplayTime(timer.currentTime, true, false);
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
      baseFontSize *= 0.7; // Reduce by 25% when showing hours
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
  // Use same logic as TimerCard for consistency
  const getProgressPercentage = () => {
    if (timer.type !== 'countdown' || timer.initialTime <= 0) return 100;
    // Use currentTime directly for consistency with TimerCard
    const progress = (timer.currentTime / timer.initialTime) * 100;
    return Math.max(0, Math.min(100, progress));
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
            isActive && timer.status === 'running' && displayMode === 'preview'
              ? 'border-red-500'
              : 'border-neutral-800',
            isDarkTheme ? 'bg-[#1D1918] text-white' : 'bg-white text-gray-900'
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
            {/* Logo and Current Time */}
            <div className="absolute right-4 top-4 flex items-center gap-2 text-right">
              {/* Logo */}
              <svg
                width={displayMode === 'display' ? '40' : '24'}
                height={displayMode === 'display' ? '40' : '24'}
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={cn(
                  'opacity-60',
                  isDarkTheme ? 'text-white' : 'text-gray-600'
                )}
              >
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                />
                <circle cx="50" cy="50" r="3" fill="currentColor" />
                <line
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="50"
                  y1="50"
                  x2="70"
                  y2="50"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <text
                  x="50"
                  y="85"
                  textAnchor="middle"
                  fontFamily="Arial, sans-serif"
                  fontSize="8"
                  fill="currentColor"
                >
                  TIMER
                </text>
              </svg>

              {/* Current Time */}
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
              {timer.type !== 'hidden' && (
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

          {/* Fullscreen toggle button - only show in display mode */}
          {displayMode === 'display' && onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className={cn(
                'absolute bottom-4 right-4 z-10 rounded-lg p-2 transition-all duration-200 hover:scale-110',
                isDarkTheme
                  ? 'bg-[#1D1918] text-white hover:bg-black/50'
                  : 'bg-white/30 text-gray-900 hover:bg-white/50',
                'backdrop-blur-sm'
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
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
