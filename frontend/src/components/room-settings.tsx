import { useState, useEffect } from 'react';
import { useRooms, useCreateRoom, useUpdateRoom } from '../hooks/use-rooms';
import { useRoomStore } from '../stores/room-store';
import { useUIStore } from '../stores/ui-store';
import { cn } from '../lib/utils';
import type { NewRoom } from '@stage-timer/db';

interface RoomSettingsProps {
  className?: string;
  onRoomSelect?: (roomSlug: string) => void;
}

export function RoomSettings({ className = '', onRoomSelect }: RoomSettingsProps) {
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomSlug, setNewRoomSlug] = useState('');
  
  const { 
    currentRoomSlug, 
    currentRoomName, 
    recentRooms, 
    connectionStatus,
    setCurrentRoom 
  } = useRoomStore();
  
  const { setSelectedRoomSlug } = useUIStore();
  
  const { data: rooms, isLoading: isLoadingRooms } = useRooms();
  const createRoomMutation = useCreateRoom();
  const updateRoomMutation = useUpdateRoom();
  
  // Auto-generate slug from name
  useEffect(() => {
    if (newRoomName && !newRoomSlug) {
      const slug = newRoomName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setNewRoomSlug(slug);
    }
  }, [newRoomName, newRoomSlug]);
  
  // Handle room selection
  const handleRoomSelect = (roomSlug: string, roomName: string) => {
    setCurrentRoom(roomSlug, roomName);
    setSelectedRoomSlug(roomSlug);
    onRoomSelect?.(roomSlug);
  };
  
  // Handle room creation
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRoomName.trim() || !newRoomSlug.trim()) return;
    
    try {
      const newRoom: NewRoom = {
        name: newRoomName.trim(),
        slug: newRoomSlug.trim(),
      };
      
      const createdRoom = await createRoomMutation.mutateAsync(newRoom);
      
      // Select the new room
      handleRoomSelect(createdRoom.slug, createdRoom.name);
      
      // Reset form
      setNewRoomName('');
      setNewRoomSlug('');
      setIsCreatingRoom(false);
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };
  
  // Handle room name update (for future use)
  // const handleUpdateRoomName = async (slug: string, newName: string) => {
  //   if (!newName.trim()) return;
  //
  //   try {
  //     await updateRoomMutation.mutateAsync({
  //       slug,
  //       data: { name: newName.trim() },
  //     });
  //   } catch (error) {
  //     console.error('Failed to update room:', error);
  //   }
  // };
  
  return (
    <div className={cn('space-y-6', className)}>
      {/* Current Room */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Current Room</h3>
        
        {currentRoomSlug ? (
          <div className="p-4 bg-green-900/20 border border-green-500 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-white">{currentRoomName}</h4>
                <p className="text-sm text-green-400">/{currentRoomSlug}</p>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className={cn(
                    'w-3 h-3 rounded-full',
                    connectionStatus === 'connected' ? 'bg-green-500' :
                    connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                    'bg-red-500'
                  )}
                />
                <span className="text-xs text-neutral-400 capitalize">
                  {connectionStatus}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-neutral-800 border border-neutral-600 rounded-lg">
            <p className="text-neutral-400">No room selected</p>
          </div>
        )}
      </div>
      
      {/* Recent Rooms */}
      {recentRooms.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Recent Rooms</h3>
          <div className="space-y-2">
            {recentRooms.slice(0, 5).map((room) => (
              <button
                key={room.slug}
                onClick={() => handleRoomSelect(room.slug, room.name)}
                className={cn(
                  'w-full p-3 rounded-lg text-left transition-colors',
                  currentRoomSlug === room.slug
                    ? 'bg-blue-900/20 border border-blue-500'
                    : 'bg-neutral-800 hover:bg-neutral-700 border border-neutral-600'
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">{room.name}</h4>
                    <p className="text-sm text-neutral-400">/{room.slug}</p>
                  </div>
                  <span className="text-xs text-neutral-500">
                    {new Date(room.lastAccessed).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* All Rooms */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">All Rooms</h3>
          <button
            onClick={() => setIsCreatingRoom(true)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
          >
            Create Room
          </button>
        </div>
        
        {/* Create Room Form */}
        {isCreatingRoom && (
          <form onSubmit={handleCreateRoom} className="mb-4 p-4 bg-neutral-800 rounded-lg border border-neutral-600">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  Room Name
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Enter room name"
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white placeholder-neutral-400 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  Room Slug (URL)
                </label>
                <input
                  type="text"
                  value={newRoomSlug}
                  onChange={(e) => setNewRoomSlug(e.target.value)}
                  placeholder="room-slug"
                  pattern="[a-z0-9-]+"
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white placeholder-neutral-400 focus:outline-none focus:border-blue-500"
                  required
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Only lowercase letters, numbers, and hyphens allowed
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createRoomMutation.isPending}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded text-sm"
                >
                  {createRoomMutation.isPending ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingRoom(false);
                    setNewRoomName('');
                    setNewRoomSlug('');
                  }}
                  className="px-4 py-2 bg-neutral-600 hover:bg-neutral-700 text-white rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}
        
        {/* Rooms List */}
        {isLoadingRooms ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        ) : rooms && rooms.length > 0 ? (
          <div className="space-y-2">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => handleRoomSelect(room.slug, room.name)}
                className={cn(
                  'w-full p-3 rounded-lg text-left transition-colors',
                  currentRoomSlug === room.slug
                    ? 'bg-blue-900/20 border border-blue-500'
                    : 'bg-neutral-800 hover:bg-neutral-700 border border-neutral-600'
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">{room.name}</h4>
                    <p className="text-sm text-neutral-400">/{room.slug}</p>
                  </div>
                  <span className="text-xs text-neutral-500">
                    {new Date(room.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-neutral-400">
            <p>No rooms found.</p>
            <p className="text-sm mt-1">Create your first room to get started.</p>
          </div>
        )}
      </div>
      
      {/* Error Messages */}
      {createRoomMutation.isError && (
        <div className="p-3 bg-red-900/20 border border-red-500 rounded-lg">
          <p className="text-red-400 text-sm">
            Failed to create room: {createRoomMutation.error?.message}
          </p>
        </div>
      )}
      
      {updateRoomMutation.isError && (
        <div className="p-3 bg-red-900/20 border border-red-500 rounded-lg">
          <p className="text-red-400 text-sm">
            Failed to update room: {updateRoomMutation.error?.message}
          </p>
        </div>
      )}
    </div>
  );
}
