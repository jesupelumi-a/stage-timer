import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStageTimer } from '../hooks/use-stage-timer';
import { useUIStore } from '../stores/ui-store';
import { TimerList } from '../components/timer-list';
import { TimerPreview } from '../components/timer-preview';
import { MessagePanel } from '../components/message-panel';
import { RoomSettings } from '../components/room-settings';
import { cn } from '../lib/utils';

export function ControllerRoute() {
  const { roomSlug } = useParams<{ roomSlug: string }>();
  const navigate = useNavigate();
  
  const {
    leftPanelOpen,
    rightPanelOpen,
    activeTimerId,
    toggleLeftPanel,
    toggleRightPanel,
  } = useUIStore();
  
  const {
    room,
    timers,
    isLoading,
    connectionStatus,
    isConnected,
  } = useStageTimer({ 
    roomSlug: roomSlug || '', 
    isController: true 
  });
  
  // Redirect if no room slug
  useEffect(() => {
    if (!roomSlug) {
      navigate('/');
    }
  }, [roomSlug, navigate]);
  
  // Get active timer
  const activeTimer = timers?.find(timer => 
    timer.id.toString() === activeTimerId
  );
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
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
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
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
  
  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col">
      {/* Header */}
      <header className="bg-black border-b border-neutral-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Panel Toggles */}
            <button
              onClick={toggleLeftPanel}
              className={cn(
                'p-2 rounded-lg transition-colors',
                leftPanelOpen 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              )}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Room Info */}
            <div>
              <h1 className="text-xl font-bold text-white">{room.name}</h1>
              <p className="text-sm text-neutral-400">Controller Mode</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-2 h-2 rounded-full',
                isConnected ? 'bg-green-500' : 'bg-red-500'
              )} />
              <span className="text-sm text-neutral-400 capitalize">
                {connectionStatus}
              </span>
            </div>
            
            {/* Display Link */}
            <a
              href={`/display/${roomSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
            >
              Open Display
            </a>
            
            {/* Right Panel Toggle */}
            <button
              onClick={toggleRightPanel}
              className={cn(
                'p-2 rounded-lg transition-colors',
                rightPanelOpen 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              )}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Timer List */}
        <div className={cn(
          'transition-all duration-300 border-r border-neutral-800 bg-neutral-800/50',
          leftPanelOpen ? 'w-80' : 'w-0'
        )}>
          {leftPanelOpen && (
            <div className="h-full overflow-y-auto p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Timers</h2>
              <TimerList
                roomSlug={roomSlug!}
                isController={true}
                showPreviews={false}
              />
            </div>
          )}
        </div>
        
        {/* Center Panel - Main Preview */}
        <div className="flex-1 flex flex-col">
          {/* Timer Preview */}
          <div className="flex-1 flex items-center justify-center p-8 bg-black">
            {activeTimer ? (
              <div className="w-full max-w-4xl">
                <TimerPreview
                  timer={activeTimer}
                  isActive={true}
                  showControls={true}
                  className="w-full"
                />
              </div>
            ) : (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-4">
                  No Timer Selected
                </h2>
                <p className="text-neutral-400 mb-6">
                  {timers && timers.length > 0 
                    ? 'Select a timer from the left panel to preview it here.'
                    : 'Create your first timer to get started.'
                  }
                </p>
                
                {(!timers || timers.length === 0) && (
                  <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                    Create Timer
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Bottom Controls */}
          <div className="border-t border-neutral-800 bg-neutral-800/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-neutral-400">
                  {timers?.length || 0} timer{timers?.length !== 1 ? 's' : ''}
                </span>
                {activeTimer && (
                  <span className="text-sm text-neutral-400">
                    Active: {activeTimer.name}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded text-sm">
                  Blackout
                </button>
                <button className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded text-sm">
                  Flash
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Panel - Messages & Settings */}
        <div className={cn(
          'transition-all duration-300 border-l border-neutral-800 bg-neutral-800/50',
          rightPanelOpen ? 'w-80' : 'w-0'
        )}>
          {rightPanelOpen && (
            <div className="h-full overflow-y-auto p-6 space-y-6">
              {/* Messages */}
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">Messages</h2>
                <MessagePanel
                  roomId={room.id}
                  timerId={activeTimer?.id}
                  isController={true}
                />
              </div>
              
              {/* Room Settings */}
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">Room Settings</h2>
                <RoomSettings
                  onRoomSelect={(slug) => navigate(`/control/${slug}`)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
