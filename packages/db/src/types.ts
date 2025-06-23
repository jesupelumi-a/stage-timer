import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type { 
  rooms, 
  timers, 
  timerSessions, 
  messages 
} from './schema';

// Select types (for reading from DB)
export type Room = InferSelectModel<typeof rooms>;
export type Timer = InferSelectModel<typeof timers>;
export type TimerSession = InferSelectModel<typeof timerSessions>;
export type Message = InferSelectModel<typeof messages>;

// Insert types (for writing to DB)
export type NewRoom = InferInsertModel<typeof rooms>;
export type NewTimer = InferInsertModel<typeof timers>;
export type NewTimerSession = InferInsertModel<typeof timerSessions>;
export type NewMessage = InferInsertModel<typeof messages>;

// Extended types with relations
export type RoomWithTimers = Room & {
  timers: Timer[];
};

export type TimerWithSession = Timer & {
  sessions: TimerSession[];
  messages: Message[];
};

export type TimerWithDetails = Timer & {
  room: Room;
  sessions: TimerSession[];
  messages: Message[];
};

// Socket event types
export interface SocketTimerEvent {
  roomId: number;
  timerId: number;
  action: 'start' | 'pause' | 'stop' | 'reset' | 'update';
  data?: any;
  timestamp: number;
}

export interface SocketMessageEvent {
  roomId: number;
  timerId: number;
  message: Message;
  action: 'show' | 'hide' | 'update';
  timestamp: number;
}

export interface SocketRoomEvent {
  roomId: number;
  action: 'join' | 'leave' | 'update';
  data?: any;
  timestamp: number;
}
