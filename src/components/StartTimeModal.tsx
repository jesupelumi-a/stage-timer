import React, { useState, useEffect } from 'react';

interface StartTimeModalProps {
  isOpen: boolean;
  initialStartTime?: string; // HH:MM format
  onSave: (startTime: string) => void;
  onCancel: () => void;
  position: { top: number; left: number };
}

export function StartTimeModal({
  isOpen,
  initialStartTime = '',
  onSave,
  onCancel,
  position,
}: StartTimeModalProps) {
  const [hours, setHours] = useState(12);
  const [minutes, setMinutes] = useState(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('PM');

  // Convert initial start time to hours, minutes, period
  useEffect(() => {
    if (isOpen && initialStartTime) {
      const [timeStr, periodStr] = initialStartTime.split(' ');
      const [h, m] = timeStr.split(':').map(Number);
      setHours(h);
      setMinutes(m);
      setPeriod(periodStr as 'AM' | 'PM');
    } else if (isOpen) {
      // Default to current time + 1 minute
      const now = new Date();
      now.setMinutes(now.getMinutes() + 1);
      const currentHours = now.getHours();
      const displayHours =
        currentHours === 0
          ? 12
          : currentHours > 12
            ? currentHours - 12
            : currentHours;
      setHours(displayHours);
      setMinutes(now.getMinutes());
      setPeriod(currentHours >= 12 ? 'PM' : 'AM');
    }
  }, [isOpen, initialStartTime]);

  const handleSave = () => {
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
    onSave(timeString);
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
        className="absolute z-50 min-w-[260px] rounded-lg border border-neutral-600 bg-neutral-800 p-4 shadow-lg"
        style={{
          top: position.top + 8,
          left: position.left,
        }}
        onKeyDown={handleKeyDown}
      >
        <div className="mb-4">
          <h3 className="mb-1 font-medium text-white">Start Time</h3>
          <p className="text-sm text-neutral-400">
            Set when this timer should be manually started
          </p>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm text-neutral-400">Time</label>
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <input
                type="number"
                min="1"
                max="12"
                value={hours}
                onChange={(e) =>
                  setHours(
                    Math.max(1, Math.min(12, parseInt(e.target.value) || 1))
                  )
                }
                className="w-12 border-none bg-transparent text-center font-mono text-lg text-white outline-none"
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
                className="w-12 border-none bg-transparent text-center font-mono text-lg text-white outline-none"
              />
            </div>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'AM' | 'PM')}
              className="ml-2 rounded border border-neutral-600 bg-neutral-700 px-2 py-1 text-white"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
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
            className="rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
}
