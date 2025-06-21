import { useState, useEffect, useCallback, useRef } from "react";
import type {
  DeviceRole,
  ConnectionStatus,
  SyncMethod,
  DeviceInfo,
  ConnectionConfig,
  SyncMessage,
  ConnectionState,
  SyncEventHandlers,
  TimerSyncData,
  MessageSyncData,
  SettingsSyncData,
} from "../types/sync";
import {
  DEFAULT_CONNECTION_CONFIG,
  DEFAULT_DEVICE_INFO,
  generateDeviceId,
  generateDeviceName,
  generateMessageId,
  validateSyncMessage,
} from "../types/sync";

interface UseSyncManagerReturn {
  connectionState: ConnectionState;
  isController: boolean;
  isDisplay: boolean;
  isConnected: boolean;
  connectedDevices: DeviceInfo[];
  setDeviceRole: (role: DeviceRole) => void;
  startConnection: (method?: SyncMethod) => Promise<void>;
  stopConnection: () => void;
  sendTimerSync: (data: TimerSyncData) => void;
  sendMessageSync: (data: MessageSyncData) => void;
  sendSettingsSync: (data: SettingsSyncData) => void;
  sendBlackoutToggle: (enabled: boolean) => void;
  sendFlashTrigger: () => void;
  generatePairingCode: () => string;
  connectWithPairingCode: (code: string) => Promise<void>;
}

