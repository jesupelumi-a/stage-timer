import { Router, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/connection';
import { rooms, timers } from '@stage-timer/db';
import type { NewRoom } from '@stage-timer/db';

const router = Router();

// Get all rooms
router.get('/', async (_req: Request, res: Response) => {
  try {
    const allRooms = await db.select().from(rooms);
    res.json(allRooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Get room by slug with timers
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const room = await db
      .select()
      .from(rooms)
      .where(eq(rooms.slug, slug))
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

    res.json({
      ...room[0],
      timers: roomTimers,
    });
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
      res
        .status(409)
        .json({ error: 'Room with this slug already exists' });
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
    const { name } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const [updatedRoom] = await db
      .update(rooms)
      .set({ name })
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
