import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import socketClient from '../lib/socket-client';
import { useRoomStore } from '../stores/room-store';
import { useTimerStore } from '../stores/timer-store';
import { roomKeys } from './use-rooms';
import { timerKeys } from './use-timers';
import type { 
  SocketTimerEvent, 
  SocketMessageEvent, 
  SocketRoomEvent 
} from '@stage-timer/db';

interface ConnectionStatus {
  status: 'disconnected' | 'connecting' | 'connected' | 'error' | 'failed';
  reason?: string;
  error?: any;
}

export function useSocket() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: socketClient.connected ? 'connected' : 'disconnected'
  });
  
  const queryClient = useQueryClient();
  const { setConnectionStatus: setRoomConnectionStatus } = useRoomStore();
  const { syncTimer } = useTimerStore();

  // Connection status handler
  const handleConnectionStatus = useCallback((status: ConnectionStatus) => {
    setConnectionStatus(status);
    setRoomConnectionStatus(status.status);
  }, [setRoomConnectionStatus]);

  // Timer event handlers
  const handleTimerStarted = useCallback((data: SocketTimerEvent) => {
    // Sync timer state
    syncTimer(data.timerId.toString(), {
      isRunning: true,
      currentTime: data.data?.currentTime || 0,
      startTime: data.timestamp,
    });
    
    // Invalidate timer queries to refetch from server
    queryClient.invalidateQueries({ 
      queryKey: timerKeys.detail(data.timerId) 
    });
  }, [syncTimer, queryClient]);

  const handleTimerPaused = useCallback((data: SocketTimerEvent) => {
    syncTimer(data.timerId.toString(), {
      isRunning: false,
      currentTime: data.data?.currentTime || 0,
    });
    
    queryClient.invalidateQueries({ 
      queryKey: timerKeys.detail(data.timerId) 
    });
  }, [syncTimer, queryClient]);

  const handleTimerStopped = useCallback((data: SocketTimerEvent) => {
    syncTimer(data.timerId.toString(), {
      isRunning: false,
      currentTime: data.data?.currentTime || 0,
    });
    
    queryClient.invalidateQueries({ 
      queryKey: timerKeys.detail(data.timerId) 
    });
  }, [syncTimer, queryClient]);

  const handleTimerReset = useCallback((data: SocketTimerEvent) => {
    syncTimer(data.timerId.toString(), {
      isRunning: false,
      currentTime: data.data?.currentTime || 0,
    });
    
    queryClient.invalidateQueries({ 
      queryKey: timerKeys.detail(data.timerId) 
    });
  }, [syncTimer, queryClient]);

  const handleTimerUpdated = useCallback((data: SocketTimerEvent) => {
    // Invalidate timer and room queries to refetch updated data
    queryClient.invalidateQueries({ 
      queryKey: timerKeys.detail(data.timerId) 
    });
    queryClient.invalidateQueries({ 
      queryKey: roomKeys.detail(data.roomId.toString()) 
    });
  }, [queryClient]);

  const handleTimerSynced = useCallback((data: SocketTimerEvent) => {
    syncTimer(data.timerId.toString(), {
      isRunning: data.data?.isRunning || false,
      currentTime: data.data?.currentTime || 0,
      startTime: data.data?.startTime,
    });
  }, [syncTimer]);

  // Room event handlers
  const handleRoomUpdated = useCallback((data: SocketRoomEvent) => {
    queryClient.invalidateQueries({ 
      queryKey: roomKeys.detail(data.roomId.toString()) 
    });
  }, [queryClient]);

  const handleUserJoined = useCallback((data: any) => {
    console.log('👤 User joined:', data);
    // Could update UI to show connected users
  }, []);

  const handleUserLeft = useCallback((data: any) => {
    console.log('👤 User left:', data);
    // Could update UI to show connected users
  }, []);

  // Message event handlers
  const handleMessageShown = useCallback((data: SocketMessageEvent) => {
    // Could update message display state
    console.log('💬 Message shown:', data);
  }, []);

  const handleMessageHidden = useCallback((data: SocketMessageEvent) => {
    // Could update message display state
    console.log('💬 Message hidden:', data);
  }, []);

  const handleMessageUpdated = useCallback((data: SocketMessageEvent) => {
    queryClient.invalidateQueries({ 
      queryKey: timerKeys.detail(data.timerId) 
    });
  }, [queryClient]);

  // Setup event listeners
  useEffect(() => {
    // Connection events
    socketClient.on('connection-status', handleConnectionStatus);
    
    // Timer events
    socketClient.on('timer-started', handleTimerStarted);
    socketClient.on('timer-paused', handleTimerPaused);
    socketClient.on('timer-stopped', handleTimerStopped);
    socketClient.on('timer-reset', handleTimerReset);
    socketClient.on('timer-updated', handleTimerUpdated);
    socketClient.on('timer-synced', handleTimerSynced);
    
    // Room events
    socketClient.on('room-updated', handleRoomUpdated);
    socketClient.on('user-joined', handleUserJoined);
    socketClient.on('user-left', handleUserLeft);
    
    // Message events
    socketClient.on('message-shown', handleMessageShown);
    socketClient.on('message-hidden', handleMessageHidden);
    socketClient.on('message-updated', handleMessageUpdated);

    // Cleanup
    return () => {
      socketClient.off('connection-status', handleConnectionStatus);
      socketClient.off('timer-started', handleTimerStarted);
      socketClient.off('timer-paused', handleTimerPaused);
      socketClient.off('timer-stopped', handleTimerStopped);
      socketClient.off('timer-reset', handleTimerReset);
      socketClient.off('timer-updated', handleTimerUpdated);
      socketClient.off('timer-synced', handleTimerSynced);
      socketClient.off('room-updated', handleRoomUpdated);
      socketClient.off('user-joined', handleUserJoined);
      socketClient.off('user-left', handleUserLeft);
      socketClient.off('message-shown', handleMessageShown);
      socketClient.off('message-hidden', handleMessageHidden);
      socketClient.off('message-updated', handleMessageUpdated);
    };
  }, [
    handleConnectionStatus,
    handleTimerStarted,
    handleTimerPaused,
    handleTimerStopped,
    handleTimerReset,
    handleTimerUpdated,
    handleTimerSynced,
    handleRoomUpdated,
    handleUserJoined,
    handleUserLeft,
    handleMessageShown,
    handleMessageHidden,
    handleMessageUpdated,
  ]);

  // Public interface
  return {
    // Connection status
    connectionStatus,
    isConnected: connectionStatus.status === 'connected',
    
    // Room actions
    joinRoom: socketClient.joinRoom.bind(socketClient),
    leaveRoom: socketClient.leaveRoom.bind(socketClient),
    
    // Timer actions
    startTimer: socketClient.startTimer.bind(socketClient),
    pauseTimer: socketClient.pauseTimer.bind(socketClient),
    stopTimer: socketClient.stopTimer.bind(socketClient),
    resetTimer: socketClient.resetTimer.bind(socketClient),
    updateTimer: socketClient.updateTimer.bind(socketClient),
    syncTimer: socketClient.syncTimer.bind(socketClient),
    
    // Message actions
    showMessage: socketClient.showMessage.bind(socketClient),
    hideMessage: socketClient.hideMessage.bind(socketClient),
    updateMessage: socketClient.updateMessage.bind(socketClient),
    
    // Room actions
    updateRoom: socketClient.updateRoom.bind(socketClient),
    
    // Socket info
    socketId: socketClient.id,
  };
}
