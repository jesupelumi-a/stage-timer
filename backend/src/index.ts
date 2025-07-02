import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { db } from './db/connection';
import { healthRouter } from './routes/health';
import { roomsRouter } from './routes/rooms';
import { timersRouter } from './routes/timers';
import timerSessionsRouter from './routes/timer-sessions';
import { setupSocketHandlers } from './socket/handlers';
import { simulateNetworkDelay } from './middleware';

// Load environment variables
config();

const app = express();
const server = createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Network delay simulation middleware (only for API routes)
// Environment variables:
// - SIMULATE_DELAY=true (force enable in production)
// - SIMULATE_DELAY_MS=3000 (custom delay in milliseconds, default: 2000)
// - SIMULATE_DELAY_SKIP_GET=true (skip delay for GET requests)
app.use('/api', simulateNetworkDelay());

// Routes
app.use('/api/health', healthRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/timers', timersRouter);
app.use('/api/timer-sessions', timerSessionsRouter);

// Test endpoint for timer sessions cleanup
app.post('/api/cleanup-sessions', async (req, res) => {
  try {
    const { migrateToSingleSessionPerTimer } = await import('./db/cleanup-sessions');
    const stats = await migrateToSingleSessionPerTimer();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Cleanup failed:', error);
    res.status(500).json({ error: 'Cleanup failed', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Socket.io handlers
setupSocketHandlers(io);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io enabled with CORS origins: ${process.env.FRONTEND_URL || 'http://localhost:5173,5174'}`);
  console.log(`🗄️  Database connection ready`);
  
  // Log delay simulation status
  const isDelayEnabled = process.env.NODE_ENV !== 'production' || process.env.SIMULATE_DELAY === 'true';
  const delayMs = process.env.SIMULATE_DELAY_MS ? parseInt(process.env.SIMULATE_DELAY_MS, 10) : 1000;
  
  if (isDelayEnabled) {
    console.log(`🐌 Network delay simulation: ENABLED (${delayMs}ms)`);
    if (process.env.SIMULATE_DELAY_SKIP_GET === 'true') {
      console.log(`   └─ Skipping GET requests`);
    }
  } else {
    console.log(`⚡ Network delay simulation: DISABLED`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

export { io };
