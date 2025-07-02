import { useState, useCallback } from 'react';

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
}

// Simple hook to replace Zustand store
export function useUIStore() {
  const [state, setState] = useState<UIState>({
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
  });

  // Panel actions
  const setLeftPanelOpen = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, leftPanelOpen: open }));
  }, []);

  const setRightPanelOpen = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, rightPanelOpen: open }));
  }, []);

  const setSettingsPanelOpen = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, settingsPanelOpen: open }));
  }, []);

  // Modal actions
  const setTimerModalOpen = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, timerModalOpen: open }));
  }, []);

  const setMessageModalOpen = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, messageModalOpen: open }));
  }, []);

  const setRoomModalOpen = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, roomModalOpen: open }));
  }, []);

  // Display mode actions
  const setFullscreenMode = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, fullscreenMode: enabled }));
  }, []);

  const setBlackoutMode = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, blackoutMode: enabled }));
  }, []);

  const setFlashMode = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, flashMode: enabled }));
  }, []);

  // Selection actions
  const setActiveTimerId = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, activeTimerId: id }));
  }, []);

  const setSelectedRoomSlug = useCallback((slug: string | null) => {
    setState(prev => ({ ...prev, selectedRoomSlug: slug }));
  }, []);

  // Loading actions
  const setLoading = useCallback((loading: boolean, message = '') => {
    setState(prev => ({ ...prev, isLoading: loading, loadingMessage: message }));
  }, []);

  // Utility actions
  const closeAllModals = useCallback(() => {
    setState(prev => ({
      ...prev,
      timerModalOpen: false,
      messageModalOpen: false,
      roomModalOpen: false,
      settingsPanelOpen: false,
    }));
  }, []);

  const toggleLeftPanel = useCallback(() => {
    setState(prev => ({ ...prev, leftPanelOpen: !prev.leftPanelOpen }));
  }, []);

  const toggleRightPanel = useCallback(() => {
    setState(prev => ({ ...prev, rightPanelOpen: !prev.rightPanelOpen }));
  }, []);

  return {
    ...state,
    setLeftPanelOpen,
    setRightPanelOpen,
    setSettingsPanelOpen,
    setTimerModalOpen,
    setMessageModalOpen,
    setRoomModalOpen,
    setFullscreenMode,
    setBlackoutMode,
    setFlashMode,
    setActiveTimerId,
    setSelectedRoomSlug,
    setLoading,
    closeAllModals,
    toggleLeftPanel,
    toggleRightPanel,
  };
}
