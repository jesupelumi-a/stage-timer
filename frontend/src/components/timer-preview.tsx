import { useEffect, useState, useCallback } from 'react';
import { useTimerStore } from '../stores/timer-store';
import { useSocket } from '../hooks/use-socket';
import { formatTime } from '../lib/utils';
import type { Timer } from '@stage-timer/db';

interface TimerPreviewProps {
  timer: Timer;
  className?: string;
  isActive?: boolean;
  showControls?: boolean;
}

export function TimerPreview({ 
  timer, 
  className = '', 
  isActive = false,
  showControls = false 
}: TimerPreviewProps) {
  const [currentTime, setCurrentTime] = useState(timer.durationMs);
  const [isRunning, setIsRunning] = useState(false);
  
  const { getTimerState, getCurrentTime, initializeTimer } = useTimerStore();
  const socket = useSocket();
  
  // Initialize timer in store if not exists
  useEffect(() => {
    const timerState = getTimerState(timer.id.toString());
    if (!timerState) {
      initializeTimer(timer.id.toString(), timer.durationMs);
    }
  }, [timer.id, timer.durationMs, getTimerState, initializeTimer]);
  
  // Update current time from store
  const updateCurrentTime = useCallback(() => {
    const time = getCurrentTime(timer.id.toString());
    setCurrentTime(time);
    
    const timerState = getTimerState(timer.id.toString());
    setIsRunning(timerState?.isRunning || false);
  }, [timer.id, getCurrentTime, getTimerState]);
  
  // Update time every 100ms when running
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(updateCurrentTime, 100);
    } else {
      updateCurrentTime();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, updateCurrentTime]);
  
  // Calculate progress percentage
  const progressPercentage = timer.durationMs > 0 
    ? Math.max(0, Math.min(100, (currentTime / timer.durationMs) * 100))
    : 0;
  
  // Determine warning state
  const getWarningState = () => {
    if (currentTime <= (timer.redWarningMs || 30000)) return 'red';
    if (currentTime <= (timer.yellowWarningMs || 60000)) return 'yellow';
    return 'normal';
  };
  
  const warningState = getWarningState();
  
  // Timer control handlers
  const handleStart = () => {
    if (socket.isConnected) {
      socket.startTimer({
        roomId: timer.roomId,
        timerId: timer.id,
        action: 'start',
        timestamp: Date.now(),
      });
    }
  };
  
  const handlePause = () => {
    if (socket.isConnected) {
      socket.pauseTimer({
        roomId: timer.roomId,
        timerId: timer.id,
        action: 'pause',
        timestamp: Date.now(),
      });
    }
  };
  
  const handleStop = () => {
    if (socket.isConnected) {
      socket.stopTimer({
        roomId: timer.roomId,
        timerId: timer.id,
        action: 'stop',
        timestamp: Date.now(),
      });
    }
  };
  
  const handleReset = () => {
    if (socket.isConnected) {
      socket.resetTimer({
        roomId: timer.roomId,
        timerId: timer.id,
        action: 'reset',
        timestamp: Date.now(),
      });
    }
  };
  
  // Format time based on timer appearance
  const formatDisplayTime = () => {
    switch (timer.appearance) {
      case 'HIDDEN':
        return '';
      case 'TOD':
        return new Date().toLocaleTimeString();
      case 'COUNTUP':
        return formatTime(timer.durationMs - currentTime);
      case 'COUNTDOWN':
      default:
        return formatTime(currentTime);
    }
  };
  
  // Component classes
  const containerClasses = `
    relative overflow-hidden rounded-lg border-2 transition-all duration-200
    ${isActive 
      ? 'border-red-500 shadow-lg shadow-red-500/20' 
      : 'border-neutral-800 hover:border-neutral-600'
    }
    ${warningState === 'red' ? 'bg-red-900/20' : ''}
    ${warningState === 'yellow' ? 'bg-yellow-900/20' : ''}
    ${className}
  `;
  
  const timeClasses = `
    font-mono font-bold text-center transition-colors duration-200
    ${warningState === 'red' ? 'text-red-400' : ''}
    ${warningState === 'yellow' ? 'text-yellow-400' : 'text-white'}
    ${timer.appearance === 'HIDDEN' ? 'invisible' : ''}
  `;
  
  return (
    <div className={containerClasses}>
      {/* Timer Content */}
      <div className="aspect-video flex flex-col justify-center items-center p-4 bg-black/50">
        {/* Timer Name */}
        {timer.showName && (
          <h3 className="text-lg font-semibold text-white mb-2 text-center">
            {timer.name}
          </h3>
        )}
        
        {/* Timer Display */}
        <div className={`text-4xl lg:text-6xl ${timeClasses}`}>
          {formatDisplayTime()}
        </div>
        
        {/* Timer Notes */}
        {timer.showNotes && timer.notes && (
          <p className="text-sm text-neutral-300 mt-2 text-center">
            {timer.notes}
          </p>
        )}
        
        {/* Timer Extra */}
        {timer.showExtra && timer.extra && (
          <p className="text-xs text-neutral-400 mt-1 text-center">
            {timer.extra}
          </p>
        )}
        
        {/* Controls */}
        {showControls && (
          <div className="flex gap-2 mt-4">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
              >
                Start
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm"
              >
                Pause
              </button>
            )}
            
            <button
              onClick={handleStop}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
            >
              Stop
            </button>
            
            <button
              onClick={handleReset}
              className="px-3 py-1 bg-neutral-600 hover:bg-neutral-700 text-white rounded text-sm"
            >
              Reset
            </button>
          </div>
        )}
      </div>
      
      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-neutral-800">
        <div 
          className={`h-full transition-all duration-200 ${
            warningState === 'red' ? 'bg-red-500' :
            warningState === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      {/* Running Indicator */}
      {isRunning && (
        <div className="absolute top-2 right-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
}
