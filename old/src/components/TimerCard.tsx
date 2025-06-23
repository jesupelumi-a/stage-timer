import { useState, useRef, useEffect } from 'react';
import {
  MdPlayArrow,
  MdPause,
  MdSettings,
  MdEdit,
  MdDelete,
  MdTimer,
  MdRefresh,
} from 'react-icons/md';
import type { TimerState, TimerType } from '../types';
import { getDisplayTime, getCurrentTime } from '../utils/time';
import { DurationModal } from './DurationModal';
import { StartTimeModal } from './StartTimeModal';
import { LoadingSpinner } from './LoadingSpinner';
import { cn } from '../lib/utils';

interface TimerCardProps {
  timer: TimerState;
  timerName: string;
  timerIndex: number;
  isActive: boolean;
  isRunning: boolean;
  startTime?: string; // HH:MM AM/PM format
  isLoading?: boolean; // Loading state for Firebase operations
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSelect: () => void;
  onSettings: () => void;
  onDelete: () => void;
  onDurationChange: (newDuration: number) => void;
  onTypeChange: (newType: TimerType) => void;
  onNameChange?: (newName: string) => void;
  onStartTimeChange?: (startTime: string) => void;
  className?: string;
}

export function TimerCard({
  timer,
  timerName,
  timerIndex,
  isActive,
  isRunning,
  startTime,
  isLoading = false,
  onStart,
  onPause,
  onReset,
  onSelect,
  onSettings,
  onDelete,
  onDurationChange,
  onTypeChange,
  onNameChange,
  onStartTimeChange,
  className = '',
}: TimerCardProps) {
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [showStartTimeModal, setShowStartTimeModal] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [isEditingName, setIsEditingName] = useState(false);
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState('');
  const durationButtonRef = useRef<HTMLButtonElement>(null);
  const startTimeButtonRef = useRef<HTMLButtonElement>(null);

  // Update current time display for "Time of Day" type
  useEffect(() => {
    if (timer.type === 'stopwatch') {
      const updateTime = () => {
        // Format as hour:minutes:seconds for consistency with TimerPreview
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');

        // Convert to 12-hour format
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const ampm = hours >= 12 ? 'PM' : 'AM';

        setCurrentTimeDisplay(`${displayHours}:${minutes}:${seconds} ${ampm}`);
      };
      updateTime(); // Set immediately
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    } else {
      // Clear the display when not stopwatch type
      setCurrentTimeDisplay('');
    }
  }, [timer.type]);

  // Handle duration modal
  const handleDurationClick = () => {
    if (durationButtonRef.current) {
      const rect = durationButtonRef.current.getBoundingClientRect();
      setModalPosition({
        top: rect.bottom,
        left: rect.left,
      });
      setShowDurationModal(true);
    }
  };

  const handleDurationSave = (newDuration: number) => {
    // Default to 10 minutes (600 seconds) if no duration set for countdown
    if (newDuration === 0 && timer.type === 'countdown') {
      newDuration = 600;
    }
    onDurationChange(newDuration);
    // Reset the timer when duration is changed
    onReset();
    setShowDurationModal(false);
  };

  const handleDurationCancel = () => {
    setShowDurationModal(false);
  };

  // Handle start time modal
  const handleStartTimeClick = () => {
    if (startTimeButtonRef.current) {
      const rect = startTimeButtonRef.current.getBoundingClientRect();
      setModalPosition({
        top: rect.bottom,
        left: rect.left,
      });
      setShowStartTimeModal(true);
    }
  };

  const handleStartTimeSave = (newStartTime: string) => {
    if (onStartTimeChange) {
      onStartTimeChange(newStartTime);
    }
    setShowStartTimeModal(false);
  };

  const handleStartTimeCancel = () => {
    setShowStartTimeModal(false);
  };

  // Handle timer type change
  const handleTypeChange = (newType: TimerType) => {
    onTypeChange(newType);

    // If switching to countdown and no duration set, default to 10 minutes
    if (newType === 'countdown' && timer.initialTime === 0) {
      onDurationChange(600); // 10 minutes
    }
  };

  // Handle selection/reset button click
  const handleSelectionClick = () => {
    if (isActive) {
      // If timer is active, reset it to initial values
      onReset();
    } else {
      // If timer is not active, select it
      onSelect();
    }
  };

  // Handle play button click - select timer first, then handle play/pause logic
  const handlePlayClick = () => {
    if (!isActive) {
      // If this timer is not active, select it AND start it immediately
      onSelect();
      // Use setTimeout to ensure selection happens first, then start
      setTimeout(() => {
        onStart();
      }, 0);
    } else {
      // If this timer is already active, toggle play/pause based on current timer status
      // Use timer.status directly instead of isRunning prop to avoid sync issues
      if (timer.status === 'running') {
        onPause();
      } else {
        onStart();
      }
    }
  };

  // Calculate progress percentage for background (0-100)
  const getProgressPercentage = (): number => {
    if (timer.type !== 'countdown' || timer.initialTime <= 0) return 0;
    // Use elapsedTime for consistency with TimerPreview
    const progress = (timer.elapsedTime / timer.initialTime) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  const progressPercentage = getProgressPercentage();

  // Get timer display text
  const getTimerDisplayText = () => {
    if (timer.type === 'hidden') {
      return 'Hidden';
    }
    if (timer.type === 'stopwatch') {
      return currentTimeDisplay || getCurrentTime('12h');
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

  // Always show duration as time, regardless of type
  const durationText = getDisplayTime(timer.initialTime, true, false);

  return (
    <>
      <div
        className={cn(
          'relative overflow-hidden rounded-lg p-4 transition-all duration-300',
          isLoading && 'pointer-events-none opacity-75',
          className
        )}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <LoadingSpinner size="md" className="text-white" />
          </div>
        )}
        {/* Progress Background */}
        {isActive && timer.type === 'countdown' && (
          <div
            className={cn(
              'absolute inset-0 z-10 origin-left bg-black opacity-20 transition-transform duration-75 ease-out'
            )}
            style={{
              transform: `scaleX(${progressPercentage / 100})`,
            }}
          />
        )}

        <div className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-lg font-semibold text-neutral-500 hover:text-neutral-300">
          {timerIndex}
        </div>

        {/* Main Content */}
        <div className="relative z-10 ml-6 flex gap-8">
          {/* Start Column */}
          <div className="flex w-24 flex-col items-center">
            <span
              className={cn(
                'text-xs text-neutral-400',
                isActive && 'text-blue-400',
                timer.status === 'running' && 'text-red-400'
              )}
            >
              Start
            </span>
            <button
              ref={startTimeButtonRef}
              onClick={(e) => {
                e.stopPropagation();
                if (!isLoading) handleStartTimeClick();
              }}
              disabled={isLoading}
              className={cn(
                'my-1 border-b border-dashed border-neutral-600 text-sm font-semibold leading-5 ring-0 transition-colors hover:border-white focus:border-white',
                isActive && 'border-blue-500',
                timer.status === 'running' && 'border-red-500',
                isLoading && 'cursor-not-allowed opacity-50'
              )}
            >
              {startTime || '12:00 PM'}
            </button>
            <span className="text-xs text-neutral-400">&nbsp;</span>
          </div>

          {/* Duration Section */}
          <div className="flex w-20 flex-col items-center sm:w-24">
            <span
              className={cn(
                'text-xs text-neutral-400',
                isActive && 'text-blue-400',
                timer.status === 'running' && 'text-red-400'
              )}
            >
              Duration
            </span>
            <button
              ref={durationButtonRef}
              onClick={(e) => {
                e.stopPropagation();
                handleDurationClick();
              }}
              className={cn(
                'my-1 border-b border-dashed border-neutral-600 text-base font-semibold leading-5 ring-0 transition-colors hover:border-white focus:border-white',
                isActive && 'border-blue-500',
                timer.status === 'running' && 'border-red-500'
              )}
            >
              {durationText}
            </button>
            <div className="relative text-xs">
              <select
                value={timer.type}
                onChange={(e) => {
                  e.stopPropagation();
                  handleTypeChange(e.target.value as TimerType);
                }}
                className={cn(
                  'w-full bg-transparent text-neutral-500 focus:outline-none',
                  isActive && 'text-blue-400',
                  timer.status === 'running' && 'text-red-400'
                )}
              >
                <option value="countdown">Countdown</option>
                <option value="countup">CountUp</option>
                <option value="stopwatch">Time of Day</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditingName ? (
              <input
                type="text"
                defaultValue={timerName}
                className="min-w-[60px] border-b border-dashed border-neutral-500 bg-transparent font-medium text-white outline-none focus:border-white"
                onBlur={(e) => {
                  if (onNameChange) {
                    onNameChange(e.target.value);
                  }
                  setIsEditingName(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (onNameChange) {
                      onNameChange(e.currentTarget.value);
                    }
                    setIsEditingName(false);
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                autoFocus
              />
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingName(true);
                }}
                className="font-medium text-white transition-colors hover:text-neutral-300"
              >
                {timerName}
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingName(true);
              }}
              className="text-neutral-400 transition-colors hover:text-white"
            >
              <MdEdit size={16} />
            </button>
          </div>

          {/* Control Buttons */}
          <div className="ml-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Selection/Reset Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectionClick();
                }}
                className="flex size-9 items-center justify-center rounded border border-neutral-600 bg-neutral-800 transition-colors hover:border-white"
                title={isActive ? 'Reset Timer' : 'Select Timer'}
              >
                {isActive ? <MdRefresh size={18} /> : <MdTimer size={18} />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSettings();
                }}
                className="flex size-9 items-center justify-center rounded border border-neutral-600 bg-neutral-800 transition-colors hover:border-white"
              >
                <MdSettings size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayClick();
                }}
                className={`flex h-9 w-12 items-center justify-center rounded border border-neutral-600 bg-neutral-800 transition-colors ${
                  timer.status === 'running'
                    ? 'text-red-500 hover:bg-red-600 hover:text-white'
                    : 'text-green-500 hover:bg-green-600 hover:text-white'
                }`}
                title={
                  timer.status === 'running' ? 'Pause Timer' : 'Start Timer'
                }
              >
                {timer.status === 'running' ? (
                  <MdPause size={20} />
                ) : (
                  <MdPlayArrow size={20} />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="flex size-9 items-center justify-center rounded bg-transparent text-neutral-400 transition-colors hover:bg-red-600 hover:text-white"
                title="Delete Timer"
              >
                <MdDelete size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Duration Modal */}
      <DurationModal
        isOpen={showDurationModal}
        initialDuration={timer.initialTime}
        onSave={handleDurationSave}
        onCancel={handleDurationCancel}
        position={modalPosition}
      />

      {/* Start Time Modal */}
      <StartTimeModal
        isOpen={showStartTimeModal}
        initialStartTime={startTime}
        onSave={handleStartTimeSave}
        onCancel={handleStartTimeCancel}
        position={modalPosition}
      />
    </>
  );
}
