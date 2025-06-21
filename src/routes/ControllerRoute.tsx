import { useState, useEffect, useCallback } from 'react';
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
import { SessionManager } from '../components/SessionManager';
import { FirebaseTest } from '../components/FirebaseTest';

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
  const [isInitialized, setIsInitialized] = useState(false);

  // Simple Firebase sync - no sessions needed!
  const {
    connectionStatus,
    isConnected,
    sharedData,
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
      console.log('Shared data updated:', data);
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
  } = useMultipleTimers(
    (_timerId) => {
      // Timer expired callback
    },
    (_timerId, _currentTime) => {
      // Timer tick callback - sync to Firebase
      if (isConnected) {
        const timerCollectionData = {
          timers,
          activeTimerId,
        };
        updateTimers(timerCollectionData);
      }
    }
  );

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

  // Session management
  const handleCreateSession = useCallback(async (): Promise<string> => {
    try {
      const timerCollectionData = {
        timers,
        activeTimerId,
      };
      const sessionId = await createSession({
        controllerDeviceId: deviceId,
        timers: timerCollectionData,
        currentMessage,
        messageQueue,
        settings,
        blackoutMode,
        flashMode,
      });
      return sessionId;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }, [
    createSession,
    deviceId,
    timers,
    currentMessage,
    messageQueue,
    settings,
    blackoutMode,
    flashMode,
  ]);

  // Sync data to Firebase when state changes
  useEffect(() => {
    if (sessionId) {
      const timerCollectionData = {
        timers,
        activeTimerId,
      };
      updateTimers(timerCollectionData);
    }
  }, [timers, activeTimerId, sessionId, updateTimers]);

  useEffect(() => {
    if (sessionId) {
      updateCurrentMessage(currentMessage);
    }
  }, [currentMessage, sessionId, updateCurrentMessage]);

  useEffect(() => {
    if (sessionId) {
      updateMessageQueue(messageQueue);
    }
  }, [messageQueue, sessionId, updateMessageQueue]);

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

      // Sync to Firebase
      if (sessionId) {
        updateFirebaseSettings(newSettings);
      }
    },
    [settings, updateSettings, sessionId, updateFirebaseSettings]
  );

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
    if (sessionId) {
      updateBlackoutMode(newBlackoutMode);
    }
  }, [blackoutMode, sessionId, updateBlackoutMode]);

  const toggleFlash = useCallback(() => {
    setFlashMode((prev) => {
      if (!prev) {
        // Sync flash trigger to Firebase
        if (sessionId) {
          updateFlashMode(true);
        }
        // Flash for 3 seconds then turn off
        setTimeout(() => {
          setFlashMode(false);
          if (sessionId) {
            updateFlashMode(false);
          }
        }, 3000);
      }
      return !prev;
    });
  }, [sessionId, updateFlashMode]);

  // Navigation
  const switchToDisplay = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const switchToSessionManager = useCallback(() => {
    setShowSessionManager(true);
  }, []);

  const closeSessionManager = useCallback(() => {
    setShowSessionManager(false);
  }, []);

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
      // Firebase sync happens automatically via useEffect
    },
    [showPresetMessage]
  );

  const handleShowMessage = useCallback(
    (text: string, autoHide?: boolean, hideAfter?: number) => {
      const message = { text, autoHide, hideAfter };
      showMessage(text, message);
      // Firebase sync happens automatically via useEffect
    },
    [showMessage]
  );

  // Timer handlers with Firebase sync
  const handleAddTimer = useCallback(
    (name: string, duration: number, type: TimerType, startTime?: string) => {
      addTimer(name, duration, type, startTime);
      // Firebase sync happens automatically via useEffect
    },
    [addTimer]
  );

  const handleStartTimer = useCallback(
    (timerId: string) => {
      startTimer(timerId);
      // Firebase sync happens automatically via useEffect
    },
    [startTimer]
  );

  const handlePauseTimer = useCallback(
    (timerId: string) => {
      pauseTimer(timerId);
      // Firebase sync happens automatically via useEffect
    },
    [pauseTimer]
  );

  const handleResetTimer = useCallback(
    (timerId: string) => {
      resetTimer(timerId);
      // Firebase sync happens automatically via useEffect
    },
    [resetTimer]
  );

  // Session handlers
  const handleJoinSession = useCallback(
    async (sessionId: string): Promise<void> => {
      // This is for controller route, but we might want to join existing sessions
      console.log('Joining session:', sessionId);
    },
    []
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
        onSwitchToMultiDevice={switchToSessionManager}
        isTimerRunning={isTimerRunning}
        isTimerPaused={isTimerPaused}
        isTimerExpired={isTimerExpired}
      />

      {/* Session Manager Modal */}
      {showSessionManager && (
        <SessionManager
          mode="create"
          sessionId={sessionId || undefined}
          isConnected={isConnected}
          connectionStatus={connectionStatus}
          onCreateSession={handleCreateSession}
          onJoinSession={handleJoinSession}
          onClose={closeSessionManager}
        />
      )}

      {/* Connection Status Indicator */}
      {sessionId && (
        <div className="fixed right-4 top-4 z-30 rounded-md bg-green-100 px-3 py-2 text-sm text-green-800 dark:bg-green-900 dark:text-green-200">
          Session: {sessionId} • {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      )}

      {/* Blackout overlay */}
      {blackoutMode && <div className="fixed inset-0 z-50 bg-black" />}

      {/* Flash overlay */}
      {flashMode && (
        <div className="pointer-events-none fixed inset-0 z-40 animate-flash bg-white" />
      )}

      {/* Firebase Test Component (temporary for debugging) */}
    </div>
  );
}
