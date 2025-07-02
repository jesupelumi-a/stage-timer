import { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
} from '@heroui/react';

interface StartTimeModalProps {
  isOpen: boolean;
  initialStartTime?: string; // HH:MM:SS AM/PM format
  onSave: (startTime: string) => void;
  onCancel: () => void;
  position?: { top: number; left: number };
}

export function StartTimeModal({
  isOpen,
  initialStartTime,
  onSave,
  onCancel,
}: StartTimeModalProps) {
  const [hours, setHours] = useState(12);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('PM');

  // Parse initial start time
  useEffect(() => {
    if (isOpen && initialStartTime) {
      const timeMatch = initialStartTime.match(
        /(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)/i
      );
      if (timeMatch) {
        const [, h, m, s, period] = timeMatch;
        setHours(parseInt(h));
        setMinutes(parseInt(m));
        setSeconds(parseInt(s));
        setAmpm(period.toUpperCase() as 'AM' | 'PM');
      } else {
        // Fallback to HH:MM AM/PM format for backward compatibility
        const fallbackMatch = initialStartTime.match(
          /(\d{1,2}):(\d{2})\s*(AM|PM)/i
        );
        if (fallbackMatch) {
          const [, h, m, period] = fallbackMatch;
          setHours(parseInt(h));
          setMinutes(parseInt(m));
          setSeconds(0);
          setAmpm(period.toUpperCase() as 'AM' | 'PM');
        }
      }
    } else if (isOpen) {
      // Default to current time
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentSeconds = now.getSeconds();

      setHours(
        currentHours === 0
          ? 12
          : currentHours > 12
            ? currentHours - 12
            : currentHours
      );
      setMinutes(currentMinutes);
      setSeconds(currentSeconds);
      setAmpm(currentHours >= 12 ? 'PM' : 'AM');
    }
  }, [isOpen, initialStartTime]);

  const handleSave = () => {
    const formattedTime = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`;
    onSave(formattedTime);
  };

  const handleCancel = () => {
    onCancel();
  };

  const handleHoursChange = (value: string) => {
    const num = parseInt(value) || 1;
    setHours(Math.max(1, Math.min(12, num)));
  };

  const handleMinutesChange = (value: string) => {
    const num = parseInt(value) || 0;
    setMinutes(Math.max(0, Math.min(59, num)));
  };

  const handleSecondsChange = (value: string) => {
    const num = parseInt(value) || 0;
    setSeconds(Math.max(0, Math.min(59, num)));
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
          Set Start Time
        </ModalHeader>
        <ModalBody>
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center">
              <label className="mb-2 text-sm text-neutral-400">Hour</label>
              <Input
                type="number"
                value={hours.toString()}
                onChange={(e) => handleHoursChange(e.target.value)}
                min="1"
                max="12"
                className="w-16"
                classNames={{
                  input: 'text-center text-white',
                  inputWrapper: 'bg-neutral-200 border-neutral-600',
                }}
              />
            </div>

            <div className="mt-6 text-2xl text-neutral-400">:</div>

            <div className="flex flex-col items-center">
              <label className="mb-2 text-sm text-neutral-400">Minute</label>
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
              <label className="mb-2 text-sm text-neutral-400">Second</label>
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

            <div className="flex flex-col items-center">
              <label className="mb-2 text-sm text-neutral-400">Period</label>
              <Select
                selectedKeys={[ampm]}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as 'AM' | 'PM';
                  if (selectedKey) {
                    setAmpm(selectedKey);
                  }
                }}
                className="w-20"
                variant="bordered"
                color="secondary"
                classNames={{
                  trigger: 'bg-neutral-200 border-neutral-600 ',
                  listboxWrapper: 'text-neutral-800',
                }}
                aria-label="AM or PM period"
              >
                <SelectItem key="AM">AM</SelectItem>
                <SelectItem key="PM">PM</SelectItem>
              </Select>
            </div>
          </div>

          <div className="mt-4 text-center text-sm text-neutral-400">
            Start Time: {hours}:{minutes.toString().padStart(2, '0')}:
            {seconds.toString().padStart(2, '0')} {ampm}
          </div>
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
