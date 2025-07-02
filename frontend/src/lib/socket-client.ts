import { io, Socket } from 'socket.io-client';
import type { 
  SocketTimerEvent, 
  SocketMessageEvent, 
  SocketRoomEvent 
} from '@stage-timer/db';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

class SocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  
  // Event listeners storage
  private eventListeners: Map<string, Set<Function>> = new Map();

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('🔌 Connected to server');
      this.reconnectAttempts = 0;
      this.emit('connection-status', { status: 'connected' });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from server:', reason);
      this.emit('connection-status', { status: 'disconnected', reason });
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
      this.emit('connection-status', { status: 'error', error });
      this.handleReconnect();
    });

    // Room events
    this.socket.on('room-joined', (data) => {
      console.log('🏠 Joined room:', data);
      this.emit('room-joined', data);
    });

    this.socket.on('user-joined', (data) => {
      console.log('👤 User joined room:', data);
      this.emit('user-joined', data);
    });

    this.socket.on('user-left', (data) => {
      console.log('👤 User left room:', data);
      this.emit('user-left', data);
    });

    this.socket.on('room-updated', (data) => {
      console.log('🏠 Room updated:', data);
      this.emit('room-updated', data);
    });

    this.socket.on('active-timer-updated', (data) => {
      console.log('🎯 Active timer updated:', data);
      this.emit('active-timer-updated', data);
    });

    // Timer events
    this.socket.on('timer-started', (data) => {
      console.log('▶️ Timer started:', data);
      this.emit('timer-started', data);
    });

    this.socket.on('timer-paused', (data) => {
      console.log('⏸️ Timer paused:', data);
      this.emit('timer-paused', data);
    });

    this.socket.on('timer-stopped', (data) => {
      console.log('⏹️ Timer stopped:', data);
      this.emit('timer-stopped', data);
    });

    this.socket.on('timer-reset', (data) => {
      console.log('🔄 Timer reset:', data);
      this.emit('timer-reset', data);
    });

    this.socket.on('timer-updated', (data) => {
      console.log('🔄 Timer updated:', data);
      this.emit('timer-updated', data);
    });

    this.socket.on('timer-synced', (data) => {
      console.log('🔄 Timer synced:', data);
      this.emit('timer-synced', data);
    });

    // Message events
    this.socket.on('message-shown', (data) => {
      console.log('💬 Message shown:', data);
      this.emit('message-shown', data);
    });

    this.socket.on('message-hidden', (data) => {
      console.log('💬 Message hidden:', data);
      this.emit('message-hidden', data);
    });

    this.socket.on('message-updated', (data) => {
      console.log('💬 Message updated:', data);
      this.emit('message-updated', data);
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('🔌 Max reconnection attempts reached');
      this.emit('connection-status', { status: 'failed' });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔌 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  // Public methods
  joinRoom(roomChannel: string) {
    if (!this.socket?.connected) {
      console.warn('🔌 Socket not connected, cannot join room');
      return;
    }

    console.log('🏠 Joining room channel:', roomChannel);
    this.socket.emit('join-room', roomChannel);
  }

  leaveRoom(roomChannel: string) {
    if (!this.socket?.connected) {
      return;
    }

    console.log('🏠 Leaving room channel:', roomChannel);
    this.socket.emit('leave-room', roomChannel);
  }

  // Timer actions
  startTimer(data: SocketTimerEvent) {
    this.socket?.emit('timer-start', data);
  }

  pauseTimer(data: SocketTimerEvent) {
    this.socket?.emit('timer-pause', data);
  }

  stopTimer(data: SocketTimerEvent) {
    this.socket?.emit('timer-stop', data);
  }

  resetTimer(data: SocketTimerEvent) {
    this.socket?.emit('timer-reset', data);
  }

  // Get socket ID for sender identification
  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  // Direct frontend-to-frontend broadcasting (for instant sync)
  broadcastFrontendEvent(eventName: string, data: any) {
    if (!this.socket?.connected) {
      console.warn('🔌 Socket not connected, cannot broadcast frontend event');
      return;
    }

    console.log('📡 Broadcasting frontend event directly to room:', eventName, data);
    // Broadcast directly to all clients in the room (including self)
    this.socket.emit('broadcast-to-room', {
      roomChannel: `room-${data.roomId}`,
      eventName,
      eventData: {
        ...data,
        senderId: this.socket.id, // Add sender ID
      },
    });
  }

  updateTimer(data: SocketTimerEvent) {
    this.socket?.emit('timer-update', data);
  }

  syncTimer(data: SocketTimerEvent) {
    this.socket?.emit('timer-sync', data);
  }

  // Message actions
  showMessage(data: SocketMessageEvent) {
    this.socket?.emit('message-show', data);
  }

  hideMessage(data: SocketMessageEvent) {
    this.socket?.emit('message-hide', data);
  }

  updateMessage(data: SocketMessageEvent) {
    this.socket?.emit('message-update', data);
  }

  // Room actions
  updateRoom(data: SocketRoomEvent) {
    this.socket?.emit('room-update', data);
  }

  changeActiveTimer(data: { roomId: number; activeTimerId: number | null; timestamp: number }) {
    this.socket?.emit('active-timer-changed', data);
  }

  // Event listener management
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback?: Function) {
    if (!this.eventListeners.has(event)) return;
    
    if (callback) {
      this.eventListeners.get(event)!.delete(callback);
    } else {
      this.eventListeners.get(event)!.clear();
    }
  }

  private emit(event: string, data?: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Connection status
  get connected() {
    return this.socket?.connected || false;
  }

  get id() {
    return this.socket?.id;
  }

  // Cleanup
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventListeners.clear();
  }
}

// Create singleton instance
export const socketClient = new SocketClient();

// Export for use in components
export default socketClient;
