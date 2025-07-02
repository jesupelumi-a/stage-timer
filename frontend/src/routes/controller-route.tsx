import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@heroui/react';
import { useAppState } from '../hooks/use-app-state';
import { socketClient } from '../lib/socket-client';
import { useGlobalTimerState } from '../hooks/use-global-timer-state';
import {
  StageTimerLayout,
  TimerPreview,
  PreviewControls,
  MessagePanel,
  RoomSettings,
} from '../components';
import type { Timer } from '@stage-timer/db';
import { TimerList } from '@/components/timer-list';
import { getNextTimerStartTime, parse12HourTime } from '../lib/utils';

export function ControllerRoute() {
  const { roomSlug } = useParams<{ roomSlug: string }>();
  const navigate = useNavigate();

  // Get global timer state for accurate current time and optimistic updates
  const {
    getRealTimeCurrentTime,
    optimisticReset,
    manualPause,
    initializeFromSession,
  } = useGlobalTimerState();

  // Use simplified app state
  const {
    currentRoom,
    timerset,
    loading,
    isConnected,
    loadRoom,
    createTimer,
    updateTimer,
    deleteTimer,
    startTimer,
    pauseTimer,
    resetTimer,
    adjustTimer,
    updateRoom,
    getTimerSession,
    isTimerRunning,
  } = useAppState();

  // Local state
  const [activeTimerId, setActiveTimerId] = useState<number | null>(null);
  const [updatingTimerId, setUpdatingTimerId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [operationLoadingStates, setOperationLoadingStates] = useState<
    Record<number, boolean>
  >({});

  // Redirect if no room slug
  useEffect(() => {
    if (!roomSlug) {
      navigate('/');
    }
  }, [roomSlug, navigate]);

  // Load room data when component mounts
  useEffect(() => {
    if (roomSlug) {
      loadRoom(roomSlug);
    }
  }, [roomSlug, loadRoom]);

  // Set active timer from room data
  useEffect(() => {
    if (currentRoom?.activeTimerId && !activeTimerId) {
      setActiveTimerId(currentRoom.activeTimerId);
    }
  }, [currentRoom?.activeTimerId, activeTimerId]);

  // Initialize global timer state when room data loads
  useEffect(() => {
    if (timerset) {
      console.log('🔄 [ControllerRoute] Initializing global timer state with session data:', timerset);
      initializeFromSession(timerset);
    }
  }, [timerset, initializeFromSession]);

  // Listen for timer events to update active timer
  useEffect(() => {
    const handleTimerStarted = (data: any) => {
      setActiveTimerId(data.timerId);
    };

    const handleTimerStopped = (data: any) => {
      if (activeTimerId === data.timerId) {
        setActiveTimerId(null);
      }
    };

    const handleTimerReset = (data: any) => {
      if (activeTimerId === data.timerId) {
        setActiveTimerId(null);
      }
    };

    // Use imported socketClient

    socketClient.on('timer-started', handleTimerStarted);
    socketClient.on('timer-stopped', handleTimerStopped);
    socketClient.on('timer-reset', handleTimerReset);

    return () => {
      socketClient.off('timer-started', handleTimerStarted);
      socketClient.off('timer-stopped', handleTimerStopped);
      socketClient.off('timer-reset', handleTimerReset);
    };
  }, [activeTimerId]);

  // Timer action handlers
  const handleCreateTimer = async () => {
    if (!currentRoom || !roomSlug) return;
    setIsCreating(true);

    // Calculate start time using helper
    const timersForStartTime = (currentRoom.timers || []).map((t) => ({
      startTime: t.startTime ?? undefined,
      durationMs: t.durationMs,
    }));
    const nextStartTimeRaw = getNextTimerStartTime(timersForStartTime);
    const nextStartTime =
      typeof nextStartTimeRaw === 'string'
        ? new Date(nextStartTimeRaw)
        : nextStartTimeRaw;

    try {
      await createTimer({
        roomSlug,
        name: `Timer ${(currentRoom.timers?.length || 0) + 1}`,
        roomId: currentRoom.id,
        durationMs: 600000, // 10 minutes default
        index: (currentRoom.timers?.length || 0) + 1,
        appearance: 'COUNTDOWN',
        type: 'DURATION',
        trigger: 'MANUAL',
        startTime: nextStartTime.toISOString() as any,
      });
    } catch (error) {
      console.error('Failed to create timer:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectTimer = async (timerId: number) => {
    const previousActiveTimerId = activeTimerId;

    // If selecting the same timer that's already active, do nothing
    if (previousActiveTimerId === timerId) {
      return;
    }

    // Set loading state for the timer being selected
    setUpdatingTimerId(timerId);

    try {
      // Start the selected timer - backend will handle everything else
      // await startTimer(timerId);

      // Update local state immediately
      setActiveTimerId(timerId);
    } catch (error) {
      console.error('Failed to select timer:', error);
    } finally {
      // Clear loading state
      setUpdatingTimerId(null);
    }
  };

  const handleStartTimer = async (timerId: number) => {
    const timer = currentRoom?.timers?.find((t) => t.id === timerId);
    if (!timer || !currentRoom) return;

    // Set loading state for this timer
    setOperationLoadingStates((prev) => ({ ...prev, [timerId]: true }));

    try {
      // Wait for backend confirmation for start/resume to ensure multi-controller sync
      await startTimer(timerId);

      // Update local state - the backend should have stopped other timers
      setActiveTimerId(timerId);
    } catch (error) {
      console.error('Failed to start timer:', error);
    } finally {
      // Clear loading state
      setOperationLoadingStates((prev) => ({ ...prev, [timerId]: false }));
    }
  };

  const handlePauseTimer = async (timerId: number) => {
    const timer = currentRoom?.timers?.find((t) => t.id === timerId);
    if (!timer || !currentRoom) return;

    // Set loading state for this timer
    setOperationLoadingStates((prev) => ({ ...prev, [timerId]: true }));

    try {
      // Get the exact current time from frontend to avoid timing discrepancies
      const frontendCurrentTime = getRealTimeCurrentTime(timer);

      // Update local state immediately (sender doesn't wait for broadcast)
      console.log('🔄 [Local] Pausing timer immediately:', timerId, 'at currentTime:', frontendCurrentTime);
      manualPause(timerId, frontendCurrentTime);

      // Frontend-broadcast: Pause immediately on ALL controllers in the room
      socketClient.broadcastFrontendEvent('frontend-timer-pause', {
        roomId: timer.roomId,
        timerId: timerId,
        currentTime: frontendCurrentTime,
        timestamp: Date.now(),
      });

      // Then sync with backend (for persistence)
      await pauseTimer(timerId, frontendCurrentTime);
    } catch (error) {
      console.error('Failed to pause timer:', error);
      // TODO: Revert optimistic update on error
    } finally {
      // Clear loading state
      setOperationLoadingStates((prev) => ({ ...prev, [timerId]: false }));
    }
  };

  const handleResetTimer = async (timerId: number) => {
    const timer = currentRoom?.timers?.find((t) => t.id === timerId);
    if (!timer || !currentRoom) return;

    // Set loading state for this timer
    setOperationLoadingStates((prev) => ({ ...prev, [timerId]: true }));

    try {
      // Reset using backend-first approach
      await resetTimer(timerId);

      // Update local state - the backend should have stopped other timers
      handleSelectTimer(timerId);
    } catch (error) {
      console.error('Failed to reset timer:', error);
      // TODO: Revert optimistic update on error
    } finally {
      // Clear loading state
      setOperationLoadingStates((prev) => ({ ...prev, [timerId]: false }));
    }
  };

  const handleAdjustTime = async (timerId: number, seconds: number) => {
    const timer = currentRoom?.timers?.find((t) => t.id === timerId);
    if (!timer || !currentRoom) return;

    // Adjust using backend-first approach
    await adjustTimer(timerId, seconds);
  };

  const handleUpdateTimer = async (
    timerId: number,
    updates: Partial<Timer>
  ) => {
    const timer = currentRoom?.timers?.find((t) => t.id === timerId);
    if (!timer) return;

    // Check if any values actually changed to avoid unnecessary backend calls
    const hasChanges = Object.entries(updates).some(([key, value]) => {
      return timer[key as keyof Timer] !== value;
    });
    if (!hasChanges) {
      console.log('No changes detected, skipping update');
      return;
    }
    setUpdatingTimerId(timerId);
    try {
      await updateTimer(timer.id, updates);
    } catch (error) {
      console.error('Failed to update timer:', error);
    } finally {
      setUpdatingTimerId(null);
    }
  };

  const handleDeleteTimer = async (timerId: number) => {
    const timer = currentRoom?.timers?.find((t) => t.id === timerId);
    if (!timer) return;

    setUpdatingTimerId(timerId);
    try {
      // If this timer is the active timer, clear the activeTimerId first
      if (activeTimerId === timerId && currentRoom) {
        await updateRoom(currentRoom.slug, { activeTimerId: null });
        setActiveTimerId(null);
      }

      // Now delete the timer
      await deleteTimer(timer.id);
    } catch (error) {
      console.error('Failed to delete timer:', error);
    } finally {
      setUpdatingTimerId(null);
    }
  };

  // Get active timer
  const activeTimer = currentRoom?.timers?.find(
    (timer) => timer.id === activeTimerId
  );

  // Get active timer session
  const activeTimerSession = activeTimerId
    ? getTimerSession(activeTimerId)
    : null;

  // Loading state
  if (loading.room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-white"></div>
          <p className="text-lg text-white">Loading room...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!currentRoom) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-900">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-400">
            Room Not Found
          </h1>
          <p className="mb-6 text-neutral-400">
            The room "{roomSlug}" could not be found.
          </p>
          <button
            onClick={() => navigate('/')}
            className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            Back to Room Selection
          </button>
        </div>
      </div>
    );
  }

  // Handle navigation actions
  const handleSwitchToDisplay = () => {
    window.open(`/display/${roomSlug}`, '_blank');
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <StageTimerLayout
      onSwitchToDisplay={handleSwitchToDisplay}
      onToggleFullscreen={handleToggleFullscreen}
      leftPanel={
        <div className="flex h-full flex-col">
          {/* Timer Preview Container */}
          <div className="st-container mb-4 flex-none">
            <div
              className="st-container-inner rounded-md border border-neutral-700 bg-neutral-800"
              style={{
                backgroundColor: 'rgb(28, 25, 24)',
              }}
            >
              <div className="relative flex aspect-video flex-col">
                {/* Timer Preview Content */}
                <div className="flex flex-1 items-center justify-center">
                  {activeTimer ? (
                    <TimerPreview
                      timer={activeTimer}
                      timerName={activeTimer.name}
                      isActive={true}
                      displayMode="preview"
                      className="h-full w-full"
                      serverTimerState={
                        activeTimerSession
                          ? {
                              currentTime: activeTimerSession.currentTime,
                              isRunning: activeTimerSession.isRunning,
                              kickoff: activeTimerSession.kickoff || null,
                              deadline: activeTimerSession.deadline || null,
                              lastStop: null, // Not used in our simplified state
                              elapsedTime: 0, // Will be calculated dynamically
                            }
                          : undefined
                      }
                    />
                  ) : (
                    <div className="text-center">
                      <div className="text-base font-bold tracking-wide text-neutral-400">
                        No Timer Selected
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Preview Controls */}
          <PreviewControls
            timers={currentRoom?.timers || []}
            activeTimerId={activeTimerId?.toString() || null}
            onSelectTimer={(id) => handleSelectTimer(parseInt(id))}
            onStartTimer={(id) => handleStartTimer(parseInt(id))}
            onPauseTimer={(id) => handlePauseTimer(parseInt(id))}
            onAdjustTime={(id, seconds) =>
              handleAdjustTime(parseInt(id), seconds)
            }
            isTimerRunning={(id) => isTimerRunning(parseInt(id))}
            isTimerPaused={() => false} // Simplified - not tracking pause state separately
            isStartingTimer={loading.timers}
            isPausingTimer={loading.timers}
            isAdjustingTimer={loading.timers}
            isTimerOperationLoading={loading.timers}
          />

          {/* Clock and Status */}
          <div className="mt-6 flex-none space-y-3">
            <div className="rounded-lg bg-neutral-800 p-3">
              <div className="flex w-full items-baseline rounded px-3 py-2 transition-colors hover:bg-neutral-700">
                <span className="text-sm font-medium text-neutral-300">
                  Connected Devices
                </span>
                <span className="ml-auto text-xs text-neutral-500">
                  {isConnected ? '1/1' : '0/1'}
                </span>
              </div>
            </div>
          </div>
        </div>
      }
      rightPanel={
        <div className="controller-messages flex-auto lg:h-full">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-white">Messages</h2>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="bordered"
                className="border-neutral-600 bg-neutral-800 text-white hover:border-neutral-400"
              >
                Focus
              </Button>
              <Button
                size="sm"
                variant="bordered"
                className="border-neutral-600 bg-neutral-800 text-white hover:border-neutral-400"
              >
                Flash
              </Button>
            </div>
          </div>

          {/* Message Panel */}
          <MessagePanel
            roomId={currentRoom.id}
            timerId={activeTimer?.id}
            isController={true}
          />

          {/* Room Settings */}
          <div className="mt-6">
            <h3 className="text-md mb-4 font-medium text-white">
              Room Settings
            </h3>
            <RoomSettings
              onRoomSelect={(slug) => navigate(`/control/${slug}`)}
            />
          </div>
        </div>
      }
    >
      <TimerList
        timers={currentRoom.timers}
        activeTimerId={activeTimerId?.toString() || null}
        isTimerRunning={(id) => isTimerRunning(parseInt(id))}
        isTimerLoading={(id) =>
          operationLoadingStates[parseInt(id)] ||
          updatingTimerId === parseInt(id)
        }
        getTimerCurrentTime={(id) => getTimerSession(parseInt(id))?.currentTime}
        getTimerSession={(id) => getTimerSession(parseInt(id))}
        onStart={(id) => handleStartTimer(parseInt(id))}
        onPause={(id) => handlePauseTimer(parseInt(id))}
        onReset={(id) => handleResetTimer(parseInt(id))}
        onSelect={(id) => handleSelectTimer(parseInt(id))}
        onSettings={() => {}}
        onDelete={(id) => handleDeleteTimer(parseInt(id))}
        onDurationChange={(timerId, newDuration) =>
          handleUpdateTimer(parseInt(timerId), { durationMs: newDuration })
        }
        onTypeChange={(timerId, newType) =>
          handleUpdateTimer(parseInt(timerId), { appearance: newType as any })
        }
        onNameChange={(timerId, newName) =>
          handleUpdateTimer(parseInt(timerId), { name: newName })
        }
        onStartTimeChange={(timerId, startTime) => {
          // Convert 12-hour time string to ISO format and update the timer
          try {
            const parsedDate = parse12HourTime(startTime);
            handleUpdateTimer(parseInt(timerId), { startTime: parsedDate });
          } catch (error) {
            console.error('Failed to parse start time:', error);
          }
        }}
        onReorder={() => {}} // Simplified - no reordering for now
        onCreate={handleCreateTimer}
        isCreating={isCreating}
      />
    </StageTimerLayout>
  );
}
