import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimpleFirebaseSync } from '../hooks/useSimpleFirebaseSync';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useFullscreenKeyboard } from '../hooks/useKeyboard';
import { TimerPreview } from '../components/TimerPreview';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { DEFAULT_SETTINGS, DEFAULT_TIMER_COLLECTION } from '../types';
import type { TimerCollection, Message, AppSettings } from '../types';

export function DisplayRoute() {
  const navigate = useNavigate();

  // Local storage for settings (fallback)
  const [localSettings] = useLocalStorage(
    'church-timer-settings',
    DEFAULT_SETTINGS
  );

  // Display state
  const [timers, setTimers] = useState<TimerCollection>(
    DEFAULT_TIMER_COLLECTION
  );
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null);
  const [messageQueue, setMessageQueue] = useState<Message[]>([]);
  const [settings, setSettings] = useState<AppSettings>(localSettings);
  const [blackoutMode, setBlackoutMode] = useState(false);
  const [flashMode, setFlashMode] = useState(false);

  // Simple Firebase sync for receiving updates from controller
  const { connectionStatus, isConnected, sharedData } = useSimpleFirebaseSync({
    isController: false,
    onDataChange: (data) => {
      // Update display state when shared data changes
      console.log('📺 Display received data update:', data);

      const activeTimerData = data.timers?.timers?.find(
        (t) => t.id === data.timers?.activeTimerId
      );
      console.log('📺 Active timer:', {
        id: activeTimerData?.id,
        name: activeTimerData?.name,
        status: activeTimerData?.state?.status,
        type: activeTimerData?.state?.type,
        initialTime: activeTimerData?.state?.initialTime,
        currentTime: activeTimerData?.state?.currentTime,
        elapsedTime: activeTimerData?.state?.elapsedTime,
      });

      // Store the timestamp when this data was last updated
      if (data.timers?.lastUpdated) {
        dataTimestampRef.current = data.timers.lastUpdated;
      } else {
        // If no timestamp, use current time
        dataTimestampRef.current = Date.now();
      }

      // Immediately update all state to ensure instant reflection of changes
      setTimers(data.timers);
      setCurrentMessage(data.currentMessage);
      setMessageQueue(data.messageQueue);
      setSettings(data.settings);
      setBlackoutMode(data.blackoutMode);
      setFlashMode(data.flashMode);
    },
    onConnectionStatusChange: (status) => {
      console.log('📺 Display Firebase connection status:', status);
    },
    onError: (error) => {
      console.error('📺 Display Firebase sync error:', error);
    },
  });

  // Double-click to go to controller (for setup)
  const handleDoubleClick = useCallback(() => {
    navigate('/control');
  }, [navigate]);

  // Real-time timer state calculation
  const [realtimeTimer, setRealtimeTimer] = useState<typeof baseTimer | null>(
    null
  );
  const lastSyncTimeRef = useRef<number>(Date.now());
  const dataTimestampRef = useRef<number>(Date.now());

  // Get current timer for display
  const activeTimer = timers.timers.find((t) => t.id === timers.activeTimerId);
  const baseTimer = useMemo(
    () =>
      activeTimer?.state || {
        type: 'countdown' as const,
        status: 'idle' as const,
        currentTime: 0,
        initialTime: 0,
        elapsedTime: 0,
      },
    [activeTimer?.state]
  );

  // Force immediate update when active timer changes
  useEffect(() => {
    if (activeTimer) {
      // Reset real-time timer to immediately reflect any changes
      setRealtimeTimer(null);
    }
  }, [activeTimer]);

  // Update real-time timer calculation - simplified for immediate updates
  useEffect(() => {
    if (!activeTimer) {
      setRealtimeTimer(baseTimer);
      return;
    }

    // Always update the last sync time when we receive new data
    lastSyncTimeRef.current = Date.now();

    // Calculate the time difference between when data was saved and now
    const now = Date.now();
    const dataAge = dataTimestampRef.current
      ? (now - dataTimestampRef.current) / 1000
      : 0;

    // For immediate updates, always start with the base timer and adjust for data age
    let adjustedElapsedTime =
      baseTimer.elapsedTime + (baseTimer.status === 'running' ? dataAge : 0);

    // Apply the same 1-second delay logic as the controller for consistency
    if (baseTimer.status === 'running') {
      if (adjustedElapsedTime < 1) {
        adjustedElapsedTime = 0;
      } else {
        adjustedElapsedTime = adjustedElapsedTime - 1;
      }
    }

    // Calculate currentTime based on timer type for consistency
    let adjustedCurrentTime: number;
    switch (baseTimer.type) {
      case 'countdown':
        adjustedCurrentTime = Math.max(
          0,
          baseTimer.initialTime - adjustedElapsedTime
        );
        break;
      case 'countup':
      case 'stopwatch':
      case 'hidden':
        adjustedCurrentTime = adjustedElapsedTime;
        break;
      default:
        adjustedCurrentTime = baseTimer.currentTime;
    }

    const adjustedTimer = {
      ...baseTimer,
      elapsedTime: adjustedElapsedTime,
      currentTime: adjustedCurrentTime,
    };

    // Immediately set the adjusted timer
    setRealtimeTimer(adjustedTimer);

    // Only start real-time updates if timer is actually running
    if (baseTimer.status === 'running') {
      const interval = setInterval(() => {
        const now = Date.now();
        const timeSinceSync = (now - lastSyncTimeRef.current) / 1000;

        setRealtimeTimer((prev) => {
          // Double-check that the timer is still running
          if (!prev || prev.status !== 'running') {
            return prev;
          }

          let newElapsedTime = adjustedElapsedTime + timeSinceSync;

          // Add the same 1-second delay logic as the controller
          // Add a small delay (1 second) before starting countdown to show full duration first
          if (newElapsedTime < 1) {
            newElapsedTime = 0;
          } else {
            newElapsedTime = newElapsedTime - 1;
          }

          // Calculate currentTime based on timer type for consistency with TimerCard
          let newCurrentTime: number;
          switch (prev.type) {
            case 'countdown':
              newCurrentTime = Math.max(0, prev.initialTime - newElapsedTime);
              break;
            case 'countup':
            case 'stopwatch':
            case 'hidden':
              newCurrentTime = newElapsedTime;
              break;
            default:
              newCurrentTime = prev.currentTime;
          }

          return {
            ...prev,
            elapsedTime: newElapsedTime,
            currentTime: newCurrentTime,
          };
        });
      }, 100); // Update every 100ms for smooth countdown

      return () => {
        clearInterval(interval);
      };
    }
  }, [activeTimer, baseTimer]); // Include all properties that should trigger immediate updates

  const currentTimer = realtimeTimer || baseTimer;

  // Check if timer is expired
  const isTimerExpired =
    currentTimer.status === 'expired' ||
    (currentTimer.type === 'countdown' &&
      currentTimer.elapsedTime >= currentTimer.initialTime);

  // Fullscreen toggle function
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  // Keyboard shortcuts
  useFullscreenKeyboard(toggleFullscreen, true);

  // Show loading spinner while waiting for Firebase data
  const isLoading = !sharedData && connectionStatus === 'connected';

  return (
    <div className="display-route h-screen w-screen overflow-hidden">
      {isLoading || !isConnected ? (
        /* Loading Screen */
        <div className="flex h-full w-full items-center justify-center bg-[#1D1918]">
          <div className="text-center">
            <LoadingSpinner
              size="xl"
              className="mx-auto mb-4 border-white border-t-blue-500"
            />
            <div className="text-lg font-semibold text-white">Syncing...</div>
          </div>
        </div>
      ) : (
        /* Full-screen TimerPreview - exactly like the control interface preview */
        <div className="h-full w-full">
          <TimerPreview
            timer={currentTimer}
            timerName={activeTimer?.name}
            currentMessage={currentMessage}
            settings={settings.display}
            isExpired={isTimerExpired}
            isActive={true}
            displayMode="display"
            className="h-full w-full"
            onToggleFullscreen={toggleFullscreen}
          />
        </div>
      )}

      {/* Connection Status Indicator */}
      {/* <div className="fixed right-4 top-4 z-30 rounded-md bg-blue-100 px-3 py-2 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200">
        Firebase: {connectionStatus} •{' '}
        {sharedData ? 'Synced' : 'Waiting for data'}
      </div> */}

      {/* Blackout overlay */}
      {blackoutMode && <div className="fixed inset-0 z-50 bg-black" />}

      {/* Flash overlay */}
      {flashMode && (
        <div className="pointer-events-none fixed inset-0 z-40 animate-flash bg-white" />
      )}

      {/* Double-click handler for setup access */}
      {/* <div
        className="fixed inset-0 z-30"
        onDoubleClick={handleDoubleClick}
        style={{ background: 'transparent', pointerEvents: 'all' }}
      /> */}

      {/* Device info (hidden, for debugging) */}
      <div className="fixed bottom-4 left-4 z-20 rounded bg-black/50 p-2 text-xs text-white/50 opacity-0 transition-opacity hover:opacity-100">
        Display Mode • Firebase: {connectionStatus} • Data:{' '}
        {sharedData ? 'Available' : 'None'}
      </div>
    </div>
  );
}
