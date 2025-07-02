import { useState, useRef, useEffect, useMemo } from 'react';
import { Button, Select, SelectItem, Input } from '@heroui/react';
import {
  MdPlayArrow,
  MdPause,
  MdSettings,
  MdEdit,
  MdDelete,
  MdTimer,
  MdRefresh,
} from 'react-icons/md';
import type { Timer } from '@stage-timer/db';
import {
  cn,
  getDisplayTime,
  formatTo12HourOptionalSeconds,
} from '../../lib/utils';
import { DurationModal } from '../duration-modal';
import { StartTimeModal } from '../start-time-modal';
import { useGlobalTimerState } from '../../hooks/use-global-timer-state';

interface TimerCardProps {
  timer: Timer;
  timerIndex: number;
  isActive: boolean;
  isRunning: boolean;
  startTime?: string; // HH:MM AM/PM format
  isLoading?: boolean; // Loading state for operations
  currentTime?: number; // Current time from timer session (for real-time updates)
  serverTimerState?: {
    // Full timer session state for real-time calculations
    timerId: number;
    isRunning: boolean;
    currentTime: number;
    kickoff?: number;
    deadline?: number;
    status: 'running' | 'paused' | 'stopped';
  } | null;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSelect: () => void;
  onSettings: () => void;
  onDelete: () => void;
  onDurationChange: (newDuration: number) => void;
  onTypeChange: (newType: string) => void;
  onNameChange?: (newName: string) => void;
  onStartTimeChange?: (startTime: string) => void;
  dragHandle?: React.ReactNode; // Optional drag handle to replace timer index
  className?: string;
}

