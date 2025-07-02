import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@heroui/react';
import { cn } from '../lib/utils';

interface StageTimerLayoutProps {
  children?: React.ReactNode;
  leftPanel?: React.ReactNode;
  rightPanel?: React.ReactNode;
  headerActions?: React.ReactNode;
  onSwitchToDisplay?: () => void;
  onToggleFullscreen?: () => void;
  onSwitchToMultiDevice?: () => void;
  className?: string;
}

export function StageTimerLayout({
  children,
  leftPanel,
  rightPanel,
  headerActions,
  onSwitchToDisplay,
  onToggleFullscreen,
  onSwitchToMultiDevice,
  className = '',
}: StageTimerLayoutProps) {
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
              Stage Timer
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onSwitchToDisplay && (
            <Button
              size="sm"
              variant="bordered"
              onPress={onSwitchToDisplay}
              className="border-neutral-600 bg-neutral-800 text-white hover:border-neutral-400"
            >
              Display
            </Button>
          )}
          {onToggleFullscreen && (
            <Button
              size="sm"
              variant="bordered"
              onPress={onToggleFullscreen}
              className="border-neutral-600 bg-neutral-800 text-white hover:border-neutral-400"
            >
              Fullscreen
            </Button>
          )}
          {onSwitchToMultiDevice && (
            <Button
              size="sm"
              variant="bordered"
              onPress={onSwitchToMultiDevice}
              className="border-purple-600 bg-purple-800 text-white hover:border-purple-400"
            >
              Multi-Device
            </Button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="controller-page h-[calc(100vh-64px)] overflow-x-hidden">
        <div className="controller-body relative flex h-full">
          {/* Left Panel - Timer Preview (Resizable) */}
          {leftPanel && (
            <>
              <section
                className="preview-section flex flex-none flex-col bg-neutral-900 p-4"
                style={{ width: leftPanelWidth }}
              >
                {leftPanel}
              </section>

              {/* Drag Handle */}
              <div
                className="w-1 flex-none cursor-col-resize bg-neutral-700 transition-colors hover:bg-neutral-600"
                onMouseDown={handleMouseDown}
                title="Drag to resize preview panel"
              />
            </>
          )}

          {/* Center Panel - Timer Controls */}
          <section className="timer-controls-section flex-1 p-4">
            <div className="controller-timers flex-none lg:h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Timers</h2>
                <div className="flex items-center gap-2">
                  {headerActions}
                  <Button
                    size="sm"
                    variant="bordered"
                    className="border-neutral-600 bg-neutral-800 text-white hover:border-neutral-400"
                  >
                    Blackout
                  </Button>
                  <Button
                    size="sm"
                    variant="bordered"
                    className="border-neutral-600 bg-neutral-800 text-white hover:border-neutral-400"
                  >
                    Flash
                  </Button>
                </div>
              </div>
              
              {/* Timer Cards Container */}
              <div className="space-y-3">
                {children}
              </div>
            </div>
          </section>

          {/* Right Panel - Messages */}
          {rightPanel && (
            <section className="message-controls-section w-80 flex-none p-4">
              {rightPanel}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
