import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoomSettings } from '../components/room-settings';
import { useOverallHealth } from '../hooks/use-health';
import { cn } from '../lib/utils';

export function RoomSelectionRoute() {
  const [deviceRole, setDeviceRole] = useState<'controller' | 'display'>('controller');
  const navigate = useNavigate();
  const { isHealthy, status } = useOverallHealth();
  
  const handleRoomSelect = (roomSlug: string) => {
    if (deviceRole === 'controller') {
      navigate(`/control/${roomSlug}`);
    } else {
      navigate(`/display/${roomSlug}`);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-black">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-black/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white">StageTimer</h1>
              <div className="flex items-center gap-2">
                <div 
                  className={cn(
                    'w-2 h-2 rounded-full',
                    isHealthy ? 'bg-green-500' : 'bg-red-500'
                  )}
                />
                <span className="text-xs text-neutral-400 capitalize">
                  {status}
                </span>
              </div>
            </div>
            
            {/* Device Role Selector */}
            <div className="flex items-center gap-2 bg-neutral-800 rounded-lg p-1">
              <button
                onClick={() => setDeviceRole('controller')}
                className={cn(
                  'px-3 py-1 rounded text-sm transition-colors',
                  deviceRole === 'controller'
                    ? 'bg-blue-600 text-white'
                    : 'text-neutral-400 hover:text-white'
                )}
              >
                Controller
              </button>
              <button
                onClick={() => setDeviceRole('display')}
                className={cn(
                  'px-3 py-1 rounded text-sm transition-colors',
                  deviceRole === 'display'
                    ? 'bg-blue-600 text-white'
                    : 'text-neutral-400 hover:text-white'
                )}
              >
                Display
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Welcome Section */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Welcome to StageTimer
              </h2>
              <p className="text-neutral-300 text-lg leading-relaxed">
                A professional stage timer application with real-time multi-device sync. 
                Perfect for churches, events, and presentations.
              </p>
            </div>
            
            {/* Device Role Info */}
            <div className="p-6 bg-neutral-800/50 rounded-lg border border-neutral-700">
              <h3 className="text-lg font-semibold text-white mb-3">
                {deviceRole === 'controller' ? '🎮 Controller Mode' : '📺 Display Mode'}
              </h3>
              <p className="text-neutral-300 mb-4">
                {deviceRole === 'controller' 
                  ? 'Manage timers, messages, and room settings. Use this on your laptop or control device.'
                  : 'Full-screen timer display for TV, projector, or secondary monitor. Shows active timers and messages.'
                }
              </p>
              
              <div className="space-y-2 text-sm text-neutral-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Real-time synchronization</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>Room-based organization</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Multiple timer types</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <span>Message broadcasting</span>
                </div>
              </div>
            </div>
            
            {/* Quick Start */}
            <div className="p-6 bg-blue-900/20 rounded-lg border border-blue-500/30">
              <h3 className="text-lg font-semibold text-white mb-3">🚀 Quick Start</h3>
              <ol className="space-y-2 text-sm text-neutral-300">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>Select or create a room</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>Choose your device role (Controller or Display)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>Start managing your timers and messages</span>
                </li>
              </ol>
            </div>
          </div>
          
          {/* Room Settings */}
          <div>
            <RoomSettings onRoomSelect={handleRoomSelect} />
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-neutral-800 bg-black/50 backdrop-blur-sm mt-16">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-sm text-neutral-400">
            <p>&copy; 2024 StageTimer. Built with React, Node.js, and PostgreSQL.</p>
            <div className="flex items-center gap-4">
              <span>v2.0.0</span>
              <span>•</span>
              <span>Real-time sync enabled</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