export function TimerCard({
  timer,
  timerIndex,
  isActive,
  isRunning,
  startTime,
  isLoading = false,
  currentTime: propCurrentTime,
  serverTimerState,
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
  dragHandle,
  className = '',
}: TimerCardProps) {
  // Use global timer state for real-time updates (single event listener)
  const { timerState, getRealTimeCurrentTime, isTimerActive, isTimerRunning } = useGlobalTimerState(timer.roomId);

  const [showDurationModal, setShowDurationModal] = useState(false);
  const [showStartTimeModal, setShowStartTimeModal] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [isEditingName, setIsEditingName] = useState(false);
  const durationButtonRef = useRef<HTMLButtonElement>(null);
  const startTimeButtonRef = useRef<HTMLButtonElement>(null);

  // Force re-render for real-time updates
  const [updateCounter, forceUpdate] = useState(0);

  // Determine if this timer is the active one using WebSocket state
  const isActiveTimer = isTimerActive(timer.id);
  const isRunningTimer = isTimerRunning(timer.id);

  // Get current time - recalculates on every update for active timers
  const currentTime = useMemo(() => {
    if (isActiveTimer) {
      return getRealTimeCurrentTime(timer);
    }
    return timer.durationMs;
  }, [isActiveTimer, getRealTimeCurrentTime, timer, updateCounter]);

  // Real-time updates ONLY for the active running timer
  useEffect(() => {
    // Only update if this specific timer is both active AND running
    if (!isActiveTimer || !isRunningTimer) return;

    // Starting real-time updates for active timer

    const interval = setInterval(() => {
      // Force re-render to update the display time and progress bar
      forceUpdate(prev => prev + 1);
    }, 100);

    return () => clearInterval(interval);
  }, [isActiveTimer, isRunningTimer, timer.id]);

  // Calculate progress percentage - recalculates on every update for active timers
  const progressPercentage = useMemo(() => {
    if (timer.durationMs <= 0) return 0;

    // Only calculate progress for active timers to save resources
    if (!isActiveTimer) return 0;

    // Get fresh real-time value for progress calculation
    const realTimeValue = getRealTimeCurrentTime(timer);
    let progress = 0;

    // Handle different timer appearances
    if (timer.appearance === 'COUNTDOWN') {
      // For countdown: progress is how much time has elapsed
      const elapsed = timer.durationMs - realTimeValue;
      progress = Math.min(100, Math.max(0, (elapsed / timer.durationMs) * 100));
    } else if (timer.appearance === 'COUNTUP') {
      // For countup: progress is how close we are to the duration
      progress = Math.min(100, Math.max(0, (realTimeValue / timer.durationMs) * 100));
    } else {
      // Default case: assume standard progress calculation
      progress = Math.min(100, Math.max(0, (realTimeValue / timer.durationMs) * 100));
    }

    // Removed debug logging for cleaner console

    return progress;
  }, [timer.durationMs, timer.appearance, timer.id, isActiveTimer, isRunningTimer, getRealTimeCurrentTime, timer, updateCounter]);

  // Memoize duration text to prevent unnecessary recalculations
  const durationText = useMemo(
    () => getDisplayTime(timer.durationMs / 1000, true, false),
    [timer.durationMs]
  );

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
    // Default to 10 minutes (600000 ms) if no duration set for countdown
    if (newDuration === 0 && timer.appearance === 'COUNTDOWN') {
      newDuration = 600000;
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
  const handleTypeChange = (newType: string) => {
    onTypeChange(newType);

    // If switching to countdown and no duration set, default to 10 minutes
    if (newType === 'COUNTDOWN' && timer.durationMs === 0) {
      onDurationChange(600000); // 10 minutes in ms
    }
  };

  // Handle selection/reset button click
  const handleSelectionClick = () => {
    onReset();
  };

  // Handle play button click - simplified with WebSocket state
  const handlePlayClick = () => {
    console.log('Play click state:', {
      isActive,
      isActiveTimer,
      isRunningTimer,
      timerState: timerState.status,
    });

    // Use WebSocket state as primary source of truth
    if (!isActiveTimer) {
      // If this timer is not active according to WebSocket, select and start it
      onSelect();
      onStart();
    } else {
      // If this timer is already active, toggle play/pause based on WebSocket state
      if (isRunningTimer) {
        console.log('🔄 Timer is running, calling pause');
        onPause();
      } else {
        console.log('🔄 Timer is not running, calling start');
        onStart();
      }
    }
  };

  return (
    <>
      <div
        className={cn(
          'group relative overflow-hidden rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 transition-all duration-300',
          isLoading && 'pointer-events-none opacity-75',
          isActive && 'bg-blue-700',
          isRunning && 'bg-red-700',
          className
        )}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-xs">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
          </div>
        )}

        {/* Progress Background */}
        {isActive && timer.appearance === 'COUNTDOWN' && (
          <div
            className={cn(
              'absolute inset-0 z-10 origin-left bg-black opacity-20 transition-transform duration-75 ease-out'
            )}
            style={{
              transform: `scaleX(${progressPercentage / 100})`,
            }}
          />
        )}

        <div
          className={cn(
            'absolute left-4 top-1/2 z-10 -translate-y-1/2 text-lg font-semibold text-neutral-300 hover:text-neutral-100',
            isActive && 'text-blue-400',
            isRunning && 'text-red-400',
            isLoading && 'text-neutral-400'
          )}
        >
          {/* Show timer index by default, drag handle on hover */}
          <span
            className={cn(
              'transition-opacity duration-200',
              dragHandle ? 'group-hover:opacity-0' : 'opacity-100'
            )}
          >
            {timerIndex}
          </span>
          {dragHandle && (
            <span
              className={cn(
                'absolute inset-0 flex items-center opacity-0 transition-opacity duration-200 group-hover:opacity-100'
              )}
            >
              {dragHandle}
            </span>
          )}
        </div>

        {/* Main Content */}
        <div className="relative z-10 ml-6 flex gap-8">
          {/* Start Column */}
          <div className="flex w-24 flex-col items-center">
            <span
              className={cn(
                'text-xs text-neutral-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100',
                isActive && 'text-blue-400',
                isRunning && 'text-red-400'
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
                isRunning && 'border-red-500',
                isLoading && 'cursor-not-allowed opacity-50',
                !timer.startTime && 'text-neutral-400'
              )}
            >
              {timer.startTime
                ? formatTo12HourOptionalSeconds(new Date(timer.startTime))
                : '12:00 AM'}
            </button>
            <span className="text-xs text-neutral-400">&nbsp;</span>
          </div>

          {/* Duration Section */}
          <div className="flex w-20 flex-col items-center sm:w-24">
            <span
              className={cn(
                'text-xs text-neutral-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100',
                isActive && 'text-blue-400',
                isRunning && 'text-red-400'
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
                isRunning && 'border-red-500'
              )}
            >
              {durationText}
            </button>
            <div className="relative text-xs opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <Select
                size="sm"
                selectedKeys={[timer.appearance]}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  if (selectedKey) {
                    handleTypeChange(selectedKey);
                  }
                }}
                className={cn(
                  'w-[112px] py-0 text-xs',
                  isActive && '!text-blue-500',
                  isRunning && 'text-red-500'
                )}
                classNames={{
                  trigger: cn(
                    'h-4 min-h-4 border-none bg-transparent',
                    isActive && '!text-blue-400',
                    isRunning && '!text-red-400'
                  ),
                  value: cn(
                    'text-center text-xs',
                    isActive && '!text-blue-400',
                    isRunning && '!text-red-400'
                  ),
                  popoverContent:
                    'bg-black-500 text-white px-0 py-0 border border-neutral-700 rounded-lg text-xs',
                  listbox:
                    'bg-neutral-800 text-white px-0 py-0 !text-xs [&>ul>li>span]:text-xs',
                }}
                aria-label="Timer type"
              >
                <SelectItem key="COUNTDOWN">Countdown</SelectItem>
                <SelectItem key="COUNTUP">CountUp</SelectItem>
                <SelectItem key="TOD">Time of Day</SelectItem>
                <SelectItem key="HIDDEN">Hidden</SelectItem>
              </Select>
            </div>
          </div>

          {/* Timer Name and Display */}
          <div className="flex flex-1 items-center gap-2">
            {isEditingName ? (
              <Input
                size="sm"
                defaultValue={timer.name}
                className="min-w-[60px] bg-transparent text-xs"
                classNames={{
                  input: 'bg-transparent text-white',
                  inputWrapper:
                    'border-b border-dashed border-neutral-500 rounded-lg bg-transparent',
                }}
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
                className="text-base font-bold text-white transition-colors hover:text-neutral-300"
              >
                {timer.name}
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingName(true);
              }}
              className="text-neutral-400 opacity-0 transition-colors hover:text-white group-hover:opacity-100"
            >
              <MdEdit size={16} />
            </button>
          </div>

          {/* Control Buttons */}
          <div className="ml-auto flex items-center justify-between">
            <div className="flex items-center gap-1">
              {/* Selection/Reset Button */}
              <Button
                isIconOnly
                size="md"
                variant="bordered"
                onPress={() => {
                  handleSelectionClick();
                }}
                className="border-neutral-600 bg-neutral-800 text-white hover:border-white"
                title={isActive ? 'Reset Timer' : 'Select Timer'}
              >
                {isActive ? <MdRefresh size={18} /> : <MdTimer size={18} />}
              </Button>

              <Button
                isIconOnly
                size="md"
                variant="bordered"
                onPress={() => {
                  onSettings();
                }}
                className="border-neutral-600 bg-neutral-800 text-white hover:border-white"
              >
                <MdSettings size={16} />
              </Button>

              <Button
                isIconOnly
                size="md"
                variant="bordered"
                onPress={() => {
                  handlePlayClick();
                }}
                className={cn(
                  'w-14 border-neutral-600 bg-neutral-800 transition-colors',
                  isRunning
                    ? 'text-red-500 hover:border-red-400 hover:bg-red-600 hover:text-white'
                    : 'text-green-500 hover:border-green-400 hover:bg-green-600 hover:text-white'
                )}
                title={isRunning ? 'Pause Timer' : 'Start Timer'}
              >
                {isRunning ? <MdPause size={18} /> : <MdPlayArrow size={18} />}
              </Button>

              <Button
                isIconOnly
                size="md"
                variant="light"
                onPress={() => {
                  onDelete();
                }}
                className="text-neutral-400 hover:bg-red-600 hover:text-white"
                title="Delete Timer"
              >
                <MdDelete size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Duration Modal */}
      <DurationModal
        isOpen={showDurationModal}
        initialDuration={timer.durationMs}
        startTime={
          timer.startTime
            ? formatTo12HourOptionalSeconds(new Date(timer.startTime))
            : '12:00 AM'
        }
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
