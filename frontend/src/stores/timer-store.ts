import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface LocalTimerState {
  id: string;
  isRunning: boolean;
  isPaused: boolean;
  currentTime: number; // milliseconds
  startTime: number | null; // timestamp
  pausedTime: number; // accumulated paused time
  lastTick: number; // last tick timestamp
}

export interface TimerState {
  // Local timer states for real-time countdown
  localTimers: Record<string, LocalTimerState>;
  
  // Current active timer for display
  activeTimerId: string | null;
  
  // Timer synchronization
  lastSyncTime: number;
  syncOffset: number; // server time offset
  
  // Actions
  initializeTimer: (id: string, initialTime: number) => void;
  startTimer: (id: string, serverStartTime?: number) => void;
  pauseTimer: (id: string) => void;
  stopTimer: (id: string) => void;
  resetTimer: (id: string, newTime: number) => void;
  updateTimerTime: (id: string, newTime: number) => void;
  
  // Sync actions
  syncTimer: (id: string, serverState: {
    isRunning: boolean;
    currentTime: number;
    startTime?: number;
  }) => void;
  setSyncOffset: (offset: number) => void;
  
  // Getters
  getTimerState: (id: string) => LocalTimerState | null;
  getCurrentTime: (id: string) => number;
  
  // Cleanup
  removeTimer: (id: string) => void;
  clearAllTimers: () => void;
}

const createInitialTimerState = (id: string, initialTime: number): LocalTimerState => ({
  id,
  isRunning: false,
  isPaused: false,
  currentTime: initialTime,
  startTime: null,
  pausedTime: 0,
  lastTick: Date.now(),
});

export const useTimerStore = create<TimerState>()(
  devtools(
    (set, get) => ({
      // Initial state
      localTimers: {},
      activeTimerId: null,
      lastSyncTime: 0,
      syncOffset: 0,
      
      // Timer management
      initializeTimer: (id, initialTime) => set((state) => ({
        localTimers: {
          ...state.localTimers,
          [id]: createInitialTimerState(id, initialTime),
        },
      })),
      
      startTimer: (id, serverStartTime) => set((state) => {
        const timer = state.localTimers[id];
        if (!timer) return state;
        
        const now = Date.now();
        const startTime = serverStartTime || now;
        
        return {
          localTimers: {
            ...state.localTimers,
            [id]: {
              ...timer,
              isRunning: true,
              isPaused: false,
              startTime,
              lastTick: now,
            },
          },
        };
      }),
      
      pauseTimer: (id) => set((state) => {
        const timer = state.localTimers[id];
        if (!timer || !timer.isRunning) return state;
        
        const now = Date.now();
        const elapsed = timer.startTime ? now - timer.startTime : 0;
        
        return {
          localTimers: {
            ...state.localTimers,
            [id]: {
              ...timer,
              isRunning: false,
              isPaused: true,
              pausedTime: timer.pausedTime + elapsed,
              lastTick: now,
            },
          },
        };
      }),
      
      stopTimer: (id) => set((state) => {
        const timer = state.localTimers[id];
        if (!timer) return state;
        
        return {
          localTimers: {
            ...state.localTimers,
            [id]: {
              ...timer,
              isRunning: false,
              isPaused: false,
              startTime: null,
              pausedTime: 0,
              lastTick: Date.now(),
            },
          },
        };
      }),
      
      resetTimer: (id, newTime) => set((state) => {
        const timer = state.localTimers[id];
        if (!timer) return state;
        
        return {
          localTimers: {
            ...state.localTimers,
            [id]: {
              ...timer,
              currentTime: newTime,
              isRunning: false,
              isPaused: false,
              startTime: null,
              pausedTime: 0,
              lastTick: Date.now(),
            },
          },
        };
      }),
      
      updateTimerTime: (id, newTime) => set((state) => {
        const timer = state.localTimers[id];
        if (!timer) return state;
        
        return {
          localTimers: {
            ...state.localTimers,
            [id]: {
              ...timer,
              currentTime: newTime,
              lastTick: Date.now(),
            },
          },
        };
      }),
      
      // Sync actions
      syncTimer: (id, serverState) => set((state) => {
        const timer = state.localTimers[id];
        if (!timer) return state;
        
        const now = Date.now();
        
        return {
          localTimers: {
            ...state.localTimers,
            [id]: {
              ...timer,
              isRunning: serverState.isRunning,
              currentTime: serverState.currentTime,
              startTime: serverState.startTime || null,
              lastTick: now,
            },
          },
          lastSyncTime: now,
        };
      }),
      
      setSyncOffset: (offset) => set({ syncOffset: offset }),
      
      // Getters
      getTimerState: (id) => {
        const state = get();
        return state.localTimers[id] || null;
      },
      
      getCurrentTime: (id) => {
        const state = get();
        const timer = state.localTimers[id];
        if (!timer) return 0;
        
        if (!timer.isRunning) {
          return timer.currentTime;
        }
        
        const now = Date.now();
        const elapsed = timer.startTime ? now - timer.startTime : 0;
        
        // For countdown timers, subtract elapsed time
        // For countup timers, add elapsed time
        // This logic should be determined by timer type from server data
        return Math.max(0, timer.currentTime - elapsed);
      },
      
      // Cleanup
      removeTimer: (id) => set((state) => {
        const { [id]: removed, ...rest } = state.localTimers;
        return { localTimers: rest };
      }),
      
      clearAllTimers: () => set({ localTimers: {} }),
    }),
    {
      name: 'timer-store',
    }
  )
);
