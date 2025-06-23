import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStageTimer } from '../hooks/use-stage-timer';
import { useUIStore } from '../stores/ui-store';
// import { useTimerStore } from '../stores/timer-store';
import { TimerPreview } from '../components/timer-preview';
import { MessagePanel } from '../components/message-panel';
// import { CountdownRenderer } from '../components/countdown-renderer';
import { cn } from '../lib/utils';

export function DisplayRoute() {
  const { roomSlug } = useParams<{ roomSlug: string }>();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const { blackoutMode, flashMode } = useUIStore();
  const { activeTimerId } = useUIStore();
  
  const {
    room,
    timers,
    isLoading,
    isConnected,
  } = useStageTimer({ 
    roomSlug: roomSlug || '', 
    isController: false 
  });
  
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
  const activeTimer = timers?.find(timer => 
    timer.id.toString() === activeTimerId
  ) || timers?.[0];
  
  // Loading state
  if (isLoading) {
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
  if (!room) {
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
      
      {/* Room Info (only when not fullscreen) */}
      {!isFullscreen && (
        <div className="absolute top-4 left-4 z-40">
          <div className="flex items-center gap-2 px-3 py-2 bg-black/80 backdrop-blur-sm rounded-lg border border-neutral-700">
            <span className="text-neutral-400 text-sm">{room.name}</span>
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
                  isActive={true}
                  className="mx-auto max-w-4xl"
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
              {room.name}
            </h1>
            <p className="text-xl text-neutral-400 mb-8">
              {timers && timers.length > 0 
                ? 'No active timer selected'
                : 'No timers configured'
              }
            </p>
            
            {/* Show all timers if no active timer */}
            {timers && timers.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
                {timers.slice(0, 6).map((timer) => (
                  <TimerPreview
                    key={timer.id}
                    timer={timer}
                    isActive={false}
                    className="opacity-75"
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Message Overlay */}
      <MessagePanel
        roomId={room.id}
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
