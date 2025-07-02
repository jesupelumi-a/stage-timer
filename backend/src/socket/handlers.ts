import { Server, Socket } from 'socket.io';
import { db } from '../db/connection';
import { timers, timerSessions } from '@stage-timer/db';
import { eq, desc } from 'drizzle-orm';
import { formatTimerSessionResponse } from '../lib/timer-calculations';
import type { SocketTimerEvent, SocketMessageEvent, SocketRoomEvent } from '@stage-timer/db';

/**
 * Helper function to get timer session data for websocket events
 */
async function getTimerSessionData(timerId: number) {
  try {
    // Get timer
    const timer = await db
      .select()
      .from(timers)
      .where(eq(timers.id, timerId))
      .limit(1);

    if (timer.length === 0) {
      return null;
    }

    // Get current session
    const sessions = await db
      .select()
      .from(timerSessions)
      .where(eq(timerSessions.timerId, timerId))
      .orderBy(desc(timerSessions.id))
      .limit(1);

    const currentSession = sessions.length > 0 ? sessions[0] : null;

    // Return formatted session response
    return formatTimerSessionResponse(timer[0], currentSession);
  } catch (error) {
    console.error('Error getting timer session data:', error);
    return null;
  }
}

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Room management
    socket.on('join-room', (roomSlug: string) => {
      console.log(`📍 Client ${socket.id} joining room: ${roomSlug}`);
      socket.join(roomSlug);
      
      // Notify others in the room
      socket.to(roomSlug).emit('user-joined', {
        socketId: socket.id,
        timestamp: Date.now(),
      });

      // Send confirmation to the client
      socket.emit('room-joined', {
        roomSlug,
        timestamp: Date.now(),
      });
    });

    socket.on('leave-room', (roomSlug: string) => {
      console.log(`📍 Client ${socket.id} leaving room: ${roomSlug}`);
      socket.leave(roomSlug);
      
      // Notify others in the room
      socket.to(roomSlug).emit('user-left', {
        socketId: socket.id,
        timestamp: Date.now(),
      });
    });

    // Timer events
    socket.on('timer-start', async (data: SocketTimerEvent) => {
      console.log(`▶️ Timer start event from ${socket.id}:`, data);

      // Get current timer session data
      const sessionData = await getTimerSessionData(data.timerId);

      // Broadcast to all clients in the room except sender
      socket.to(`room-${data.roomId}`).emit('timer-started', {
        ...data,
        sessionData,
        timestamp: Date.now(),
      });
    });

    socket.on('timer-pause', async (data: SocketTimerEvent) => {
      console.log(`⏸️ Timer pause event from ${socket.id}:`, data);

      // Get current timer session data
      const sessionData = await getTimerSessionData(data.timerId);

      socket.to(`room-${data.roomId}`).emit('timer-paused', {
        ...data,
        sessionData,
        timestamp: Date.now(),
      });
    });

    socket.on('timer-stop', async (data: SocketTimerEvent) => {
      console.log(`⏹️ Timer stop event from ${socket.id}:`, data);

      // Get current timer session data
      const sessionData = await getTimerSessionData(data.timerId);

      socket.to(`room-${data.roomId}`).emit('timer-stopped', {
        ...data,
        sessionData,
        timestamp: Date.now(),
      });
    });

    socket.on('timer-reset', async (data: SocketTimerEvent) => {
      console.log(`🔄 Timer reset event from ${socket.id}:`, data);

      // Get current timer session data
      const sessionData = await getTimerSessionData(data.timerId);

      socket.to(`room-${data.roomId}`).emit('timer-reset', {
        ...data,
        sessionData,
        timestamp: Date.now(),
      });
    });

    socket.on('timer-update', async (data: SocketTimerEvent) => {
      console.log(`🔄 Timer update event from ${socket.id}:`, data);

      // Get current timer session data
      const sessionData = await getTimerSessionData(data.timerId);

      socket.to(`room-${data.roomId}`).emit('timer-updated', {
        ...data,
        sessionData,
        timestamp: Date.now(),
      });
    });

    socket.on('timer-sync', (data: SocketTimerEvent) => {
      console.log(`🔄 Timer sync event from ${socket.id}:`, data);
      
      socket.to(`room-${data.roomId}`).emit('timer-synced', {
        ...data,
        timestamp: Date.now(),
      });
    });

    // Message events
    socket.on('message-show', (data: SocketMessageEvent) => {
      console.log(`💬 Message show event from ${socket.id}:`, data);
      
      socket.to(`room-${data.roomId}`).emit('message-shown', {
        ...data,
        timestamp: Date.now(),
      });
    });

    socket.on('message-hide', (data: SocketMessageEvent) => {
      console.log(`💬 Message hide event from ${socket.id}:`, data);
      
      socket.to(`room-${data.roomId}`).emit('message-hidden', {
        ...data,
        timestamp: Date.now(),
      });
    });

    socket.on('message-update', (data: SocketMessageEvent) => {
      console.log(`💬 Message update event from ${socket.id}:`, data);
      
      socket.to(`room-${data.roomId}`).emit('message-updated', {
        ...data,
        timestamp: Date.now(),
      });
    });

    // Room events
    socket.on('room-update', (data: SocketRoomEvent) => {
      console.log(`🏠 Room update event from ${socket.id}:`, data);

      socket.to(`room-${data.roomId}`).emit('room-updated', {
        ...data,
        timestamp: Date.now(),
      });
    });

    // Direct room broadcasting (frontend-to-frontend with minimal backend involvement)
    socket.on('broadcast-to-room', (data: { roomChannel: string; eventName: string; eventData: any }) => {
      console.log(`📡 Direct room broadcast from ${socket.id}:`, data.eventName);

      // Broadcast to ALL clients in the room (including sender for consistency)
      io.to(data.roomChannel).emit(data.eventName, {
        ...data.eventData,
        timestamp: Date.now(),
      });
    });

    // Active timer selection events
    socket.on('active-timer-changed', (data: { roomId: number; activeTimerId: number | null; timestamp: number }) => {
      console.log(`🎯 Active timer changed from ${socket.id}:`, data);

      socket.to(`room-${data.roomId}`).emit('active-timer-updated', {
        ...data,
        timestamp: Date.now(),
      });
    });

    // Disconnect handling
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id}, reason: ${reason}`);
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`❌ Socket error from ${socket.id}:`, error);
    });
  });

  // Server-side room management
  io.on('error', (error) => {
    console.error('❌ Socket.io server error:', error);
  });

  console.log('🔌 Socket.io handlers initialized');
}
