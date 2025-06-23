import React, { useState, useEffect } from "react";
import type { Timer, TimerType } from "../types";

interface TimerSettingsModalProps {
  timer: Timer | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (timerId: string, updates: Partial<Timer>) => void;
}

export function TimerSettingsModal({
  timer,
  isOpen,
  onClose,
  onSave,
}: TimerSettingsModalProps) {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [type, setType] = useState<TimerType>("countdown");
  const [autoLinkToPrevious, setAutoLinkToPrevious] = useState(false);

  // Update form when timer changes
  useEffect(() => {
    if (timer) {
      setName(timer.name);
      setDuration(formatDuration(timer.state.initialTime));
      setType(timer.state.type);
      setAutoLinkToPrevious(timer.autoLinkToPrevious || false);
    }
  }, [timer]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const parseDuration = (durationStr: string): number => {
    const parts = durationStr.split(':').map(p => parseInt(p) || 0);
    let seconds = 0;
    
    if (parts.length === 3) {
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      seconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
      seconds = parts[0];
    }
    
    return Math.max(0, seconds);
  };

  const handleSave = () => {
    if (!timer) return;

    const newDuration = parseDuration(duration);
    const updates: Partial<Timer> = {
      name: name.trim() || timer.name,
      autoLinkToPrevious,
      state: {
        ...timer.state,
        type,
        initialTime: newDuration,
        currentTime: type === "countdown" ? newDuration : timer.state.currentTime,
      },
    };

    onSave(timer.id, updates);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen || !timer) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-neutral-800 border border-neutral-600 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-600">
          <h2 className="text-lg font-medium text-white">Timer Settings</h2>
          <button
            onClick={handleCancel}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Timer Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Timer Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-ctrl w-full h-10 px-3"
              placeholder="Enter timer name..."
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Duration
            </label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="input-ctrl w-full h-10 px-3"
              placeholder="MM:SS or HH:MM:SS"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Format: MM:SS or HH:MM:SS (e.g., 10:00 or 1:30:00)
            </p>
          </div>

          {/* Timer Type */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Timer Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TimerType)}
              className="input-ctrl w-full h-10 px-3"
            >
              <option value="countdown">Countdown</option>
              <option value="countup">Count Up</option>
              <option value="stopwatch">Stopwatch</option>
            </select>
          </div>

          {/* Auto-link Option */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={autoLinkToPrevious}
                onChange={(e) => setAutoLinkToPrevious(e.target.checked)}
                className="w-4 h-4 text-green-600 bg-neutral-700 border-neutral-600 rounded focus:ring-green-500 focus:ring-2"
              />
              <div>
                <span className="text-sm font-medium text-neutral-300">
                  Auto-start when previous timer expires
                </span>
                <p className="text-xs text-neutral-500">
                  This timer will automatically start when the previous timer reaches 0:00
                </p>
              </div>
            </label>
          </div>

          {/* Current Status */}
          <div className="bg-neutral-700/50 rounded p-3">
            <h4 className="text-sm font-medium text-neutral-300 mb-2">Current Status</h4>
            <div className="space-y-1 text-xs text-neutral-400">
              <div>Status: <span className="capitalize">{timer.state.status}</span></div>
              <div>Current Time: {formatDuration(timer.state.currentTime)}</div>
              <div>Order: #{timer.order}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-neutral-600">
          <button
            onClick={handleCancel}
            className="btn-ctrl h-9 px-4 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-ctrl h-9 px-4 text-sm bg-green-800 border-green-600 hover:border-green-400 text-white"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
