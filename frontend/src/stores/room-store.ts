import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'failed';

export interface RoomState {
  // Current room
  currentRoomSlug: string | null;
  currentRoomName: string | null;

  // Room history for quick access
  recentRooms: Array<{
    slug: string;
    name: string;
    lastAccessed: number;
  }>;

  // Connection state
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  lastConnectionTime: number;

  // Device role
  deviceRole: 'controller' | 'display' | null;

  // Actions
  setCurrentRoom: (slug: string, name: string) => void;
  addRecentRoom: (slug: string, name: string) => void;
  removeRecentRoom: (slug: string) => void;
  clearRecentRooms: () => void;

  setConnectionStatus: (status: ConnectionStatus) => void;
  setDeviceRole: (role: 'controller' | 'display' | null) => void;

  // Utilities
  getRecentRooms: () => Array<{
    slug: string;
    name: string;
    lastAccessed: number;
  }>;
  leaveRoom: () => void;
}

export const useRoomStore = create<RoomState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentRoomSlug: null,
        currentRoomName: null,
        recentRooms: [],
        isConnected: false,
        connectionStatus: 'disconnected',
        lastConnectionTime: 0,
        deviceRole: null,

        // Room management
        setCurrentRoom: (slug, name) => {
          set({
            currentRoomSlug: slug,
            currentRoomName: name,
          });

          // Add to recent rooms
          get().addRecentRoom(slug, name);
        },

        addRecentRoom: (slug, name) =>
          set((state) => {
            const existing = state.recentRooms.find(
              (room) => room.slug === slug
            );
            const now = Date.now();

            if (existing) {
              // Update last accessed time
              return {
                recentRooms: state.recentRooms
                  .map((room) =>
                    room.slug === slug
                      ? { ...room, name, lastAccessed: now }
                      : room
                  )
                  .sort((a, b) => b.lastAccessed - a.lastAccessed),
              };
            } else {
              // Add new room and keep only last 10
              const newRecentRooms = [
                { slug, name, lastAccessed: now },
                ...state.recentRooms,
              ].slice(0, 10);

              return { recentRooms: newRecentRooms };
            }
          }),

        removeRecentRoom: (slug) =>
          set((state) => ({
            recentRooms: state.recentRooms.filter((room) => room.slug !== slug),
          })),

        clearRecentRooms: () => set({ recentRooms: [] }),

        // Connection management
        setConnectionStatus: (status) =>
          set({
            connectionStatus: status,
            isConnected: status === 'connected',
            lastConnectionTime:
              status === 'connected' ? Date.now() : get().lastConnectionTime,
          }),

        setDeviceRole: (role) => set({ deviceRole: role }),

        // Utilities
        getRecentRooms: () => {
          const state = get();
          return state.recentRooms.sort(
            (a, b) => b.lastAccessed - a.lastAccessed
          );
        },

        leaveRoom: () =>
          set({
            currentRoomSlug: null,
            currentRoomName: null,
            connectionStatus: 'disconnected',
            isConnected: false,
            deviceRole: null,
          }),
      }),
      {
        name: 'room-store',
        // Only persist room history and current room, not connection state
        partialize: (state) => ({
          currentRoomSlug: state.currentRoomSlug,
          currentRoomName: state.currentRoomName,
          recentRooms: state.recentRooms,
          deviceRole: state.deviceRole,
        }),
      }
    ),
    {
      name: 'room-store',
    }
  )
);
