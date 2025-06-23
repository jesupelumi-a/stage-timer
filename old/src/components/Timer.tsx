import React from 'react';
import type { TimerState, TimerType } from '../types';
import { getDisplayTime } from '../utils/time';

interface TimerProps {
  timer: TimerState;
  isExpired: boolean;
  showMilliseconds?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
}

export function Timer({
  timer,
  isExpired,
  showMilliseconds = false,
  className = '',
  size = 'large',
}: TimerProps) {
  const timerText = getDisplayTime(
    timer.currentTime,
    true, // show hours
    showMilliseconds
  );

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'text-4xl md:text-6xl';
      case 'medium':
        return 'text-6xl md:text-8xl';
      case 'large':
        return 'text-8xl md:text-10xl lg:text-11xl';
      case 'xlarge':
        return 'text-10xl md:text-11xl lg:text-12xl';
      default:
        return 'text-8xl md:text-10xl lg:text-11xl';
    }
  };

  const getStatusClass = () => {
    if (isExpired) {
      return 'text-red-500 animate-flash';
    }

    switch (timer.status) {
      case 'running':
        return 'text-green-400';
      case 'paused':
        return 'text-yellow-400';
      case 'expired':
        return 'text-red-500';
      default:
        return 'text-white';
    }
  };

  return (
    <div className={`timer-component text-center ${className}`}>
      <div
        className={`font-mono font-bold leading-none ${getSizeClass()} ${getStatusClass()}`}
      >
        {timerText}
      </div>

      <div className="mt-4 text-lg font-medium capitalize opacity-75 md:text-xl lg:text-2xl">
        {timer.type}
        {timer.status !== 'idle' && (
          <span className="ml-2 text-sm md:text-base lg:text-lg">
            ({timer.status})
          </span>
        )}
      </div>
    </div>
  );
}

interface TimerControlsProps {
  timer: TimerState;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onStop: () => void;
  isRunning: boolean;
  isPaused: boolean;
  className?: string;
}

export function TimerControls({
  timer,
  onStart,
  onPause,
  onReset,
  onStop,
  isPaused,
  className = '',
}: TimerControlsProps) {
  const canStart = timer.status === 'idle' || timer.status === 'paused';
  const canPause = timer.status === 'running';
  const canReset = timer.status !== 'idle';
  const canStop = timer.status !== 'idle';

  return (
    <div
      className={`timer-controls flex flex-wrap justify-center gap-3 ${className}`}
    >
      <button
        onClick={onStart}
        disabled={!canStart}
        className="control-button control-button-success disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPaused ? 'Resume' : 'Start'}
      </button>

      <button
        onClick={onPause}
        disabled={!canPause}
        className="control-button control-button-warning disabled:cursor-not-allowed disabled:opacity-50"
      >
        Pause
      </button>

      <button
        onClick={onReset}
        disabled={!canReset}
        className="control-button control-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
      >
        Reset
      </button>

      <button
        onClick={onStop}
        disabled={!canStop}
        className="control-button control-button-danger disabled:cursor-not-allowed disabled:opacity-50"
      >
        Stop
      </button>
    </div>
  );
}

interface TimerSetupProps {
  onSetTimer: (duration: number, type: TimerType) => void;
  currentType: TimerType;
  className?: string;
}

export function TimerSetup({
  onSetTimer,
  currentType,
  className = '',
}: TimerSetupProps) {
  const [hours, setHours] = React.useState(0);
  const [minutes, setMinutes] = React.useState(5);
  const [seconds, setSeconds] = React.useState(0);
  const [timerType, setTimerType] = React.useState<TimerType>(currentType);

  const handleSetTimer = () => {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds > 0 || timerType !== 'countdown') {
      onSetTimer(totalSeconds, timerType);
    }
  };

  const isValid = timerType !== 'countdown' || hours + minutes + seconds > 0;

  return (
    <div className={`timer-setup space-y-4 ${className}`}>
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Timer Type
        </label>
        <select
          value={timerType}
          onChange={(e) => setTimerType(e.target.value as TimerType)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="countdown">Countdown</option>
          <option value="countup">Count Up</option>
          <option value="stopwatch">Time of Day</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>

      {timerType === 'countdown' && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Duration
          </label>
          <div className="flex space-x-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">Hours</label>
              <input
                type="number"
                value={hours}
                onChange={(e) =>
                  setHours(Math.max(0, parseInt(e.target.value) || 0))
                }
                min="0"
                max="23"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">
                Minutes
              </label>
              <input
                type="number"
                value={minutes}
                onChange={(e) =>
                  setMinutes(
                    Math.max(0, Math.min(59, parseInt(e.target.value) || 0))
                  )
                }
                min="0"
                max="59"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">
                Seconds
              </label>
              <input
                type="number"
                value={seconds}
                onChange={(e) =>
                  setSeconds(
                    Math.max(0, Math.min(59, parseInt(e.target.value) || 0))
                  )
                }
                min="0"
                max="59"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleSetTimer}
        disabled={!isValid}
        className="control-button control-button-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
      >
        Set Timer
      </button>
    </div>
  );
}

interface TimerPresetsProps {
  presets: Array<{
    id: string;
    name: string;
    duration: number;
    type: TimerType;
  }>;
  onSelectPreset: (duration: number, type: TimerType) => void;
  className?: string;
}

export function TimerPresets({
  presets,
  onSelectPreset,
  className = '',
}: TimerPresetsProps) {
  if (presets.length === 0) {
    return (
      <div className={`timer-presets ${className}`}>
        <p className="text-sm italic text-gray-500">
          No timer presets available
        </p>
      </div>
    );
  }

  return (
    <div className={`timer-presets ${className}`}>
      <h3 className="mb-3 text-sm font-semibold text-gray-700">Quick Timers</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelectPreset(preset.duration, preset.type)}
            className="preset-button text-center"
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );
}
