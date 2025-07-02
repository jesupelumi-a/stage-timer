import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MdOutlineDragHandle } from 'react-icons/md';
import type { Timer } from '@stage-timer/db';
import { TimerCard } from './timer-card';
import { cn } from '../../lib/utils';

interface SortableTimerCardProps {
  timer: Timer;
  timerIndex: number;
  isActive: boolean;
  isRunning: boolean;
  startTime?: string;
  isLoading?: boolean;
  currentTime?: number;
  serverTimerState?: {
    timerId: number;
    isRunning: boolean;
    currentTime: number;
    kickoff?: number;
    deadline?: number;
    status: 'running' | 'paused' | 'stopped';
  } | null;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSelect: () => void;
  onSettings: () => void;
  onDelete: () => void;
  onDurationChange: (newDuration: number) => void;
  onTypeChange: (newType: string) => void;
  onNameChange?: (newName: string) => void;
  onStartTimeChange?: (startTime: string) => void;
}

export function SortableTimerCard({
  timer,
  timerIndex,
  isActive,
  isRunning,
  startTime,
  isLoading = false,
  currentTime,
  serverTimerState,
  onStart,
  onPause,
  onReset,
  onSelect,
  onSettings,
  onDelete,
  onDurationChange,
  onTypeChange,
  onNameChange,
  onStartTimeChange,
}: SortableTimerCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: timer.id.toString(),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('relative', isDragging && 'z-50 opacity-50')}
    >
      <TimerCard
        timer={timer}
        timerIndex={timerIndex}
        isActive={isActive}
        isRunning={isRunning}
        startTime={startTime}
        isLoading={isLoading}
        currentTime={currentTime}
        serverTimerState={serverTimerState}
        onStart={onStart}
        onPause={onPause}
        onReset={onReset}
        onSelect={onSelect}
        onSettings={onSettings}
        onDelete={onDelete}
        onDurationChange={onDurationChange}
        onTypeChange={onTypeChange}
        onNameChange={onNameChange}
        onStartTimeChange={onStartTimeChange}
        dragHandle={
          <button
            {...attributes}
            {...listeners}
            className={cn(
              'absolute -left-2 top-1/2 z-20 -translate-y-1/2 rounded text-neutral-400 opacity-0 transition-all duration-200 hover:text-white group-hover:opacity-100',
              isActive && 'text-blue-400',
              isRunning && 'text-red-400',
              isDragging && 'opacity-100'
            )}
            title="Drag to reorder"
          >
            <MdOutlineDragHandle size={24} />
          </button>
        }
      />
    </div>
  );
}
