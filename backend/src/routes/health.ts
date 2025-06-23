import { Router, Request, Response } from 'express';
import { db } from '../db/connection';

const router = Router();

// Basic health check
router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Database health check
router.get('/db', async (_req: Request, res: Response) => {
  try {
    // Simple query to test database connection
    await db.execute('SELECT 1');

    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

// Detailed system info (development only)
router.get('/info', (_req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({ error: 'Not available in production' });
    return;
  }

  res.json({
    status: 'ok',
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      databaseUrl: process.env.DATABASE_URL ? '[CONFIGURED]' : '[NOT SET]',
      frontendUrl: process.env.FRONTEND_URL,
    },
    timestamp: new Date().toISOString(),
  });
});

export { router as healthRouter };
