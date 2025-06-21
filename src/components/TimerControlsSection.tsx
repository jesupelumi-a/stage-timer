import React, { useState, useEffect } from 'react';
import { addSeconds, format, parse } from 'date-fns';
import type { Timer, TimerType } from '../types';
import { TimerCard } from './TimerCard';
import { TimerSettingsModal } from './TimerSettingsModal';
import { cn } from '../lib/utils';

interface TimerControlsSectionProps {
  timers: Timer[];
  activeTimerId: string | null;
  onAddTimer: (
    name: string,
    duration: number,
    type: TimerType,
    startTime?: string
  ) => void;
  onDeleteTimer: (timerId: string) => void;
  onSelectTimer: (timerId: string) => void;
  onStartTimer: (timerId: string) => void;
  onPauseTimer: (timerId: string) => void;
  onResetTimer: (timerId: string) => void;
  onUpdateTimerTime: (timerId: string, newTime: number) => void;
  onUpdateTimerDuration: (timerId: string, newDuration: number) => void;
  onUpdateTimerType: (timerId: string, newType: TimerType) => void;
  onUpdateTimer: (timerId: string, updates: Partial<Timer>) => void;
  onReorderTimers: (timerIds: string[]) => void;
  onToggleBlackout: () => void;
  onToggleFlash: () => void;
  isTimerRunning: (timerId: string) => boolean;
  isTimerPaused: (timerId: string) => boolean;
  isTimerExpired: (timerId: string) => boolean;
  isTimerLoading?: (timerId: string) => boolean;
  blackoutMode: boolean;
  flashMode: boolean;
}

