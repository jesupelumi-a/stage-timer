import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppState } from '../hooks/use-app-state';
import { useUIStore } from '../stores/ui-store';
import { TimerPreview } from '../components/timer-preview';
import { MessagePanel } from '../components/message-panel';
import { cn } from '../lib/utils';

export function DisplayRoute() {
  const { roomSlug } = useParams<{ roomSlug: string }>();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { blackoutMode, flashMode } = useUIStore();
  const [activeTimerId, setActiveTimerId] = useState<number | null>(null);

  const {
    currentRoom,
    loading,
    isConnected,
    loadRoom,
    getTimerSession,
  } = useAppState();

  // Initialize active timer from room data
  useEffect(() => {
    if (currentRoom?.activeTimerId && !activeTimerId) {
      setActiveTimerId(currentRoom.activeTimerId);
    }
  }, [currentRoom?.activeTimerId, activeTimerId]);

  // Load room data when component mounts
  useEffect(() => {
    if (roomSlug) {
      loadRoom(roomSlug);
    }
  }, [roomSlug, loadRoom]);

  // Redirect if no room slug
  useEffect(() => {
    if (!roomSlug) {
      navigate('/');
    }
  }, [roomSlug, navigate]);

  // Handle fullscreen
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        exitFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Get active timer
  const activeTimer = currentRoom?.timers?.find(timer =>
    timer.id === activeTimerId
  ) || currentRoom?.timers?.[0];

  // Get active timer session
  const activeTimerSession = activeTimerId ? getTimerSession(activeTimerId) : null;

  // Loading state
  if (loading.room) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading room...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!currentRoom) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Room Not Found</h1>
          <p className="text-neutral-400 mb-6">
            The room "{roomSlug}" could not be found.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Back to Room Selection
          </button>
        </div>
      </div>
    );
  }
  
  // Blackout mode
  if (blackoutMode) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Blackout</h1>
          <p className="text-neutral-400">Press F to exit fullscreen</p>
        </div>
      </div>
    );
  }
  
  // Flash mode
  if (flashMode) {
    return (
      <div className="min-h-screen bg-white animate-pulse">
        {/* Flash effect */}
      </div>
    );
  }
  
  return (
    <div className={cn(
      'min-h-screen bg-black relative overflow-hidden',
      isFullscreen && 'cursor-none'
    )}>
      {/* Connection Status Indicator */}
      {!isConnected && (
        <div className="absolute top-4 right-4 z-50">
          <div className="flex items-center gap-2 px-3 py-2 bg-red-900/80 backdrop-blur-sm rounded-lg border border-red-500">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 text-sm">Disconnected</span>
          </div>
        </div>
      )}

      {/* Timer Session Sync Status (only when active timer and connected) */}
      {activeTimerId && isConnected && !isFullscreen && (
        <div className="absolute top-16 right-4 z-50">
          <div className={cn(
            'flex items-center gap-2 px-3 py-2 backdrop-blur-sm rounded-lg border',
            activeTimerSession
              ? 'bg-blue-900/80 border-blue-500'
              : 'bg-gray-900/80 border-gray-500'
          )}>
            <div className={cn(
              'w-2 h-2 rounded-full',
              activeTimerSession
                ? 'bg-blue-500'
                : 'bg-gray-500'
            )} />
            <span className={cn(
              'text-sm',
              activeTimerSession
                ? 'text-blue-400'
                : 'text-gray-400'
            )}>
              {activeTimerSession
                ? 'Timer Synced'
                : 'No Timer Data'
              }
            </span>
          </div>
        </div>
      )}

      {/* Room Info (only when not fullscreen) */}
      {!isFullscreen && (
        <div className="absolute top-4 left-4 z-40">
          <div className="flex items-center gap-2 px-3 py-2 bg-black/80 backdrop-blur-sm rounded-lg border border-neutral-700">
            <span className="text-neutral-400 text-sm">{currentRoom.name}</span>
            <div className={cn(
              'w-2 h-2 rounded-full',
              isConnected ? 'bg-green-500' : 'bg-red-500'
            )} />
          </div>
        </div>
      )}
      
      {/* Fullscreen Toggle (only when not fullscreen) */}
      {!isFullscreen && (
        <div className="absolute top-4 right-4 z-40">
          <button
            onClick={toggleFullscreen}
            className="px-3 py-2 bg-black/80 backdrop-blur-sm rounded-lg border border-neutral-700 text-neutral-400 hover:text-white text-sm"
          >
            Fullscreen (F)
          </button>
        </div>
      )}
      
      {/* Main Display Area */}
      <div className="min-h-screen flex items-center justify-center p-8">
        {activeTimer ? (
          <div className="w-full max-w-6xl">
            {/* Timer Display */}
            <div className="text-center mb-8">
              {/* Timer Name */}
              {activeTimer.showName && (
                <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
                  {activeTimer.name}
                </h1>
              )}
              
              {/* Main Timer */}
              <div className="mb-6">
                <TimerPreview
                  timer={activeTimer}
                  timerName={activeTimer.name}
                  isActive={true}
                  displayMode="display"
                  onToggleFullscreen={toggleFullscreen}
                  className="mx-auto max-w-4xl aspect-video"
                  serverTimerState={activeTimerSession ? {
                    currentTime: activeTimerSession.currentTime,
                    isRunning: activeTimerSession.isRunning,
                    kickoff: activeTimerSession.kickoff || null,
                    deadline: activeTimerSession.deadline || null,
                    lastStop: null, // Not used in simplified state
                    elapsedTime: 0, // Will be calculated dynamically
                  } : undefined}
                />
              </div>
              
              {/* Timer Notes */}
              {activeTimer.showNotes && activeTimer.notes && (
                <p className="text-xl lg:text-2xl text-neutral-300 mb-4">
                  {activeTimer.notes}
                </p>
              )}
              
              {/* Timer Extra */}
              {activeTimer.showExtra && activeTimer.extra && (
                <p className="text-lg text-neutral-400">
                  {activeTimer.extra}
                </p>
              )}
            </div>
          </div>
        ) : (
          /* No Active Timer */
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
              {currentRoom.name}
            </h1>
            <p className="text-xl text-neutral-400 mb-8">
              {currentRoom.timers && currentRoom.timers.length > 0
                ? 'No active timer selected'
                : 'No timers configured'
              }
            </p>

            {/* Show all timers if no active timer */}
            {currentRoom.timers && currentRoom.timers.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
                {currentRoom.timers.slice(0, 6).map((timer) => (
                  <TimerPreview
                    key={timer.id}
                    timer={timer}
                    timerName={timer.name}
                    isActive={false}
                    displayMode="display"
                    className="opacity-75 aspect-video"
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message Overlay */}
      <MessagePanel
        roomId={currentRoom.id}
        timerId={activeTimer?.id}
        isController={false}
        className="absolute inset-0 pointer-events-none"
      />
      
      {/* Help Text (only when not fullscreen) */}
      {!isFullscreen && (
        <div className="absolute bottom-4 left-4 z-40">
          <div className="px-3 py-2 bg-black/80 backdrop-blur-sm rounded-lg border border-neutral-700">
            <p className="text-neutral-400 text-xs">
              Press F for fullscreen • ESC to exit
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
