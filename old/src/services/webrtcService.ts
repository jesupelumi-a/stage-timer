import type {
  PeerConnection,
  WebRTCConfig,
  DeviceInfo,
  SyncMessage,
  PairingInfo,
} from "../types/sync";
import {
  DEFAULT_WEBRTC_CONFIG,
  generateMessageId,
  validateSyncMessage,
} from "../types/sync";

export class WebRTCService {
  private config: WebRTCConfig;
  private localDevice: DeviceInfo;
  private peers: Map<string, PeerConnection> = new Map();
  private onMessage: (message: SyncMessage) => void;
  private onPeerConnected: (peerId: string) => void;
  private onPeerDisconnected: (peerId: string) => void;
  private onError: (error: string) => void;

  constructor(
    localDevice: DeviceInfo,
    config: Partial<WebRTCConfig> = {},
    callbacks: {
      onMessage: (message: SyncMessage) => void;
      onPeerConnected: (peerId: string) => void;
      onPeerDisconnected: (peerId: string) => void;
      onError: (error: string) => void;
    }
  ) {
    this.config = { ...DEFAULT_WEBRTC_CONFIG, ...config };
    this.localDevice = localDevice;
    this.onMessage = callbacks.onMessage;
    this.onPeerConnected = callbacks.onPeerConnected;
    this.onPeerDisconnected = callbacks.onPeerDisconnected;
    this.onError = callbacks.onError;
  }

