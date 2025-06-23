import { useState } from 'react';
import type { TimerState, TimerType, TimerPreset } from '../types';
import { formatTime } from '../utils/time';

interface TimersTabProps {
  timer: TimerState;
  timerPresets: TimerPreset[];
  onSetTimer: (duration: number, type: TimerType) => void;
  onCreateTimer: (name: string, duration: number, type: TimerType) => void;
  onDeleteTimer: (id: string) => void;
  className?: string;
}

export function TimersTab({
  timer,
  timerPresets,
  onSetTimer,
  onCreateTimer,
  onDeleteTimer,
  className = '',
}: TimersTabProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTimerName, setNewTimerName] = useState('');
  const [newTimerHours, setNewTimerHours] = useState(0);
  const [newTimerMinutes, setNewTimerMinutes] = useState(5);
  const [newTimerSeconds, setNewTimerSeconds] = useState(0);
  const [newTimerType, setNewTimerType] = useState<TimerType>('countdown');

  const handleCreateTimer = () => {
    if (newTimerName.trim()) {
      const duration =
        newTimerHours * 3600 + newTimerMinutes * 60 + newTimerSeconds;
      onCreateTimer(newTimerName.trim(), duration, newTimerType);

      // Reset form
      setNewTimerName('');
      setNewTimerHours(0);
      setNewTimerMinutes(5);
      setNewTimerSeconds(0);
      setNewTimerType('countdown');
      setShowCreateForm(false);
    }
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
    setNewTimerName('');
    setNewTimerHours(0);
    setNewTimerMinutes(5);
    setNewTimerSeconds(0);
    setNewTimerType('countdown');
  };

  return (
    <div className={`timers-tab space-y-6 ${className}`}>
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Timers</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
        >
          + Create Timer
        </button>
      </div>

      {/* Create Timer Form */}
      {showCreateForm && (
        <div className="rounded-lg border bg-gray-50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Create New Timer
          </h3>

          <div className="space-y-4">
            {/* Timer Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Timer Name
              </label>
              <input
                type="text"
                value={newTimerName}
                onChange={(e) => setNewTimerName(e.target.value)}
                placeholder="Enter timer name..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Timer Type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Timer Type
              </label>
              <select
                value={newTimerType}
                onChange={(e) => setNewTimerType(e.target.value as TimerType)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="countdown">Countdown</option>
                <option value="countup">Count Up</option>
                <option value="stopwatch">Stopwatch</option>
              </select>
            </div>

            {/* Duration (only for countdown) */}
            {newTimerType === 'countdown' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Duration
                </label>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-gray-500">
                      Hours
                    </label>
                    <input
                      type="number"
                      value={newTimerHours}
                      onChange={(e) =>
                        setNewTimerHours(
                          Math.max(0, parseInt(e.target.value) || 0)
                        )
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
                      value={newTimerMinutes}
                      onChange={(e) =>
                        setNewTimerMinutes(
                          Math.max(
                            0,
                            Math.min(59, parseInt(e.target.value) || 0)
                          )
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
                      value={newTimerSeconds}
                      onChange={(e) =>
                        setNewTimerSeconds(
                          Math.max(
                            0,
                            Math.min(59, parseInt(e.target.value) || 0)
                          )
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

            {/* Form Actions */}
            <div className="flex space-x-3">
              <button
                onClick={handleCreateTimer}
                disabled={
                  !newTimerName.trim() ||
                  (newTimerType === 'countdown' &&
                    newTimerHours + newTimerMinutes + newTimerSeconds === 0)
                }
                className="rounded-md bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                Create Timer
              </button>
              <button
                onClick={handleCancelCreate}
                className="rounded-md bg-gray-600 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timers List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Available Timers
        </h3>

        {timerPresets.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <p>No timers created yet.</p>
            <p className="mt-1 text-sm">
              Click "Create Timer" to add your first timer.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {timerPresets.map((preset) => (
              <TimerCard
                key={preset.id}
                preset={preset}
                isActive={
                  timer.type === preset.type &&
                  timer.initialTime === preset.duration
                }
                onSelect={() => onSetTimer(preset.duration, preset.type)}
                onDelete={() => onDeleteTimer(preset.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface TimerCardProps {
  preset: TimerPreset;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function TimerCard({ preset, isActive, onSelect, onDelete }: TimerCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete();
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      // Auto-cancel after 3 seconds
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  const getTypeIcon = (type: TimerType) => {
    switch (type) {
      case 'countdown':
        return '⏰';
      case 'countup':
        return '⏱️';
      case 'stopwatch':
        return '⏲️';
      default:
        return '⏰';
    }
  };

  const getTypeColor = (type: TimerType) => {
    switch (type) {
      case 'countdown':
        return 'bg-blue-100 text-blue-800';
      case 'countup':
        return 'bg-green-100 text-green-800';
      case 'stopwatch':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      className={`timer-card cursor-pointer rounded-lg border-2 p-4 transition-all ${
        isActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
      } `}
      onClick={onSelect}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getTypeIcon(preset.type)}</span>
          <h4 className="truncate font-semibold text-gray-900">
            {preset.name}
          </h4>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          className={`rounded px-2 py-1 text-xs transition-colors ${
            showDeleteConfirm
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'text-gray-400 hover:text-red-600'
          } `}
          title={
            showDeleteConfirm
              ? 'Click again to confirm deletion'
              : 'Delete timer'
          }
        >
          {showDeleteConfirm ? 'Confirm' : '🗑️'}
        </button>
      </div>

      <div className="space-y-2">
        <div
          className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getTypeColor(
            preset.type
          )}`}
        >
          {preset.type}
        </div>

        {preset.type === 'countdown' && (
          <div className="font-mono text-2xl font-bold text-gray-900">
            {formatTime(preset.duration)}
          </div>
        )}

        {preset.type !== 'countdown' && (
          <div className="text-sm text-gray-600">
            {preset.type === 'countup'
              ? 'Counts up from 00:00'
              : 'Stopwatch timer'}
          </div>
        )}
      </div>

      {isActive && (
        <div className="mt-3 text-xs font-medium text-blue-600">
          ✓ Currently Active
        </div>
      )}
    </div>
  );
}
