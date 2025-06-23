import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  bigint,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const timerAppearanceEnum = pgEnum('timer_appearance', [
  'TOD',
  'COUNTDOWN', 
  'COUNTUP',
  'HIDDEN'
]);

export const timerTypeEnum = pgEnum('timer_type', [
  'DURATION',
  'FIXED_TIME'
]);

export const timerTriggerEnum = pgEnum('timer_trigger', [
  'MANUAL',
  'SCHEDULED'
]);

export const sessionStatusEnum = pgEnum('session_status', [
  'running',
  'paused', 
  'stopped'
]);

// Tables
export const rooms = pgTable('rooms', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const timers = pgTable('timers', {
  id: serial('id').primaryKey(),
  roomId: integer('room_id').references(() => rooms.id).notNull(),
  name: text('name').notNull(),
  notes: text('notes').default(''),
  extra: text('extra').default(''),
  appearance: timerAppearanceEnum('appearance').default('COUNTDOWN').notNull(),
  type: timerTypeEnum('type').default('DURATION').notNull(),
  trigger: timerTriggerEnum('trigger').default('MANUAL').notNull(),
  durationMs: integer('duration_ms').notNull(),
  yellowWarningMs: integer('yellow_warning_ms').default(60000), // 1 minute
  redWarningMs: integer('red_warning_ms').default(30000), // 30 seconds
  index: integer('index').notNull(),
  showName: boolean('show_name').default(true).notNull(),
  showNotes: boolean('show_notes').default(false).notNull(),
  showExtra: boolean('show_extra').default(false).notNull(),
  startTime: timestamp('start_time'),
  startDate: boolean('start_date').default(false).notNull(),
  finishTime: timestamp('finish_time'),
  finishDate: boolean('finish_date').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const timerSessions = pgTable('timer_sessions', {
  id: serial('id').primaryKey(),
  timerId: integer('timer_id').references(() => timers.id).notNull(),
  kickoff: bigint('kickoff', { mode: 'number' }), // Unix timestamp in ms
  deadline: bigint('deadline', { mode: 'number' }), // Unix timestamp in ms
  lastStop: bigint('last_stop', { mode: 'number' }), // Unix timestamp in ms
  status: sessionStatusEnum('status').default('stopped').notNull(),
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  timerId: integer('timer_id').references(() => timers.id).notNull(),
  text: text('text').notNull(),
  color: text('color').default('#ffffff').notNull(),
  bold: boolean('bold').default(false).notNull(),
  uppercase: boolean('uppercase').default(false).notNull(),
  index: integer('index').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const roomsRelations = relations(rooms, ({ many }) => ({
  timers: many(timers),
}));

export const timersRelations = relations(timers, ({ one, many }) => ({
  room: one(rooms, {
    fields: [timers.roomId],
    references: [rooms.id],
  }),
  sessions: many(timerSessions),
  messages: many(messages),
}));

export const timerSessionsRelations = relations(timerSessions, ({ one }) => ({
  timer: one(timers, {
    fields: [timerSessions.timerId],
    references: [timers.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  timer: one(timers, {
    fields: [messages.timerId],
    references: [timers.id],
  }),
}));