  // Create a new peer connection
  private createPeerConnection(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({
      iceServers: this.config.iceServers,
    });

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // In a real implementation, you'd send this to the signaling server
        // For local network, we'll use a different approach
        console.log("ICE candidate:", event.candidate);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Peer ${peerId} connection state:`, pc.connectionState);
      
      const peer = this.peers.get(peerId);
      if (!peer) return;

      switch (pc.connectionState) {
        case "connected":
          peer.status = "connected";
          this.onPeerConnected(peerId);
          break;
        case "disconnected":
        case "failed":
        case "closed":
          peer.status = "disconnected";
          this.onPeerDisconnected(peerId);
          this.peers.delete(peerId);
          break;
      }
    };

    // Handle data channel from remote peer
    pc.ondatachannel = (event) => {
      const channel = event.channel;
      this.setupDataChannel(peerId, channel);
    };

    return pc;
  }

  // Setup data channel event handlers
  private setupDataChannel(peerId: string, channel: RTCDataChannel) {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    peer.dataChannel = channel;

    channel.onopen = () => {
      console.log(`Data channel opened with peer ${peerId}`);
      peer.status = "connected";
      this.onPeerConnected(peerId);
    };

    channel.onclose = () => {
      console.log(`Data channel closed with peer ${peerId}`);
      peer.status = "disconnected";
      this.onPeerDisconnected(peerId);
    };

    channel.onerror = (error) => {
      console.error(`Data channel error with peer ${peerId}:`, error);
      this.onError(`Data channel error: ${error}`);
    };

    channel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (validateSyncMessage(message)) {
          this.onMessage(message);
        } else {
          console.warn("Invalid message received:", message);
        }
      } catch (error) {
        console.error("Failed to parse message:", error);
      }
    };
  }

  // Create an offer to connect to a peer
  async createOffer(peerId: string): Promise<string> {
    try {
      const pc = this.createPeerConnection(peerId);
      
      // Create data channel
      const dataChannel = pc.createDataChannel("sync", this.config.dataChannelConfig);
      
      const peer: PeerConnection = {
        id: peerId,
        connection: pc,
        dataChannel,
        status: "connecting",
        role: "display", // Assume the peer is a display if we're creating the offer
      };
      
      this.peers.set(peerId, peer);
      this.setupDataChannel(peerId, dataChannel);

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Return offer as base64 encoded string for easy sharing
      return btoa(JSON.stringify(offer));
    } catch (error) {
      this.onError(`Failed to create offer: ${error}`);
      throw error;
    }
  }

  // Accept an offer and create an answer
  async acceptOffer(peerId: string, offerStr: string): Promise<string> {
    try {
      const offer = JSON.parse(atob(offerStr));
      const pc = this.createPeerConnection(peerId);
      
      const peer: PeerConnection = {
        id: peerId,
        connection: pc,
        dataChannel: null,
        status: "connecting",
        role: "controller", // Assume the peer is a controller if we're accepting their offer
      };
      
      this.peers.set(peerId, peer);

      // Set remote description
      await pc.setRemoteDescription(offer);

      // Create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Return answer as base64 encoded string
      return btoa(JSON.stringify(answer));
    } catch (error) {
      this.onError(`Failed to accept offer: ${error}`);
      throw error;
    }
  }

  // Complete the connection with the answer
  async completeConnection(peerId: string, answerStr: string): Promise<void> {
    try {
      const answer = JSON.parse(atob(answerStr));
      const peer = this.peers.get(peerId);
      
      if (!peer) {
        throw new Error("Peer not found");
      }

      await peer.connection.setRemoteDescription(answer);
    } catch (error) {
      this.onError(`Failed to complete connection: ${error}`);
      throw error;
    }
  }

  // Send message to a specific peer
  sendMessage(peerId: string, message: SyncMessage): boolean {
    const peer = this.peers.get(peerId);
    
    if (!peer || !peer.dataChannel || peer.dataChannel.readyState !== "open") {
      return false;
    }

    try {
      peer.dataChannel.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`Failed to send message to peer ${peerId}:`, error);
      return false;
    }
  }

  // Broadcast message to all connected peers
  broadcastMessage(message: SyncMessage): number {
    let sentCount = 0;
    
    for (const [peerId] of this.peers) {
      if (this.sendMessage(peerId, message)) {
        sentCount++;
      }
    }
    
    return sentCount;
  }

  // Get connected peers
  getConnectedPeers(): string[] {
    return Array.from(this.peers.keys()).filter(
      peerId => this.peers.get(peerId)?.status === "connected"
    );
  }

  // Disconnect from a specific peer
  disconnectPeer(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.connection.close();
      this.peers.delete(peerId);
    }
  }

  // Disconnect from all peers
  disconnectAll(): void {
    for (const [peerId] of this.peers) {
      this.disconnectPeer(peerId);
    }
  }

  // Generate pairing info for QR code
  generatePairingInfo(): PairingInfo {
    const pairingInfo: PairingInfo = {
      deviceId: this.localDevice.id,
      deviceName: this.localDevice.name,
      connectionMethod: "webrtc",
      connectionData: "", // Will be filled with offer when creating connection
      timestamp: Date.now(),
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    };

    return pairingInfo;
  }

  // Create pairing offer for QR code
  async createPairingOffer(): Promise<PairingInfo> {
    const tempPeerId = `temp-${Date.now()}`;
    const offer = await this.createOffer(tempPeerId);
    
    const pairingInfo = this.generatePairingInfo();
    pairingInfo.connectionData = offer;
    
    return pairingInfo;
  }

  // Connect using pairing info from QR code
  async connectWithPairingInfo(pairingInfo: PairingInfo): Promise<void> {
    if (pairingInfo.connectionMethod !== "webrtc") {
      throw new Error("Invalid connection method for WebRTC service");
    }

    if (Date.now() > pairingInfo.expires) {
      throw new Error("Pairing info has expired");
    }

    try {
      const answer = await this.acceptOffer(pairingInfo.deviceId, pairingInfo.connectionData);
      
      // In a real implementation, you'd need to send this answer back to the offering device
      // For now, we'll simulate this by logging it
      console.log("Answer for pairing:", answer);
      
      // The offering device would then call completeConnection with this answer
    } catch (error) {
      this.onError(`Failed to connect with pairing info: ${error}`);
      throw error;
    }
  }

  // Check if WebRTC is supported
  static isSupported(): boolean {
    return (
      typeof RTCPeerConnection !== "undefined" &&
      typeof RTCDataChannel !== "undefined"
    );
  }

  // Get connection statistics
  async getConnectionStats(peerId: string): Promise<RTCStatsReport | null> {
    const peer = this.peers.get(peerId);
    if (!peer) return null;

    try {
      return await peer.connection.getStats();
    } catch (error) {
      console.error("Failed to get connection stats:", error);
      return null;
    }
  }

  // Cleanup resources
  destroy(): void {
    this.disconnectAll();
    this.peers.clear();
  }
}
