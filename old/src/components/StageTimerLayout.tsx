import React from "react";
import type { TimerState, Message, AppSettings } from "../types";

interface StageTimerLayoutProps {
  timer: TimerState;
  currentMessage: Message | null;
  settings: AppSettings;
  isExpired: boolean;
  children?: React.ReactNode;
}

export function StageTimerLayout({
  timer: _timer,
  currentMessage: _currentMessage,
  settings: _settings,
  isExpired: _isExpired,
  children,
}: StageTimerLayoutProps) {
  return (
    <div className="stage-timer-layout h-screen w-screen bg-neutral-900 text-white overflow-hidden">
      {/* Header Bar */}
      <header className="bg-neutral-800 border-b border-neutral-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 group underline decoration-dashed decoration-transparent hover:decoration-current transition-colors">
            <span className="text-lg font-medium">Unnamed</span>
          </button>
          <button className="btn btn-ctrl bg-neutral-800 hover:border-neutral-400 h-8 py-0 px-3 text-sm">
            Room
          </button>
          <button className="btn-ctrl bg-neutral-800 hover:border-neutral-400 h-8 py-0 px-3 text-sm">
            Save
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="btn-ctrl text-sm h-7 px-3">
            Customize
          </button>
          <button className="btn-ctrl !bg-teal-800 border-teal-600 hover:!border-teal-300 !text-white text-sm h-7 px-3">
            Share
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="controller-page overflow-x-hidden h-[calc(100vh-64px)]">
        <div className="controller-body relative lg:flex h-full">
          
          {/* Left Panel - Timer Preview */}
          <section className="preview-section w-80 flex-none p-4">
            <div className="st-container st-container--ratio">
              <div className="st-container-inner rounded-3xl bg-neutral-800 border border-neutral-700">
                <div className="relative flex flex-col h-full aspect-video">
                  {/* Timer Preview Content */}
                  <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                      <div className="text-4xl font-mono font-bold text-white mb-2">
                        00:00:00
                      </div>
                      <div className="text-sm text-neutral-400 uppercase tracking-wide">
                        Countdown
                      </div>
                    </div>
                  </div>
                  
                  {/* Preview Controls */}
                  <div className="flex items-center justify-between p-3 border-t border-neutral-700">
                    <div className="flex items-center gap-2">
                      <button className="btn-ctrl !rounded-r-none p-0 h-9 w-7 text-neutral-400">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button className="flex-auto btn-ctrl p-0 h-9 z-10 text-sm">
                        -1m
                      </button>
                      <button className="flex-auto btn-ctrl p-0 h-9 w-9 max-w-[80px] text-green-600">
                        <svg className="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button className="btn-ctrl p-0 h-9 text-xs text-red-600 hover:!bg-red-600 hover:!border-red-400 hover:text-white flex-auto !w-14">
                        <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button className="flex-auto btn-ctrl p-0 h-9 w-9 max-w-[80px] text-neutral-400">
                        <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button className="flex-auto btn-ctrl p-0 h-9 z-10 text-sm">
                        +1m
                      </button>
                      <button className="btn-ctrl !rounded-l-none p-0 h-9 w-7 text-neutral-400">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Clock and Status */}
            <div className="mt-4 space-y-3">
              <button className="btn text-neutral-500 hover:text-white hover:bg-neutral-700 text-xs font-light px-2 py-px max-w-full overflow-hidden text-ellipsis w-full">
                Africa / Lagos (WAT)
              </button>
              
              <div className="bg-neutral-800 rounded p-3">
                <button className="flex items-baseline w-full px-3 py-2 hover:bg-neutral-700 rounded transition-colors">
                  <span className="text-sm text-neutral-300">Connected Devices</span>
                  <span className="ml-auto text-xs text-neutral-500">2/3</span>
                </button>
              </div>
            </div>
          </section>

          {/* Center Panel - Timer Controls */}
          <section className="timer-controls-section flex-1 p-4">
            <div className="controller-timers flex-none lg:h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Timers</h2>
                <div className="flex items-center gap-2">
                  <button className="rounded px-3 py-1 text-sm bg-neutral-800 hover:bg-neutral-700">
                    Actions
                  </button>
                  <button className="btn-ctrl flex items-center truncate px-3 text-sm h-7">
                    Blackout
                  </button>
                  <button className="relative transition ring-0 btn-ctrl text-sm h-7 px-2">
                    Flash
                  </button>
                </div>
              </div>
              
              {/* Timer Cards Container */}
              <div className="space-y-3">
                {children}
              </div>
            </div>
          </section>

          {/* Right Panel - Messages */}
          <section className="message-controls-section w-80 flex-none p-4">
            <div className="controller-messages flex-auto lg:h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Messages</h2>
                <div className="flex items-center gap-2">
                  <button className="btn-ctrl flex items-center truncate px-3 text-sm h-7">
                    Focus
                  </button>
                  <button className="relative transition ring-0 btn-ctrl text-sm h-7 px-2">
                    Flash
                  </button>
                </div>
              </div>
              
              {/* Message Input */}
              <div className="mb-4">
                <textarea
                  className="input-ctrl py-2 px-3 w-full block text-white bg-neutral-800 border border-neutral-600 rounded resize-none"
                  placeholder="Enter message ..."
                  rows={3}
                  defaultValue="Please wrap up your message"
                />
              </div>
              
              {/* Message Preset Buttons */}
              <div className="grid grid-cols-5 gap-2 mb-4">
                <button className="btn-msg active w-12 h-12 rounded bg-neutral-700 border border-neutral-600"></button>
                <button className="btn-msg text-green-500 w-12 h-12 rounded bg-neutral-800 border border-neutral-600"></button>
                <button className="btn-msg text-red-500 w-12 h-12 rounded bg-neutral-800 border border-neutral-600"></button>
                <button className="btn-msg w-12 h-12 rounded bg-neutral-800 border border-neutral-600"></button>
                <button className="btn-msg w-12 h-12 rounded bg-neutral-800 border border-neutral-600"></button>
              </div>
              
              {/* Message Controls */}
              <div className="flex gap-2 mb-4">
                <button className="btn-ctrl flex items-center truncate px-3 h-8 flex-1">
                  Show
                </button>
                <button className="btn-ctrl h-8 px-6 space-x-2">
                  Add Message
                </button>
              </div>
              
              {/* Additional Features */}
              <div className="space-y-2">
                <button className="hover:text-white transition-colors text-sm text-neutral-400 w-full text-left">
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