export function useSyncManager(
  eventHandlers: Partial<SyncEventHandlers> = {},
  config: Partial<ConnectionConfig> = {}
): UseSyncManagerReturn {
  const fullConfig = { ...DEFAULT_CONNECTION_CONFIG, ...config };

  // Generate or retrieve device info
  const [localDevice] = useState<DeviceInfo>(() => {
    const stored = localStorage.getItem("stage-timer-device-info");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_DEVICE_INFO,
          ...parsed,
          lastSeen: Date.now(),
        };
      } catch {
        // Fall through to generate new
      }
    }

    return {
      ...DEFAULT_DEVICE_INFO,
      id: generateDeviceId(),
      name: generateDeviceName(),
    };
  });

  // Connection state
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: "disconnected",
    method: null,
    connectedDevices: [],
    localDevice,
    lastSync: 0,
    errors: [],
  });

  // Refs for connection management
  const connectionRef = useRef<any>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const messageQueueRef = useRef<SyncMessage[]>([]);

  // Save device info to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(
      "stage-timer-device-info",
      JSON.stringify(localDevice)
    );
  }, [localDevice]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup function - will be handled by the stopConnection function
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (connectionRef.current) {
        try {
          connectionRef.current.close();
        } catch (error) {
          // Ignore cleanup errors
        }
        connectionRef.current = null;
      }
    };
  }, []);

  // Connection status helpers
  const isController = connectionState.localDevice.role === "controller";
  const isDisplay = connectionState.localDevice.role === "display";
  const isConnected = connectionState.status === "connected";

  // Update connection status
  const updateConnectionStatus = useCallback(
    (status: ConnectionStatus, error?: string) => {
      setConnectionState((prev) => ({
        ...prev,
        status,
        errors: error ? [...prev.errors.slice(-4), error] : prev.errors,
      }));

      eventHandlers.onConnectionStatusChange?.(status);
      if (error) {
        eventHandlers.onError?.(error);
      }
    },
    [eventHandlers]
  );

  // Send message through active connection
  const sendMessage = useCallback(
    (message: SyncMessage) => {
      if (!isConnected || !connectionRef.current) {
        // Queue message for later
        messageQueueRef.current.push(message);
        return;
      }

      try {
        const messageStr = JSON.stringify(message);

        if (
          connectionRef.current.dataChannel &&
          typeof connectionRef.current.dataChannel.send === "function"
        ) {
          connectionRef.current.dataChannel.send(messageStr);
        } else if (
          connectionRef.current.send &&
          typeof connectionRef.current.send === "function"
        ) {
          connectionRef.current.send(messageStr);
        }

        setConnectionState((prev) => ({ ...prev, lastSync: Date.now() }));
      } catch (error) {
        console.error("Failed to send message:", error);
        updateConnectionStatus("error", `Failed to send message: ${error}`);
      }
    },
    [isConnected, updateConnectionStatus]
  );

  // Process queued messages
  const processMessageQueue = useCallback(() => {
    if (messageQueueRef.current.length > 0 && isConnected) {
      const messages = [...messageQueueRef.current];
      messageQueueRef.current = [];

      messages.forEach((message) => {
        sendMessage(message);
      });
    }
  }, [isConnected, sendMessage]);

  // Handle incoming messages
  const handleIncomingMessage = useCallback(
    (messageStr: string) => {
      try {
        const message = JSON.parse(messageStr);

        if (!validateSyncMessage(message)) {
          console.warn("Invalid sync message received:", message);
          return;
        }

        // Update last sync time
        setConnectionState((prev) => ({ ...prev, lastSync: Date.now() }));

        // Handle different message types
        switch (message.type) {
          case "device_info": {
            const deviceInfo = message.data as DeviceInfo;
            setConnectionState((prev) => ({
              ...prev,
              connectedDevices: prev.connectedDevices.some(
                (d) => d.id === deviceInfo.id
              )
                ? prev.connectedDevices.map((d) =>
                    d.id === deviceInfo.id ? deviceInfo : d
                  )
                : [...prev.connectedDevices, deviceInfo],
            }));
            eventHandlers.onDeviceConnected?.(deviceInfo);
            break;
          }

          case "heartbeat":
            // Send heartbeat response
            sendMessage({
              id: generateMessageId(),
              type: "ack",
              timestamp: Date.now(),
              senderId: localDevice.id,
              data: { originalId: message.id },
            });
            break;

          case "ack":
            // Handle acknowledgment
            break;

          default:
            // Forward to event handler
            eventHandlers.onSyncMessage?.(message);
            break;
        }
      } catch (error) {
        console.error("Failed to process incoming message:", error);
      }
    },
    [localDevice.id, eventHandlers, sendMessage]
  );

  // Start heartbeat
  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }

    heartbeatRef.current = setInterval(() => {
      if (isConnected) {
        sendMessage({
          id: generateMessageId(),
          type: "heartbeat",
          timestamp: Date.now(),
          senderId: localDevice.id,
          data: localDevice,
        });

        // Check connection health
        const currentTime = Date.now();
        const lastSync = connectionState.lastSync;
        if (
          lastSync > 0 &&
          currentTime - lastSync > fullConfig.heartbeatInterval * 3
        ) {
          updateConnectionStatus("error", "Connection timeout");
        }
      }
    }, fullConfig.heartbeatInterval);
  }, [
    isConnected,
    sendMessage,
    localDevice,
    fullConfig.heartbeatInterval,
    updateConnectionStatus,
  ]);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  // Set device role
  const setDeviceRole = useCallback((role: DeviceRole) => {
    setConnectionState((prev) => ({
      ...prev,
      localDevice: { ...prev.localDevice, role },
    }));
  }, []);

  // Start connection (placeholder - will be implemented in specific connection methods)
  const startConnection = useCallback(
    async (method: SyncMethod = fullConfig.method) => {
      updateConnectionStatus("connecting");

      try {
        // This will be implemented by specific connection handlers
        // For now, just update the method
        setConnectionState((prev) => ({ ...prev, method }));

        // Start heartbeat
        startHeartbeat();

        // Process any queued messages
        processMessageQueue();
      } catch (error) {
        updateConnectionStatus("error", `Connection failed: ${error}`);
      }
    },
    [
      fullConfig.method,
      updateConnectionStatus,
      startHeartbeat,
      processMessageQueue,
    ]
  );

  // Stop connection
  const stopConnection = useCallback(() => {
    stopHeartbeat();

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (connectionRef.current) {
      try {
        // Try to close connection regardless of method
        if (typeof connectionRef.current.close === "function") {
          connectionRef.current.close();
        }
      } catch (error) {
        console.error("Error closing connection:", error);
      }
      connectionRef.current = null;
    }

    setConnectionState((prev) => ({
      ...prev,
      status: "disconnected",
      method: null,
      connectedDevices: [],
      lastSync: 0,
    }));
  }, [stopHeartbeat]);

  // Sync message senders
  const sendTimerSync = useCallback(
    (data: TimerSyncData) => {
      sendMessage({
        id: generateMessageId(),
        type: "timer_state",
        timestamp: Date.now(),
        senderId: localDevice.id,
        data,
      });
    },
    [sendMessage, localDevice.id]
  );

  const sendMessageSync = useCallback(
    (data: MessageSyncData) => {
      sendMessage({
        id: generateMessageId(),
        type: "message_update",
        timestamp: Date.now(),
        senderId: localDevice.id,
        data,
      });
    },
    [sendMessage, localDevice.id]
  );

  const sendSettingsSync = useCallback(
    (data: SettingsSyncData) => {
      sendMessage({
        id: generateMessageId(),
        type: "settings_update",
        timestamp: Date.now(),
        senderId: localDevice.id,
        data,
      });
    },
    [sendMessage, localDevice.id]
  );

  const sendBlackoutToggle = useCallback(
    (enabled: boolean) => {
      sendMessage({
        id: generateMessageId(),
        type: "blackout_toggle",
        timestamp: Date.now(),
        senderId: localDevice.id,
        data: { enabled },
      });
    },
    [sendMessage, localDevice.id]
  );

  const sendFlashTrigger = useCallback(() => {
    sendMessage({
      id: generateMessageId(),
      type: "flash_trigger",
      timestamp: Date.now(),
      senderId: localDevice.id,
      data: {},
    });
  }, [sendMessage, localDevice.id]);

  // Pairing code generation (placeholder)
  const generatePairingCode = useCallback((): string => {
    // This will be implemented with actual pairing logic
    return "PAIR123";
  }, []);

  // Connect with pairing code (placeholder)
  const connectWithPairingCode = useCallback(
    async (code: string): Promise<void> => {
      // This will be implemented with actual pairing logic
      console.log("Connecting with code:", code);
    },
    []
  );

  return {
    connectionState,
    isController,
    isDisplay,
    isConnected,
    connectedDevices: connectionState.connectedDevices,
    setDeviceRole,
    startConnection,
    stopConnection,
    sendTimerSync,
    sendMessageSync,
    sendSettingsSync,
    sendBlackoutToggle,
    sendFlashTrigger,
    generatePairingCode,
    connectWithPairingCode,
  };
}
