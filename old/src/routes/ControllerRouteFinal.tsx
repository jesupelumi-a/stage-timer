import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AppSettings, MessagePreset, TimerType, Timer } from '../types';
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
    fetchExistingData,
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
    initializeTimerCollection,
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
          // First, try to fetch existing data from Firebase
          console.log('🔍 Checking for existing data in Firebase...');
          const existingData = await fetchExistingData();

          if (existingData) {
            // Use existing data from Firebase
            console.log('📥 Loading existing data from Firebase');

            // Update local state with Firebase data
            if (existingData.timers) {
              // Update timer collection with existing data
              initializeTimerCollection({
                timers: existingData.timers.timers || [],
                activeTimerId: existingData.timers.activeTimerId || null,
              });
            }

            if (existingData.settings) {
              updateSettings(existingData.settings);
            }

            if (existingData.blackoutMode !== undefined) {
              setBlackoutMode(existingData.blackoutMode);
            }

            if (existingData.flashMode !== undefined) {
              setFlashMode(existingData.flashMode);
            }

            console.log('✅ Existing data loaded successfully');
          } else {
            // No existing data, initialize with defaults
            console.log(
              '📝 No existing data found, initializing with defaults'
            );
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
            console.log('✅ Firebase data initialized with defaults');
          }

          initializationRef.current = true;
        } catch (error) {
          console.error('❌ Failed to initialize Firebase data:', error);
        }
      };

      initData();
    }
  }, [
    isConnected,
    fetchExistingData,
    initializeTimerCollection,
    updateSettings,
    initializeData,
    timerCollection,
    activeTimerId,
    currentMessage,
    messageQueue,
    settings,
    blackoutMode,
    flashMode,
  ]);

  // Track timer statuses to only sync when status changes (not on every tick)
  const prevTimerStatusesRef = useRef<Map<string, string>>(new Map());

  // Simple manual sync function (no automatic loops)
  const syncTimersToFirebase = useCallback(async () => {
    if (isConnected && initializationRef.current) {
      const timerCollectionData = {
        timers: timerCollection,
        activeTimerId,
        lastUpdated: Date.now(), // Add timestamp for sync tracking
      };

      // Syncing timer collection to Firebase

      await updateTimers(timerCollectionData);
    }
  }, [isConnected, timerCollection, activeTimerId, updateTimers]);

  // Remove auto-sync to prevent infinite loop

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

  // Custom sync function for add operations
  const syncTimersWithAdd = useCallback(
    async (
      name: string,
      duration: number,
      type: TimerType,
      startTime?: string
    ) => {
      if (isConnected && initializationRef.current) {
        // Generate a new timer ID
        const newTimerId = `timer-${Date.now()}`;
        const currentTime = type === 'countdown' ? duration : 0;

        const newTimer = {
          id: newTimerId,
          name,
          state: {
            type,
            status: 'idle' as const,
            currentTime,
            initialTime: duration,
            elapsedTime: 0,
          },
          order: timerCollection.length + 1,
          startTime,
        };

        const updatedTimers = [...timerCollection, newTimer];

        const timerCollectionData = {
          timers: updatedTimers,
          activeTimerId: activeTimerId || newTimerId, // Set as active if no active timer
          lastUpdated: Date.now(),
        };

        await updateTimers(timerCollectionData);
      }
    },
    [isConnected, timerCollection, activeTimerId, updateTimers]
  );

  // Timer handlers with Firebase sync
  const handleAddTimer = useCallback(
    async (
      name: string,
      duration: number,
      type: TimerType,
      startTime?: string
    ) => {
      addTimer(name, duration, type, startTime);
      // Sync immediately with the expected new timer
      await syncTimersWithAdd(name, duration, type, startTime);
    },
    [addTimer, syncTimersWithAdd]
  );

  // Create a custom sync function that takes the expected status and handles multiple timers
  const syncTimersWithStatus = useCallback(
    async (timerId: string, expectedStatus: 'running' | 'paused') => {
      if (isConnected && initializationRef.current) {
        // Create a copy of the timer collection with the correct status
        // If starting a timer, pause all other running timers
        const updatedTimers = timerCollection.map((t) => {
          if (t.id === timerId) {
            return { ...t, state: { ...t.state, status: expectedStatus } };
          } else if (
            expectedStatus === 'running' &&
            t.state.status === 'running'
          ) {
            // Pause other running timers when starting a new one
            return {
              ...t,
              state: {
                ...t.state,
                status: 'paused' as const,
                pausedTime: Date.now(),
              },
            };
          }
          return t;
        });

        const timerCollectionData = {
          timers: updatedTimers,
          activeTimerId: expectedStatus === 'running' ? timerId : activeTimerId, // Update activeTimerId when starting a timer
          lastUpdated: Date.now(), // Add timestamp for sync tracking
        };

        // Syncing to Firebase with the correct expected status
        await updateTimers(timerCollectionData);
      }
    },
    [isConnected, timerCollection, activeTimerId, updateTimers]
  );

  const handleStartTimer = useCallback(
    async (timerId: string) => {
      setTimerLoading(timerId, true);
      try {
        startTimer(timerId);
        // Sync immediately with the expected status
        await syncTimersWithStatus(timerId, 'running');
      } finally {
        setTimeout(() => setTimerLoading(timerId, false), 300);
      }
    },
    [startTimer, setTimerLoading, syncTimersWithStatus]
  );

  const handlePauseTimer = useCallback(
    async (timerId: string) => {
      setTimerLoading(timerId, true);
      try {
        pauseTimer(timerId);
        // Sync immediately with the expected status
        await syncTimersWithStatus(timerId, 'paused');
      } finally {
        setTimeout(() => setTimerLoading(timerId, false), 300);
      }
    },
    [pauseTimer, setTimerLoading, syncTimersWithStatus]
  );

  // Custom sync function for reset operations
  const syncTimersWithReset = useCallback(
    async (timerId: string) => {
      if (isConnected && initializationRef.current) {
        const updatedTimers = timerCollection.map((t) => {
          if (t.id === timerId) {
            const currentTime =
              t.state.type === 'countdown' ? t.state.initialTime : 0;
            return {
              ...t,
              state: {
                ...t.state,
                status: 'idle' as const,
                currentTime,
                elapsedTime: 0,
                startTime: undefined,
                pausedTime: undefined,
              },
            };
          }
          return t;
        });

        const timerCollectionData = {
          timers: updatedTimers,
          activeTimerId,
          lastUpdated: Date.now(),
        };

        await updateTimers(timerCollectionData);
      }
    },
    [isConnected, timerCollection, activeTimerId, updateTimers]
  );

  const handleResetTimer = useCallback(
    async (timerId: string) => {
      setTimerLoading(timerId, true);
      try {
        resetTimer(timerId);
        // Sync immediately with the expected reset state
        await syncTimersWithReset(timerId);
      } finally {
        setTimeout(() => setTimerLoading(timerId, false), 300);
      }
    },
    [resetTimer, setTimerLoading, syncTimersWithReset]
  );

  // Custom sync function for delete operations
  const syncTimersWithDelete = useCallback(
    async (timerId: string) => {
      if (isConnected && initializationRef.current) {
        const updatedTimers = timerCollection.filter((t) => t.id !== timerId);

        // If we're deleting the active timer, select the first remaining timer
        let newActiveTimerId = activeTimerId;
        if (activeTimerId === timerId && updatedTimers.length > 0) {
          newActiveTimerId = updatedTimers[0].id;
        } else if (updatedTimers.length === 0) {
          newActiveTimerId = null;
        }

        const timerCollectionData = {
          timers: updatedTimers,
          activeTimerId: newActiveTimerId,
          lastUpdated: Date.now(),
        };

        await updateTimers(timerCollectionData);
      }
    },
    [isConnected, timerCollection, activeTimerId, updateTimers]
  );

  const handleDeleteTimer = useCallback(
    async (timerId: string) => {
      deleteTimer(timerId);
      // Sync immediately with the expected deletion
      await syncTimersWithDelete(timerId);
    },
    [deleteTimer, syncTimersWithDelete]
  );

  // Custom sync function for timer updates (name, startTime, etc.)
  const syncTimersWithUpdates = useCallback(
    async (timerId: string, updates: Partial<Timer>) => {
      if (isConnected && initializationRef.current) {
        const updatedTimers = timerCollection.map((t) => {
          if (t.id === timerId) {
            return { ...t, ...updates };
          }
          return t;
        });

        const timerCollectionData = {
          timers: updatedTimers,
          activeTimerId,
          lastUpdated: Date.now(),
        };

        await updateTimers(timerCollectionData);
      }
    },
    [isConnected, timerCollection, activeTimerId, updateTimers]
  );

  const handleUpdateTimer = useCallback(
    async (timerId: string, updates: Partial<Timer>) => {
      updateTimer(timerId, updates);
      // Sync immediately with the expected updates
      await syncTimersWithUpdates(timerId, updates);
    },
    [updateTimer, syncTimersWithUpdates]
  );

  // Custom sync function for duration updates
  const syncTimersWithDuration = useCallback(
    async (timerId: string, newDuration: number) => {
      if (isConnected && initializationRef.current) {
        const updatedTimers = timerCollection.map((t) => {
          if (t.id === timerId) {
            return {
              ...t,
              state: {
                ...t.state,
                initialTime: newDuration,
                currentTime:
                  t.state.type === 'countdown'
                    ? newDuration
                    : t.state.currentTime,
              },
            };
          }
          return t;
        });

        const timerCollectionData = {
          timers: updatedTimers,
          activeTimerId,
          lastUpdated: Date.now(),
        };

        await updateTimers(timerCollectionData);
      }
    },
    [isConnected, timerCollection, activeTimerId, updateTimers]
  );

  // Custom sync function for type updates
  const syncTimersWithType = useCallback(
    async (timerId: string, newType: TimerType) => {
      if (isConnected && initializationRef.current) {
        const updatedTimers = timerCollection.map((t) => {
          if (t.id === timerId) {
            const newCurrentTime =
              newType === 'countdown' ? t.state.initialTime : 0;
            return {
              ...t,
              state: {
                ...t.state,
                type: newType,
                currentTime: newCurrentTime,
                status: 'idle' as const,
              },
            };
          }
          return t;
        });

        const timerCollectionData = {
          timers: updatedTimers,
          activeTimerId,
          lastUpdated: Date.now(),
        };

        await updateTimers(timerCollectionData);
      }
    },
    [isConnected, timerCollection, activeTimerId, updateTimers]
  );

  const handleUpdateTimerDuration = useCallback(
    async (timerId: string, newDuration: number) => {
      updateTimerDuration(timerId, newDuration);
      // Sync immediately with the expected duration
      await syncTimersWithDuration(timerId, newDuration);
    },
    [updateTimerDuration, syncTimersWithDuration]
  );

  const handleUpdateTimerType = useCallback(
    async (timerId: string, newType: TimerType) => {
      updateTimerType(timerId, newType);
      // Sync immediately with the expected type
      await syncTimersWithType(timerId, newType);
    },
    [updateTimerType, syncTimersWithType]
  );

  const handleUpdateTimerTime = useCallback(
    async (timerId: string, newTime: number) => {
      updateTimerTime(timerId, newTime);
      // Sync to Firebase after time update
      setTimeout(async () => {
        await syncTimersToFirebase();
      }, 100);
    },
    [updateTimerTime, syncTimersToFirebase]
  );

  // Custom sync function for select operations
  const syncTimersWithSelect = useCallback(
    async (timerId: string) => {
      if (isConnected && initializationRef.current) {
        const timer = timerCollection.find((t) => t.id === timerId);
        if (!timer) return;

        const currentTime =
          timer.state.type === 'countdown' ? timer.state.initialTime : 0;

        const updatedTimers = timerCollection.map((t) =>
          t.id === timerId
            ? {
                ...t,
                state: {
                  ...t.state,
                  status: 'idle' as const,
                  currentTime,
                  elapsedTime: 0,
                  startTime: undefined,
                  pausedTime: undefined,
                },
              }
            : t
        );

        const timerCollectionData = {
          timers: updatedTimers,
          activeTimerId: timerId,
          lastUpdated: Date.now(),
        };

        await updateTimers(timerCollectionData);
      }
    },
    [isConnected, timerCollection, updateTimers]
  );

  const handleSelectTimer = useCallback(
    async (timerId: string) => {
      selectTimer(timerId);
      // Sync immediately with the expected select state
      await syncTimersWithSelect(timerId);
    },
    [selectTimer, syncTimersWithSelect]
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
        onDeleteTimer={handleDeleteTimer}
        onSelectTimer={handleSelectTimer}
        onStartTimer={handleStartTimer}
        onPauseTimer={handlePauseTimer}
        onResetTimer={handleResetTimer}
        onUpdateTimerTime={handleUpdateTimerTime}
        onUpdateTimerDuration={handleUpdateTimerDuration}
        onUpdateTimerType={handleUpdateTimerType}
        onUpdateTimer={handleUpdateTimer}
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
