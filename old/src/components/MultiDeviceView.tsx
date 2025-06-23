import React, { useState } from "react";
import type { Timer, Message, AppSettings, TimerType } from "../types";
import type { ConnectionState, NetworkDevice, PairingInfo } from "../types/sync";
import { DeviceRoleSelector } from "./DeviceRoleSelector";
import { ConnectionStatusPanel } from "./ConnectionStatusPanel";
import { QRCodePairing } from "./QRCodePairing";

interface MultiDeviceViewProps {
  timers: Timer[];
  activeTimer: Timer | null;
  activeTimerId: string | null;
  currentMessage: Message | null;
  messageQueue: Message[];
  settings: AppSettings;
  connectionState: ConnectionState;
  discoveredDevices: NetworkDevice[];
  blackoutMode: boolean;
  flashMode: boolean;
  
  // Device management
  onSetDeviceRole: (role: any) => void;
  onStartConnection: () => void;
  onStopConnection: () => void;
  onConnectToDevice: (device: NetworkDevice) => void;
  onGeneratePairingCode: () => string;
  onConnectWithCode: (code: string) => Promise<void>;
  onGeneratePairingInfo: () => Promise<PairingInfo>;
  onConnectWithPairingInfo: (info: PairingInfo) => Promise<void>;
  onRefreshDevices: () => void;
  
  // Timer actions (for controller)
  onAddTimer: (name: string, duration: number, type: TimerType) => void;
  onDeleteTimer: (timerId: string) => void;
  onSelectTimer: (timerId: string) => void;
  onStartTimer: (timerId: string) => void;
  onPauseTimer: (timerId: string) => void;
  onResetTimer: (timerId: string) => void;
  onUpdateTimerTime: (timerId: string, newTime: number) => void;
  onUpdateTimerDuration: (timerId: string, newDuration: number) => void;
  onUpdateTimerType: (timerId: string, newType: TimerType) => void;
  onUpdateTimer: (timerId: string, updates: Partial<Timer>) => void;
  onAdjustTime: (timerId: string, seconds: number) => void;
  
  // Message actions (for controller)
  onShowMessage: (text: string, autoHide?: boolean, hideAfter?: number) => void;
  onClearMessage: () => void;
  onToggleBlackout: () => void;
  onToggleFlash: () => void;
  
  // Navigation
  onSwitchToDisplay: () => void;
  onSwitchToControl: () => void;
  
  className?: string;
}

export function MultiDeviceView({
  connectionState,
  discoveredDevices,
  onSetDeviceRole,
  onStartConnection,
  onStopConnection,
  onConnectToDevice,
  onGeneratePairingCode,
  onConnectWithCode,
  onGeneratePairingInfo,
  onConnectWithPairingInfo,
  onRefreshDevices,
  onSwitchToDisplay,
  onSwitchToControl,
  className = "",
}: MultiDeviceViewProps) {
  const [activeTab, setActiveTab] = useState<"setup" | "connection" | "pairing">("setup");

  const { localDevice, status, connectedDevices } = connectionState;
  const isController = localDevice.role === "controller";
  const isDisplay = localDevice.role === "display";
  const isConnected = status === "connected";

  const tabs = [
    { id: "setup", label: "Device Setup", icon: "⚙️" },
    { id: "connection", label: "Connection", icon: "🔗" },
    { id: "pairing", label: "Pairing", icon: "📱" },
  ] as const;

  return (
    <div className={`multi-device-view h-screen bg-neutral-900 text-white ${className}`}>
      {/* Header */}
      <div className="bg-neutral-800 border-b border-neutral-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Stage Timer - Multi-Device Setup</h1>
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${
                status === "connected" ? "bg-green-400" : 
                status === "connecting" ? "bg-yellow-400" : 
                status === "error" ? "bg-red-400" : "bg-neutral-500"
              }`}></div>
              <span className="text-neutral-300">
                {isConnected ? `Connected (${connectedDevices.length})` : "Not Connected"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isController && (
              <button
                onClick={onSwitchToControl}
                className="btn-ctrl h-9 px-4 text-sm bg-blue-800 border-blue-600 hover:border-blue-400 text-white"
              >
                Open Controller
              </button>
            )}
            
            {(isDisplay || isController) && (
              <button
                onClick={onSwitchToDisplay}
                className="btn-ctrl h-9 px-4 text-sm bg-green-800 border-green-600 hover:border-green-400 text-white"
              >
                Open Display
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-80 bg-neutral-800 border-r border-neutral-700 p-6">
          {/* Tab Navigation */}
          <div className="space-y-2 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? "bg-neutral-700 text-white border border-neutral-600"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-700/50"
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Quick Status */}
          <div className="bg-neutral-700/50 rounded-lg p-4">
            <div className="text-sm font-medium text-neutral-300 mb-2">Quick Status</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Device Role:</span>
                <span className="text-white capitalize">{localDevice.role}</span>
              </div>
              <div className="flex justify-between">
                <span>Connection:</span>
                <span className={`capitalize ${
                  status === "connected" ? "text-green-400" : 
                  status === "connecting" ? "text-yellow-400" : 
                  status === "error" ? "text-red-400" : "text-neutral-400"
                }`}>
                  {status}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Connected Devices:</span>
                <span className="text-white">{connectedDevices.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Discovered:</span>
                <span className="text-white">{discoveredDevices.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Panel */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === "setup" && (
            <div className="max-w-2xl">
              <h2 className="text-xl font-semibold mb-4">Device Setup</h2>
              <p className="text-neutral-300 mb-6">
                Configure this device's role and connection preferences. Choose "Controller" for the device 
                you'll use to manage timers, and "Display" for devices that will show the timer.
              </p>
              
              <DeviceRoleSelector
                currentDevice={localDevice}
                connectionStatus={status}
                connectedDevices={connectedDevices}
                onRoleChange={onSetDeviceRole}
                onStartConnection={onStartConnection}
                onStopConnection={onStopConnection}
              />
            </div>
          )}

          {activeTab === "connection" && (
            <div className="max-w-2xl">
              <h2 className="text-xl font-semibold mb-4">Connection Management</h2>
              <p className="text-neutral-300 mb-6">
                View connection status, manage connected devices, and discover other Stage Timer devices 
                on your local network.
              </p>
              
              <ConnectionStatusPanel
                connectionState={connectionState}
                discoveredDevices={discoveredDevices}
                onConnectToDevice={onConnectToDevice}
                onGeneratePairingCode={onGeneratePairingCode}
                onConnectWithCode={onConnectWithCode}
                onRefreshDevices={onRefreshDevices}
              />
            </div>
          )}

          {activeTab === "pairing" && (
            <div className="max-w-2xl">
              <h2 className="text-xl font-semibold mb-4">Device Pairing</h2>
              <p className="text-neutral-300 mb-6">
                Use QR codes or manual pairing codes to connect devices quickly and securely. 
                This works even without internet connection.
              </p>
              
              <QRCodePairing
                onGeneratePairingInfo={onGeneratePairingInfo}
                onConnectWithPairingInfo={onConnectWithPairingInfo}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-neutral-800 border-t border-neutral-700 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-neutral-400">
          <div>
            Stage Timer Multi-Device • Device: {localDevice.name} ({localDevice.id.slice(-8)})
          </div>
          <div>
            {isConnected ? "🟢 Online" : "⚪ Offline"}
          </div>
        </div>
      </div>
    </div>
  );
}
