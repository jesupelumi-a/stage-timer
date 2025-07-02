import { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Checkbox,
} from '@heroui/react';

interface DurationModalProps {
  isOpen: boolean;
  initialDuration: number; // in milliseconds
  onSave: (duration: number) => void;
  onCancel: () => void;
  position?: { top: number; left: number };
  startTime?: string; // Optional start time for end time calculation
}

export function DurationModal({
  isOpen,
  initialDuration,
  onSave,
  onCancel,
  startTime = '12:00:00 PM',
}: DurationModalProps) {
  const [mode, setMode] = useState<'duration' | 'endTime'>('duration');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [endTime, setEndTime] = useState('');
  const [endDate, setEndDate] = useState('');

  // Convert initial duration from milliseconds to hours, minutes, seconds
  useEffect(() => {
    if (isOpen) {
      const totalSeconds = Math.floor(initialDuration / 1000);
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;

      setHours(h);
      setMinutes(m);
      setSeconds(s);

      // Set default end time/date for end time mode and sync
      const now = new Date();
      const endDateTime = new Date(now.getTime() + initialDuration);
      setEndDate(endDateTime.toISOString().split('T')[0]); // YYYY-MM-DD format
      setEndTime(endDateTime.toTimeString().slice(0, 5)); // HH:MM format

      // Initialize sync between duration and end time
      updateEndTimeFromDuration(h, m, s);
    }
  }, [isOpen, initialDuration, startTime]);

  // Calculate duration from end time
  const calculateDurationFromEndTime = () => {
    if (!endDate || !endTime) return 0;

    const endDateTime = new Date(`${endDate}T${endTime}`);
    const startDateTime = parseStartTime(startTime);

    const diffMs = endDateTime.getTime() - startDateTime.getTime();
    return Math.max(0, diffMs);
  };

  // Parse start time string to Date object
  const parseStartTime = (timeStr: string) => {
    const now = new Date();
    // Handle both HH:MM:SS AM/PM and HH:MM AM/PM formats
    const timeMatch = timeStr.match(
      /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)/i
    );
    if (!timeMatch) return now;

    const [, hoursStr, minutesStr, secondsStr = '0', period] = timeMatch;
    const hours = parseInt(hoursStr);
    const minutes = parseInt(minutesStr);
    const seconds = parseInt(secondsStr);

    let hour24 = hours;
    if (period.toUpperCase() === 'PM' && hours !== 12) hour24 += 12;
    if (period.toUpperCase() === 'AM' && hours === 12) hour24 = 0;

    const startDate = new Date(now);
    startDate.setHours(hour24, minutes, seconds, 0);

    return startDate;
  };

  const handleSave = () => {
    let totalMs: number;

    if (mode === 'duration') {
      // Convert back to milliseconds
      totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
    } else {
      // Calculate duration from end time
      totalMs = calculateDurationFromEndTime();
    }

    onSave(totalMs);
  };

  const handleCancel = () => {
    onCancel();
  };

  const handleHoursChange = (value: string) => {
    const num = parseInt(value) || 0;
    const newHours = Math.max(0, Math.min(23, num));
    setHours(newHours);

    // Update end time based on new duration
    updateEndTimeFromDuration(newHours, minutes, seconds);
  };

  const handleMinutesChange = (value: string) => {
    const num = parseInt(value) || 0;
    const newMinutes = Math.max(0, Math.min(59, num));
    setMinutes(newMinutes);

    // Update end time based on new duration
    updateEndTimeFromDuration(hours, newMinutes, seconds);
  };

  const handleSecondsChange = (value: string) => {
    const num = parseInt(value) || 0;
    const newSeconds = Math.max(0, Math.min(59, num));
    setSeconds(newSeconds);

    // Update end time based on new duration
    updateEndTimeFromDuration(hours, minutes, newSeconds);
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);

    // Update duration based on new end date/time
    updateDurationFromEndTime(value, endTime);
  };

  const handleEndTimeChange = (value: string) => {
    setEndTime(value);

    // Update duration based on new end date/time
    updateDurationFromEndTime(endDate, value);
  };

  // Update end date/time when duration changes
  const updateEndTimeFromDuration = (h: number, m: number, s: number) => {
    const startDateTime = parseStartTime(startTime);
    const durationMs = (h * 3600 + m * 60 + s) * 1000;
    const endDateTime = new Date(startDateTime.getTime() + durationMs);

    setEndDate(endDateTime.toISOString().split('T')[0]); // YYYY-MM-DD format
    setEndTime(endDateTime.toTimeString().slice(0, 5)); // HH:MM format
  };

  // Update duration when end date/time changes
  const updateDurationFromEndTime = (date: string, time: string) => {
    if (!date || !time) return;

    const endDateTime = new Date(`${date}T${time}`);
    const startDateTime = parseStartTime(startTime);
    const diffMs = Math.max(0, endDateTime.getTime() - startDateTime.getTime());

    const totalSeconds = Math.floor(diffMs / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    setHours(h);
    setMinutes(m);
    setSeconds(s);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      placement="center"
      size="md"
      classNames={{
        base: 'bg-neutral-800 text-white',
        header: 'border-b border-neutral-700',
        footer: 'border-t border-neutral-700',
        closeButton: 'text-white hover:bg-neutral-700',
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          Set Timer Duration
        </ModalHeader>
        <ModalBody>
          {mode === 'duration' ? (
            <>
              <div className="flex items-center justify-center gap-4">
                <div className="flex flex-col items-center">
                  <label className="mb-2 text-sm text-neutral-400">Hours</label>
                  <Input
                    type="number"
                    value={hours.toString()}
                    onChange={(e) => handleHoursChange(e.target.value)}
                    min="0"
                    max="23"
                    className="w-16"
                    classNames={{
                      input: 'text-center text-white',
                      inputWrapper: 'bg-neutral-200 border-neutral-600',
                    }}
                  />
                </div>

                <div className="mt-6 text-2xl text-neutral-400">:</div>

                <div className="flex flex-col items-center">
                  <label className="mb-2 text-sm text-neutral-400">
                    Minutes
                  </label>
                  <Input
                    type="number"
                    value={minutes.toString().padStart(2, '0')}
                    onChange={(e) => handleMinutesChange(e.target.value)}
                    min="0"
                    max="59"
                    className="w-16"
                    classNames={{
                      input: 'text-center text-white',
                      inputWrapper: 'bg-neutral-200 border-neutral-600',
                    }}
                  />
                </div>

                <div className="mt-6 text-2xl text-neutral-400">:</div>

                <div className="flex flex-col items-center">
                  <label className="mb-2 text-sm text-neutral-400">
                    Seconds
                  </label>
                  <Input
                    type="number"
                    value={seconds.toString().padStart(2, '0')}
                    onChange={(e) => handleSecondsChange(e.target.value)}
                    min="0"
                    max="59"
                    className="w-16"
                    classNames={{
                      input: 'text-center text-white',
                      inputWrapper: 'bg-neutral-200 border-neutral-600',
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 text-center text-sm text-neutral-400">
                End Time:{' '}
                <span className="font-medium text-white">
                  {(() => {
                    const startDateTime = parseStartTime(startTime);
                    const durationMs =
                      (hours * 3600 + minutes * 60 + seconds) * 1000;
                    const endDateTime = new Date(
                      startDateTime.getTime() + durationMs
                    );
                    return endDateTime.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true,
                    });
                  })()}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="text-center text-sm text-neutral-400">
                  Timer will start at:{' '}
                  <span className="font-medium text-white">{startTime}</span>
                </div>

                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="mb-2 block text-sm text-neutral-400">
                      End Date
                    </label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                      classNames={{
                        input: 'text-white',
                        inputWrapper: 'bg-neutral-200 border-neutral-600',
                      }}
                    />
                  </div>

                  <div className="flex-1">
                    <label className="mb-2 block text-sm text-neutral-400">
                      End Time
                    </label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => handleEndTimeChange(e.target.value)}
                      step={2}
                      classNames={{
                        input: 'text-white',
                        inputWrapper: 'bg-neutral-200 border-neutral-600',
                      }}
                    />
                  </div>
                </div>

                <div className="mt-4 text-center text-sm text-neutral-400">
                  {endDate && endTime && (
                    <>
                      Duration:{' '}
                      <span className="font-medium text-white">
                        {(() => {
                          const durationHours = Math.floor(
                            calculateDurationFromEndTime() / 3600000
                          );
                          const durationMinutes = Math.floor(
                            (calculateDurationFromEndTime() % 3600000) / 60000
                          );
                          const durationSeconds = Math.floor(
                            (calculateDurationFromEndTime() % 60000) / 1000
                          );

                          let result = '';
                          if (durationHours > 0) result += `${durationHours}h `;
                          if (durationMinutes > 0 || durationHours > 0)
                            result += `${durationMinutes}m `;
                          result += `${durationSeconds}s`;

                          return result;
                        })()}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          <Checkbox
            isSelected={mode === 'endTime'}
            onValueChange={(checked) =>
              setMode(checked ? 'endTime' : 'duration')
            }
            classNames={{
              label: 'text-sm text-neutral-300',
            }}
            className="mx-auto mt-6 flex items-center justify-center"
          >
            Set end time instead of duration
          </Checkbox>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="bordered"
            onPress={handleCancel}
            className="border-neutral-600 text-white hover:bg-neutral-700"
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleSave}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
