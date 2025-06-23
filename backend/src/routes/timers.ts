import { Router, Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/connection';
import { timers, rooms, timerSessions, messages } from '@stage-timer/db';
import type { NewTimer } from '@stage-timer/db';

const router = Router();

// Get all timers for a room
router.get('/room/:roomSlug', async (req: Request, res: Response) => {
  try {
    const { roomSlug } = req.params;

    // First get the room
    const room = await db
      .select()
      .from(rooms)
      .where(eq(rooms.slug, roomSlug))
      .limit(1);

    if (room.length === 0) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    const roomTimers = await db
      .select()
      .from(timers)
      .where(eq(timers.roomId, room[0].id))
      .orderBy(timers.index);

    res.json(roomTimers);
  } catch (error) {
    console.error('Error fetching timers:', error);
    res.status(500).json({ error: 'Failed to fetch timers' });
  }
});

// Get specific timer with sessions and messages
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const timer = await db
      .select()
      .from(timers)
      .where(eq(timers.id, parseInt(id)))
      .limit(1);

    if (timer.length === 0) {
      res.status(404).json({ error: 'Timer not found' });
      return;
    }

    const sessions = await db
      .select()
      .from(timerSessions)
      .where(eq(timerSessions.timerId, parseInt(id)));

    const timerMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.timerId, parseInt(id)))
      .orderBy(messages.index);

    res.json({
      ...timer[0],
      sessions,
      messages: timerMessages,
    });
  } catch (error) {
    console.error('Error fetching timer:', error);
    res.status(500).json({ error: 'Failed to fetch timer' });
  }
});

// Create new timer
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      roomSlug,
      name,
      durationMs,
      appearance,
      type,
      trigger,
      ...otherFields
    } = req.body;

    if (!roomSlug || !name || durationMs === undefined) {
      res
        .status(400)
        .json({ error: 'roomSlug, name, and durationMs are required' });
      return;
    }

    // Get room ID
    const room = await db
      .select()
      .from(rooms)
      .where(eq(rooms.slug, roomSlug))
      .limit(1);

    if (room.length === 0) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    // Get next index for this room
    const existingTimers = await db
      .select()
      .from(timers)
      .where(eq(timers.roomId, room[0].id));

    const nextIndex =
      existingTimers.length > 0
        ? Math.max(...existingTimers.map((t) => t.index)) + 1
        : 0;

    const newTimer: NewTimer = {
      roomId: room[0].id,
      name,
      durationMs,
      appearance: appearance || 'COUNTDOWN',
      type: type || 'DURATION',
      trigger: trigger || 'MANUAL',
      index: nextIndex,
      ...otherFields,
    };

    const [createdTimer] = await db.insert(timers).values(newTimer).returning();

    res.status(201).json(createdTimer);
  } catch (error) {
    console.error('Error creating timer:', error);
    res.status(500).json({ error: 'Failed to create timer' });
  }
});

// Update timer
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.roomId;
    delete updateData.createdAt;

    const [updatedTimer] = await db
      .update(timers)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(timers.id, parseInt(id)))
      .returning();

    if (!updatedTimer) {
      res.status(404).json({ error: 'Timer not found' });
      return;
    }

    res.json(updatedTimer);
  } catch (error) {
    console.error('Error updating timer:', error);
    res.status(500).json({ error: 'Failed to update timer' });
  }
});

// Delete timer
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [deletedTimer] = await db
      .delete(timers)
      .where(eq(timers.id, parseInt(id)))
      .returning();

    if (!deletedTimer) {
      res.status(404).json({ error: 'Timer not found' });
      return;
    }

    res.json({ message: 'Timer deleted successfully' });
  } catch (error) {
    console.error('Error deleting timer:', error);
    res.status(500).json({ error: 'Failed to delete timer' });
  }
});

export { router as timersRouter };
