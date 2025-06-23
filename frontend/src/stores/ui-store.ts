import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface UIState {
  // Panel visibility
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  settingsPanelOpen: boolean;

  // Modal states
  timerModalOpen: boolean;
  messageModalOpen: boolean;
  roomModalOpen: boolean;

  // Display modes
  fullscreenMode: boolean;
  blackoutMode: boolean;
  flashMode: boolean;

  // Current selections
  activeTimerId: string | null;
  selectedRoomSlug: string | null;

  // Loading states
  isLoading: boolean;
  loadingMessage: string;

  // Actions
  setLeftPanelOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  setSettingsPanelOpen: (open: boolean) => void;

  setTimerModalOpen: (open: boolean) => void;
  setMessageModalOpen: (open: boolean) => void;
  setRoomModalOpen: (open: boolean) => void;

  setFullscreenMode: (enabled: boolean) => void;
  setBlackoutMode: (enabled: boolean) => void;
  setFlashMode: (enabled: boolean) => void;

  setActiveTimerId: (id: string | null) => void;
  setSelectedRoomSlug: (slug: string | null) => void;

  setLoading: (loading: boolean, message?: string) => void;

  // Utility actions
  closeAllModals: () => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      // Initial state
      leftPanelOpen: true,
      rightPanelOpen: false,
      settingsPanelOpen: false,

      timerModalOpen: false,
      messageModalOpen: false,
      roomModalOpen: false,

      fullscreenMode: false,
      blackoutMode: false,
      flashMode: false,

      activeTimerId: null,
      selectedRoomSlug: null,

      isLoading: false,
      loadingMessage: '',

      // Panel actions
      setLeftPanelOpen: (open) => set({ leftPanelOpen: open }),
      setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
      setSettingsPanelOpen: (open) => set({ settingsPanelOpen: open }),

      // Modal actions
      setTimerModalOpen: (open) => set({ timerModalOpen: open }),
      setMessageModalOpen: (open) => set({ messageModalOpen: open }),
      setRoomModalOpen: (open) => set({ roomModalOpen: open }),

      // Display mode actions
      setFullscreenMode: (enabled) => set({ fullscreenMode: enabled }),
      setBlackoutMode: (enabled) => set({ blackoutMode: enabled }),
      setFlashMode: (enabled) => set({ flashMode: enabled }),

      // Selection actions
      setActiveTimerId: (id) => set({ activeTimerId: id }),
      setSelectedRoomSlug: (slug) => set({ selectedRoomSlug: slug }),

      // Loading actions
      setLoading: (loading, message = '') =>
        set({ isLoading: loading, loadingMessage: message }),

      // Utility actions
      closeAllModals: () =>
        set({
          timerModalOpen: false,
          messageModalOpen: false,
          roomModalOpen: false,
          settingsPanelOpen: false,
        }),

      toggleLeftPanel: () =>
        set((state) => ({
          leftPanelOpen: !state.leftPanelOpen,
        })),

      toggleRightPanel: () =>
        set((state) => ({
          rightPanelOpen: !state.rightPanelOpen,
        })),
    }),
    {
      name: 'ui-store',
    }
  )
);
