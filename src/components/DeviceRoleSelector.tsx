import React, { useState } from "react";
import type { DeviceRole, DeviceInfo, ConnectionStatus } from "../types/sync";

interface DeviceRoleSelectorProps {
  currentDevice: DeviceInfo;
  connectionStatus: ConnectionStatus;
  connectedDevices: DeviceInfo[];
  onRoleChange: (role: DeviceRole) => void;
  onStartConnection: () => void;
  onStopConnection: () => void;
  className?: string;
}

export function DeviceRoleSelector({
  currentDevice,
  connectionStatus,
  connectedDevices,
  onRoleChange,
  onStartConnection,
  onStopConnection,
  className = "",
}: DeviceRoleSelectorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isConnected = connectionStatus === "connected";
  const isConnecting = connectionStatus === "connecting";
  const hasControllers = connectedDevices.some(d => d.role === "controller");
  const hasDisplays = connectedDevices.some(d => d.role === "display");

  // Auto-suggest role based on connected devices
  const getSuggestedRole = (): DeviceRole => {
    if (currentDevice.role !== "auto") {
      return currentDevice.role;
    }

    // If no controllers are connected, suggest controller
    if (!hasControllers) {
      return "controller";
    }

    // If controllers exist but no displays, suggest display
    if (hasControllers && !hasDisplays) {
      return "display";
    }

    // Default to display if both exist
    return "display";
  };

  const suggestedRole = getSuggestedRole();

  const handleRoleSelect = (role: DeviceRole) => {
    onRoleChange(role);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "text-green-400";
      case "connecting":
        return "text-yellow-400";
      case "error":
        return "text-red-400";
      default:
        return "text-neutral-400";
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return `Connected to ${connectedDevices.length} device${connectedDevices.length !== 1 ? 's' : ''}`;
      case "connecting":
        return "Connecting...";
      case "error":
        return "Connection error";
      default:
        return "Not connected";
    }
  };

  return (
    <div className={`device-role-selector bg-neutral-800 border border-neutral-600 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">Device Setup</h3>
        <div className={`text-sm ${getStatusColor()}`}>
          {getStatusText()}
        </div>
      </div>

      {/* Device Info */}
      <div className="mb-4 p-3 bg-neutral-700/50 rounded">
        <div className="text-sm text-neutral-300 mb-1">This Device</div>
        <div className="text-white font-medium">{currentDevice.name}</div>
        <div className="text-xs text-neutral-400">ID: {currentDevice.id.slice(-8)}</div>
      </div>

      {/* Role Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-300 mb-3">
          Device Role
        </label>
        
        <div className="space-y-2">
          {/* Controller Option */}
          <label className="flex items-center p-3 border border-neutral-600 rounded cursor-pointer hover:border-neutral-500 transition-colors">
            <input
              type="radio"
              name="deviceRole"
              value="controller"
              checked={currentDevice.role === "controller"}
              onChange={() => handleRoleSelect("controller")}
              className="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
            />
            <div className="ml-3 flex-1">
              <div className="text-white font-medium">Controller</div>
              <div className="text-xs text-neutral-400">
                Manage timers, messages, and settings. Controls other devices.
              </div>
              {hasControllers && currentDevice.role !== "controller" && (
                <div className="text-xs text-yellow-400 mt-1">
                  ⚠️ Another controller is already connected
                </div>
              )}
            </div>
          </label>

          {/* Display Option */}
          <label className="flex items-center p-3 border border-neutral-600 rounded cursor-pointer hover:border-neutral-500 transition-colors">
            <input
              type="radio"
              name="deviceRole"
              value="display"
              checked={currentDevice.role === "display"}
              onChange={() => handleRoleSelect("display")}
              className="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
            />
            <div className="ml-3 flex-1">
              <div className="text-white font-medium">Display</div>
              <div className="text-xs text-neutral-400">
                Show timer and messages. Controlled by controller device.
              </div>
            </div>
          </label>

          {/* Auto Option */}
          <label className="flex items-center p-3 border border-neutral-600 rounded cursor-pointer hover:border-neutral-500 transition-colors">
            <input
              type="radio"
              name="deviceRole"
              value="auto"
              checked={currentDevice.role === "auto"}
              onChange={() => handleRoleSelect("auto")}
              className="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
            />
            <div className="ml-3 flex-1">
              <div className="text-white font-medium">
                Auto-detect
                {currentDevice.role === "auto" && (
                  <span className="ml-2 text-xs text-blue-400">
                    (Suggests: {suggestedRole})
                  </span>
                )}
              </div>
              <div className="text-xs text-neutral-400">
                Automatically choose role based on connected devices.
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Connection Controls */}
      <div className="flex gap-2 mb-4">
        {!isConnected && !isConnecting ? (
          <button
            onClick={onStartConnection}
            className="btn-ctrl h-9 px-4 text-sm bg-green-800 border-green-600 hover:border-green-400 text-white flex-1"
          >
            Start Connection
          </button>
        ) : (
          <button
            onClick={onStopConnection}
            className="btn-ctrl h-9 px-4 text-sm bg-red-800 border-red-600 hover:border-red-400 text-white flex-1"
            disabled={isConnecting}
          >
            {isConnecting ? "Connecting..." : "Disconnect"}
          </button>
        )}
        
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="btn-ctrl h-9 px-4 text-sm"
        >
          Advanced
        </button>
      </div>

      {/* Connected Devices */}
      {connectedDevices.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-neutral-300 mb-2">
            Connected Devices ({connectedDevices.length})
          </div>
          <div className="space-y-2">
            {connectedDevices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-2 bg-neutral-700/50 rounded text-sm"
              >
                <div>
                  <div className="text-white">{device.name}</div>
                  <div className="text-xs text-neutral-400">
                    {device.role} • {device.id.slice(-8)}
                  </div>
                </div>
                <div className="text-xs text-green-400">Connected</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="border-t border-neutral-600 pt-4">
          <div className="text-sm font-medium text-neutral-300 mb-3">
            Advanced Options
          </div>
          
          <div className="space-y-3">
            {/* Device Name */}
            <div>
              <label className="block text-xs text-neutral-400 mb-1">
                Device Name
              </label>
              <input
                type="text"
                value={currentDevice.name}
                onChange={(e) => {
                  // This would need to be handled by parent component
                  console.log("Device name change:", e.target.value);
                }}
                className="input-ctrl w-full h-8 px-2 text-sm"
                placeholder="Enter device name..."
              />
            </div>

            {/* Connection Method */}
            <div>
              <label className="block text-xs text-neutral-400 mb-1">
                Connection Method
              </label>
              <select className="input-ctrl w-full h-8 px-2 text-sm">
                <option value="webrtc">WebRTC (Peer-to-Peer)</option>
                <option value="websocket">WebSocket (Local Network)</option>
                <option value="auto">Auto-detect</option>
              </select>
            </div>

            {/* Debug Info */}
            <div className="text-xs text-neutral-500">
              <div>Version: {currentDevice.version}</div>
              <div>Capabilities: {currentDevice.capabilities.join(", ")}</div>
              <div>Last Seen: {new Date(currentDevice.lastSeen).toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-neutral-500 mt-4 p-3 bg-neutral-700/30 rounded">
        <strong>Quick Setup:</strong> Choose "Controller" on the device you'll use to manage timers, 
        and "Display" on devices that will show the timer. Use "Auto-detect" if unsure.
      </div>
    </div>
  );
}
