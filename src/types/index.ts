// Timer Types
export type TimerType = 'countdown' | 'countup' | 'stopwatch' | 'hidden';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'expired';

export interface TimerState {
  type: TimerType;
  status: TimerStatus;
  currentTime: number; // in seconds - for display compatibility
  initialTime: number; // in seconds - the duration
  elapsedTime: number; // in seconds - actual elapsed time during play
  startTime?: number; // timestamp when timer started
  pausedTime?: number; // accumulated paused time
}

export interface TimerPreset {
  id: string;
  name: string;
  duration: number; // in seconds
  type: TimerType;
}

// Multiple Timer Support
export interface Timer {
  id: string;
  name: string;
  state: TimerState;
  autoLinkToPrevious?: boolean;
  order: number;
  startTime?: string; // HH:MM AM/PM format - when timer should be manually started
}

export interface TimerCollection {
  timers: Timer[];
  activeTimerId: string | null;
  lastUpdated?: number; // Timestamp for sync tracking
}

// Message Types
export interface Message {
  id: string;
  text: string;
  isVisible: boolean;
  autoHide?: boolean;
  hideAfter?: number; // in seconds
  createdAt: number; // timestamp
}

export interface MessagePreset {
  id: string;
  name: string;
  text: string;
  autoHide?: boolean;
  hideAfter?: number;
}

// Settings Types
export interface DisplaySettings {
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  showSeconds: boolean;
  timeFormat: '12h' | '24h';
  showDate: boolean;
}

export interface TimerSettings {
  defaultType: TimerType;
  visualAlerts: boolean;
  flashOnExpiry: boolean;
  showMilliseconds: boolean;
}

export interface AppSettings {
  display: DisplaySettings;
  timer: TimerSettings;
  churchName?: string;
}

// View Types
export type ViewMode = 'display' | 'control';

// App State Types
export interface AppState {
  timers: TimerCollection;
  currentMessage: Message | null;
  messageQueue: Message[];
  settings: AppSettings;
  viewMode: ViewMode;
  isFullscreen: boolean;
  blackoutMode: boolean;
  flashMode: boolean;
}

// Action Types for State Management
export type TimerAction =
  | { type: 'START_TIMER'; payload?: { timerId?: string } }
  | { type: 'PAUSE_TIMER'; payload?: { timerId?: string } }
  | { type: 'RESET_TIMER'; payload?: { timerId?: string } }
  | { type: 'STOP_TIMER'; payload?: { timerId?: string } }
  | {
      type: 'SET_TIMER';
      payload: { duration: number; timerType: TimerType; timerId?: string };
    }
  | { type: 'TICK'; payload?: { timerId?: string } }
  | { type: 'EXPIRE_TIMER'; payload?: { timerId?: string } }
  | {
      type: 'ADD_TIMER';
      payload: { name: string; duration: number; timerType: TimerType };
    }
  | { type: 'DELETE_TIMER'; payload: { timerId: string } }
  | { type: 'SELECT_TIMER'; payload: { timerId: string } }
  | { type: 'REORDER_TIMERS'; payload: { timerIds: string[] } }
  | {
      type: 'UPDATE_TIMER';
      payload: { timerId: string; updates: Partial<Timer> };
    };

export type MessageAction =
  | { type: 'SHOW_MESSAGE'; payload: Message }
  | { type: 'HIDE_MESSAGE'; payload: string }
  | { type: 'CLEAR_ALL_MESSAGES' }
  | { type: 'QUEUE_MESSAGE'; payload: Message };

export type SettingsAction =
  | { type: 'UPDATE_DISPLAY_SETTINGS'; payload: Partial<DisplaySettings> }
  | { type: 'UPDATE_TIMER_SETTINGS'; payload: Partial<TimerSettings> }
  | { type: 'UPDATE_CHURCH_NAME'; payload: string };

export type AppAction =
  | TimerAction
  | MessageAction
  | SettingsAction
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'TOGGLE_FULLSCREEN' }
  | { type: 'TOGGLE_BLACKOUT' }
  | { type: 'TOGGLE_FLASH' };

// Utility Types
export interface TimeDisplay {
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds?: number;
}

// Default Values
export const DEFAULT_TIMER_PRESETS: TimerPreset[] = [
  { id: '1', name: '1 min', duration: 60, type: 'countdown' },
  { id: '5', name: '5 min', duration: 300, type: 'countdown' },
  { id: '10', name: '10 min', duration: 600, type: 'countdown' },
  { id: '15', name: '15 min', duration: 900, type: 'countdown' },
  { id: '30', name: '30 min', duration: 1800, type: 'countdown' },
  { id: '45', name: '45 min', duration: 2700, type: 'countdown' },
  { id: '60', name: '60 min', duration: 3600, type: 'countdown' },
];

export const DEFAULT_MESSAGE_PRESETS: MessagePreset[] = [
  {
    id: 'welcome',
    name: 'Welcome',
    text: 'Welcome to our service',
    autoHide: false,
  },
  {
    id: 'starting-soon',
    name: 'Starting Soon',
    text: 'Service starting soon',
    autoHide: true,
    hideAfter: 30,
  },
  {
    id: 'please-seated',
    name: 'Please Be Seated',
    text: 'Please be seated',
    autoHide: true,
    hideAfter: 15,
  },
  {
    id: 'silence-devices',
    name: 'Silence Devices',
    text: 'Please silence mobile devices',
    autoHide: true,
    hideAfter: 20,
  },
  {
    id: 'thank-you',
    name: 'Thank You',
    text: 'Thank you for joining us',
    autoHide: false,
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  display: {
    theme: 'dark',
    fontSize: 'large',
    showSeconds: true,
    timeFormat: '12h',
    showDate: true,
  },
  timer: {
    defaultType: 'countdown',
    visualAlerts: true,
    flashOnExpiry: true,
    showMilliseconds: false,
  },
};

export const DEFAULT_TIMER_STATE: TimerState = {
  type: 'countdown',
  status: 'idle',
  currentTime: 0,
  initialTime: 0,
  elapsedTime: 0,
};

export const DEFAULT_TIMER_COLLECTION: TimerCollection = {
  timers: [
    {
      id: 'timer-1',
      name: 'Timer 1',
      state: {
        type: 'countdown',
        status: 'idle',
        currentTime: 600, // 10:00
        initialTime: 600,
        elapsedTime: 0,
      },
      order: 1,
    },
  ],
  activeTimerId: 'timer-1',
  lastUpdated: Date.now(),
};
