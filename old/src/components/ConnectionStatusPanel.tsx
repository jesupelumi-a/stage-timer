import React, { useState } from "react";
import type { ConnectionState, DeviceInfo, NetworkDevice } from "../types/sync";

interface ConnectionStatusPanelProps {
  connectionState: ConnectionState;
  discoveredDevices: NetworkDevice[];
  onConnectToDevice: (device: NetworkDevice) => void;
  onGeneratePairingCode: () => string;
  onConnectWithCode: (code: string) => Promise<void>;
  onRefreshDevices: () => void;
  className?: string;
}

export function ConnectionStatusPanel({
  connectionState,
  discoveredDevices,
  onConnectToDevice,
  onGeneratePairingCode,
  onConnectWithCode,
  onRefreshDevices,
  className = "",
}: ConnectionStatusPanelProps) {
  const [showPairingCode, setShowPairingCode] = useState(false);
  const [pairingCode, setPairingCode] = useState("");
  const [inputPairingCode, setInputPairingCode] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const { status, connectedDevices, localDevice, lastSync, errors } = connectionState;

  const getStatusIcon = () => {
    switch (status) {
      case "connected":
        return "🟢";
      case "connecting":
        return "🟡";
      case "error":
        return "🔴";
      default:
        return "⚪";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting";
      case "error":
        return "Connection Error";
      default:
        return "Disconnected";
    }
  };

  const handleGeneratePairingCode = () => {
    const code = onGeneratePairingCode();
    setPairingCode(code);
    setShowPairingCode(true);
  };

  const handleConnectWithCode = async () => {
    if (!inputPairingCode.trim()) return;

    setIsConnecting(true);
    try {
      await onConnectWithCode(inputPairingCode.trim());
      setInputPairingCode("");
    } catch (error) {
      console.error("Failed to connect with pairing code:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const formatLastSync = () => {
    if (!lastSync) return "Never";
    const now = Date.now();
    const diff = now - lastSync;
    
    if (diff < 1000) return "Just now";
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(lastSync).toLocaleTimeString();
  };

  return (
    <div className={`connection-status-panel bg-neutral-800 border border-neutral-600 rounded-lg p-4 ${className}`}>
      {/* Status Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getStatusIcon()}</span>
          <div>
            <div className="text-white font-medium">{getStatusText()}</div>
            <div className="text-xs text-neutral-400">
              Last sync: {formatLastSync()}
            </div>
          </div>
        </div>
        
        <button
          onClick={onRefreshDevices}
          className="btn-ctrl h-8 w-8 p-0 text-xs"
          title="Refresh devices"
        >
          <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
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
                className="flex items-center justify-between p-3 bg-neutral-700/50 rounded"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div>
                    <div className="text-white text-sm">{device.name}</div>
                    <div className="text-xs text-neutral-400">
                      {device.role} • {device.id.slice(-8)}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-green-400">Online</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discovered Devices */}
      {discoveredDevices.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-neutral-300 mb-2">
            Discovered Devices ({discoveredDevices.length})
          </div>
          <div className="space-y-2">
            {discoveredDevices
              .filter(device => device.id !== localDevice.id)
              .map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-3 bg-neutral-700/30 rounded border border-neutral-600"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <div>
                      <div className="text-white text-sm">{device.name}</div>
                      <div className="text-xs text-neutral-400">
                        {device.role} • {device.ip}:{device.port}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onConnectToDevice(device)}
                    className="btn-ctrl h-7 px-3 text-xs bg-blue-800 border-blue-600 hover:border-blue-400 text-white"
                  >
                    Connect
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Pairing Options */}
      <div className="border-t border-neutral-600 pt-4">
        <div className="text-sm font-medium text-neutral-300 mb-3">
          Device Pairing
        </div>

        {/* Generate Pairing Code */}
        <div className="mb-3">
          <button
            onClick={handleGeneratePairingCode}
            className="btn-ctrl h-8 px-4 text-sm w-full"
          >
            Generate Pairing Code
          </button>
          
          {showPairingCode && pairingCode && (
            <div className="mt-2 p-3 bg-neutral-700/50 rounded">
              <div className="text-xs text-neutral-400 mb-1">Share this code:</div>
              <div className="text-lg font-mono text-white text-center py-2 bg-neutral-600 rounded">
                {pairingCode}
              </div>
              <div className="text-xs text-neutral-400 mt-1 text-center">
                Code expires in 5 minutes
              </div>
            </div>
          )}
        </div>

        {/* Connect with Code */}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputPairingCode}
            onChange={(e) => setInputPairingCode(e.target.value.toUpperCase())}
            placeholder="Enter pairing code..."
            className="input-ctrl flex-1 h-8 px-2 text-sm"
            maxLength={8}
          />
          <button
            onClick={handleConnectWithCode}
            disabled={!inputPairingCode.trim() || isConnecting}
            className="btn-ctrl h-8 px-4 text-sm bg-green-800 border-green-600 hover:border-green-400 text-white disabled:opacity-50"
          >
            {isConnecting ? "..." : "Connect"}
          </button>
        </div>
      </div>

      {/* Connection Errors */}
      {errors.length > 0 && (
        <div className="mt-4 border-t border-neutral-600 pt-4">
          <div className="text-sm font-medium text-red-400 mb-2">
            Recent Errors
          </div>
          <div className="space-y-1">
            {errors.slice(-3).map((error, index) => (
              <div key={index} className="text-xs text-red-300 bg-red-900/20 p-2 rounded">
                {error}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connection Info */}
      <div className="mt-4 text-xs text-neutral-500">
        <div className="flex justify-between">
          <span>Method:</span>
          <span>{connectionState.method || "None"}</span>
        </div>
        <div className="flex justify-between">
          <span>Local Device:</span>
          <span>{localDevice.name}</span>
        </div>
        <div className="flex justify-between">
          <span>Role:</span>
          <span className="capitalize">{localDevice.role}</span>
        </div>
      </div>

      {/* Help Text */}
      {status === "disconnected" && (
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-600/30 rounded text-xs text-blue-300">
          <strong>Getting Started:</strong> Generate a pairing code on one device and enter it on another, 
          or connect to discovered devices on your local network.
        </div>
      )}
    </div>
  );
}
