import { useState, useEffect, useCallback } from 'react';
import {
  simpleFirebaseService,
  type SharedTimerData,
  type ConnectionStatus,
} from '../services/simpleFirebase';
import type { TimerCollection, Message, AppSettings } from '../types';

export interface UseSimpleFirebaseSyncOptions {
  isController?: boolean;
  onDataChange?: (data: SharedTimerData) => void;
  onConnectionStatusChange?: (status: ConnectionStatus) => void;
  onError?: (error: Error) => void;
}

export interface UseSimpleFirebaseSyncReturn {
  // Connection state
  connectionStatus: ConnectionStatus;
  isConnected: boolean;

  // Controller methods (only work if isController = true)
  fetchExistingData: () => Promise<SharedTimerData | null>;
  initializeData: (data: {
    timers: TimerCollection;
    currentMessage: Message | null;
    messageQueue: Message[];
    settings: AppSettings;
    blackoutMode: boolean;
    flashMode: boolean;
  }) => Promise<void>;

  // Data sync methods (controller only)
  updateTimers: (timers: TimerCollection) => Promise<void>;
  updateCurrentMessage: (message: Message | null) => Promise<void>;
  updateMessageQueue: (queue: Message[]) => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<void>;
  updateBlackoutMode: (enabled: boolean) => Promise<void>;
  updateFlashMode: (enabled: boolean) => Promise<void>;

  // Current shared data (for both controller and display)
  sharedData: SharedTimerData | null;
}

export function useSimpleFirebaseSync(
  options: UseSimpleFirebaseSyncOptions = {}
): UseSimpleFirebaseSyncReturn {
  const {
    isController = false,
    onDataChange,
    onConnectionStatusChange,
    onError,
  } = options;

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    simpleFirebaseService.status
  );
  const [sharedData, setSharedData] = useState<SharedTimerData | null>(null);

  // Auto-authenticate on mount
  useEffect(() => {
    const authenticate = async () => {
      try {
        await simpleFirebaseService.authenticate();
      } catch (error) {
        console.error('Failed to authenticate:', error);
        onError?.(error as Error);
      }
    };

    authenticate();
  }, [onError]);

  // Handle connection status changes
  useEffect(() => {
    const unsubscribe = simpleFirebaseService.onConnectionStatusChange(
      (status) => {
        setConnectionStatus(status);
        onConnectionStatusChange?.(status);
      }
    );

    return unsubscribe;
  }, [onConnectionStatusChange]);

  // Handle data changes
  useEffect(() => {
    const unsubscribe = simpleFirebaseService.onDataChange((data) => {
      setSharedData(data);
      onDataChange?.(data);
    });

    return unsubscribe;
  }, [onDataChange]);

  // Fetch existing data (controller only)
  const fetchExistingData =
    useCallback(async (): Promise<SharedTimerData | null> => {
      if (!isController) {
        throw new Error('Only controllers can fetch data');
      }

      try {
        return await simpleFirebaseService.fetchExistingData();
      } catch (error) {
        onError?.(error as Error);
        throw error;
      }
    }, [isController, onError]);

  // Initialize data (controller only)
  const initializeData = useCallback(
    async (data: {
      timers: TimerCollection;
      currentMessage: Message | null;
      messageQueue: Message[];
      settings: AppSettings;
      blackoutMode: boolean;
      flashMode: boolean;
    }): Promise<void> => {
      if (!isController) {
        throw new Error('Only controllers can initialize data');
      }

      try {
        await simpleFirebaseService.initializeData(data);
      } catch (error) {
        onError?.(error as Error);
        throw error;
      }
    },
    [isController, onError]
  );

  // Data update methods (controller only)
  const updateTimers = useCallback(
    async (timers: TimerCollection): Promise<void> => {
      if (!isController) return;
      try {
        await simpleFirebaseService.updateTimers(timers);
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
        await simpleFirebaseService.updateCurrentMessage(message);
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
        await simpleFirebaseService.updateMessageQueue(queue);
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
        await simpleFirebaseService.updateSettings(settings);
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
        await simpleFirebaseService.updateBlackoutMode(enabled);
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
        await simpleFirebaseService.updateFlashMode(enabled);
      } catch (error) {
        onError?.(error as Error);
        throw error;
      }
    },
    [isController, onError]
  );

  return {
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    sharedData,
    fetchExistingData,
    initializeData,
    updateTimers,
    updateCurrentMessage,
    updateMessageQueue,
    updateSettings,
    updateBlackoutMode,
    updateFlashMode,
  };
}
