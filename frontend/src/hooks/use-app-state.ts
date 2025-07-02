import { useState, useEffect, useCallback } from 'react';
import type {
  Room,
  Timer,
  RoomWithTimers,
  NewRoom,
  NewTimer,
} from '@stage-timer/db';
import { socketClient } from '../lib/socket-client';

// Enhanced API response type that matches the backend structure
interface EnhancedRoomResponse extends Room {
  timeset?: {
    timerId: number;
    running: boolean;
    deadline: number | null;
    kickoff: number | null;
    lastStop: number | null;
    currentTime: number | null;
    status: string;
  } | null;
  timers?: {
    items: Timer[];
    sorted: Timer[];
    active: Timer | null;
  };
  messages?: {
    items: any[];
    sorted: any[];
  };
}

// API client functions (simple fetch calls)
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Simple API functions
const api = {
  // Rooms
  getRooms: () => fetchAPI<Room[]>('/rooms'),
  getRoom: (slug: string) => fetchAPI<EnhancedRoomResponse>(`/rooms/${slug}`),
  createRoom: (room: NewRoom) =>
    fetchAPI<Room>('/rooms', {
      method: 'POST',
      body: JSON.stringify(room),
    }),
  updateRoom: (
    slug: string,
    data: { name?: string; activeTimerId?: number | null }
  ) =>
    fetchAPI<Room>(`/rooms/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteRoom: (slug: string) =>
    fetchAPI<{ message: string }>(`/rooms/${slug}`, {
      method: 'DELETE',
    }),

  // Timers
  createTimer: (timer: NewTimer & { roomSlug: string }) =>
    fetchAPI<Timer>('/timers', {
      method: 'POST',
      body: JSON.stringify(timer),
    }),
  updateTimer: (id: number, data: Partial<Timer>) =>
    fetchAPI<Timer>(`/timers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTimer: (id: number) =>
    fetchAPI<{ message: string }>(`/timers/${id}`, {
      method: 'DELETE',
    }),

  // Timer Sessions
  startTimer: (timerId: number) =>
    fetchAPI<any>(`/timer-sessions/${timerId}/start`, {
      method: 'POST',
    }),
  pauseTimer: (timerId: number, currentTime?: number) =>
    fetchAPI<any>(`/timer-sessions/${timerId}/pause`, {
      method: 'POST',
      body: JSON.stringify({
        timestamp: Date.now(),
        currentTime: currentTime // Send the exact frontend current time
      }),
    }),
  resetTimer: (timerId: number) =>
    fetchAPI<any>(`/timer-sessions/${timerId}/reset`, {
      method: 'POST',
    }),
  adjustTimer: (timerId: number, seconds: number) =>
    fetchAPI<any>(`/timer-sessions/${timerId}/adjust`, {
      method: 'PUT',
      body: JSON.stringify({ seconds }),
    }),
  getTimerSession: (timerId: number) =>
    fetchAPI<any>(`/timer-sessions/${timerId}`),
};

// Timer session state type
interface TimersetState {
  timerId: number;
  isRunning: boolean;
  currentTime: number;
  kickoff?: number;
  deadline?: number;
  status: 'running' | 'paused' | 'stopped';
}

// Main app state hook
export function useAppState() {
  // Core state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<RoomWithTimers | null>(null);
  const [timerset, setTimerset] = useState<TimersetState | null>(null);

  // Loading states
  const [loading, setLoading] = useState({
    rooms: false,
    room: false,
    timers: false,
  });

  // Error states
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Socket connection state
  const [isConnected, setIsConnected] = useState(false);

  // Clear error helper
  const clearError = useCallback((key: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
  }, []);

  // Set error helper
  const setError = useCallback((key: string, message: string) => {
    setErrors((prev) => ({ ...prev, [key]: message }));
  }, []);

  // Load initial data
  const loadRooms = useCallback(async () => {
    setLoading((prev) => ({ ...prev, rooms: true }));
    clearError('rooms');

    try {
      const roomsData = await api.getRooms();
      setRooms(roomsData);
    } catch (error) {
      console.error('Failed to load rooms:', error);
      setError('rooms', 'Failed to load rooms');
    } finally {
      setLoading((prev) => ({ ...prev, rooms: false }));
    }
  }, [clearError, setError]);

  const loadRoom = useCallback(
    async (slug: string) => {
      setLoading((prev) => ({ ...prev, room: true }));
      clearError('room');

      try {
        // Single API call to get all room data (timers, sessions, messages)
        const roomData = await api.getRoom(slug);

        // Set room data (now includes timers in nested structure)
        setCurrentRoom({
          ...roomData,
          timers: roomData.timers?.items || [], // Extract timers from nested structure
        });

        // Set timerset from the response (only one active timer at a time)
        if (roomData.timeset) {
          setTimerset({
            timerId: roomData.timeset.timerId,
            isRunning: roomData.timeset.running || false,
            currentTime: roomData.timeset.currentTime || 0,
            kickoff: roomData.timeset.kickoff || undefined,
            deadline: roomData.timeset.deadline || undefined,
            status: (roomData.timeset.status as 'running' | 'paused' | 'stopped') || 'stopped',
          });
        } else {
          setTimerset(null);
        }
      } catch (error) {
        console.error('Failed to load room:', error);
        setError('room', 'Failed to load room');
      } finally {
        setLoading((prev) => ({ ...prev, room: false }));
      }
    },
    [clearError, setError]
  );

  // Room operations
  const createRoom = useCallback(
    async (roomData: NewRoom) => {
      setLoading((prev) => ({ ...prev, rooms: true }));
      clearError('createRoom');

      try {
        const newRoom = await api.createRoom(roomData);
        setRooms((prev) => [...prev, newRoom]);
        return newRoom;
      } catch (error) {
        console.error('Failed to create room:', error);
        setError('createRoom', 'Failed to create room');
        throw error;
      } finally {
        setLoading((prev) => ({ ...prev, rooms: false }));
      }
    },
    [clearError, setError]
  );

  const updateRoom = useCallback(
    async (
      slug: string,
      data: { name?: string; activeTimerId?: number | null }
    ) => {
      clearError('updateRoom');

      try {
        const updatedRoom = await api.updateRoom(slug, data);

        // Update rooms list
        setRooms((prev) =>
          prev.map((room) => (room.slug === slug ? updatedRoom : room))
        );

        // Update current room if it's the one being updated
        if (currentRoom?.slug === slug) {
          setCurrentRoom((prev) => (prev ? { ...prev, ...updatedRoom } : null));
        }

        return updatedRoom;
      } catch (error) {
        console.error('Failed to update room:', error);
        setError('updateRoom', 'Failed to update room');
        throw error;
      }
    },
    [currentRoom?.slug, clearError, setError]
  );

  const deleteRoom = useCallback(
    async (slug: string) => {
      clearError('deleteRoom');

      try {
        await api.deleteRoom(slug);
        setRooms((prev) => prev.filter((room) => room.slug !== slug));

        // Clear current room if it's the one being deleted
        if (currentRoom?.slug === slug) {
          setCurrentRoom(null);
        }
      } catch (error) {
        console.error('Failed to delete room:', error);
        setError('deleteRoom', 'Failed to delete room');
        throw error;
      }
    },
    [currentRoom?.slug, clearError, setError]
  );

  // Timer operations
  const createTimer = useCallback(
    async (timerData: NewTimer & { roomSlug: string }) => {
      setLoading((prev) => ({ ...prev, timers: true }));
      clearError('createTimer');

      try {
        const newTimer = await api.createTimer(timerData);

        // Add timer to current room if it matches
        if (currentRoom?.slug === timerData.roomSlug) {
          setCurrentRoom((prev) =>
            prev
              ? {
                  ...prev,
                  timers: [...prev.timers, newTimer],
                }
              : null
          );

          // No need to initialize timer session state since we only track one active timer
        }

        return newTimer;
      } catch (error) {
        console.error('Failed to create timer:', error);
        setError('createTimer', 'Failed to create timer');
        throw error;
      } finally {
        setLoading((prev) => ({ ...prev, timers: false }));
      }
    },
    [currentRoom?.slug, clearError, setError]
  );

  const updateTimer = useCallback(
    async (id: number, data: Partial<Timer>) => {
      clearError('updateTimer');

      try {
        const updatedTimer = await api.updateTimer(id, data);

        // Update timer in current room
        if (currentRoom) {
          setCurrentRoom((prev) =>
            prev
              ? {
                  ...prev,
                  timers: prev.timers.map((timer) =>
                    timer.id === id ? updatedTimer : timer
                  ),
                }
              : null
          );
        }

        return updatedTimer;
      } catch (error) {
        console.error('Failed to update timer:', error);
        setError('updateTimer', 'Failed to update timer');
        throw error;
      }
    },
    [currentRoom, clearError, setError]
  );

  const deleteTimer = useCallback(
    async (id: number) => {
      clearError('deleteTimer');

      try {
        await api.deleteTimer(id);

        // Remove timer from current room
        if (currentRoom) {
          setCurrentRoom((prev) =>
            prev
              ? {
                  ...prev,
                  timers: prev.timers.filter((timer) => timer.id !== id),
                }
              : null
          );
        }

        // Clear timerset if this was the active timer
        if (timerset?.timerId === id) {
          setTimerset(null);
        }
      } catch (error) {
        console.error('Failed to delete timer:', error);
        setError('deleteTimer', 'Failed to delete timer');
        throw error;
      }
    },
    [currentRoom, clearError, setError]
  );

  // Timer control operations
  const startTimer = useCallback(
    async (timerId: number) => {
      setLoading((prev) => ({ ...prev, timers: true }));
      clearError('startTimer');

      try {
        const response = await api.startTimer(timerId);

        // Update timerset immediately for UI responsiveness
        setTimerset({
          timerId,
          isRunning: response.running,
          currentTime: response.currentTime || 0,
          kickoff: response.kickoff,
          deadline: response.deadline,
          status: response.running ? 'running' : 'stopped',
        });

        return response;
      } catch (error) {
        console.error('Failed to start timer:', error);
        setError('startTimer', 'Failed to start timer');
        throw error;
      } finally {
        setLoading((prev) => ({ ...prev, timers: false }));
      }
    },
    [clearError, setError]
  );

  const pauseTimer = useCallback(
    async (timerId: number, currentTime?: number) => {
      setLoading((prev) => ({ ...prev, timers: true }));
      clearError('pauseTimer');

      try {
        const response = await api.pauseTimer(timerId, currentTime);

        // Update timerset
        if (timerset?.timerId === timerId) {
          setTimerset({
            ...timerset,
            isRunning: false,
            currentTime: response.currentTime || timerset.currentTime || 0,
            status: 'paused',
          });
        }

        return response;
      } catch (error) {
        console.error('Failed to pause timer:', error);
        setError('pauseTimer', 'Failed to pause timer');
        throw error;
      } finally {
        setLoading((prev) => ({ ...prev, timers: false }));
      }
    },
    [clearError, setError, timerset]
  );

  const resetTimer = useCallback(
    async (timerId: number) => {
      setLoading((prev) => ({ ...prev, timers: true }));
      clearError('resetTimer');

      try {
        const response = await api.resetTimer(timerId);

        // Update timerset
        if (timerset?.timerId === timerId) {
          setTimerset({
            ...timerset,
            isRunning: false,
            currentTime: response.currentTime || 0,
            kickoff: response.kickoff,
            deadline: response.deadline,
            status: 'stopped',
          });
        }

        return response;
      } catch (error) {
        console.error('Failed to reset timer:', error);
        setError('resetTimer', 'Failed to reset timer');
        throw error;
      } finally {
        setLoading((prev) => ({ ...prev, timers: false }));
      }
    },
    [clearError, setError]
  );

  const adjustTimer = useCallback(
    async (timerId: number, seconds: number) => {
      setLoading((prev) => ({ ...prev, timers: true }));
      clearError('adjustTimer');

      try {
        const response = await api.adjustTimer(timerId, seconds);

        // Update timerset if this is the active timer
        if (timerset?.timerId === timerId) {
          setTimerset({
            ...timerset,
            currentTime: response.currentTime || timerset.currentTime || 0,
            kickoff: response.kickoff,
            deadline: response.deadline,
          });
        }

        return response;
      } catch (error) {
        console.error('Failed to adjust timer:', error);
        setError('adjustTimer', 'Failed to adjust timer');
        throw error;
      } finally {
        setLoading((prev) => ({ ...prev, timers: false }));
      }
    },
    [clearError, setError]
  );

  // Note: Timer event handling moved to useTimerSync hook for better real-time updates
  // These handlers are kept for backward compatibility but useTimerSync is the primary source

  const handleTimerStopped = useCallback((data: any) => {
    console.log('🛑 Received timer-stopped event:', data);
    setTimerset((prevTimerset) => {
      if (prevTimerset?.timerId === data.timerId) {
        console.log('🛑 Clearing timerset for stopped timer:', data.timerId);
        return null; // Clear the active timer
      }
      return prevTimerset;
    });
  }, []);

  const handleTimerReset = useCallback((data: any) => {
    // Simplified - just reload room data
    console.log('Timer reset:', data);
  }, []);

  const handleTimerUpdated = useCallback((data: any) => {
    // Simplified - just reload room data
    console.log('Timer updated:', data);
  }, []);

  const handleActiveTimerUpdated = useCallback(
    (data: any) => {
      if (currentRoom && data.roomId === currentRoom.id) {
        setCurrentRoom((prev) =>
          prev
            ? {
                ...prev,
                activeTimerId: data.activeTimerId,
              }
            : null
        );
      }
    },
    [currentRoom]
  );

  const handleConnectionStatus = useCallback((data: any) => {
    setIsConnected(data.status === 'connected');
  }, []);

  // Setup websocket listeners (minimal - timer events handled by useTimerSync)
  useEffect(() => {
    // Connection events
    socketClient.on('connection-status', handleConnectionStatus);

    // Only keep non-timer events to avoid conflicts with useTimerSync
    socketClient.on('timer-stopped', handleTimerStopped);
    socketClient.on('timer-reset', handleTimerReset);
    socketClient.on('timer-updated', handleTimerUpdated);

    // Room events
    socketClient.on('active-timer-updated', handleActiveTimerUpdated);

    // Cleanup
    return () => {
      socketClient.off('connection-status', handleConnectionStatus);
      socketClient.off('timer-stopped', handleTimerStopped);
      socketClient.off('timer-reset', handleTimerReset);
      socketClient.off('timer-updated', handleTimerUpdated);
      socketClient.off('active-timer-updated', handleActiveTimerUpdated);
    };
  }, [
    handleConnectionStatus,
    handleTimerStopped,
    handleTimerReset,
    handleTimerUpdated,
    handleActiveTimerUpdated,
  ]);

  // Join room when current room changes
  useEffect(() => {
    if (currentRoom) {
      // Join using room-{roomId} format to match backend emissions
      const roomChannel = `room-${currentRoom.id}`;
      console.log('🏠 [useAppState] Joining room channel:', roomChannel, 'for room:', currentRoom.name);
      socketClient.joinRoom(roomChannel);

      return () => {
        console.log('🏠 [useAppState] Leaving room channel:', roomChannel);
        socketClient.leaveRoom(roomChannel);
      };
    }
  }, [currentRoom]);

  return {
    // State
    rooms,
    currentRoom,
    timerset,
    loading,
    errors,
    isConnected,

    // Room actions
    loadRooms,
    loadRoom,
    createRoom,
    updateRoom,
    deleteRoom,

    // Timer actions
    createTimer,
    updateTimer,
    deleteTimer,
    startTimer,
    pauseTimer,
    resetTimer,
    adjustTimer,

    // Utilities
    clearError,
    getTimerSession: (timerId: number) => {
      return timerset?.timerId === timerId ? timerset : null;
    },
    isTimerRunning: (timerId: number) =>
      timerset?.timerId === timerId && timerset?.isRunning || false,
  };
}
