import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timersAPI } from '../lib/api-client';
import { roomKeys } from './use-rooms';
import type { Timer, NewTimer } from '@stage-timer/db';

// Query keys
export const timerKeys = {
  all: ['timers'] as const,
  lists: () => [...timerKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...timerKeys.lists(), { filters }] as const,
  details: () => [...timerKeys.all, 'detail'] as const,
  detail: (id: number) => [...timerKeys.details(), id] as const,
  byRoom: (roomSlug: string) => [...timerKeys.all, 'room', roomSlug] as const,
};

// Get timers by room
export function useTimersByRoom(roomSlug: string | null) {
  return useQuery({
    queryKey: timerKeys.byRoom(roomSlug || ''),
    queryFn: () => timersAPI.getByRoom(roomSlug!),
    enabled: !!roomSlug,
  });
}

// Get timer by ID with details
export function useTimer(id: number | null) {
  return useQuery({
    queryKey: timerKeys.detail(id || 0),
    queryFn: () => timersAPI.getById(id!),
    enabled: !!id,
  });
}

// Create timer mutation
export function useCreateTimer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (timer: NewTimer & { roomSlug: string }) => timersAPI.create(timer),
    onSuccess: (newTimer, variables) => {
      // Invalidate timers for the room
      queryClient.invalidateQueries({ 
        queryKey: timerKeys.byRoom(variables.roomSlug) 
      });
      
      // Invalidate room details to update timer count
      queryClient.invalidateQueries({ 
        queryKey: roomKeys.detail(variables.roomSlug) 
      });
      
      // Add timer to cache
      queryClient.setQueryData(timerKeys.detail(newTimer.id), newTimer);
    },
  });
}

// Update timer mutation
export function useUpdateTimer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Timer> }) =>
      timersAPI.update(id, data),
    onSuccess: (updatedTimer) => {
      // Update timer in cache
      queryClient.setQueryData(timerKeys.detail(updatedTimer.id), updatedTimer);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: timerKeys.lists() 
      });
      
      // If we know the room, invalidate room-specific queries
      if (updatedTimer.roomId) {
        queryClient.invalidateQueries({ 
          queryKey: roomKeys.details() 
        });
      }
    },
  });
}

// Delete timer mutation
export function useDeleteTimer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => timersAPI.delete(id),
    onSuccess: (_, id) => {
      // Remove timer from cache
      queryClient.removeQueries({ queryKey: timerKeys.detail(id) });
      
      // Invalidate all timer lists
      queryClient.invalidateQueries({ 
        queryKey: timerKeys.lists() 
      });
      
      // Invalidate room details
      queryClient.invalidateQueries({ 
        queryKey: roomKeys.details() 
      });
    },
  });
}

// Bulk update timers (for reordering, etc.)
export function useBulkUpdateTimers() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: Array<{ id: number; data: Partial<Timer> }>) => {
      const results = await Promise.all(
        updates.map(({ id, data }) => timersAPI.update(id, data))
      );
      return results;
    },
    onSuccess: (updatedTimers) => {
      // Update each timer in cache
      updatedTimers.forEach(timer => {
        queryClient.setQueryData(timerKeys.detail(timer.id), timer);
      });
      
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ 
        queryKey: timerKeys.lists() 
      });
      
      queryClient.invalidateQueries({ 
        queryKey: roomKeys.details() 
      });
    },
  });
}
