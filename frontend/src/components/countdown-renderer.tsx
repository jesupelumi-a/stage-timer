import { useEffect, useState, useCallback } from 'react';
import { formatTime, cn } from '../lib/utils';

interface CountdownRendererProps {
  // Time configuration
  initialTime: number; // milliseconds
  isRunning: boolean;
  isPaused: boolean;
  startTime?: number; // timestamp when timer started
  
  // Display configuration
  appearance: 'COUNTDOWN' | 'COUNTUP' | 'TOD' | 'HIDDEN';
  showMilliseconds?: boolean;
  
  // Warning thresholds
  yellowWarningMs?: number;
  redWarningMs?: number;
  
  // Styling
  className?: string;
  textSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  
  // Callbacks
  onTimeUpdate?: (currentTime: number) => void;
  onWarningChange?: (warning: 'normal' | 'yellow' | 'red') => void;
  onComplete?: () => void;
}

export function CountdownRenderer({
  initialTime,
  isRunning,
  isPaused,
  startTime,
  appearance = 'COUNTDOWN',
  showMilliseconds = false,
  yellowWarningMs = 60000, // 1 minute
  redWarningMs = 30000, // 30 seconds
  className = '',
  textSize = '4xl',
  onTimeUpdate,
  onWarningChange,
  onComplete,
}: CountdownRendererProps) {
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [lastWarning, setLastWarning] = useState<'normal' | 'yellow' | 'red'>('normal');
  
  // Calculate current time based on timer state
  const calculateCurrentTime = useCallback(() => {
    if (!isRunning || isPaused) {
      return currentTime;
    }
    
    if (!startTime) {
      return initialTime;
    }
    
    const now = Date.now();
    const elapsed = now - startTime;
    
    switch (appearance) {
      case 'COUNTUP':
        return Math.min(initialTime, elapsed);
      case 'COUNTDOWN':
      default:
        return Math.max(0, initialTime - elapsed);
    }
  }, [isRunning, isPaused, startTime, initialTime, currentTime, appearance]);
  
  // Update timer every 100ms when running
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        const newTime = calculateCurrentTime();
        setCurrentTime(newTime);
        onTimeUpdate?.(newTime);
        
        // Check for completion
        if (appearance === 'COUNTDOWN' && newTime <= 0) {
          onComplete?.();
        } else if (appearance === 'COUNTUP' && newTime >= initialTime) {
          onComplete?.();
        }
      }, showMilliseconds ? 10 : 100);
    } else {
      const newTime = calculateCurrentTime();
      setCurrentTime(newTime);
      onTimeUpdate?.(newTime);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    isRunning, 
    isPaused, 
    calculateCurrentTime, 
    onTimeUpdate, 
    onComplete, 
    appearance, 
    initialTime,
    showMilliseconds
  ]);
  
  // Check warning state
  const getWarningState = useCallback(() => {
    if (appearance !== 'COUNTDOWN') return 'normal';
    
    if (currentTime <= redWarningMs) return 'red';
    if (currentTime <= yellowWarningMs) return 'yellow';
    return 'normal';
  }, [currentTime, redWarningMs, yellowWarningMs, appearance]);
  
  // Update warning state
  useEffect(() => {
    const warning = getWarningState();
    if (warning !== lastWarning) {
      setLastWarning(warning);
      onWarningChange?.(warning);
    }
  }, [getWarningState, lastWarning, onWarningChange]);
  
  // Format display time
  const formatDisplayTime = () => {
    switch (appearance) {
      case 'HIDDEN':
        return '';
      case 'TOD':
        return new Date().toLocaleTimeString([], { 
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      case 'COUNTUP':
      case 'COUNTDOWN':
      default:
        if (showMilliseconds) {
          const totalMs = Math.abs(currentTime);
          const ms = totalMs % 1000;
          const seconds = Math.floor(totalMs / 1000) % 60;
          const minutes = Math.floor(totalMs / 60000) % 60;
          const hours = Math.floor(totalMs / 3600000);
          
          const sign = currentTime < 0 ? '-' : '';
          
          if (hours > 0) {
            return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${Math.floor(ms / 10).toString().padStart(2, '0')}`;
          } else {
            return `${sign}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${Math.floor(ms / 10).toString().padStart(2, '0')}`;
          }
        } else {
          return formatTime(currentTime);
        }
    }
  };
  
  // Get text color based on warning state
  const getTextColor = () => {
    const warning = getWarningState();
    switch (warning) {
      case 'red':
        return 'text-red-400';
      case 'yellow':
        return 'text-yellow-400';
      default:
        return 'text-white';
    }
  };
  
  // Get text size class
  const getTextSizeClass = () => {
    switch (textSize) {
      case 'sm': return 'text-sm';
      case 'md': return 'text-base';
      case 'lg': return 'text-lg';
      case 'xl': return 'text-xl';
      case '2xl': return 'text-2xl';
      case '3xl': return 'text-3xl';
      case '4xl': return 'text-4xl';
      case '5xl': return 'text-5xl';
      case '6xl': return 'text-6xl';
      default: return 'text-4xl';
    }
  };
  
  // Don't render if hidden
  if (appearance === 'HIDDEN') {
    return null;
  }
  
  return (
    <div 
      className={cn(
        'font-mono font-bold transition-colors duration-200',
        getTextSizeClass(),
        getTextColor(),
        className
      )}
    >
      {formatDisplayTime()}
    </div>
  );
}
