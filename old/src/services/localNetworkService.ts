import type { NetworkDevice, DeviceInfo, PairingInfo } from "../types/sync";

// Simple local network discovery service using WebSocket signaling
export class LocalNetworkService {
  private localDevice: DeviceInfo;
  private discoveredDevices: Map<string, NetworkDevice> = new Map();
  private broadcastInterval: NodeJS.Timeout | null = null;
  private discoveryPort = 8765;
  private onDeviceDiscovered: (device: NetworkDevice) => void;
  private onDeviceLost: (deviceId: string) => void;
  private onError: (error: string) => void;

  constructor(
    localDevice: DeviceInfo,
    callbacks: {
      onDeviceDiscovered: (device: NetworkDevice) => void;
      onDeviceLost: (deviceId: string) => void;
      onError: (error: string) => void;
    }
  ) {
    this.localDevice = localDevice;
    this.onDeviceDiscovered = callbacks.onDeviceDiscovered;
    this.onDeviceLost = callbacks.onDeviceLost;
    this.onError = callbacks.onError;
  }

  // Start device discovery
  async startDiscovery(): Promise<void> {
    try {
      // Start broadcasting our presence
      this.startBroadcast();
      
      // Start listening for other devices
      this.startListening();
      
      console.log("Local network discovery started");
    } catch (error) {
      this.onError(`Failed to start discovery: ${error}`);
      throw error;
    }
  }

  // Stop device discovery
  stopDiscovery(): void {
    this.stopBroadcast();
    this.discoveredDevices.clear();
    console.log("Local network discovery stopped");
  }

  // Start broadcasting our device info
  private startBroadcast(): void {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
    }

    // Broadcast every 5 seconds
    this.broadcastInterval = setInterval(() => {
      this.broadcastDeviceInfo();
    }, 5000);

    // Initial broadcast
    this.broadcastDeviceInfo();
  }

  // Stop broadcasting
  private stopBroadcast(): void {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }
  }

  // Broadcast device information
  private async broadcastDeviceInfo(): Promise<void> {
    try {
      // In a real implementation, this would use UDP broadcast or mDNS
      // For this demo, we'll use a simple HTTP-based approach
      
      const deviceInfo = {
        id: this.localDevice.id,
        name: this.localDevice.name,
        role: this.localDevice.role,
        port: this.discoveryPort,
        timestamp: Date.now(),
      };

      // Simulate broadcasting by storing in localStorage with a timestamp
      // Other devices can check this periodically
      const broadcastKey = `stage-timer-broadcast-${this.localDevice.id}`;
      localStorage.setItem(broadcastKey, JSON.stringify(deviceInfo));

      // Clean up old broadcasts (older than 30 seconds)
      this.cleanupOldBroadcasts();
      
    } catch (error) {
      console.error("Failed to broadcast device info:", error);
    }
  }

  // Listen for other devices
  private startListening(): void {
    // Check for other devices every 3 seconds
    const checkInterval = setInterval(() => {
      this.checkForDevices();
    }, 3000);

    // Store interval reference for cleanup
    (this as any).checkInterval = checkInterval;
  }

  // Check localStorage for other device broadcasts
  private checkForDevices(): void {
    try {
      const now = Date.now();
      const maxAge = 30000; // 30 seconds

      // Check all localStorage keys for broadcasts
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("stage-timer-broadcast-") && !key.includes(this.localDevice.id)) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const deviceInfo = JSON.parse(data);
              
              // Check if broadcast is recent
              if (now - deviceInfo.timestamp < maxAge) {
                const networkDevice: NetworkDevice = {
                  id: deviceInfo.id,
                  name: deviceInfo.name,
                  ip: "localhost", // In a real implementation, this would be the actual IP
                  port: deviceInfo.port,
                  role: deviceInfo.role,
                  lastSeen: deviceInfo.timestamp,
                };

                // Check if this is a new device or updated info
                const existing = this.discoveredDevices.get(deviceInfo.id);
                if (!existing || existing.lastSeen < deviceInfo.timestamp) {
                  this.discoveredDevices.set(deviceInfo.id, networkDevice);
                  this.onDeviceDiscovered(networkDevice);
                }
              }
            } catch (error) {
              console.error("Failed to parse device broadcast:", error);
            }
          }
        }
      }

      // Remove devices that haven't been seen recently
      for (const [deviceId, device] of this.discoveredDevices) {
        if (now - device.lastSeen > maxAge) {
          this.discoveredDevices.delete(deviceId);
          this.onDeviceLost(deviceId);
        }
      }
    } catch (error) {
      console.error("Failed to check for devices:", error);
    }
  }

  // Clean up old broadcasts from localStorage
  private cleanupOldBroadcasts(): void {
    try {
      const now = Date.now();
      const maxAge = 60000; // 1 minute
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("stage-timer-broadcast-")) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const deviceInfo = JSON.parse(data);
              if (now - deviceInfo.timestamp > maxAge) {
                keysToRemove.push(key);
              }
            } catch (error) {
              // Invalid data, remove it
              keysToRemove.push(key);
            }
          }
        }
      }

      // Remove old broadcasts
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error("Failed to cleanup old broadcasts:", error);
    }
  }

  // Get discovered devices
  getDiscoveredDevices(): NetworkDevice[] {
    return Array.from(this.discoveredDevices.values());
  }

  // Generate pairing info for local network connection
  generatePairingInfo(): PairingInfo {
    return {
      deviceId: this.localDevice.id,
      deviceName: this.localDevice.name,
      connectionMethod: "websocket",
      connectionData: `localhost:${this.discoveryPort}`,
      timestamp: Date.now(),
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    };
  }

  // Create a simple WebSocket server for direct connections
  async createConnectionServer(): Promise<number> {
    // In a real implementation, this would create a WebSocket server
    // For this demo, we'll simulate it
    console.log(`Connection server would start on port ${this.discoveryPort}`);
    return this.discoveryPort;
  }

  // Connect to a device using its network info
  async connectToDevice(device: NetworkDevice): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      try {
        // In a real implementation, this would connect to the device's WebSocket server
        // For this demo, we'll simulate a connection
        
        const ws = new WebSocket(`ws://${device.ip}:${device.port}`);
        
        ws.onopen = () => {
          console.log(`Connected to device ${device.name} at ${device.ip}:${device.port}`);
          resolve(ws);
        };

        ws.onerror = (error) => {
          console.error(`Failed to connect to device ${device.name}:`, error);
          reject(error);
        };

        ws.onclose = () => {
          console.log(`Connection to device ${device.name} closed`);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  // Check if local network discovery is supported
  static isSupported(): boolean {
    return typeof localStorage !== "undefined";
  }

  // Get local IP address (simplified)
  async getLocalIP(): Promise<string> {
    // In a real implementation, this would detect the actual local IP
    // For this demo, we'll return localhost
    return "localhost";
  }

  // Cleanup resources
  destroy(): void {
    this.stopDiscovery();
    
    if ((this as any).checkInterval) {
      clearInterval((this as any).checkInterval);
    }

    // Remove our broadcast from localStorage
    const broadcastKey = `stage-timer-broadcast-${this.localDevice.id}`;
    localStorage.removeItem(broadcastKey);
  }
}
