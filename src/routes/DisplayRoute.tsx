import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebaseSync } from '../hooks/useFirebaseSync';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useFullscreenKeyboard } from '../hooks/useKeyboard';
import { DisplayView } from '../components/DisplayView';
import { SessionManager } from '../components/SessionManager';
import { FirebaseTest } from '../components/FirebaseTest';
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
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [timers, setTimers] = useState<TimerCollection>(
    DEFAULT_TIMER_COLLECTION
  );
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null);
  const [messageQueue, setMessageQueue] = useState<Message[]>([]);
  const [settings, setSettings] = useState<AppSettings>(localSettings);
  const [blackoutMode, setBlackoutMode] = useState(false);
  const [flashMode, setFlashMode] = useState(false);

  // Firebase sync for receiving updates from controller
  const { connectionStatus, isConnected, sessionId, sessionData, joinSession } =
    useFirebaseSync({
      isController: false,
      onSessionData: (data) => {
        // Update display state when session data changes
        setTimers(data.timers);
        setCurrentMessage(data.currentMessage);
        setMessageQueue(data.messageQueue);
        setSettings(data.settings);
        setBlackoutMode(data.blackoutMode);
        setFlashMode(data.flashMode);
      },
      onConnectionStatusChange: (status) => {
        console.log('Firebase connection status:', status);
      },
      onError: (error) => {
        console.error('Firebase sync error:', error);
      },
    });

  // Session management
  const handleJoinSession = useCallback(
    async (sessionId: string): Promise<void> => {
      try {
        await joinSession(sessionId);
        setShowSessionManager(false);
      } catch (error) {
        console.error('Failed to join session:', error);
        throw error;
      }
    },
    [joinSession]
  );

  const handleCreateSession = useCallback(async (): Promise<string> => {
    // Display devices don't create sessions, but we need this for the component
    throw new Error('Display devices cannot create sessions');
  }, []);

  // Show session manager if not connected to a session
  useEffect(() => {
    if (!sessionId && isConnected) {
      setShowSessionManager(true);
    }
  }, [sessionId, isConnected]);

  // Keyboard shortcuts
  useFullscreenKeyboard(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, true);

  // Double-click to go to controller (for setup)
  const handleDoubleClick = useCallback(() => {
    navigate('/control');
  }, [navigate]);

  // Get current timer for display
  const activeTimer = timers.timers.find((t) => t.id === timers.activeTimerId);
  const currentTimer = activeTimer?.state || {
    type: 'countdown' as const,
    status: 'idle' as const,
    currentTime: 0,
    initialTime: 0,
    elapsedTime: 0,
  };

  // Check if timer is expired
  const isTimerExpired = currentTimer.status === 'expired';

  return (
    <div className="display-route h-screen w-screen overflow-hidden">
      <DisplayView
        timer={currentTimer}
        currentMessage={currentMessage}
        settings={settings}
        isExpired={isTimerExpired}
      />

      {/* Session Manager Modal */}
      {showSessionManager && (
        <SessionManager
          mode="join"
          sessionId={sessionId || undefined}
          isConnected={isConnected}
          connectionStatus={connectionStatus}
          onCreateSession={handleCreateSession}
          onJoinSession={handleJoinSession}
          onClose={() => setShowSessionManager(false)}
        />
      )}

      {/* Connection Status Indicator */}
      {sessionId && (
        <div className="fixed right-4 top-4 z-30 rounded-md bg-blue-100 px-3 py-2 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          Session: {sessionId} • {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      )}

      {/* Blackout overlay */}
      {blackoutMode && <div className="fixed inset-0 z-50 bg-black" />}

      {/* Flash overlay */}
      {flashMode && (
        <div className="pointer-events-none fixed inset-0 z-40 animate-flash bg-white" />
      )}

      {/* Double-click handler for setup access */}
      <div
        className="fixed inset-0 z-30"
        onDoubleClick={handleDoubleClick}
        style={{ background: 'transparent', pointerEvents: 'all' }}
      />

      {/* Firebase connection status indicator (small, unobtrusive) */}
      {!sessionId && (
        <div className="fixed right-4 top-4 z-20">
          <div
            className={`h-3 w-3 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-green-500'
                : connectionStatus === 'connecting'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            }`}
            title={`Firebase: ${connectionStatus}`}
          />
        </div>
      )}

      {/* Device info (hidden, for debugging) */}
      <div className="fixed bottom-4 left-4 z-20 rounded bg-black/50 p-2 text-xs text-white/50 opacity-0 transition-opacity hover:opacity-100">
        Display Mode • Firebase: {connectionStatus} • Session:{' '}
        {sessionId || 'None'}
      </div>

      {/* Firebase Test Component (temporary for debugging) */}
      <FirebaseTest />
    </div>
  );
}
