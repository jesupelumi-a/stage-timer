import { useState } from 'react';
import { useStageTimer } from '../hooks/use-stage-timer';
import { useUIStore } from '../stores/ui-store';
import { TimerPreview } from './timer-preview';
import { formatDuration } from '../lib/utils';
import { cn } from '../lib/utils';
import type { Timer } from '@stage-timer/db';

interface TimerListProps {
  roomSlug: string;
  className?: string;
  showPreviews?: boolean;
  isController?: boolean;
}

export function TimerList({ 
  roomSlug, 
  className = '',
  showPreviews = true,
  isController = false 
}: TimerListProps) {
  const [selectedTimerId, setSelectedTimerId] = useState<number | null>(null);
  
  const { activeTimerId, setActiveTimerId } = useUIStore();
  const { 
    timers, 
    isLoadingTimers, 
    timersError,
    startTimer,
    pauseTimer,
    stopTimer,
    resetTimer,
    deleteTimer
  } = useStageTimer({ roomSlug, isController });
  
  // Handle timer selection
  const handleTimerSelect = (timer: Timer) => {
    setSelectedTimerId(timer.id);
    setActiveTimerId(timer.id.toString());
  };
  
  // Handle timer actions
  const handleStartTimer = (timerId: number) => {
    startTimer(timerId);
  };
  
  const handlePauseTimer = (timerId: number) => {
    pauseTimer(timerId);
  };
  
  const handleStopTimer = (timerId: number) => {
    stopTimer(timerId);
  };
  
  const handleResetTimer = (timerId: number) => {
    resetTimer(timerId);
  };
  
  const handleDeleteTimer = async (timerId: number) => {
    if (confirm('Are you sure you want to delete this timer?')) {
      await deleteTimer(timerId);
      if (selectedTimerId === timerId) {
        setSelectedTimerId(null);
        setActiveTimerId(null);
      }
    }
  };
  
  const handleDuplicateTimer = async (timer: Timer) => {
    // Implementation would create a new timer with same settings
    console.log('Duplicate timer:', timer);
  };
  
  // Loading state
  if (isLoadingTimers) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }
  
  // Error state
  if (timersError) {
    return (
      <div className={cn('p-4 bg-red-900/20 border border-red-500 rounded-lg', className)}>
        <p className="text-red-400">Failed to load timers: {timersError.message}</p>
      </div>
    );
  }
  
  // Empty state
  if (!timers || timers.length === 0) {
    return (
      <div className={cn('p-8 text-center text-neutral-400', className)}>
        <p>No timers found.</p>
        {isController && (
          <p className="text-sm mt-2">Create your first timer to get started.</p>
        )}
      </div>
    );
  }
  
  return (
    <div className={cn('space-y-4', className)}>
      {/* Timer List */}
      <div className="space-y-2">
        {timers.map((timer) => (
          <div
            key={timer.id}
            className={cn(
              'border rounded-lg p-4 cursor-pointer transition-all duration-200',
              selectedTimerId === timer.id
                ? 'border-blue-500 bg-blue-900/20'
                : 'border-neutral-700 hover:border-neutral-600 bg-neutral-900/50'
            )}
            onClick={() => handleTimerSelect(timer)}
          >
            {/* Timer Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-white">{timer.name}</h3>
                <span className="text-xs px-2 py-1 bg-neutral-700 rounded text-neutral-300">
                  {timer.appearance}
                </span>
                <span className="text-xs px-2 py-1 bg-neutral-700 rounded text-neutral-300">
                  {timer.type}
                </span>
              </div>
              
              {isController && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicateTimer(timer);
                    }}
                    className="text-xs px-2 py-1 bg-neutral-600 hover:bg-neutral-500 rounded text-white"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTimer(timer.id);
                    }}
                    className="text-xs px-2 py-1 bg-red-600 hover:bg-red-500 rounded text-white"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
            
            {/* Timer Info */}
            <div className="grid grid-cols-2 gap-4 text-sm text-neutral-300">
              <div>
                <span className="text-neutral-500">Duration:</span>
                <span className="ml-2">{formatDuration(timer.durationMs)}</span>
              </div>
              <div>
                <span className="text-neutral-500">Index:</span>
                <span className="ml-2">{timer.index}</span>
              </div>
            </div>
            
            {/* Timer Notes */}
            {timer.notes && (
              <p className="text-sm text-neutral-400 mt-2">{timer.notes}</p>
            )}
            
            {/* Timer Controls */}
            {isController && selectedTimerId === timer.id && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-neutral-700">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartTimer(timer.id);
                  }}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                >
                  Start
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePauseTimer(timer.id);
                  }}
                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm"
                >
                  Pause
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStopTimer(timer.id);
                  }}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                >
                  Stop
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetTimer(timer.id);
                  }}
                  className="px-3 py-1 bg-neutral-600 hover:bg-neutral-700 text-white rounded text-sm"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Timer Previews */}
      {showPreviews && selectedTimerId && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-white mb-4">Preview</h4>
          {timers
            .filter(timer => timer.id === selectedTimerId)
            .map(timer => (
              <TimerPreview
                key={timer.id}
                timer={timer}
                isActive={activeTimerId === timer.id.toString()}
                showControls={isController}
                className="max-w-md"
              />
            ))
          }
        </div>
      )}
    </div>
  );
}