export function TimerControlsSection({
  timers,
  activeTimerId,
  onAddTimer,
  onDeleteTimer,
  onSelectTimer,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onUpdateTimerTime,
  onUpdateTimerDuration,
  onUpdateTimerType,
  onUpdateTimer,
  onToggleBlackout,
  onToggleFlash,
  isTimerRunning,
  isTimerPaused,
  isTimerExpired,
  isTimerLoading,
  blackoutMode,
  flashMode,
}: TimerControlsSectionProps) {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedTimer, setSelectedTimer] = useState<Timer | null>(null);
  const [lastActiveTimerId, setLastActiveTimerId] = useState<string | null>(
    null
  );

  // Ensure there's always an active timer (first one by default)
  useEffect(() => {
    if (timers.length > 0 && !activeTimerId) {
      onSelectTimer(timers[0].id);
    }
  }, [timers, activeTimerId, onSelectTimer]);

  // Pause previously active timer when a new timer becomes active
  useEffect(() => {
    if (
      activeTimerId &&
      lastActiveTimerId &&
      activeTimerId !== lastActiveTimerId
    ) {
      // Check if the previously active timer is running
      if (isTimerRunning(lastActiveTimerId)) {
        onPauseTimer(lastActiveTimerId);
      }
    }
    setLastActiveTimerId(activeTimerId);
  }, [activeTimerId, lastActiveTimerId, isTimerRunning, onPauseTimer]);

  const handleAddTimer = () => {
    // Calculate the next timer's start time based on the last timer
    let nextStartTime = '12:00 PM'; // Default start time

    if (timers.length > 0) {
      const lastTimer = timers[timers.length - 1];
      const lastStartTime = lastTimer.startTime || '12:00 PM';
      const lastDuration = lastTimer.state.initialTime || 600; // Default to 10 minutes if no duration

      try {
        // Parse the last start time (12-hour format: "1:30 PM")
        const startDate = parse(lastStartTime, 'h:mm a', new Date());

        // Add the duration in seconds
        const endDate = addSeconds(startDate, lastDuration);

        // Format back to 12-hour format
        nextStartTime = format(endDate, 'h:mm a');
      } catch (error) {
        console.warn('Error calculating next start time:', error);
        // Fallback to default time if parsing fails
        nextStartTime = '12:00 PM';
      }
    }

    // Create timer with smart defaults including calculated startTime
    const timerName = `Timer ${timers.length + 1}`;
    const duration = 600; // 10 minutes in seconds
    const timerType: TimerType = 'countdown';

    // Add the timer with the calculated startTime
    onAddTimer(timerName, duration, timerType, nextStartTime);
  };

  const handleTimerSettings = (timerId: string) => {
    const timer = timers.find((t) => t.id === timerId);
    if (timer) {
      setSelectedTimer(timer);
      setShowSettingsModal(true);
    }
  };

  const handleSettingsSave = (timerId: string, updates: Partial<Timer>) => {
    onUpdateTimer(timerId, updates);
    setShowSettingsModal(false);
    setSelectedTimer(null);
  };

  const handleSettingsClose = () => {
    setShowSettingsModal(false);
    setSelectedTimer(null);
  };

  const handleTimerSelect = (timerId: string) => {
    onSelectTimer(timerId);
  };

  return (
    <div className="timer-controls-section flex-1 p-4">
      <div className="controller-timers flex-none lg:h-full">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-white">Timers</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleBlackout}
              className={`btn-ctrl flex h-7 items-center truncate px-3 text-sm ${blackoutMode ? 'bg-neutral-600 text-white' : ''}`}
              title="Toggle blackout"
            >
              Blackout
            </button>
            <button
              onClick={onToggleFlash}
              className={`btn-ctrl relative h-7 px-2 text-sm ring-0 transition ${flashMode ? 'bg-neutral-600 text-white' : ''}`}
              title="Flash the timer display"
            >
              Flash
            </button>
          </div>
        </div>

        {/* Timer Cards */}
        <div className="mb-4 space-y-3">
          {timers.map((timer, index) => {
            const isActive = timer.id === activeTimerId;
            const isRunning = isTimerRunning(timer.id);

            return (
              <TimerCard
                key={timer.id}
                timer={timer.state}
                timerName={timer.name}
                timerIndex={index + 1}
                isActive={isActive}
                isRunning={isRunning}
                startTime={timer.startTime}
                isLoading={isTimerLoading ? isTimerLoading(timer.id) : false}
                onStart={() => onStartTimer(timer.id)}
                onPause={() => onPauseTimer(timer.id)}
                onReset={() => onResetTimer(timer.id)}
                onSelect={() => handleTimerSelect(timer.id)}
                onSettings={() => handleTimerSettings(timer.id)}
                onDelete={() => onDeleteTimer(timer.id)}
                onDurationChange={(newDuration: number) =>
                  onUpdateTimerDuration(timer.id, newDuration)
                }
                onTypeChange={(newType) => onUpdateTimerType(timer.id, newType)}
                onNameChange={(newName) =>
                  onUpdateTimer(timer.id, { name: newName })
                }
                onStartTimeChange={(startTime) =>
                  onUpdateTimer(timer.id, { startTime })
                }
                className={cn(
                  'bg-neutral-800',
                  isActive && isRunning && 'bg-red-700',
                  isActive && !isRunning && 'bg-blue-700'
                )}
              />
            );
          })}
        </div>

        {/* Add Timer Section */}
        <button
          onClick={handleAddTimer}
          className="btn-ctrl mx-auto flex h-8 w-auto items-center justify-center space-x-2 px-6"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>Add Timer</span>
        </button>

        {/* Additional Info */}
        {timers.length === 0 && (
          <div className="py-8 text-center text-neutral-500">
            <p className="text-sm">No timers created yet.</p>
            <p className="mt-1 text-xs">Click "Add Timer" to get started.</p>
          </div>
        )}

        {/* Timer Instructions */}
        {timers.length > 0 && (
          <div className="mt-6 rounded bg-neutral-800/50 p-3 text-xs text-neutral-400">
            <p className="mb-1">
              <strong>Tips:</strong>
            </p>
            <ul className="space-y-1 text-xs">
              <li>• Click timer name/time to edit</li>
              <li>• Use drag handle to reorder</li>
              <li>• Green = Start, Red = Pause/Stop</li>
              <li>• Auto-link timers for sequences</li>
            </ul>
          </div>
        )}

        {/* Timer Settings Modal */}
        <TimerSettingsModal
          timer={selectedTimer}
          isOpen={showSettingsModal}
          onClose={handleSettingsClose}
          onSave={handleSettingsSave}
        />
      </div>
    </div>
  );
}
