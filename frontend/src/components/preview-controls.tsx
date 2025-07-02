import { Button, Popover, PopoverContent, PopoverTrigger } from '@heroui/react';
import {
  MdPlayArrow,
  MdPause,
  MdSkipPrevious,
  MdSkipNext,
} from 'react-icons/md';
import { cn } from '../lib/utils';
import type { Timer } from '@stage-timer/db';
import { useState } from 'react';
import { IoCaretDown } from 'react-icons/io5';

interface PreviewControlsProps {
  timers: Timer[];
  activeTimerId: string | null;
  onSelectTimer: (timerId: string) => void;
  onStartTimer: (timerId: string) => void;
  onPauseTimer: (timerId: string) => void;
  onAdjustTime: (timerId: string, seconds: number) => void;
  isTimerRunning: (timerId: string) => boolean;
  isTimerPaused: (timerId: string) => boolean;
  className?: string;
  // Loading states for backend-first operations
  isStartingTimer?: boolean;
  isPausingTimer?: boolean;
  isAdjustingTimer?: boolean;
  isTimerOperationLoading?: boolean;
}

const subtractOptions = [
  { label: '- 1s', value: -1 },
  { label: '- 10s', value: -10 },
  { label: '- 30s', value: -30 },
  { label: '- 1m', value: -60 },
  { label: '- 5m', value: -300 },
  { label: '- 10m', value: -600 },
  { label: '- 20m', value: -1200 },
  { label: '- 30m', value: -1800 },
];

const addOptions = [
  { label: '+ 1s', value: 1 },
  { label: '+ 10s', value: 10 },
  { label: '+ 30s', value: 30 },
  { label: '+ 1m', value: 60 },
  { label: '+ 5m', value: 300 },
  { label: '+ 10m', value: 600 },
  { label: '+ 20m', value: 1200 },
  { label: '+ 30m', value: 1800 },
];

const buttonClasses =
  'border-neutral-600 bg-neutral-800 text-neutral-400 hover:border-neutral-400 hover:text-white disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:border-neutral-600/50 disabled:text-neutral-400 disabled:opacity-50';

