import React from 'react';
import type {
  TimerState,
  Message,
  AppSettings,
  DisplaySettings,
} from '../types';
import { getDisplayTime, getCurrentTime, getCurrentDate } from '../utils/time';
import { MessageDisplay } from './MessageDisplay';

interface DisplayViewProps {
  timer: TimerState;
  currentMessage: Message | null;
  settings: AppSettings;
  isExpired: boolean;
  className?: string;
}

export function DisplayView({
  timer,
  currentMessage,
  settings,
  isExpired,
  className = '',
}: DisplayViewProps) {
  const isDarkTheme = settings.display.theme === 'dark';

  // Get timer display text
  const timerText = getDisplayTime(
    timer.currentTime,
    true, // show hours
    settings.display.showSeconds
  );

  // Get current time and date
  const currentTime = getCurrentTime(settings.display.timeFormat);
  const currentDate = getCurrentDate();

  // Determine timer status for styling
  const getTimerStatusClass = () => {
    if (isExpired && settings.timer.flashOnExpiry) {
      return 'animate-flash text-red-500';
    }

    switch (timer.status) {
      case 'running':
        return 'text-green-400';
      case 'paused':
        return 'text-yellow-400';
      case 'expired':
        return 'text-red-500';
      default:
        return isDarkTheme ? 'text-white' : 'text-gray-900';
    }
  };

  // Get font size class based on settings
  const getFontSizeClass = () => {
    switch (settings.display.fontSize) {
      case 'small':
        return 'text-8xl md:text-9xl lg:text-10xl';
      case 'medium':
        return 'text-9xl md:text-10xl lg:text-11xl';
      case 'large':
        return 'text-10xl md:text-11xl lg:text-12xl';
      case 'xlarge':
        return 'text-11xl md:text-12xl lg:text-[16rem]';
      default:
        return 'text-10xl md:text-11xl lg:text-12xl';
    }
  };

  return (
    <div
      className={`display-view flex h-screen w-screen flex-col ${isDarkTheme ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} ${className} `}
    >
      {/* Header with current time and date */}
      <div className="flex items-start justify-between p-6 lg:p-8">
        <div className="text-left">
          {settings.display.showDate && (
            <div className="text-lg font-medium opacity-80 lg:text-2xl">
              {currentDate}
            </div>
          )}
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold lg:text-4xl">{currentTime}</div>
        </div>
      </div>

      {/* Main timer display */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 lg:px-8">
        <div className="space-y-8 text-center">
          {/* Timer */}
          <div
            className={`font-mono font-bold leading-none ${getFontSizeClass()} ${getTimerStatusClass()}`}
          >
            {timerText}
          </div>

          {/* Progress bar for countdown timers */}
          {timer.type === 'countdown' && timer.initialTime > 0 && (
            <div className="mx-auto w-full max-w-2xl">
              <div className="h-2 overflow-hidden rounded-full bg-gray-300 lg:h-4">
                <div
                  className={`h-full transition-all duration-300 ${(() => {
                    if (isExpired) return 'bg-red-500';
                    const elapsedPercentage = Math.max(
                      0,
                      Math.min(
                        100,
                        ((timer.initialTime - timer.currentTime) /
                          timer.initialTime) *
                          100
                      )
                    );
                    if (elapsedPercentage >= 95) return 'bg-red-500'; // Last 5%
                    if (elapsedPercentage >= 80) return 'bg-amber-500'; // 15% (80-95%)
                    return 'bg-green-500'; // First 80%
                  })()}`}
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        ((timer.initialTime - timer.currentTime) /
                          timer.initialTime) *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message display area */}
      {currentMessage && (
        <div className="absolute inset-x-0 bottom-20 px-6 lg:bottom-32 lg:px-8">
          <MessageDisplay
            message={currentMessage}
            className="message-display"
          />
        </div>
      )}

      {/* Footer with subtle branding */}
      <div className="p-6 !pb-0 text-center lg:p-8">
        <div className="text-sm opacity-50 lg:text-lg">TWH Media</div>
      </div>
    </div>
  );
}

interface ClockDisplayProps {
  settings: DisplaySettings;
  className?: string;
}

export function ClockDisplay({ settings, className = '' }: ClockDisplayProps) {
  const [currentTime, setCurrentTime] = React.useState(
    getCurrentTime(settings.timeFormat)
  );
  const [currentDate, setCurrentDate] = React.useState(getCurrentDate());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime(settings.timeFormat));
      setCurrentDate(getCurrentDate());
    }, 1000);

    return () => clearInterval(interval);
  }, [settings.timeFormat]);

  const isDarkTheme = settings.theme === 'dark';

  return (
    <div
      className={`clock-display flex h-screen w-screen flex-col items-center justify-center ${isDarkTheme ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} ${className} `}
    >
      <div className="space-y-8 text-center">
        <div className="font-mono text-10xl font-bold md:text-11xl lg:text-12xl">
          {currentTime}
        </div>

        {settings.showDate && (
          <div className="text-2xl font-medium opacity-80 lg:text-4xl">
            {currentDate}
          </div>
        )}
      </div>
    </div>
  );
}
