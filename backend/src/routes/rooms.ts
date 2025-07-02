import { Router, Request, Response } from 'express';
import { eq, inArray } from 'drizzle-orm';
import { db } from '../db/connection';
import { rooms, timers, timerSessions, messages } from '@stage-timer/db';
import type { NewRoom } from '@stage-timer/db';

const router = Router();

// Get all rooms
router.get('/', async (_req: Request, res: Response) => {
  try {
    console.log('📡 GET /api/rooms - Fetching all rooms');
    const allRooms = await db.select().from(rooms);
    console.log(`📡 Found ${allRooms.length} rooms`);
    res.json(allRooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Get room by slug with all data (timers, sessions, messages)
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    console.log(`📡 GET /api/rooms/${slug} - Fetching room with all data`);

    // Get room
    const room = await db
      .select()
      .from(rooms)
      .where(eq(rooms.slug, slug))
      .limit(1);

    if (room.length === 0) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    const roomData = room[0];

    // Get all timers for this room
    const roomTimers = await db
      .select()
      .from(timers)
      .where(eq(timers.roomId, roomData.id))
      .orderBy(timers.index);

    // Get all timer sessions for this room
    const timerSession = await db.query.timerSessions.findFirst();

    // Get all messages for timers in this room
    const timerIds = roomTimers.map((t) => t.id);
    const roomMessages =
      timerIds.length > 0
        ? await db
            .select()
            .from(messages)
            .where(inArray(messages.timerId, timerIds))
            .orderBy(messages.index)
        : [];

    // Find active timer and its session
    const activeTimer = roomTimers.find((t) => t.id === roomData.activeTimerId);

    // Build response similar to stagetimer.io format
    const response = {
      // Room metadata
      ...roomData,

      // Timer session data (current active timer state)
      timeset: timerSession
        ? {
            timerId: timerSession.timerId,
            running: timerSession.status === 'running',
            deadline: timerSession.deadline || null,
            kickoff: timerSession.kickoff || null,
            lastStop: timerSession.lastStop || null,
            currentTime:
              timerSession.deadline && timerSession.kickoff
                ? timerSession.deadline - timerSession.kickoff
                : null,
            status: timerSession.status,
          }
        : null,

      // Timers data
      timers: {
        items: roomTimers,
        sorted: roomTimers, // Already sorted by index
        active: activeTimer || null,
      },

      // Messages data
      messages: {
        items: roomMessages,
        sorted: roomMessages, // Already sorted by index
        // active:     roomMessages.find((m) => m.id === roomData.activeMessageId) || null,
        // activeId: roomData.activeMessageId,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Create new room
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) {
      res.status(400).json({ error: 'Name and slug are required' });
      return;
    }

    // Check if slug already exists
    const existingRoom = await db
      .select()
      .from(rooms)
      .where(eq(rooms.slug, slug))
      .limit(1);

    if (existingRoom.length > 0) {
      res.status(409).json({ error: 'Room with this slug already exists' });
      return;
    }

    const newRoom: NewRoom = {
      name,
      slug,
    };

    const [createdRoom] = await db.insert(rooms).values(newRoom).returning();

    res.status(201).json(createdRoom);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Update room
router.put('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { name, activeTimerId } = req.body;

    if (!name && activeTimerId === undefined) {
      res.status(400).json({ error: 'Name or activeTimerId is required' });
      return;
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (activeTimerId !== undefined) updateData.activeTimerId = activeTimerId;

    const [updatedRoom] = await db
      .update(rooms)
      .set(updateData)
      .where(eq(rooms.slug, slug))
      .returning();

    if (!updatedRoom) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    res.json(updatedRoom);
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// Delete room
router.delete('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const [deletedRoom] = await db
      .delete(rooms)
      .where(eq(rooms.slug, slug))
      .returning();

    if (!deletedRoom) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

export { router as roomsRouter };
