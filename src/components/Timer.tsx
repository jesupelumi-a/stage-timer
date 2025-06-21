import React from "react";
import type { TimerState, TimerType } from "../types";
import { getDisplayTime } from "../utils/time";

interface TimerProps {
  timer: TimerState;
  isExpired: boolean;
  showMilliseconds?: boolean;
  className?: string;
  size?: "small" | "medium" | "large" | "xlarge";
}

export function Timer({
  timer,
  isExpired,
  showMilliseconds = false,
  className = "",
  size = "large",
}: TimerProps) {
  const timerText = getDisplayTime(
    timer.currentTime,
    true, // show hours
    showMilliseconds
  );

  const getSizeClass = () => {
    switch (size) {
      case "small":
        return "text-4xl md:text-6xl";
      case "medium":
        return "text-6xl md:text-8xl";
      case "large":
        return "text-8xl md:text-10xl lg:text-11xl";
      case "xlarge":
        return "text-10xl md:text-11xl lg:text-12xl";
      default:
        return "text-8xl md:text-10xl lg:text-11xl";
    }
  };

  const getStatusClass = () => {
    if (isExpired) {
      return "text-red-500 animate-flash";
    }

    switch (timer.status) {
      case "running":
        return "text-green-400";
      case "paused":
        return "text-yellow-400";
      case "expired":
        return "text-red-500";
      default:
        return "text-white";
    }
  };

  return (
    <div className={`timer-component text-center ${className}`}>
      <div
        className={`font-mono font-bold leading-none ${getSizeClass()} ${getStatusClass()}`}
      >
        {timerText}
      </div>

      <div className="mt-4 text-lg md:text-xl lg:text-2xl font-medium opacity-75 capitalize">
        {timer.type}
        {timer.status !== "idle" && (
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
  className = "",
}: TimerControlsProps) {
  const canStart = timer.status === "idle" || timer.status === "paused";
  const canPause = timer.status === "running";
  const canReset = timer.status !== "idle";
  const canStop = timer.status !== "idle";

  return (
    <div
      className={`timer-controls flex flex-wrap gap-3 justify-center ${className}`}
    >
      <button
        onClick={onStart}
        disabled={!canStart}
        className="control-button control-button-success disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPaused ? "Resume" : "Start"}
      </button>

      <button
        onClick={onPause}
        disabled={!canPause}
        className="control-button control-button-warning disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Pause
      </button>

      <button
        onClick={onReset}
        disabled={!canReset}
        className="control-button control-button-secondary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Reset
      </button>

      <button
        onClick={onStop}
        disabled={!canStop}
        className="control-button control-button-danger disabled:opacity-50 disabled:cursor-not-allowed"
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
  className = "",
}: TimerSetupProps) {
  const [hours, setHours] = React.useState(0);
  const [minutes, setMinutes] = React.useState(5);
  const [seconds, setSeconds] = React.useState(0);
  const [timerType, setTimerType] = React.useState<TimerType>(currentType);

  const handleSetTimer = () => {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds > 0 || timerType !== "countdown") {
      onSetTimer(totalSeconds, timerType);
    }
  };

  const isValid = timerType !== "countdown" || hours + minutes + seconds > 0;

  return (
    <div className={`timer-setup space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Timer Type
        </label>
        <select
          value={timerType}
          onChange={(e) => setTimerType(e.target.value as TimerType)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="countdown">Countdown</option>
          <option value="countup">Count Up</option>
          <option value="stopwatch">Stopwatch</option>
        </select>
      </div>

      {timerType === "countdown" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration
          </label>
          <div className="flex space-x-2">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Hours</label>
              <input
                type="number"
                value={hours}
                onChange={(e) =>
                  setHours(Math.max(0, parseInt(e.target.value) || 0))
                }
                min="0"
                max="23"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleSetTimer}
        disabled={!isValid}
        className="control-button control-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
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
  className = "",
}: TimerPresetsProps) {
  if (presets.length === 0) {
    return (
      <div className={`timer-presets ${className}`}>
        <p className="text-sm text-gray-500 italic">
          No timer presets available
        </p>
      </div>
    );
  }

  return (
    <div className={`timer-presets ${className}`}>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Timers</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
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
