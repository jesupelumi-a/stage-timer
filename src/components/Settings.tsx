import type { AppSettings, DisplaySettings, TimerSettings } from "../types";

interface SettingsProps {
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  className?: string;
}

export function Settings({
  settings,
  onUpdateSettings,
  className = "",
}: SettingsProps) {
  const updateDisplaySettings = (updates: Partial<DisplaySettings>) => {
    onUpdateSettings({
      display: { ...settings.display, ...updates },
    });
  };

  const updateTimerSettings = (updates: Partial<TimerSettings>) => {
    onUpdateSettings({
      timer: { ...settings.timer, ...updates },
    });
  };

  const updateChurchName = (churchName: string) => {
    onUpdateSettings({ churchName });
  };

  return (
    <div className={`settings space-y-8 ${className}`}>
      {/* Church Information */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Church Information
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Church Name (Optional)
          </label>
          <input
            type="text"
            value={settings.churchName || ""}
            onChange={(e) => updateChurchName(e.target.value)}
            placeholder="Enter your church name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            This will be displayed on the timer screen
          </p>
        </div>
      </div>

      {/* Display Settings */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Display Settings
        </h3>
        <div className="space-y-4">
          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <select
              value={settings.display.theme}
              onChange={(e) =>
                updateDisplaySettings({
                  theme: e.target.value as "light" | "dark",
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timer Font Size
            </label>
            <select
              value={settings.display.fontSize}
              onChange={(e) =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                updateDisplaySettings({ fontSize: e.target.value as any })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="xlarge">Extra Large</option>
            </select>
          </div>

          {/* Time Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Format
            </label>
            <select
              value={settings.display.timeFormat}
              onChange={(e) =>
                updateDisplaySettings({
                  timeFormat: e.target.value as "12h" | "24h",
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="12h">12 Hour (AM/PM)</option>
              <option value="24h">24 Hour</option>
            </select>
          </div>

          {/* Show Seconds */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showSeconds"
              checked={settings.display.showSeconds}
              onChange={(e) =>
                updateDisplaySettings({ showSeconds: e.target.checked })
              }
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="showSeconds"
              className="text-sm font-medium text-gray-700"
            >
              Show seconds in timer
            </label>
          </div>

          {/* Show Date */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showDate"
              checked={settings.display.showDate}
              onChange={(e) =>
                updateDisplaySettings({ showDate: e.target.checked })
              }
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="showDate"
              className="text-sm font-medium text-gray-700"
            >
              Show current date
            </label>
          </div>
        </div>
      </div>

      {/* Timer Settings */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Timer Settings
        </h3>
        <div className="space-y-4">
          {/* Default Timer Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Timer Type
            </label>
            <select
              value={settings.timer.defaultType}
              onChange={(e) =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                updateTimerSettings({ defaultType: e.target.value as any })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="countdown">Countdown</option>
              <option value="countup">Count Up</option>
              <option value="stopwatch">Stopwatch</option>
            </select>
          </div>

          {/* Visual Alerts */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="visualAlerts"
              checked={settings.timer.visualAlerts}
              onChange={(e) =>
                updateTimerSettings({ visualAlerts: e.target.checked })
              }
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="visualAlerts"
              className="text-sm font-medium text-gray-700"
            >
              Enable visual alerts
            </label>
          </div>

          {/* Flash on Expiry */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="flashOnExpiry"
              checked={settings.timer.flashOnExpiry}
              onChange={(e) =>
                updateTimerSettings({ flashOnExpiry: e.target.checked })
              }
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="flashOnExpiry"
              className="text-sm font-medium text-gray-700"
            >
              Flash timer when expired
            </label>
          </div>

          {/* Show Milliseconds */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showMilliseconds"
              checked={settings.timer.showMilliseconds}
              onChange={(e) =>
                updateTimerSettings({ showMilliseconds: e.target.checked })
              }
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="showMilliseconds"
              className="text-sm font-medium text-gray-700"
            >
              Show milliseconds (for precise timing)
            </label>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Keyboard Shortcuts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Start/Resume Timer:</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Space</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pause Timer:</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">P</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Reset Timer:</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">R</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Stop Timer:</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">S</kbd>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Toggle Fullscreen:</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">F11</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Clear Message:</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">C</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Preset Messages:</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">1-5</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Toggle View:</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                Ctrl+V
              </kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
