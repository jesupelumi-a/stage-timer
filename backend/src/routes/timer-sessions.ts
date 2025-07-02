import { Router, Request, Response } from 'express';
import { db } from '../db/connection';
import { timers, timerSessions, rooms } from '@stage-timer/db';
import { eq } from 'drizzle-orm';
import {
  calculateTimerState,
  createTimerSession,
  pauseTimerSession,
  resumeTimerSession,
  resetTimerSession,
  formatTimerSessionResponse,
  formatTimerSessionTimeset,
} from '../lib/timer-calculations';
import { io } from '../index';
import type { SocketTimerEvent } from '@stage-timer/db';

const router = Router();

/**
 * Get current timer session state
 * GET /timer-sessions/:timerId
 */
router.get('/:timerId', async (req: Request, res: Response) => {
  try {
    const { timerId } = req.params;
    const timerIdNum = parseInt(timerId);

    // Get timer
    const timer = await db
      .select()
      .from(timers)
      .where(eq(timers.id, timerIdNum))
      .limit(1);

    if (timer.length === 0) {
      res.status(404).json({ error: 'Timer not found' });
      return;
    }

    // Get the single active session (if any)
    const [currentSession] = await db
      .select()
      .from(timerSessions)
      .limit(1);

    // Check if the active session is for this timer
    const sessionForThisTimer = currentSession?.timerId === timerIdNum ? currentSession : null;

    // Calculate and return timer state
    const response = formatTimerSessionResponse(timer[0], sessionForThisTimer);
    res.json(response);
  } catch (error) {
    console.error('Error getting timer session:', error);
    res.status(500).json({ error: 'Failed to get timer session' });
  }
});

/**
 * Start timer - creates new session or resumes paused session
 * POST /timer-sessions/:timerId/start
 */
router.post('/:timerId/start', async (req: Request, res: Response) => {
  try {
    const { timerId } = req.params;
    const timerIdNum = parseInt(timerId);

    // Get timer
    const timer = await db
      .select()
      .from(timers)
      .where(eq(timers.id, timerIdNum))
      .limit(1);

    if (timer.length === 0) {
      res.status(404).json({ error: 'Timer not found' });
      return;
    }

    // Get the single active session (if any)
    const [currentSession] = await db
      .select()
      .from(timerSessions)
      .limit(1);

    let updatedSession;

    if (currentSession && currentSession.timerId === timerIdNum && currentSession.status === 'paused') {
      // Resume paused timer for the same timer
      const sessionData = resumeTimerSession(timer[0], currentSession);
      [updatedSession] = await db
        .update(timerSessions)
        .set(sessionData)
        .where(eq(timerSessions.id, currentSession.id))
        .returning();

      console.log(`▶️ Resumed paused timer ${timerIdNum}:`, {
        running: updatedSession.status === 'running',
        kickoff: updatedSession.kickoff,
        deadline: updatedSession.deadline
      });
    } else {
      // Delete all existing timer sessions and create new one (only one active timer at a time)
      await db.delete(timerSessions);
      console.log(`🗑️ Cleared all existing timer sessions`);

      // Create new session for the selected timer
      const sessionData = createTimerSession(timer[0]);
      [updatedSession] = await db
        .insert(timerSessions)
        .values({
          ...sessionData,
          timerId: timerIdNum,
        })
        .returning();

      console.log(`▶️ Started timer ${timerIdNum} with new session:`, {
        running: updatedSession.status === 'running',
        kickoff: updatedSession.kickoff,
        deadline: updatedSession.deadline
      });
    }

    // Set this timer as the active timer in its room
    await db
      .update(rooms)
      .set({ activeTimerId: timerIdNum })
      .where(eq(rooms.id, timer[0].roomId));

    // Emit WebSocket event to all clients in the room
    const socketSessionData = formatTimerSessionResponse(timer[0], updatedSession);
    const socketEvent: SocketTimerEvent = {
      roomId: timer[0].roomId,
      timerId: timerIdNum,
      action: 'start',
      data: formatTimerSessionTimeset(timer[0], updatedSession),
      timestamp: Date.now(),
    };

    io.to(`room-${timer[0].roomId}`).emit('timer-started', {
      ...socketEvent,
      sessionData: socketSessionData,
    });

    console.log(`📡 Emitted timer-started event to room-${timer[0].roomId}`);

    // Return only timeset for optimized response
    const timeset = formatTimerSessionTimeset(timer[0], updatedSession);
    res.json(timeset);
  } catch (error) {
    console.error('Error starting timer:', error);
    res.status(500).json({ error: 'Failed to start timer' });
  }
});

/**
 * Pause timer
 * POST /timer-sessions/:timerId/pause
 */
