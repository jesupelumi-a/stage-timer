import { useState, useEffect, useCallback, useRef } from 'react';
import {
  firebaseService,
  type SessionData,
  type ConnectionStatus,
} from '../services/firebase';
import type { TimerCollection, Message, AppSettings } from '../types';

export interface UseFirebaseSyncOptions {
  isController?: boolean;
  onSessionData?: (data: SessionData) => void;
  onConnectionStatusChange?: (status: ConnectionStatus) => void;
  onError?: (error: Error) => void;
}

export interface UseFirebaseSyncReturn {
  // Connection state
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  sessionId: string | null;

  // Controller methods
  createSession: (initialData: {
    controllerDeviceId: string;
    timers: TimerCollection;
    currentMessage: Message | null;
    messageQueue: Message[];
    settings: AppSettings;
    blackoutMode: boolean;
    flashMode: boolean;
  }) => Promise<string>;

  // Display methods
  joinSession: (sessionId: string) => Promise<void>;

  // Data sync methods
  updateTimers: (timers: TimerCollection) => Promise<void>;
  updateCurrentMessage: (message: Message | null) => Promise<void>;
  updateMessageQueue: (queue: Message[]) => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<void>;
  updateBlackoutMode: (enabled: boolean) => Promise<void>;
  updateFlashMode: (enabled: boolean) => Promise<void>;

  // Session management
  endSession: () => Promise<void>;
  deleteSession: () => Promise<void>;

  // Current session data
  sessionData: SessionData | null;
}

export function useFirebaseSync(
  options: UseFirebaseSyncOptions = {}
): UseFirebaseSyncReturn {
  const {
    isController = false,
    onSessionData,
    onConnectionStatusChange,
    onError,
  } = options;

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    firebaseService.status
  );
  const [sessionId, setSessionId] = useState<string | null>(
    firebaseService.currentSessionId
  );
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const unsubscribeSessionRef = useRef<(() => void) | null>(null);

  // Auto-authenticate on mount (for both controller and display)
  useEffect(() => {
    const authenticate = async () => {
      try {
        await firebaseService.authenticate();
      } catch (error) {
        console.error('Failed to authenticate:', error);
        onError?.(error as Error);
      }
    };

    authenticate();
  }, [onError]);

  // Handle connection status changes
  useEffect(() => {
    const unsubscribe = firebaseService.onConnectionStatusChange((status) => {
      setConnectionStatus(status);
      onConnectionStatusChange?.(status);
    });

    return unsubscribe;
  }, [onConnectionStatusChange]);

  // Create session (controller only)
  const createSession = useCallback(
    async (initialData: {
      controllerDeviceId: string;
      timers: TimerCollection;
      currentMessage: Message | null;
      messageQueue: Message[];
      settings: AppSettings;
      blackoutMode: boolean;
      flashMode: boolean;
    }): Promise<string> => {
      try {
        const newSessionId = await firebaseService.createSession({
          ...initialData,
          isActive: true,
        });

        setSessionId(newSessionId);

        // Subscribe to session updates
        if (unsubscribeSessionRef.current) {
          unsubscribeSessionRef.current();
        }

        unsubscribeSessionRef.current = firebaseService.subscribeToSession(
          newSessionId,
          (data) => {
            if (data) {
              setSessionData(data);
              onSessionData?.(data);
            }
          }
        );

        return newSessionId;
      } catch (error) {
        onError?.(error as Error);
        throw error;
      }
    },
    [onSessionData, onError]
  );

  // Join session (display only)
  const joinSession = useCallback(
    async (sessionId: string): Promise<void> => {
      try {
        const data = await firebaseService.joinSession(sessionId);
        if (data) {
          setSessionId(sessionId);
          setSessionData(data);
          onSessionData?.(data);

          // Subscribe to session updates
          if (unsubscribeSessionRef.current) {
            unsubscribeSessionRef.current();
          }

          unsubscribeSessionRef.current = firebaseService.subscribeToSession(
            sessionId,
            (data) => {
              if (data) {
                setSessionData(data);
                onSessionData?.(data);
              }
            }
          );
        }
      } catch (error) {
        onError?.(error as Error);
        throw error;
      }
    },
    [onSessionData, onError]
  );

  // Data update methods (controller only)
  const updateTimers = useCallback(
    async (timers: TimerCollection): Promise<void> => {
      if (!isController) return;
      try {
        await firebaseService.updateTimers(timers);
      } catch (error) {
        onError?.(error as Error);
        throw error;
      }
    },
    [isController, onError]
  );

  const updateCurrentMessage = useCallback(
    async (message: Message | null): Promise<void> => {
      if (!isController) return;
      try {
        await firebaseService.updateCurrentMessage(message);
      } catch (error) {
        onError?.(error as Error);
        throw error;
      }
    },
    [isController, onError]
  );

  const updateMessageQueue = useCallback(
    async (queue: Message[]): Promise<void> => {
      if (!isController) return;
      try {
        await firebaseService.updateMessageQueue(queue);
      } catch (error) {
        onError?.(error as Error);
        throw error;
      }
    },
    [isController, onError]
  );

  const updateSettings = useCallback(
    async (settings: AppSettings): Promise<void> => {
      if (!isController) return;
      try {
        await firebaseService.updateSettings(settings);
      } catch (error) {
        onError?.(error as Error);
        throw error;
      }
    },
    [isController, onError]
  );

  const updateBlackoutMode = useCallback(
    async (enabled: boolean): Promise<void> => {
      if (!isController) return;
      try {
        await firebaseService.updateBlackoutMode(enabled);
      } catch (error) {
        onError?.(error as Error);
        throw error;
      }
    },
    [isController, onError]
  );

  const updateFlashMode = useCallback(
    async (enabled: boolean): Promise<void> => {
      if (!isController) return;
      try {
        await firebaseService.updateFlashMode(enabled);
      } catch (error) {
        onError?.(error as Error);
        throw error;
      }
    },
    [isController, onError]
  );

  // Session management
  const endSession = useCallback(async (): Promise<void> => {
    try {
      await firebaseService.endSession();
      if (unsubscribeSessionRef.current) {
        unsubscribeSessionRef.current();
        unsubscribeSessionRef.current = null;
      }
      setSessionId(null);
      setSessionData(null);
    } catch (error) {
      onError?.(error as Error);
      throw error;
    }
  }, [onError]);

  const deleteSession = useCallback(async (): Promise<void> => {
    try {
      await firebaseService.deleteSession();
      if (unsubscribeSessionRef.current) {
        unsubscribeSessionRef.current();
        unsubscribeSessionRef.current = null;
      }
      setSessionId(null);
      setSessionData(null);
    } catch (error) {
      onError?.(error as Error);
      throw error;
    }
  }, [onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeSessionRef.current) {
        unsubscribeSessionRef.current();
      }
    };
  }, []);

  return {
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    sessionId,
    sessionData,
    createSession,
    joinSession,
    updateTimers,
    updateCurrentMessage,
    updateMessageQueue,
    updateSettings,
    updateBlackoutMode,
    updateFlashMode,
    endSession,
    deleteSession,
  };
}
