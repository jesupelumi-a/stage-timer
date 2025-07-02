import { useState, useEffect } from 'react';
import { useAppState } from '../hooks/use-app-state';
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
    rooms,
    loading,
    createRoom,
    loadRooms,
  } = useAppState();

  const { setSelectedRoomSlug } = useUIStore();

  // Load rooms when component mounts
  useEffect(() => {
    loadRooms();
  }, [loadRooms]);
  
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
      
      const createdRoom = await createRoom(newRoom);
      
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
      {/* Available Rooms */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Available Rooms</h3>

        {loading.rooms ? (
          <div className="p-4 bg-neutral-800 border border-neutral-600 rounded-lg">
            <p className="text-neutral-400">Loading rooms...</p>
          </div>
        ) : rooms.length > 0 ? (
          <div className="space-y-2">
            {rooms.map((room) => (
              <button
                key={room.slug}
                onClick={() => handleRoomSelect(room.slug, room.name)}
                className="w-full p-3 rounded-lg text-left transition-colors bg-neutral-800 hover:bg-neutral-700 border border-neutral-600"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">{room.name}</h4>
                    <p className="text-sm text-neutral-400">/{room.slug}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-neutral-800 border border-neutral-600 rounded-lg">
            <p className="text-neutral-400">No rooms available</p>
          </div>
        )}
      </div>

      {/* Create Room */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Create New Room</h3>
          <button
            onClick={() => setIsCreatingRoom(!isCreatingRoom)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
          >
            {isCreatingRoom ? 'Cancel' : 'Create Room'}
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
                  disabled={loading.rooms}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded text-sm"
                >
                  {loading.rooms ? 'Creating...' : 'Create'}
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
        {loading.rooms ? (
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
                  false // Simplified - no current room tracking
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
      

    </div>
  );
}
