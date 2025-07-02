import { useState, useEffect } from 'react';
import { Button } from '@heroui/react';
import { MdAdd } from 'react-icons/md';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import type { Timer } from '@stage-timer/db';
import { TimerCard } from './timer-card';
import { SortableTimerCard } from './sortable-timer-card';
import { formatTo12Hour } from '../../lib/utils';

interface TimerListProps {
  timers: Timer[];
  activeTimerId: string | null;
  isTimerRunning: (timerId: string) => boolean;
  isTimerLoading: (timerId: string) => boolean;
  getTimerCurrentTime: (timerId: string) => number | undefined;
  getTimerSession: (timerId: string) => {
    timerId: number;
    isRunning: boolean;
    currentTime: number;
    kickoff?: number;
    deadline?: number;
    status: 'running' | 'paused' | 'stopped';
  } | null;
  // isTimerPaused: (timerId: string) => boolean;
  onStart: (timerId: string) => void;
  onPause: (timerId: string) => void;
  onReset: (timerId: string) => void;
  onSelect: (timerId: string) => void;
  onSettings: (timerId: string) => void;
  onDelete: (timerId: string) => void;
  onDurationChange: (timerId: string, duration: number) => void;
  onTypeChange: (timerId: string, type: string) => void;
  onNameChange: (timerId: string, name: string) => void;
  onStartTimeChange: (timerId: string, startTime: string) => void;
  onReorder: (timerIds: number[]) => void;
  onCreate: () => void;
  isCreating: boolean;
}

export const TimerList = ({
  timers,
  activeTimerId,
  isTimerRunning,
  isTimerLoading,
  getTimerCurrentTime,
  getTimerSession,
  // isTimerPaused,
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
  onReorder,
  onCreate,
  isCreating,
}: TimerListProps) => {
  const [activeTimer, setActiveTimer] = useState<Timer | null>(null);
  const [localTimers, setLocalTimers] = useState<Timer[]>(timers);

  // Update local timers when props change
  useEffect(() => {
    setLocalTimers(timers);
  }, [timers]);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Only start dragging after moving 8px
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Wait 250ms before starting drag on touch
        tolerance: 5,
      },
    })
  );

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const timer = localTimers.find((t) => t.id.toString() === active.id);
    setActiveTimer(timer || null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTimer(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localTimers.findIndex(
      (t) => t.id.toString() === active.id
    );
    const newIndex = localTimers.findIndex((t) => t.id.toString() === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      // Update local state immediately for smooth UI
      const newTimers = arrayMove(localTimers, oldIndex, newIndex);
      setLocalTimers(newTimers);

      // Extract timer IDs in new order for backend update
      const reorderedIds = newTimers.map((timer) => timer.id);
      onReorder(reorderedIds);
    }
  }

  const sortableIds = localTimers.map((timer) => timer.id.toString());

  return timers && timers.length > 0 ? (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-3">
        <SortableContext
          items={sortableIds}
          strategy={verticalListSortingStrategy}
        >
          {localTimers.map((timer, index) => (
            <SortableTimerCard
              key={timer.id}
              timer={timer}
              timerIndex={index + 1}
              isActive={timer.id.toString() === activeTimerId}
              isRunning={isTimerRunning(timer.id.toString())}
              startTime={
                timer.startTime
                  ? formatTo12Hour(new Date(timer.startTime))
                  : undefined
              }
              isLoading={isTimerLoading(timer.id.toString())}
              currentTime={getTimerCurrentTime(timer.id.toString())}
              serverTimerState={getTimerSession(timer.id.toString())}
              onStart={() => onStart(timer.id.toString())}
              onPause={() => onPause(timer.id.toString())}
              onReset={() => onReset(timer.id.toString())}
              onSelect={() => onSelect(timer.id.toString())}
              onSettings={() => onSettings(timer.id.toString())}
              onDelete={() => onDelete(timer.id.toString())}
              onDurationChange={(newDuration: number) =>
                onDurationChange(timer.id.toString(), newDuration)
              }
              onTypeChange={(newType: string) =>
                onTypeChange(timer.id.toString(), newType)
              }
              onNameChange={(newName: string) =>
                onNameChange(timer.id.toString(), newName)
              }
              onStartTimeChange={(startTime: string) =>
                onStartTimeChange(timer.id.toString(), startTime)
              }
            />
          ))}
        </SortableContext>

        <DragOverlay>
          {activeTimer ? (
            <TimerCard
              timer={activeTimer}
              timerIndex={
                localTimers.findIndex((t) => t.id === activeTimer.id) + 1
              }
              isActive={activeTimer.id.toString() === activeTimerId}
              isRunning={isTimerRunning(activeTimer.id.toString())}
              startTime={
                activeTimer.startTime
                  ? formatTo12Hour(new Date(activeTimer.startTime))
                  : undefined
              }
              isLoading={false}
              serverTimerState={getTimerSession(activeTimer.id.toString())}
              onStart={() => {}}
              onPause={() => {}}
              onReset={() => {}}
              onSelect={() => {}}
              onSettings={() => {}}
              onDelete={() => {}}
              onDurationChange={() => {}}
              onTypeChange={() => {}}
              onNameChange={() => {}}
              onStartTimeChange={() => {}}
              className="rotate-3 shadow-2xl"
            />
          ) : null}
        </DragOverlay>

        <Button
          onPress={onCreate}
          variant="bordered"
          isLoading={isCreating}
          className="mx-auto border-neutral-600 bg-neutral-800 text-white hover:border-neutral-400"
        >
          <MdAdd size={18} />
          Add Timer
        </Button>
      </div>
    </DndContext>
  ) : (
    <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-neutral-600 text-neutral-400">
      <p className="text-lg">No timers yet</p>
      <Button
        onPress={onCreate}
        variant="bordered"
        isLoading={isCreating}
        className="border-neutral-600 bg-neutral-800 text-white hover:border-neutral-400"
      >
        <MdAdd size={18} />
        Create Your First Timer
      </Button>
    </div>
  );
};
