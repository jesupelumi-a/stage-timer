import React from "react";
import type { Message, MessagePreset } from "../types";

interface MessageDisplayProps {
  message: Message | null;
  className?: string;
  style?: React.CSSProperties;
}

export function MessageDisplay({
  message,
  className = "",
  style,
}: MessageDisplayProps) {
  if (!message || !message.isVisible) {
    return null;
  }

  return (
    <div
      className={`message-display animate-in fade-in duration-500 ${className}`}
      style={style}
    >
      <div className="bg-black/20 backdrop-blur-sm rounded-lg px-8 py-4 max-w-4xl mx-auto">
        <p className="text-white text-center leading-tight break-words">
          {message.text}
        </p>
      </div>
    </div>
  );
}

interface MessageQueueDisplayProps {
  queue: Message[];
  className?: string;
}

export function MessageQueueDisplay({
  queue,
  className = "",
}: MessageQueueDisplayProps) {
  if (queue.length === 0) {
    return null;
  }

  return (
    <div className={`message-queue ${className}`}>
      <h3 className="text-sm font-semibold text-gray-600 mb-2">
        Queued Messages ({queue.length})
      </h3>
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {queue.map((message, index) => (
          <div
            key={message.id}
            className="text-xs bg-gray-100 rounded px-2 py-1 truncate"
            title={message.text}
          >
            {index + 1}. {message.text}
          </div>
        ))}
      </div>
    </div>
  );
}

interface MessageControlsProps {
  onShowMessage: (text: string, autoHide?: boolean, hideAfter?: number) => void;
  onClearMessage: () => void;
  onClearAll: () => void;
  hasCurrentMessage: boolean;
  hasQueuedMessages: boolean;
  className?: string;
}

export function MessageControls({
  onShowMessage,
  onClearMessage,
  onClearAll,
  hasCurrentMessage,
  hasQueuedMessages,
  className = "",
}: MessageControlsProps) {
  const [customMessage, setCustomMessage] = React.useState("");
  const [autoHide, setAutoHide] = React.useState(false);
  const [hideAfter, setHideAfter] = React.useState(10);

  const handleShowCustomMessage = () => {
    if (customMessage.trim()) {
      onShowMessage(
        customMessage.trim(),
        autoHide,
        autoHide ? hideAfter : undefined
      );
      setCustomMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleShowCustomMessage();
    }
  };

  return (
    <div className={`message-controls space-y-4 ${className}`}>
      {/* Custom Message Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Custom Message
        </label>
        <div className="space-y-2">
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter your message..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={2}
          />

          {/* Auto-hide options */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoHide}
                onChange={(e) => setAutoHide(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-600">Auto-hide</span>
            </label>

            {autoHide && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">after</span>
                <input
                  type="number"
                  value={hideAfter}
                  onChange={(e) =>
                    setHideAfter(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  min="1"
                  max="300"
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <span className="text-sm text-gray-600">seconds</span>
              </div>
            )}
          </div>

          <button
            onClick={handleShowCustomMessage}
            disabled={!customMessage.trim()}
            className="control-button control-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Show Message
          </button>
        </div>
      </div>

      {/* Message Actions */}
      <div className="flex space-x-2">
        <button
          onClick={onClearMessage}
          disabled={!hasCurrentMessage}
          className="control-button control-button-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear Current
        </button>

        <button
          onClick={onClearAll}
          disabled={!hasCurrentMessage && !hasQueuedMessages}
          className="control-button control-button-danger disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear All
        </button>
      </div>
    </div>
  );
}

interface MessagePresetsProps {
  presets: Array<{
    id: string;
    name: string;
    text: string;
    autoHide?: boolean;
    hideAfter?: number;
  }>;
  onSelectPreset: (preset: MessagePreset) => void;
  className?: string;
}

export function MessagePresets({
  presets,
  onSelectPreset,
  className = "",
}: MessagePresetsProps) {
  if (presets.length === 0) {
    return (
      <div className={`message-presets ${className}`}>
        <p className="text-sm text-gray-500 italic">
          No message presets available
        </p>
      </div>
    );
  }

  return (
    <div className={`message-presets ${className}`}>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Message Presets
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelectPreset(preset)}
            className="preset-button text-left p-3 hover:bg-gray-100 transition-colors"
            title={preset.text}
          >
            <div className="font-medium text-sm">{preset.name}</div>
            <div className="text-xs text-gray-500 truncate mt-1">
              {preset.text}
            </div>
            {preset.autoHide && (
              <div className="text-xs text-blue-600 mt-1">
                Auto-hide: {preset.hideAfter}s
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
