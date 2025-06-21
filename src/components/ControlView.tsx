import type {
  Timer,
  Message,
  AppSettings,
  TimerPreset,
  MessagePreset,
  TimerType,
} from '../types';
import { TimerControlsSection } from './TimerControlsSection';
import { TimerPreview } from './TimerPreview';
import { PreviewControls } from './PreviewControls';
import { cn } from '../lib/utils';
import { useState, useCallback, useRef, useEffect } from 'react';

interface ControlViewProps {
  timers: Timer[];
  activeTimer: Timer | null;
  activeTimerId: string | null;
  currentMessage: Message | null;
  messageQueue: Message[];
  settings: AppSettings;
  timerPresets: TimerPreset[];
  messagePresets: MessagePreset[];
  blackoutMode: boolean;
  flashMode: boolean;
  onAddTimer: (
    name: string,
    duration: number,
    type: TimerType,
    startTime?: string
  ) => void;
  onDeleteTimer: (timerId: string) => void;
  onSelectTimer: (timerId: string) => void;
  onStartTimer: (timerId: string) => void;
  onPauseTimer: (timerId: string) => void;
  onResetTimer: (timerId: string) => void;
  onUpdateTimerTime: (timerId: string, newTime: number) => void;
  onUpdateTimerDuration: (timerId: string, newDuration: number) => void;
  onUpdateTimerType: (timerId: string, newType: TimerType) => void;
  onUpdateTimer: (timerId: string, updates: Partial<Timer>) => void;
  onReorderTimers: (timerIds: string[]) => void;
  onAdjustTime: (timerId: string, seconds: number) => void;
  onShowMessage: (text: string, autoHide?: boolean, hideAfter?: number) => void;
  onShowPresetMessage: (preset: MessagePreset) => void;
  onClearMessage: () => void;
  onClearAllMessages: () => void;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onToggleFullscreen: () => void;
  onToggleBlackout: () => void;
  onToggleFlash: () => void;
  onSwitchToDisplay: () => void;
  onSwitchToMultiDevice?: () => void;
  isTimerRunning: (timerId: string) => boolean;
  isTimerPaused: (timerId: string) => boolean;
  isTimerExpired: (timerId: string) => boolean;
  isTimerLoading?: (timerId: string) => boolean;
  className?: string;
}

