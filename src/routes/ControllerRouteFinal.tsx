import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AppSettings, MessagePreset, TimerType } from '../types';
import {
  DEFAULT_TIMER_PRESETS,
  DEFAULT_MESSAGE_PRESETS,
  DEFAULT_SETTINGS,
} from '../types';
import { useMultipleTimers } from '../hooks/useMultipleTimers';
import { useMessages } from '../hooks/useMessages';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useSimpleFirebaseSync } from '../hooks/useSimpleFirebaseSync';
import {
  useTimerKeyboard,
  useFullscreenKeyboard,
  useMessageKeyboard,
  useAppKeyboard,
} from '../hooks/useKeyboard';
import { ControlView } from '../components/ControlView';

export function ControllerRoute() {
  const navigate = useNavigate();

  // Local storage
  const [timerPresets] = useLocalStorage(
    'church-timer-presets',
    DEFAULT_TIMER_PRESETS
  );
  const [messagePresets] = useLocalStorage(
    'church-timer-message-presets',
    DEFAULT_MESSAGE_PRESETS
  );
  const [settings, updateSettings] = useLocalStorage(
    'church-timer-settings',
    DEFAULT_SETTINGS
  );

  // App state
  const [, setIsFullscreen] = useState(false);
  const [blackoutMode, setBlackoutMode] = useState(false);
  const [flashMode, setFlashMode] = useState(false);
  const [loadingTimers, setLoadingTimers] = useState<Set<string>>(new Set());
  const initializationRef = useRef(false);

  // Simple Firebase sync - no sessions needed!
  const {
    connectionStatus,
    isConnected,
    initializeData,
    updateTimers,
    updateCurrentMessage,
    updateMessageQueue,
    updateSettings: updateFirebaseSettings,
    updateBlackoutMode,
    updateFlashMode,
  } = useSimpleFirebaseSync({
    isController: true,
    onDataChange: (data) => {
      // Controller doesn't need to react to its own updates
      console.log('📊 Controller received data update (ignoring)');
    },
    onConnectionStatusChange: (status) => {
      console.log('Firebase connection status:', status);
    },
    onError: (error) => {
      console.error('Firebase sync error:', error);
    },
  });

  // Multiple timer functionality
  const {
    timers: timerCollection,
    activeTimer,
    activeTimerId,
    addTimer,
    deleteTimer,
    selectTimer,
    startTimer,
    pauseTimer,
    resetTimer,
    updateTimer,
    updateTimerTime,
    updateTimerDuration,
    updateTimerType,
    reorderTimers,
    adjustTime,
    isTimerRunning,
    isTimerPaused,
    isTimerExpired,
  } = useMultipleTimers();

  // Extract timers array for component props
  const timers = timerCollection;

  // Message functionality
  const {
    currentMessage,
    messageQueue,
    showMessage,
    showPresetMessage,
    hideMessage,
    clearAllMessages,
  } = useMessages();

  // Initialize Firebase data when connected (only once)
  useEffect(() => {
    if (isConnected && !initializationRef.current) {
      const initData = async () => {
        try {
          const timerCollectionData = {
            timers: timerCollection,
            activeTimerId,
          };
          await initializeData({
            timers: timerCollectionData,
            currentMessage,
            messageQueue,
            settings,
            blackoutMode,
            flashMode,
          });
          initializationRef.current = true;
          console.log('✅ Firebase data initialized');
        } catch (error) {
          console.error('❌ Failed to initialize Firebase data:', error);
        }
      };

      initData();
    }
  }, [isConnected]); // Only depend on connection status

  // Track timer statuses to only sync when status changes (not on every tick)
  const prevTimerStatusesRef = useRef<Map<string, string>>(new Map());

  // Simple manual sync function (no automatic loops)
  const syncTimersToFirebase = useCallback(async () => {
    if (isConnected && initializationRef.current) {
      const timerCollectionData = {
        timers: timerCollection,
        activeTimerId,
      };
      await updateTimers(timerCollectionData);
    }
  }, [isConnected, timerCollection, activeTimerId, updateTimers]);

  // Loading state helpers
  const setTimerLoading = useCallback((timerId: string, loading: boolean) => {
    setLoadingTimers((prev) => {
      const newSet = new Set(prev);
      if (loading) {
        newSet.add(timerId);
      } else {
        newSet.delete(timerId);
      }
      return newSet;
    });
  }, []);

  const isTimerLoading = useCallback(
    (timerId: string) => {
      return loadingTimers.has(timerId);
    },
    [loadingTimers]
  );

  // Settings update wrapper
  const handleUpdateSettings = useCallback(
    (updates: Partial<AppSettings>) => {
      const newSettings = {
        ...settings,
        ...updates,
        display: { ...settings.display, ...updates.display },
        timer: { ...settings.timer, ...updates.timer },
      };
      updateSettings(newSettings);

      // Sync to Firebase after a short delay
      setTimeout(() => {
        if (isConnected && initializationRef.current) {
          updateFirebaseSettings(newSettings);
        }
      }, 100);
    },
    [settings, updateSettings, isConnected, updateFirebaseSettings]
  );

  // Fullscreen functionality
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    }
  }, []);

  // Theme toggle
  const toggleTheme = useCallback(() => {
    handleUpdateSettings({
      display: {
        ...settings.display,
        theme: settings.display.theme === 'dark' ? 'light' : 'dark',
      },
    });
  }, [settings.display, handleUpdateSettings]);

  // Blackout and Flash functionality with Firebase sync
  const toggleBlackout = useCallback(() => {
    const newBlackoutMode = !blackoutMode;
    setBlackoutMode(newBlackoutMode);

    // Sync to Firebase
    setTimeout(() => {
      if (isConnected && initializationRef.current) {
        updateBlackoutMode(newBlackoutMode);
      }
    }, 100);
  }, [blackoutMode, isConnected, updateBlackoutMode]);

  const toggleFlash = useCallback(() => {
    setFlashMode((prev) => {
      if (!prev) {
        // Sync flash trigger to Firebase
        setTimeout(() => {
          if (isConnected && initializationRef.current) {
            updateFlashMode(true);
          }
        }, 100);

        // Flash for 3 seconds then turn off
        setTimeout(() => {
          setFlashMode(false);
          if (isConnected && initializationRef.current) {
            updateFlashMode(false);
          }
        }, 3000);
      }
      return !prev;
    });
  }, [isConnected, updateFlashMode]);

  // Navigation
  const switchToDisplay = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Keyboard shortcuts
  useTimerKeyboard(
    () => activeTimerId && startTimer(activeTimerId),
    () => activeTimerId && pauseTimer(activeTimerId),
    () => activeTimerId && resetTimer(activeTimerId),
    () => activeTimerId && pauseTimer(activeTimerId),
    true
  );
  useFullscreenKeyboard(toggleFullscreen, true);
  useMessageKeyboard(
    () => hideMessage(),
    (index) => {
      if (messagePresets[index]) {
        showPresetMessage(messagePresets[index]);
      }
    },
    true
  );
  useAppKeyboard(() => navigate('/'), toggleTheme, true);

  // Message handlers
  const handleMessagePresetSelect = useCallback(
    (preset: MessagePreset) => {
      showPresetMessage(preset);
      // Message sync will happen via separate useEffect for messages
    },
    [showPresetMessage]
  );

  const handleShowMessage = useCallback(
    (text: string, autoHide?: boolean, hideAfter?: number) => {
      const message = { text, autoHide, hideAfter };
      showMessage(text, message);
      // Message sync will happen via separate useEffect for messages
    },
    [showMessage]
  );

  // Timer handlers with Firebase sync
  const handleAddTimer = useCallback(
    (name: string, duration: number, type: TimerType, startTime?: string) => {
      addTimer(name, duration, type, startTime);
      // Auto-sync will happen via useEffect when timer collection changes
    },
    [addTimer]
  );

  const handleStartTimer = useCallback(
    async (timerId: string) => {
      setTimerLoading(timerId, true);
      try {
        startTimer(timerId);
        // Wait for state to update, then sync
        setTimeout(syncTimersToFirebase, 100);
      } finally {
        setTimeout(() => setTimerLoading(timerId, false), 300);
      }
    },
    [startTimer, setTimerLoading, syncTimersToFirebase]
  );

  const handlePauseTimer = useCallback(
    async (timerId: string) => {
      setTimerLoading(timerId, true);
      try {
        pauseTimer(timerId);
        // Wait for state to update, then sync
        setTimeout(syncTimersToFirebase, 100);
      } finally {
        setTimeout(() => setTimerLoading(timerId, false), 300);
      }
    },
    [pauseTimer, setTimerLoading, syncTimersToFirebase]
  );

  const handleResetTimer = useCallback(
    async (timerId: string) => {
      setTimerLoading(timerId, true);
      try {
        resetTimer(timerId);
        // Wait for state to update, then sync
        setTimeout(syncTimersToFirebase, 100);
      } finally {
        setTimeout(() => setTimerLoading(timerId, false), 300);
      }
    },
    [resetTimer, setTimerLoading, syncTimersToFirebase]
  );

  return (
    <div className="controller-route h-screen w-screen overflow-hidden">
      <ControlView
        timers={timers}
        activeTimer={activeTimer}
        activeTimerId={activeTimerId}
        currentMessage={currentMessage}
        messageQueue={messageQueue}
        settings={settings}
        timerPresets={timerPresets}
        messagePresets={messagePresets}
        blackoutMode={blackoutMode}
        flashMode={flashMode}
        onAddTimer={handleAddTimer}
        onDeleteTimer={deleteTimer}
        onSelectTimer={selectTimer}
        onStartTimer={handleStartTimer}
        onPauseTimer={handlePauseTimer}
        onResetTimer={handleResetTimer}
        onUpdateTimerTime={updateTimerTime}
        onUpdateTimerDuration={updateTimerDuration}
        onUpdateTimerType={updateTimerType}
        onUpdateTimer={updateTimer}
        onReorderTimers={reorderTimers}
        onAdjustTime={adjustTime}
        onShowMessage={handleShowMessage}
        onShowPresetMessage={handleMessagePresetSelect}
        onClearMessage={() => hideMessage()}
        onClearAllMessages={clearAllMessages}
        onUpdateSettings={handleUpdateSettings}
        onToggleFullscreen={toggleFullscreen}
        onToggleBlackout={toggleBlackout}
        onToggleFlash={toggleFlash}
        onSwitchToDisplay={switchToDisplay}
        onSwitchToMultiDevice={() => {}} // No longer needed
        isTimerRunning={isTimerRunning}
        isTimerPaused={isTimerPaused}
        isTimerExpired={isTimerExpired}
        isTimerLoading={isTimerLoading}
      />

      {/* Connection Status Indicator */}
      <div className="fixed right-4 top-4 z-30 rounded-md bg-green-100 px-3 py-2 text-sm text-green-800 dark:bg-green-900 dark:text-green-200">
        Firebase: {connectionStatus} •{' '}
        {initializationRef.current ? 'Syncing' : 'Initializing'}
      </div>

      {/* Blackout overlay */}
      {blackoutMode && <div className="fixed inset-0 z-50 bg-black" />}

      {/* Flash overlay */}
      {flashMode && (
        <div className="pointer-events-none fixed inset-0 z-40 animate-flash bg-white" />
      )}
    </div>
  );
}
