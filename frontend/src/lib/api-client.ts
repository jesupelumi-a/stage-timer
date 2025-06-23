import type { 
  Room, 
  Timer, 
  TimerWithDetails, 
  RoomWithTimers,
  NewRoom,
  NewTimer 
} from '@stage-timer/db';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response
  ) {
    super(message);
    this.name = 'APIError';
  }
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch {
        // Use default error message if JSON parsing fails
      }
      
      throw new APIError(errorMessage, response.status, response);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return {} as T;
    }
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    // Network or other errors
    throw new APIError(
      error instanceof Error ? error.message : 'Network error',
      0
    );
  }
}

// Health API
export const healthAPI = {
  check: () => fetchAPI<{ status: string; timestamp: string; uptime: number }>('/health'),
  checkDB: () => fetchAPI<{ status: string; database: string; timestamp: string }>('/health/db'),
  getInfo: () => fetchAPI<any>('/health/info'),
};

// Rooms API
export const roomsAPI = {
  getAll: () => fetchAPI<Room[]>('/rooms'),
  
  getBySlug: (slug: string) => fetchAPI<RoomWithTimers>(`/rooms/${slug}`),
  
  create: (room: NewRoom) => 
    fetchAPI<Room>('/rooms', {
      method: 'POST',
      body: JSON.stringify(room),
    }),
  
  update: (slug: string, data: { name: string }) =>
    fetchAPI<Room>(`/rooms/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (slug: string) =>
    fetchAPI<{ message: string }>(`/rooms/${slug}`, {
      method: 'DELETE',
    }),
};

// Timers API
export const timersAPI = {
  getByRoom: (roomSlug: string) => 
    fetchAPI<Timer[]>(`/timers/room/${roomSlug}`),
  
  getById: (id: number) => 
    fetchAPI<TimerWithDetails>(`/timers/${id}`),
  
  create: (timer: NewTimer & { roomSlug: string }) =>
    fetchAPI<Timer>('/timers', {
      method: 'POST',
      body: JSON.stringify(timer),
    }),
  
  update: (id: number, data: Partial<Timer>) =>
    fetchAPI<Timer>(`/timers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: number) =>
    fetchAPI<{ message: string }>(`/timers/${id}`, {
      method: 'DELETE',
    }),
};

// Export the APIError for error handling
export { APIError };
