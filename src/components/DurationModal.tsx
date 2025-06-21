import React, { useState, useEffect } from 'react';

interface DurationModalProps {
  isOpen: boolean;
  initialDuration: number; // in seconds
  onSave: (duration: number) => void;
  onCancel: () => void;
  position: { top: number; left: number };
}

export function DurationModal({
  isOpen,
  initialDuration,
  onSave,
  onCancel,
  position,
}: DurationModalProps) {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(10); // Default to 10 minutes
  const [seconds, setSeconds] = useState(0);

  // Convert initial duration to hours, minutes, seconds
  useEffect(() => {
    if (isOpen) {
      if (initialDuration > 0) {
        const h = Math.floor(initialDuration / 3600);
        const m = Math.floor((initialDuration % 3600) / 60);
        const s = initialDuration % 60;
        setHours(h);
        setMinutes(m);
        setSeconds(s);
      } else {
        // Default to 10 minutes for countdown
        setHours(0);
        setMinutes(10);
        setSeconds(0);
      }
    }
  }, [isOpen, initialDuration]);

  const handleSave = () => {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    onSave(totalSeconds);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onCancel} />

      {/* Modal */}
      <div
        className="absolute z-50 min-w-[280px] rounded-lg border border-neutral-600 bg-neutral-800 p-4 shadow-lg"
        style={{
          top: position.top + 8,
          left: position.left,
        }}
        onKeyDown={handleKeyDown}
      >
        <div className="mb-4">
          <h3 className="mb-1 font-medium text-white">Duration</h3>
          <p className="text-sm text-neutral-400">
            Ends at{' '}
            {new Date(
              Date.now() + (hours * 3600 + minutes * 60 + seconds) * 1000
            ).toLocaleTimeString()}{' '}
            Today (WAT). Counting down from{' '}
            {hours > 0 ? `${hours} hour${hours !== 1 ? 's' : ''} ` : ''}
            {minutes} min${minutes !== 1 ? 's' : ''}.
          </p>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm text-neutral-400">
            Duration ⓘ
          </label>
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <input
                type="number"
                min="0"
                max="23"
                value={hours.toString().padStart(2, '0')}
                onChange={(e) =>
                  setHours(
                    Math.max(0, Math.min(23, parseInt(e.target.value) || 0))
                  )
                }
                className="w-12 border-none bg-transparent text-center font-mono text-lg text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                autoFocus
              />
            </div>
            <span className="text-lg text-white">:</span>
            <div className="flex items-center">
              <input
                type="number"
                min="0"
                max="59"
                value={minutes.toString().padStart(2, '0')}
                onChange={(e) =>
                  setMinutes(
                    Math.max(0, Math.min(59, parseInt(e.target.value) || 0))
                  )
                }
                className="w-12 border-none bg-transparent text-center font-mono text-lg text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
            <span className="text-lg text-white">:</span>
            <div className="flex items-center">
              <input
                type="number"
                min="0"
                max="59"
                value={seconds.toString().padStart(2, '0')}
                onChange={(e) =>
                  setSeconds(
                    Math.max(0, Math.min(59, parseInt(e.target.value) || 0))
                  )
                }
                className="w-12 border-none bg-transparent text-center font-mono text-lg text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm text-neutral-400">
            Appearance
          </label>
          <select className="w-full rounded border border-neutral-600 bg-neutral-700 px-3 py-2 text-white">
            <option>Countdown</option>
          </select>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-neutral-400 transition-colors hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
}
