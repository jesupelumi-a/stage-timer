import { Server, Socket } from 'socket.io';
import type { SocketTimerEvent, SocketMessageEvent, SocketRoomEvent } from '@stage-timer/db';

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
    socket.on('timer-start', (data: SocketTimerEvent) => {
      console.log(`▶️ Timer start event from ${socket.id}:`, data);
      
      // Broadcast to all clients in the room except sender
      socket.to(`room-${data.roomId}`).emit('timer-started', {
        ...data,
        timestamp: Date.now(),
      });
    });

    socket.on('timer-pause', (data: SocketTimerEvent) => {
      console.log(`⏸️ Timer pause event from ${socket.id}:`, data);
      
      socket.to(`room-${data.roomId}`).emit('timer-paused', {
        ...data,
        timestamp: Date.now(),
      });
    });

    socket.on('timer-stop', (data: SocketTimerEvent) => {
      console.log(`⏹️ Timer stop event from ${socket.id}:`, data);
      
      socket.to(`room-${data.roomId}`).emit('timer-stopped', {
        ...data,
        timestamp: Date.now(),
      });
    });

    socket.on('timer-reset', (data: SocketTimerEvent) => {
      console.log(`🔄 Timer reset event from ${socket.id}:`, data);
      
      socket.to(`room-${data.roomId}`).emit('timer-reset', {
        ...data,
        timestamp: Date.now(),
      });
    });

    socket.on('timer-update', (data: SocketTimerEvent) => {
      console.log(`🔄 Timer update event from ${socket.id}:`, data);
      
      socket.to(`room-${data.roomId}`).emit('timer-updated', {
        ...data,
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
