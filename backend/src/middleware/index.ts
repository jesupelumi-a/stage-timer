import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to simulate network latency for development/testing
 * Adds a configurable delay to all API requests to simulate real-world conditions
 */
export function simulateNetworkDelay(defaultDelayMs: number = 1000) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Check if delay simulation is enabled
    const isEnabled = process.env.NODE_ENV !== 'production' || process.env.SIMULATE_DELAY === 'true';
    
    if (!isEnabled) {
      next();
      return;
    }
    
    // Get delay amount from environment or use default
    const delayMs = process.env.SIMULATE_DELAY_MS ? parseInt(process.env.SIMULATE_DELAY_MS, 10) : defaultDelayMs;
    
    // Skip delay for health checks and GET requests (optional)
    const skipPaths = ['/health'];
    const shouldSkip = skipPaths.some(path => req.path.includes(path)) || 
                     (process.env.SIMULATE_DELAY_SKIP_GET === 'true' && req.method === 'GET');
    
    if (shouldSkip) {
      next();
      return;
    }
    
    console.log(`🐌 Simulating ${delayMs}ms network delay for ${req.method} ${req.path}`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    
    next();
  };
}

/**
 * Middleware for CORS
 */
export function configureCORS() {
  return (req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  };
} 