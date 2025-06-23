import type { AppSettings, TimerPreset, MessagePreset } from "../types";
import { DEFAULT_SETTINGS } from "../types";

const STORAGE_KEYS = {
  SETTINGS: "church-timer-settings",
  TIMER_PRESETS: "church-timer-presets",
  MESSAGE_PRESETS: "church-timer-message-presets",
  LAST_TIMER_STATE: "church-timer-last-state",
} as const;

/**
 * Generic function to save data to localStorage
 */
function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage:`, error);
  }
}

/**
 * Generic function to load data from localStorage
 */
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Save app settings to localStorage
 */
export function saveSettings(settings: AppSettings): void {
  saveToStorage(STORAGE_KEYS.SETTINGS, settings);
}

/**
 * Load app settings from localStorage
 */
export function loadSettings(): AppSettings {
  return loadFromStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
}

/**
 * Save timer presets to localStorage
 */
export function saveTimerPresets(presets: TimerPreset[]): void {
  saveToStorage(STORAGE_KEYS.TIMER_PRESETS, presets);
}

/**
 * Load timer presets from localStorage
 */
export function loadTimerPresets(): TimerPreset[] {
  return loadFromStorage(STORAGE_KEYS.TIMER_PRESETS, []);
}

/**
 * Save message presets to localStorage
 */
export function saveMessagePresets(presets: MessagePreset[]): void {
  saveToStorage(STORAGE_KEYS.MESSAGE_PRESETS, presets);
}

/**
 * Load message presets from localStorage
 */
export function loadMessagePresets(): MessagePreset[] {
  return loadFromStorage(STORAGE_KEYS.MESSAGE_PRESETS, []);
}

/**
 * Save the last timer state for persistence
 */
export function saveLastTimerState(state: {
  duration: number;
  type: string;
}): void {
  saveToStorage(STORAGE_KEYS.LAST_TIMER_STATE, state);
}

/**
 * Load the last timer state
 */
export function loadLastTimerState(): {
  duration: number;
  type: string;
} | null {
  return loadFromStorage(STORAGE_KEYS.LAST_TIMER_STATE, null);
}

/**
 * Clear all stored data (useful for reset functionality)
 */
export function clearAllStorage(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error("Failed to clear localStorage:", error);
  }
}

/**
 * Check if localStorage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const test = "__storage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Export all settings and presets as JSON for backup
 */
export function exportData(): string {
  const data = {
    settings: loadSettings(),
    timerPresets: loadTimerPresets(),
    messagePresets: loadMessagePresets(),
    exportDate: new Date().toISOString(),
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Import settings and presets from JSON backup
 */
export function importData(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData);

    if (data.settings) {
      saveSettings(data.settings);
    }

    if (data.timerPresets) {
      saveTimerPresets(data.timerPresets);
    }

    if (data.messagePresets) {
      saveMessagePresets(data.messagePresets);
    }

    return true;
  } catch (error) {
    console.error("Failed to import data:", error);
    return false;
  }
}