export function ControlView({
  timers,
  activeTimer,
  activeTimerId,
  currentMessage,
  messageQueue: _messageQueue,
  settings,
  timerPresets: _timerPresets,
  messagePresets,
  blackoutMode,
  flashMode,
  onAddTimer,
  onDeleteTimer,
  onSelectTimer,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onUpdateTimerTime,
  onUpdateTimerDuration,
  onUpdateTimerType,
  onUpdateTimer,
  onReorderTimers,
  onAdjustTime,
  onShowMessage: _onShowMessage,
  onShowPresetMessage,
  onClearMessage,
  onClearAllMessages: _onClearAllMessages,
  onUpdateSettings: _onUpdateSettings,
  onToggleFullscreen,
  onToggleBlackout,
  onToggleFlash,
  onSwitchToDisplay,
  onSwitchToMultiDevice,
  isTimerRunning,
  isTimerPaused,
  isTimerExpired,
  isTimerLoading,
  className = '',
}: ControlViewProps) {
  // State for resizable left panel
  const [leftPanelWidth, setLeftPanelWidth] = useState(480);
  const isDragging = useRef(false);

  // Drag handlers for resizing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;

    const newWidth = Math.min(
      Math.max(320, e.clientX),
      window.innerWidth * 0.6
    );
    setLeftPanelWidth(newWidth);
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  // Calculate responsive dimensions for 22" TV aspect ratio (16:9)
  const getTimerDimensions = () => {
    const panelPadding = 32; // 16px padding on each side
    const availableWidth = leftPanelWidth - panelPadding;
    const maxWidth = availableWidth;

    // Maintain 16:9 aspect ratio for 22" TV simulation
    const aspectRatio = 16 / 9;
    const calculatedHeight = maxWidth / aspectRatio;

    return {
      width: maxWidth,
      height: calculatedHeight,
    };
  };

  const timerDimensions = getTimerDimensions();

  // Cleanup effect for event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      className={cn(
        'stage-timer-layout h-screen w-screen overflow-hidden bg-neutral-900 text-white',
        className
      )}
    >
      {/* Header Bar */}
      <header className="flex items-center justify-between border-b border-neutral-700 bg-neutral-800 px-4 py-3">
        <div className="flex items-center gap-4">
          <button className="group flex items-center gap-2 underline decoration-transparent decoration-dashed transition-colors hover:decoration-current">
            <span className="text-lg font-medium">
              The Word City Stage Timer
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSwitchToDisplay}
            className={cn('btn-ctrl h-7 px-3 text-sm')}
          >
            Display
          </button>
          <button
            onClick={onToggleFullscreen}
            className="btn-ctrl h-7 px-3 text-sm"
          >
            Fullscreen
          </button>
          {onSwitchToMultiDevice && (
            <button
              onClick={onSwitchToMultiDevice}
              className="btn-ctrl h-7 border-purple-600 bg-purple-800 px-3 text-sm text-white hover:border-purple-400"
            >
              Multi-Device
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="controller-page h-[calc(100vh-64px)] overflow-x-hidden">
        <div className="controller-body relative flex h-full">
          {/* Left Panel - Timer Preview (Resizable) */}
          <section
            className="preview-section flex flex-none flex-col bg-neutral-900 p-4"
            style={{ width: leftPanelWidth }}
          >
            {/* Timer Preview Container */}
            <div className="st-container mb-4 flex-none">
              <div className="st-container-inner rounded-md border border-neutral-900 bg-neutral-800">
                <div
                  className="relative flex flex-col"
                  style={{
                    width: timerDimensions.width,
                    height: timerDimensions.height,
                  }}
                >
                  {/* Timer Preview Content */}
                  <div className="flex flex-1 items-center justify-center">
                    {activeTimer ? (
                      <TimerPreview
                        timer={activeTimer.state}
                        timerName={activeTimer.name}
                        currentMessage={currentMessage}
                        settings={settings.display}
                        isExpired={isTimerExpired(activeTimer.id)}
                        isActive={true}
                      />
                    ) : (
                      <div className="text-center">
                        <div className="mb-2 font-mono text-4xl font-bold text-white">
                          00:00:00
                        </div>
                        <div className="text-sm uppercase tracking-wide text-neutral-400">
                          No Timer Selected
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Controls */}
            <div className="flex-none">
              <PreviewControls
                timers={timers}
                activeTimerId={activeTimerId}
                onSelectTimer={onSelectTimer}
                onStartTimer={onStartTimer}
                onPauseTimer={onPauseTimer}
                onResetTimer={onResetTimer}
                onAdjustTime={onAdjustTime}
                onUpdateTimerDuration={onUpdateTimerDuration}
                isTimerRunning={isTimerRunning}
                isTimerPaused={isTimerPaused}
              />
            </div>

            {/* Clock and Status */}
            <div className="mt-4 flex-none space-y-3">
              <div className="rounded bg-neutral-800 p-3">
                <button className="flex w-full items-baseline rounded px-3 py-2 transition-colors hover:bg-neutral-700">
                  <span className="text-sm text-neutral-300">
                    Connected Devices
                  </span>
                  <span className="ml-auto text-xs text-neutral-500">2/3</span>
                </button>
              </div>
            </div>
          </section>

          {/* Drag Handle */}
          <div
            className="w-1 flex-none cursor-col-resize bg-neutral-700 transition-colors hover:bg-neutral-600"
            onMouseDown={handleMouseDown}
            title="Drag to resize preview panel"
          />

          {/* Center Panel - Timer Controls */}
          <TimerControlsSection
            timers={timers}
            activeTimerId={activeTimerId}
            onAddTimer={onAddTimer}
            onDeleteTimer={onDeleteTimer}
            onSelectTimer={onSelectTimer}
            onStartTimer={onStartTimer}
            onPauseTimer={onPauseTimer}
            onResetTimer={onResetTimer}
            onUpdateTimerTime={onUpdateTimerTime}
            onUpdateTimerDuration={onUpdateTimerDuration}
            onUpdateTimerType={onUpdateTimerType}
            onUpdateTimer={onUpdateTimer}
            onReorderTimers={onReorderTimers}
            onToggleBlackout={onToggleBlackout}
            onToggleFlash={onToggleFlash}
            isTimerRunning={isTimerRunning}
            isTimerPaused={isTimerPaused}
            isTimerExpired={isTimerExpired}
            isTimerLoading={isTimerLoading}
            blackoutMode={blackoutMode}
            flashMode={flashMode}
          />

          {/* Right Panel - Messages */}
          <section className="message-controls-section w-80 flex-none p-4">
            <div className="controller-messages flex-auto lg:h-full">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-white">Messages</h2>
                <div className="flex items-center gap-2">
                  <button className="btn-ctrl flex h-7 items-center truncate px-3 text-sm">
                    Focus
                  </button>
                  <button className="btn-ctrl relative h-7 px-2 text-sm ring-0 transition">
                    Flash
                  </button>
                </div>
              </div>

              {/* Message Input */}
              <div className="mb-4">
                <textarea
                  className="input-ctrl block w-full resize-none rounded border border-neutral-600 bg-neutral-800 px-3 py-2 text-white"
                  placeholder="Enter message ..."
                  rows={3}
                  defaultValue={currentMessage?.text || ''}
                />
              </div>

              {/* Message Preset Buttons */}
              <div className="mb-4 grid grid-cols-5 gap-2">
                {messagePresets.slice(0, 5).map((preset, index) => (
                  <button
                    key={preset.id}
                    onClick={() => onShowPresetMessage(preset)}
                    className="btn-msg h-12 w-12 rounded border border-neutral-600 bg-neutral-800 text-xs"
                    title={preset.name}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              {/* Message Controls */}
              <div className="mb-4 flex gap-2">
                <button
                  onClick={onClearMessage}
                  className="btn-ctrl flex h-8 flex-1 items-center truncate px-3"
                >
                  Clear
                </button>
                <button className="btn-ctrl h-8 space-x-2 px-6">
                  Add Message
                </button>
              </div>

              {/* Current Message Display */}
              {currentMessage && (
                <div className="mb-4 rounded bg-neutral-800 p-3">
                  <div className="mb-1 text-xs text-neutral-400">
                    Current Message:
                  </div>
                  <div className="text-sm text-white">
                    {currentMessage.text}
                  </div>
                </div>
              )}

              {/* Additional Features */}
              <div className="space-y-2">
                <button className="w-full text-left text-sm text-neutral-400 transition-colors hover:text-white">
                  Submit questions link
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
