// Multi-Device Sync Types

export type DeviceRole = "controller" | "display" | "auto";

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export type SyncMethod = "webrtc" | "websocket" | "local";

export interface DeviceInfo {
  id: string;
  name: string;
  role: DeviceRole;
  lastSeen: number;
  capabilities: string[];
  version: string;
}

export interface ConnectionConfig {
  method: SyncMethod;
  autoConnect: boolean;
  reconnectAttempts: number;
  heartbeatInterval: number;
  connectionTimeout: number;
}

export interface SyncMessage {
  id: string;
  type: SyncMessageType;
  timestamp: number;
  senderId: string;
  data: any;
  requiresAck?: boolean;
}

export type SyncMessageType =
  | "device_info"
  | "timer_state"
  | "timer_action"
  | "message_update"
  | "settings_update"
  | "blackout_toggle"
  | "flash_trigger"
  | "heartbeat"
  | "ack"
  | "error";

// Timer sync data
export interface TimerSyncData {
  timers: any[]; // Timer array
  activeTimerId: string | null;
  action?: "start" | "pause" | "reset" | "add" | "delete" | "update";
  timerId?: string;
  updates?: any;
}

// Message sync data
export interface MessageSyncData {
  currentMessage: any | null;
  messageQueue: any[];
  action?: "show" | "hide" | "clear" | "queue";
  message?: any;
}

// Settings sync data
export interface SettingsSyncData {
  settings: any;
  updates: any;
}

// Connection state
export interface ConnectionState {
  status: ConnectionStatus;
  method: SyncMethod | null;
  connectedDevices: DeviceInfo[];
  localDevice: DeviceInfo;
  lastSync: number;
  errors: string[];
}

// WebRTC specific types
export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  dataChannelConfig: RTCDataChannelInit;
}

export interface PeerConnection {
  id: string;
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  status: ConnectionStatus;
  role: DeviceRole;
}

// Local network discovery
export interface NetworkDevice {
  id: string;
  name: string;
  ip: string;
  port: number;
  role: DeviceRole;
  lastSeen: number;
}

// QR Code pairing
export interface PairingInfo {
  deviceId: string;
  deviceName: string;
  connectionMethod: SyncMethod;
  connectionData: string; // IP:port or WebRTC offer
  timestamp: number;
  expires: number;
}

// Sync events
export interface SyncEventHandlers {
  onDeviceConnected: (device: DeviceInfo) => void;
  onDeviceDisconnected: (deviceId: string) => void;
  onSyncMessage: (message: SyncMessage) => void;
  onConnectionStatusChange: (status: ConnectionStatus) => void;
  onError: (error: string) => void;
}

// Default configurations
export const DEFAULT_CONNECTION_CONFIG: ConnectionConfig = {
  method: "webrtc",
  autoConnect: true,
  reconnectAttempts: 5,
  heartbeatInterval: 5000, // 5 seconds
  connectionTimeout: 10000, // 10 seconds
};

export const DEFAULT_WEBRTC_CONFIG: WebRTCConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
  dataChannelConfig: {
    ordered: true,
    maxRetransmits: 3,
  },
};

export const DEFAULT_DEVICE_INFO: Omit<DeviceInfo, "id" | "name"> = {
  role: "auto",
  lastSeen: Date.now(),
  capabilities: ["timer", "messages", "settings"],
  version: "1.0.0",
};

// Utility functions
export function generateDeviceId(): string {
  return `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function isValidDeviceRole(role: string): role is DeviceRole {
  return ["controller", "display", "auto"].includes(role);
}

export function isValidSyncMethod(method: string): method is SyncMethod {
  return ["webrtc", "websocket", "local"].includes(method);
}

// Message validation
export function validateSyncMessage(message: any): message is SyncMessage {
  return (
    message &&
    typeof message.id === "string" &&
    typeof message.type === "string" &&
    typeof message.timestamp === "number" &&
    typeof message.senderId === "string" &&
    message.data !== undefined
  );
}

// Device name generation
export function generateDeviceName(): string {
  const adjectives = ["Quick", "Smart", "Bright", "Swift", "Clear", "Sharp"];
  const nouns = ["Timer", "Display", "Controller", "Device", "Screen", "Panel"];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adjective} ${noun}`;
}

// Connection health check
export function isConnectionHealthy(lastSync: number, heartbeatInterval: number): boolean {
  return Date.now() - lastSync < heartbeatInterval * 3;
}

// Error types
export class SyncError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = "SyncError";
  }
}

export class ConnectionError extends SyncError {
  constructor(message: string, public method: SyncMethod) {
    super(message, "CONNECTION_ERROR");
  }
}

export class ValidationError extends SyncError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", false);
  }
}
