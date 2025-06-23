import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomsAPI } from '../lib/api-client';
import type { NewRoom } from '@stage-timer/db';

// Query keys
export const roomKeys = {
  all: ['rooms'] as const,
  lists: () => [...roomKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...roomKeys.lists(), { filters }] as const,
  details: () => [...roomKeys.all, 'detail'] as const,
  detail: (slug: string) => [...roomKeys.details(), slug] as const,
};

// Get all rooms
export function useRooms() {
  return useQuery({
    queryKey: roomKeys.lists(),
    queryFn: roomsAPI.getAll,
  });
}

// Get room by slug with timers
export function useRoom(slug: string | null) {
  return useQuery({
    queryKey: roomKeys.detail(slug || ''),
    queryFn: () => roomsAPI.getBySlug(slug!),
    enabled: !!slug,
  });
}

// Create room mutation
export function useCreateRoom() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (room: NewRoom) => roomsAPI.create(room),
    onSuccess: (newRoom) => {
      // Invalidate and refetch rooms list
      queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
      
      // Add the new room to the cache
      queryClient.setQueryData(roomKeys.detail(newRoom.slug), newRoom);
    },
  });
}

// Update room mutation
export function useUpdateRoom() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: { name: string } }) =>
      roomsAPI.update(slug, data),
    onSuccess: (updatedRoom, { slug }) => {
      // Update the room in cache
      queryClient.setQueryData(roomKeys.detail(slug), updatedRoom);
      
      // Invalidate rooms list to reflect changes
      queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
    },
  });
}

// Delete room mutation
export function useDeleteRoom() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (slug: string) => roomsAPI.delete(slug),
    onSuccess: (_, slug) => {
      // Remove room from cache
      queryClient.removeQueries({ queryKey: roomKeys.detail(slug) });
      
      // Invalidate rooms list
      queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
    },
  });
}