router.post('/:timerId/pause', async (req: Request, res: Response) => {
  try {
    const { timerId } = req.params;
    const { timestamp, currentTime } = req.body; // Get timestamp and frontend current time
    const timerIdNum = parseInt(timerId);

    console.log(`⏸️ Processing pause request for timer ${timerIdNum} with timestamp:`, timestamp, 'currentTime:', currentTime);

    // Get timer
    const timer = await db
      .select()
      .from(timers)
      .where(eq(timers.id, timerIdNum))
      .limit(1);

    if (timer.length === 0) {
      res.status(404).json({ error: 'Timer not found' });
      return;
    }

    // Get the single active session (should be for this timer)
    const [currentSession] = await db
      .select()
      .from(timerSessions)
      .limit(1);

    if (!currentSession) {
      res.status(400).json({ error: 'No active timer session found' });
      return;
    }

    if (currentSession.timerId !== timerIdNum) {
      res.status(400).json({ error: 'This timer is not currently active' });
      return;
    }

    if (currentSession.status !== 'running') {
      res.status(400).json({ error: 'Timer is not currently running' });
      return;
    }

    // Update session to paused, using request timestamp and frontend current time
    const sessionData = pauseTimerSession(currentSession, timestamp, currentTime);
    const [updatedSession] = await db
      .update(timerSessions)
      .set(sessionData)
      .where(eq(timerSessions.id, currentSession.id))
      .returning();

    // NOTE: WebSocket broadcasting disabled for pause events
    // Frontend handles pause broadcasting directly for instant sync
    console.log(`📡 Skipping timer-paused WebSocket broadcast - handled by frontend`);

    // Return only timeset for optimized response
    const timeset = formatTimerSessionTimeset(timer[0], updatedSession);
    res.json(timeset);
  } catch (error) {
    console.error('Error pausing timer:', error);
    res.status(500).json({ error: 'Failed to pause timer' });
  }
});

/**
 * Reset timer - clears session
 * POST /timer-sessions/:timerId/reset
 */
router.post('/:timerId/reset', async (req: Request, res: Response) => {
  try {
    const { timerId } = req.params;
    const timerIdNum = parseInt(timerId);

    // Get timer
    const timer = await db
      .select()
      .from(timers)
      .where(eq(timers.id, timerIdNum))
      .limit(1);

    if (timer.length === 0) {
      res.status(404).json({ error: 'Timer not found' });
      return;
    }

    // Delete all existing sessions and create new reset session
    await db.delete(timerSessions);
    console.log(`🗑️ Cleared all existing timer sessions for reset`);

    const sessionData = resetTimerSession();
    const [updatedSession] = await db
      .insert(timerSessions)
      .values({
        timerId: timerIdNum,
        ...sessionData,
      })
      .returning();

    console.log(`🔄 Reset timer ${timerIdNum} with new session`);

    // Set this timer as the active timer in its room
    await db
      .update(rooms)
      .set({ activeTimerId: timerIdNum })
      .where(eq(rooms.id, timer[0].roomId));

    // Emit WebSocket event to all clients in the room
    const socketSessionData = formatTimerSessionResponse(timer[0], updatedSession);
    const socketEvent: SocketTimerEvent = {
      roomId: timer[0].roomId,
      timerId: timerIdNum,
      action: 'reset',
      data: formatTimerSessionTimeset(timer[0], updatedSession),
      timestamp: Date.now(),
    };

    io.to(`room-${timer[0].roomId}`).emit('timer-reset', {
      ...socketEvent,
      sessionData: socketSessionData,
    });

    console.log(`📡 Emitted timer-reset event to room-${timer[0].roomId}`);

    // Return only timeset for optimized response
    const timeset = formatTimerSessionTimeset(timer[0], updatedSession);
    res.json(timeset);
  } catch (error) {
    console.error('Error resetting timer:', error);
    res.status(500).json({ error: 'Failed to reset timer' });
  }
});

/**
 * Adjust timer time (add/subtract time)
 * POST /timer-sessions/:timerId/adjust
 * Body: { seconds: number } (positive to add time, negative to subtract)
 */
router.post('/:timerId/adjust', async (req: Request, res: Response) => {
  try {
    const { timerId } = req.params;
    const { seconds } = req.body;
    const timerIdNum = parseInt(timerId);
    const adjustmentMs = seconds * 1000;

    if (typeof seconds !== 'number') {
      res.status(400).json({ error: 'seconds must be a number' });
      return;
    }

    // Get timer
    const timer = await db
      .select()
      .from(timers)
      .where(eq(timers.id, timerIdNum))
      .limit(1);

    if (timer.length === 0) {
      res.status(404).json({ error: 'Timer not found' });
      return;
    }

    // Get the single active session (should be for this timer)
    const [currentSession] = await db
      .select()
      .from(timerSessions)
      .limit(1);

    if (!currentSession) {
      res.status(400).json({ error: 'No active timer session to adjust' });
      return;
    }

    if (currentSession.timerId !== timerIdNum) {
      res.status(400).json({ error: 'This timer is not currently active' });
      return;
    }

    // Adjust deadline if session is active
    let updatedSession;
    if (currentSession.deadline) {
      const newDeadline = currentSession.deadline + adjustmentMs;
      [updatedSession] = await db
        .update(timerSessions)
        .set({ deadline: newDeadline })
        .where(eq(timerSessions.id, currentSession.id))
        .returning();
    } else {
      updatedSession = currentSession;
    }

    // Emit WebSocket event to all clients in the room
    const socketSessionData = formatTimerSessionResponse(timer[0], updatedSession);
    const socketEvent: SocketTimerEvent = {
      roomId: timer[0].roomId,
      timerId: timerIdNum,
      action: 'update',
      data: formatTimerSessionTimeset(timer[0], updatedSession),
      timestamp: Date.now(),
    };

    io.to(`room-${timer[0].roomId}`).emit('timer-updated', {
      ...socketEvent,
      sessionData: socketSessionData,
    });

    console.log(`📡 Emitted timer-updated event to room-${timer[0].roomId}`);

    const response = formatTimerSessionResponse(timer[0], updatedSession);
    res.json(response);
  } catch (error) {
    console.error('Error adjusting timer:', error);
    res.status(500).json({ error: 'Failed to adjust timer' });
  }
});

export default router;
