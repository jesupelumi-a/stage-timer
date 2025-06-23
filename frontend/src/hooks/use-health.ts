import { useQuery } from '@tanstack/react-query';
import { healthAPI } from '../lib/api-client';

// Query keys
export const healthKeys = {
  all: ['health'] as const,
  check: () => [...healthKeys.all, 'check'] as const,
  db: () => [...healthKeys.all, 'db'] as const,
  info: () => [...healthKeys.all, 'info'] as const,
};

// Basic health check
export function useHealthCheck() {
  return useQuery({
    queryKey: healthKeys.check(),
    queryFn: healthAPI.check,
    // Check health every 30 seconds
    refetchInterval: 30000,
    // Don't retry health checks as aggressively
    retry: 1,
    // Keep data fresh for connection status
    staleTime: 10000, // 10 seconds
  });
}

// Database health check
export function useDBHealthCheck() {
  return useQuery({
    queryKey: healthKeys.db(),
    queryFn: healthAPI.checkDB,
    // Check DB health every minute
    refetchInterval: 60000,
    retry: 1,
    staleTime: 30000, // 30 seconds
  });
}

// System info (development only)
export function useSystemInfo() {
  return useQuery({
    queryKey: healthKeys.info(),
    queryFn: healthAPI.getInfo,
    // Only fetch in development
    enabled: import.meta.env.DEV,
    // Don't refetch system info frequently
    refetchInterval: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Combined health status
export function useOverallHealth() {
  const healthCheck = useHealthCheck();
  const dbCheck = useDBHealthCheck();
  
  const isHealthy = healthCheck.isSuccess && dbCheck.isSuccess;
  const isLoading = healthCheck.isLoading || dbCheck.isLoading;
  const hasError = healthCheck.isError || dbCheck.isError;
  
  return {
    isHealthy,
    isLoading,
    hasError,
    healthCheck,
    dbCheck,
    status: isLoading 
      ? 'checking' 
      : isHealthy 
        ? 'healthy' 
        : 'unhealthy',
  };
}
