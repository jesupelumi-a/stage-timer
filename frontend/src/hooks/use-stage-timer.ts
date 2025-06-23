import { useEffect, useCallback } from 'react';
import { useSocket } from './use-socket';
import { useRoom, useCreateRoom, useUpdateRoom } from './use-rooms';
import { useTimersByRoom, useCreateTimer, useUpdateTimer, useDeleteTimer } from './use-timers';
import { useUIStore } from '../stores/ui-store';
import { useRoomStore } from '../stores/room-store';
import { useTimerStore } from '../stores/timer-store';
import type { NewRoom, NewTimer, Timer } from '@stage-timer/db';

interface UseStageTimerOptions {
  roomSlug?: string;
  isController?: boolean;
}

/**
 * Main hook that replaces useSimpleFirebaseSync
 * Provides unified interface for room and timer management
 */
export function useStageTimer(options: UseStageTimerOptions = {}) {
  const { roomSlug, isController = false } = options;
  
  // Stores
  const { setSelectedRoomSlug } = useUIStore();
  const { setCurrentRoom, setDeviceRole } = useRoomStore();
  const { initializeTimer } = useTimerStore();
  
  // Socket connection
  const socket = useSocket();
  
  // Queries
  const roomQuery = useRoom(roomSlug || null);
  const timersQuery = useTimersByRoom(roomSlug || null);
  
  // Mutations
  const createRoomMutation = useCreateRoom();
  const updateRoomMutation = useUpdateRoom();
  const createTimerMutation = useCreateTimer();
  const updateTimerMutation = useUpdateTimer();
  const deleteTimerMutation = useDeleteTimer();
  
  // Set device role
  useEffect(() => {
    setDeviceRole(isController ? 'controller' : 'display');
  }, [isController, setDeviceRole]);
  
  // Join room when roomSlug changes
  useEffect(() => {
    if (roomSlug && socket.isConnected) {
      socket.joinRoom(roomSlug);
      setSelectedRoomSlug(roomSlug);
      
      if (roomQuery.data) {
        setCurrentRoom(roomSlug, roomQuery.data.name);
      }
    }
    
    return () => {
      if (roomSlug && socket.isConnected) {
        socket.leaveRoom(roomSlug);
      }
    };
  }, [roomSlug, socket.isConnected, socket, setSelectedRoomSlug, setCurrentRoom, roomQuery.data]);
  
  // Initialize timers in local store
  useEffect(() => {
    if (timersQuery.data) {
      timersQuery.data.forEach(timer => {
        initializeTimer(timer.id.toString(), timer.durationMs);
      });
    }
  }, [timersQuery.data, initializeTimer]);
  
  // Room management
  const createRoom = useCallback(async (room: NewRoom) => {
    try {
      const newRoom = await createRoomMutation.mutateAsync(room);
      return newRoom;
    } catch (error) {
      console.error('Failed to create room:', error);
      throw error;
    }
  }, [createRoomMutation]);
  
  const updateRoom = useCallback(async (slug: string, data: { name: string }) => {
    try {
      const updatedRoom = await updateRoomMutation.mutateAsync({ slug, data });
      
      // Broadcast room update via socket
      if (socket.isConnected) {
        socket.updateRoom({
          roomId: updatedRoom.id,
          action: 'update',
          data: updatedRoom,
          timestamp: Date.now(),
        });
      }
      
      return updatedRoom;
    } catch (error) {
      console.error('Failed to update room:', error);
      throw error;
    }
  }, [updateRoomMutation, socket]);
  
  // Timer management
  const createTimer = useCallback(async (timer: Omit<NewTimer, 'roomId'> & { roomSlug: string }) => {
    try {
      const newTimer = await createTimerMutation.mutateAsync(timer as any);
      
      // Initialize in local store
      initializeTimer(newTimer.id.toString(), newTimer.durationMs);
      
      return newTimer;
    } catch (error) {
      console.error('Failed to create timer:', error);
      throw error;
    }
  }, [createTimerMutation, initializeTimer]);
  
  const updateTimer = useCallback(async (id: number, data: Partial<Timer>) => {
    try {
      const updatedTimer = await updateTimerMutation.mutateAsync({ id, data });
      
      // Broadcast timer update via socket
      if (socket.isConnected && roomQuery.data) {
        socket.updateTimer({
          roomId: roomQuery.data.id,
          timerId: id,
          action: 'update',
          data: updatedTimer,
          timestamp: Date.now(),
        });
      }
      
      return updatedTimer;
    } catch (error) {
      console.error('Failed to update timer:', error);
      throw error;
    }
  }, [updateTimerMutation, socket, roomQuery.data]);
  
  const deleteTimer = useCallback(async (id: number) => {
    try {
      await deleteTimerMutation.mutateAsync(id);
      
      // Broadcast timer deletion via socket
      if (socket.isConnected && roomQuery.data) {
        socket.updateTimer({
          roomId: roomQuery.data.id,
          timerId: id,
          action: 'update',
          data: { deleted: true },
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error('Failed to delete timer:', error);
      throw error;
    }
  }, [deleteTimerMutation, socket, roomQuery.data]);
  
  // Timer control actions
  const startTimer = useCallback((timerId: number) => {
    if (!socket.isConnected || !roomQuery.data) return;
    
    socket.startTimer({
      roomId: roomQuery.data.id,
      timerId,
      action: 'start',
      timestamp: Date.now(),
    });
  }, [socket, roomQuery.data]);
  
  const pauseTimer = useCallback((timerId: number) => {
    if (!socket.isConnected || !roomQuery.data) return;
    
    socket.pauseTimer({
      roomId: roomQuery.data.id,
      timerId,
      action: 'pause',
      timestamp: Date.now(),
    });
  }, [socket, roomQuery.data]);
  
  const stopTimer = useCallback((timerId: number) => {
    if (!socket.isConnected || !roomQuery.data) return;
    
    socket.stopTimer({
      roomId: roomQuery.data.id,
      timerId,
      action: 'stop',
      timestamp: Date.now(),
    });
  }, [socket, roomQuery.data]);
  
  const resetTimer = useCallback((timerId: number) => {
    if (!socket.isConnected || !roomQuery.data) return;
    
    socket.resetTimer({
      roomId: roomQuery.data.id,
      timerId,
      action: 'reset',
      timestamp: Date.now(),
    });
  }, [socket, roomQuery.data]);
  
  // Return interface similar to useSimpleFirebaseSync
  return {
    // Connection status
    connectionStatus: socket.connectionStatus.status,
    isConnected: socket.isConnected,
    
    // Data
    room: roomQuery.data,
    timers: timersQuery.data || [],
    
    // Loading states
    isLoadingRoom: roomQuery.isLoading,
    isLoadingTimers: timersQuery.isLoading,
    isLoading: roomQuery.isLoading || timersQuery.isLoading,
    
    // Error states
    roomError: roomQuery.error,
    timersError: timersQuery.error,
    
    // Room actions
    createRoom,
    updateRoom,
    
    // Timer actions
    createTimer,
    updateTimer,
    deleteTimer,
    
    // Timer controls
    startTimer,
    pauseTimer,
    stopTimer,
    resetTimer,
    
    // Mutation states
    isCreatingRoom: createRoomMutation.isPending,
    isUpdatingRoom: updateRoomMutation.isPending,
    isCreatingTimer: createTimerMutation.isPending,
    isUpdatingTimer: updateTimerMutation.isPending,
    isDeletingTimer: deleteTimerMutation.isPending,
    
    // Socket info
    socketId: socket.socketId,
  };
}