export function PreviewControls({
  timers,
  activeTimerId,
  onSelectTimer,
  onStartTimer,
  onPauseTimer,
  onAdjustTime,
  isTimerRunning,
  isStartingTimer = false,
  isPausingTimer = false,
  isAdjustingTimer = false,
  isTimerOperationLoading = false,
}: PreviewControlsProps) {
  const isRunning = activeTimerId ? isTimerRunning(activeTimerId) : false;
  const [isNegativeOpen, setIsNegativeOpen] = useState(false);
  const [isPositiveOpen, setIsPositiveOpen] = useState(false);

  const disabled = !activeTimerId || isTimerOperationLoading;

  const handlePrevTimer = () => {
    if (!activeTimerId || timers.length === 0) return;

    const currentIndex = timers.findIndex(
      (t) => t.id.toString() === activeTimerId
    );
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : timers.length - 1;
    onSelectTimer(timers[prevIndex].id.toString());
  };

  const handleNextTimer = () => {
    if (!activeTimerId || timers.length === 0) return;

    const currentIndex = timers.findIndex(
      (t) => t.id.toString() === activeTimerId
    );
    const nextIndex = currentIndex < timers.length - 1 ? currentIndex + 1 : 0;
    onSelectTimer(timers[nextIndex].id.toString());
  };

  const handlePlayPause = () => {
    if (!activeTimerId) return;

    if (isRunning) {
      onPauseTimer(activeTimerId);
    } else {
      onStartTimer(activeTimerId);
    }
  };

  const handleAdjustTime = (seconds: number) => {
    if (!activeTimerId) return;
    onAdjustTime(activeTimerId, seconds);
  };

  return (
    <section className="flex justify-center space-x-2">
      <div className="flex max-w-[100px]">
        <Popover
          placement="bottom-start"
          isOpen={isNegativeOpen}
          onOpenChange={setIsNegativeOpen}
        >
          <PopoverTrigger>
            <Button
              isIconOnly
              size="md"
              variant="bordered"
              onPress={() => {}}
              disabled={disabled}
              className={cn(
                buttonClasses,
                'w-8 min-w-0 rounded-r-none border-r-0 relative'
              )}
            >
              <IoCaretDown className="size-3" />
              {isTimerOperationLoading && (
                <span className="absolute inset-0 animate-stripes bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px]"></span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="rounded-lg bg-neutral-800 p-1">
            <ul>
              {subtractOptions.map((option) => (
                <li
                  key={option.value}
                  onClick={() => {
                    handleAdjustTime(option.value);
                    setIsNegativeOpen(false);
                  }}
                  className="cursor-pointer rounded-md px-2 py-1 text-sm text-neutral-100 hover:bg-neutral-500"
                >
                  {option.label}
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>

        <Button
          size="md"
          variant="bordered"
          onPress={() => handleAdjustTime(-60)}
          disabled={disabled}
          className={cn(buttonClasses, 'min-w-0 rounded-l-none relative')}
        >
          {!(isAdjustingTimer || isTimerOperationLoading) && '-1m'}
          {(isAdjustingTimer || isTimerOperationLoading) && (
            <span className="absolute inset-0 animate-stripes bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px]"></span>
          )}
        </Button>
      </div>

      {/* Previous Timer Button */}
      <Button
        isIconOnly
        size="md"
        variant="bordered"
        onPress={handlePrevTimer}
        disabled={!activeTimerId || timers.length <= 1 || isTimerOperationLoading}
        className={cn(buttonClasses, 'flex-auto relative')}
      >
        <MdSkipPrevious className="h-4 w-4" />
        {isTimerOperationLoading && (
          <span className="absolute inset-0 animate-stripes bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px]"></span>
        )}
      </Button>

      {/* Play/Pause Button */}
      <Button
        isIconOnly
        size="md"
        variant="bordered"
        onPress={handlePlayPause}
        disabled={disabled}
        className={cn(
          'flex-auto relative',
          buttonClasses,
          isRunning
            ? 'text-red-500 hover:bg-red-600 hover:text-white'
            : 'text-green-500 hover:bg-green-600 hover:text-white',
          (isStartingTimer || isPausingTimer || isTimerOperationLoading) &&
            'text-neutral-200 hover:bg-neutral-800 hover:text-neutral-200'
        )}
      >
        {isRunning ? (
          <MdPause className="h-5 w-5" />
        ) : (
          <MdPlayArrow className="h-5 w-5" />
        )}
        {(isStartingTimer || isPausingTimer || isTimerOperationLoading) && (
          <span className="absolute inset-0 animate-stripes bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px]"></span>
        )}
      </Button>

      {/* Next Timer Button */}
      <Button
        isIconOnly
        size="md"
        variant="bordered"
        onPress={handleNextTimer}
        disabled={!activeTimerId || timers.length <= 1 || isTimerOperationLoading}
        className={cn(buttonClasses, 'flex-auto relative')}
      >
        <MdSkipNext className="h-4 w-4" />
        {isTimerOperationLoading && (
          <span className="absolute inset-0 animate-stripes bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px]"></span>
        )}
      </Button>

      <div className="flex max-w-[100px]">
        <Button
          size="md"
          variant="bordered"
          onPress={() => handleAdjustTime(60)}
          disabled={disabled}
          className={cn(buttonClasses, 'min-w-0 rounded-r-none relative')}
        >
          {!(isAdjustingTimer || isTimerOperationLoading) && '+1m'}
          {(isAdjustingTimer || isTimerOperationLoading) && (
            <span className="absolute inset-0 animate-stripes bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px]"></span>
          )}
        </Button>

        <Popover
          placement="bottom-end"
          isOpen={isPositiveOpen}
          onOpenChange={setIsPositiveOpen}
        >
          <PopoverTrigger>
            <Button
              isIconOnly
              size="md"
              variant="bordered"
              onPress={() => {}}
              disabled={!activeTimerId || isTimerOperationLoading}
              className={cn(
                buttonClasses,
                'w-8 min-w-0 rounded-l-none border-l-0 relative'
              )}
            >
              <IoCaretDown className="size-3" />
              {isTimerOperationLoading && (
                <span className="absolute inset-0 animate-stripes bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px]"></span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="rounded-lg bg-neutral-800 p-1">
            <ul>
              {addOptions.map((option) => (
                <li
                  key={option.value}
                  onClick={() => {
                    handleAdjustTime(option.value);
                    setIsPositiveOpen(false);
                  }}
                  className="cursor-pointer rounded-md px-2 py-1 text-sm text-neutral-100 hover:bg-neutral-500"
                >
                  {option.label}
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      </div>
    </section>
  );
}
