import { Router, Request, Response } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/connection';
import { timers, rooms, timerSessions, messages } from '@stage-timer/db';
import type { NewTimer } from '@stage-timer/db';
import { formatTimerSessionResponse } from '../lib/timer-calculations';

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

    // Convert startTime string to Date if needed
    if (otherFields.startTime && typeof otherFields.startTime === 'string') {
      otherFields.startTime = new Date(otherFields.startTime);
    }

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

    // Convert startTime string to Date if needed
    if (updateData.startTime && typeof updateData.startTime === 'string') {
      updateData.startTime = new Date(updateData.startTime);
    }

    const [updatedTimer] = await db
      .update(timers)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(timers.id, parseInt(id)))
      .returning();

    if (!updatedTimer) {
      res.status(404).json({ error: 'Timer not found' });
      return;
    }

    // Return just the updated timer (flattened)
    res.json(updatedTimer);
  } catch (error) {
    console.error('Error updating timer:', error);
    res.status(500).json({ error: 'Failed to update timer' });
  }
});

// Reorder timers - bulk update indices
router.patch('/reorder', async (req: Request, res: Response) => {
  try {
    console.log('Reorder request received:', req.body);
    const { timerIds } = req.body;

    if (!timerIds || !Array.isArray(timerIds)) {
      console.error('Invalid timerIds:', timerIds);
      res.status(400).json({ error: 'timerIds array is required' });
      return;
    }

    console.log('Processing timer IDs:', timerIds);

    // Validate and convert timer IDs to integers
    const validTimerIds: number[] = [];
    for (let i = 0; i < timerIds.length; i++) {
      const id = timerIds[i];
      console.log(`Processing ID at index ${i}:`, id, 'type:', typeof id);
      
      // Handle both string and number inputs
      const parsedId = typeof id === 'number' ? id : parseInt(String(id), 10);
      console.log(`Parsed ID:`, parsedId);
      
      if (isNaN(parsedId) || parsedId <= 0) {
        console.error(`Invalid timer ID at index ${i}:`, id, 'parsed as:', parsedId);
        res.status(400).json({ error: `Invalid timer ID at position ${i}: ${id}` });
        return;
      }
      validTimerIds.push(parsedId);
    }

    console.log('Valid timer IDs:', validTimerIds);

    // Update each timer's index based on its position in the array
    const updatePromises = validTimerIds.map((timerId: number, index: number) => {
      console.log(`Updating timer ${timerId} to index ${index}`);
      return db
        .update(timers)
        .set({ index, updatedAt: new Date() })
        .where(eq(timers.id, timerId))
        .returning();
    });

    const updatedTimers = await Promise.all(updatePromises);
    const flatResults = updatedTimers.map(result => result[0]).filter(Boolean);

    console.log('Reorder completed, updated timers:', flatResults.length);
    res.json(flatResults);
  } catch (error) {
    console.error('Error reordering timers:', error);
    res.status(500).json({ error: 'Failed to reorder timers' });
  }
});

// Delete timer
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const timerId = parseInt(id);

    // First check if this timer is the active timer for any room
    const roomsWithActiveTimer = await db
      .select()
      .from(rooms)
      .where(eq(rooms.activeTimerId, timerId));

    // If this timer is active in any room(s), clear the activeTimerId first
    if (roomsWithActiveTimer.length > 0) {
      await Promise.all(
        roomsWithActiveTimer.map(room =>
          db
            .update(rooms)
            .set({ activeTimerId: null })
            .where(eq(rooms.id, room.id))
        )
      );
    }

    // Now delete the timer
    const [deletedTimer] = await db
      .delete(timers)
      .where(eq(timers.id, timerId))
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
