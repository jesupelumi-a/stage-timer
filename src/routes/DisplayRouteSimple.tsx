import React, { useState, useEffect, useCallback, useRef } from 'react';
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
      console.log(
        '📺 Active timer status:',
        data.timers?.timers?.find((t) => t.id === data.timers?.activeTimerId)
          ?.state?.status
      );
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
  const [realtimeTimer, setRealtimeTimer] = useState<any>(null);
  const lastSyncTimeRef = useRef<number>(Date.now());

  // Get current timer for display
  const activeTimer = timers.timers.find((t) => t.id === timers.activeTimerId);
  const baseTimer = activeTimer?.state || {
    type: 'countdown' as const,
    status: 'idle' as const,
    currentTime: 0,
    initialTime: 0,
    elapsedTime: 0,
  };

  // Update real-time timer calculation
  useEffect(() => {
    if (!activeTimer) {
      console.log('📺 No active timer, using base timer');
      setRealtimeTimer(baseTimer);
      return;
    }

    console.log(
      '📺 Timer status changed:',
      baseTimer.status,
      'elapsed:',
      baseTimer.elapsedTime,
      'initial:',
      baseTimer.initialTime,
      'type:',
      baseTimer.type
    );

    // Update the last sync time when we receive new data
    lastSyncTimeRef.current = Date.now();
    setRealtimeTimer(baseTimer);

    // Only start real-time updates if timer is actually running
    if (baseTimer.status === 'running') {
      console.log('📺 Starting real-time updates for running timer');
      const interval = setInterval(() => {
        const now = Date.now();
        const timeSinceSync = (now - lastSyncTimeRef.current) / 1000;

        setRealtimeTimer((prev: any) => {
          // Double-check that the timer is still running
          if (!prev || prev.status !== 'running') {
            console.log('📺 Timer no longer running, stopping updates');
            return prev;
          }

          const newElapsedTime = baseTimer.elapsedTime + timeSinceSync;

          return {
            ...prev,
            elapsedTime: newElapsedTime,
            // Let TimerPreview calculate currentTime from elapsedTime
          };
        });
      }, 100); // Update every 100ms for smooth countdown

      return () => {
        console.log('📺 Cleaning up real-time timer interval');
        clearInterval(interval);
      };
    } else {
      // If timer is not running, just use the base timer data as-is
      console.log('📺 Timer not running, using static base timer data');
      setRealtimeTimer(baseTimer);
    }
  }, [
    activeTimer?.id,
    baseTimer.status,
    baseTimer.elapsedTime,
    baseTimer.initialTime,
  ]); // More specific dependencies

  const currentTimer = realtimeTimer || baseTimer;

  // Check if timer is expired
  const isTimerExpired =
    currentTimer.status === 'expired' ||
    (currentTimer.type === 'countdown' &&
      currentTimer.elapsedTime >= currentTimer.initialTime);

  // Keyboard shortcuts
  useFullscreenKeyboard(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, true);

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
            <div className="mt-2 text-sm text-gray-400">
              Waiting for timer data
            </div>
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
