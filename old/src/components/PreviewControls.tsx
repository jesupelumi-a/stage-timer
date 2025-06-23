import { useState, useEffect, useRef } from 'react';
import { cn } from '../lib/utils';
import { IoCaretDown } from 'react-icons/io5';
import {
  MdArrowBackIosNew,
  MdPause,
  MdPlayArrow,
  MdSkipNext,
  MdSkipPrevious,
} from 'react-icons/md';
import type { Timer } from '../types';

interface PreviewControlsProps {
  timers: Timer[];
  activeTimerId: string | null;
  onSelectTimer: (timerId: string) => void;
  onStartTimer: (timerId: string) => void;
  onPauseTimer: (timerId: string) => void;
  onResetTimer: (timerId: string) => void;
  onAdjustTime: (timerId: string, seconds: number) => void;
  onUpdateTimerDuration: (timerId: string, newDuration: number) => void;
  isTimerRunning: (timerId: string) => boolean;
  isTimerPaused: (timerId: string) => boolean;
  className?: string;
}

export function PreviewControls({
  timers,
  activeTimerId,
  onSelectTimer,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onAdjustTime,
  onUpdateTimerDuration,
  isTimerRunning,
  isTimerPaused: _isTimerPaused,
  className = '',
}: PreviewControlsProps) {
  const [showSubtractDropdown, setShowSubtractDropdown] = useState(false);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const subtractRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        subtractRef.current &&
        !subtractRef.current.contains(event.target as Node)
      ) {
        setShowSubtractDropdown(false);
      }
      if (addRef.current && !addRef.current.contains(event.target as Node)) {
        setShowAddDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isRunning = activeTimerId ? isTimerRunning(activeTimerId) : false;

  // Get current timer index and navigation availability
  const currentTimerIndex = timers.findIndex(
    (timer) => timer.id === activeTimerId
  );
  const hasPrevious = currentTimerIndex > 0;
  const hasNext = currentTimerIndex < timers.length - 1;

  const subtractOptions = [
    { label: '-1s', value: -1 },
    { label: '-10s', value: -10 },
    { label: '-30s', value: -30 },
    { label: '-1m', value: -60 },
    { label: '-5m', value: -300 },
    { label: '-10m', value: -600 },
    { label: '-20m', value: -1200 },
    { label: '-30m', value: -1800 },
  ];

  const addOptions = [
    { label: '+1s', value: 1 },
    { label: '+10s', value: 10 },
    { label: '+30s', value: 30 },
    { label: '+1m', value: 60 },
    { label: '+5m', value: 300 },
    { label: '+10m', value: 600 },
    { label: '+20m', value: 1200 },
    { label: '+30m', value: 1800 },
  ];

  const handleTimeAdjustment = (seconds: number) => {
    if (!activeTimerId) return;

    const activeTimer = timers.find((t) => t.id === activeTimerId);
    if (!activeTimer) return;

    // Only affect Countdown timers
    if (activeTimer.state.type === 'countdown') {
      // Calculate what the new duration would be
      const proposedNewDuration = activeTimer.state.initialTime + seconds;

      // Duration should never go below 0 (minimum 1 second to prevent issues)
      const newDuration = Math.max(1, proposedNewDuration);

      // Simply update the duration - elapsedTime remains unchanged
      // This means the TimerPreview will show: newDuration - elapsedTime
      // which preserves the elapsed time but changes the remaining time
      onUpdateTimerDuration(activeTimerId, newDuration);
    }

    setShowSubtractDropdown(false);
    setShowAddDropdown(false);
  };

  const handlePlayPause = () => {
    if (!activeTimerId) return;

    if (isRunning) {
      onPauseTimer(activeTimerId);
    } else {
      onStartTimer(activeTimerId);
    }
  };

  const handleReset = () => {
    if (activeTimerId) {
      onResetTimer(activeTimerId);
    }
  };

  const handlePrevious = () => {
    if (!hasPrevious || currentTimerIndex === -1) return;

    const previousTimer = timers[currentTimerIndex - 1];
    const wasCurrentRunning = activeTimerId
      ? isTimerRunning(activeTimerId)
      : false;

    // If current timer is running, pause it first
    if (wasCurrentRunning && activeTimerId) {
      onPauseTimer(activeTimerId);
    }

    // Select the previous timer
    onSelectTimer(previousTimer.id);

    // If the previous timer was running, start the new one
    if (wasCurrentRunning) {
      // Use setTimeout to ensure selection happens first
      setTimeout(() => {
        onStartTimer(previousTimer.id);
      }, 0);
    }
  };

  const handleNext = () => {
    if (!hasNext || currentTimerIndex === -1) return;

    const nextTimer = timers[currentTimerIndex + 1];
    const wasCurrentRunning = activeTimerId
      ? isTimerRunning(activeTimerId)
      : false;

    // If current timer is running, pause it first
    if (wasCurrentRunning && activeTimerId) {
      onPauseTimer(activeTimerId);
    }

    // Select the next timer
    onSelectTimer(nextTimer.id);

    // If the previous timer was running, start the new one
    if (wasCurrentRunning) {
      // Use setTimeout to ensure selection happens first
      setTimeout(() => {
        onStartTimer(nextTimer.id);
      }, 0);
    }
  };

  return (
    <div
      className={cn('flex items-center justify-center space-x-2', className)}
    >
      {/* Subtract Time Dropdown */}
      <div className="relative flex max-w-[100px] flex-auto" ref={subtractRef}>
        <button
          onClick={() => {
            setShowSubtractDropdown(!showSubtractDropdown);
            setShowAddDropdown(false);
          }}
          className="btn-ctrl h-9 w-7 !rounded-r-none border-r-0 p-0 text-sm"
          disabled={!activeTimerId}
        >
          <IoCaretDown className="size-3" />
        </button>

        {showSubtractDropdown && (
          <div className="absolute left-0 top-full z-50 mb-1 w-20 rounded border border-neutral-600 bg-neutral-800 py-1 shadow-lg">
            {subtractOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleTimeAdjustment(option.value)}
                className="block w-full px-3 py-1 text-left text-sm text-neutral-300 hover:bg-neutral-700 hover:text-white"
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => handleTimeAdjustment(-60)}
          className="btn-ctrl z-10 h-9 flex-auto !rounded-l-none p-0 text-sm"
          disabled={!activeTimerId}
        >
          -1m
        </button>
      </div>

      <button
        onClick={handlePrevious}
        className={cn(
          'btn-ctrl h-9 w-9 max-w-[80px] flex-auto p-0',
          !hasPrevious && 'cursor-not-allowed opacity-50'
        )}
        title="Previous timer"
        disabled={!hasPrevious}
      >
        <MdSkipPrevious className="size-5" />
      </button>

      {/* Play Button */}
      <button
        onClick={handlePlayPause}
        className={cn(
          'btn-ctrl h-9 w-12 flex-auto p-0',
          isRunning
            ? 'text-red-500 hover:bg-red-600 hover:text-white'
            : 'text-green-500 hover:bg-green-600 hover:text-white'
        )}
        disabled={!activeTimerId}
      >
        {isRunning ? (
          <MdPause className="size-5" />
        ) : (
          <MdPlayArrow className="size-5" />
        )}
      </button>

      {/* Next Button */}
      <button
        onClick={handleNext}
        className={cn(
          'btn-ctrl h-9 w-9 max-w-[80px] flex-auto p-0',
          !hasNext && 'cursor-not-allowed opacity-50'
        )}
        title="Next timer"
        disabled={!hasNext}
      >
        <MdSkipNext className="size-5" />
      </button>

      {/* Add Time Dropdown */}
      <div className="relative flex max-w-[100px] flex-auto" ref={addRef}>
        <button
          onClick={() => handleTimeAdjustment(60)}
          className="btn-ctrl z-10 h-9 flex-auto !rounded-r-none p-0 text-sm"
          disabled={!activeTimerId}
        >
          +1m
        </button>

        <button
          onClick={() => {
            setShowAddDropdown(!showAddDropdown);
            setShowSubtractDropdown(false);
          }}
          className="btn-ctrl h-9 w-7 !rounded-l-none p-0 text-sm"
          disabled={!activeTimerId}
        >
          <IoCaretDown className="size-3" />
        </button>

        {showAddDropdown && (
          <div className="absolute right-0 top-full z-50 mb-1 w-20 rounded border border-neutral-600 bg-neutral-800 py-1 shadow-lg">
            {addOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleTimeAdjustment(option.value)}
                className="block w-full px-3 py-1 text-left text-sm text-neutral-300 hover:bg-neutral-700 hover:text-white"
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
