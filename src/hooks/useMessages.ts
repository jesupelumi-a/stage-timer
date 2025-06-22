import { useState, useCallback, useEffect, useRef } from 'react';
import type { Message, MessagePreset } from '../types';

interface UseMessagesReturn {
  currentMessage: Message | null;
  messageQueue: Message[];
  showMessage: (text: string, options?: Partial<Message>) => void;
  showPresetMessage: (preset: MessagePreset) => void;
  hideMessage: (messageId?: string) => void;
  clearAllMessages: () => void;
  queueMessage: (text: string, options?: Partial<Message>) => void;
  processQueue: () => void;
}

export function useMessages(): UseMessagesReturn {
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null);
  const [messageQueue, setMessageQueue] = useState<Message[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Auto-hide message after specified duration
  const scheduleAutoHide = useCallback((message: Message) => {
    if (message.autoHide && message.hideAfter) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        hideMessage(message.id);
      }, message.hideAfter * 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show a message immediately
  const showMessage = useCallback(
    (text: string, options: Partial<Message> = {}) => {
      const message: Message = {
        id:
          options.id ||
          `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text,
        isVisible: true,
        autoHide: options.autoHide ?? false,
        hideAfter: options.hideAfter,
        createdAt: Date.now(),
        ...options,
      };

      setCurrentMessage(message);

      if (message.autoHide) {
        scheduleAutoHide(message);
      }
    },
    [scheduleAutoHide]
  );

  // Show a preset message
  const showPresetMessage = useCallback(
    (preset: MessagePreset) => {
      showMessage(preset.text, {
        id: `preset-${preset.id}-${Date.now()}`,
        autoHide: preset.autoHide,
        hideAfter: preset.hideAfter,
      });
    },
    [showMessage]
  );

  // Hide a specific message or the current message
  const hideMessage = useCallback((messageId?: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (messageId) {
      // Hide specific message
      setCurrentMessage((prev) =>
        prev && prev.id === messageId ? null : prev
      );

      // Remove from queue if it exists there
      setMessageQueue((prev) => prev.filter((msg) => msg.id !== messageId));
    } else {
      // Hide current message
      setCurrentMessage(null);
    }

    // Process next message in queue
    processQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear all messages
  const clearAllMessages = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setCurrentMessage(null);
    setMessageQueue([]);
  }, []);

  // Add message to queue
  const queueMessage = useCallback(
    (text: string, options: Partial<Message> = {}) => {
      const message: Message = {
        id:
          options.id ||
          `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text,
        isVisible: false,
        autoHide: options.autoHide ?? false,
        hideAfter: options.hideAfter,
        createdAt: Date.now(),
        ...options,
      };

      setMessageQueue((prev) => [...prev, message]);
    },
    []
  );

  // Process the next message in queue
  const processQueue = useCallback(() => {
    setMessageQueue((prev) => {
      if (prev.length === 0) {
        return prev;
      }

      const [nextMessage, ...remainingQueue] = prev;

      // Show the next message if no current message is displayed
      if (!currentMessage) {
        setCurrentMessage({
          ...nextMessage,
          isVisible: true,
        });

        if (nextMessage.autoHide) {
          scheduleAutoHide(nextMessage);
        }
      }

      return remainingQueue;
    });
  }, [currentMessage, scheduleAutoHide]);

  // Auto-process queue when current message is cleared
  useEffect(() => {
    if (!currentMessage && messageQueue.length > 0) {
      processQueue();
    }
  }, [currentMessage, messageQueue.length, processQueue]);

  return {
    currentMessage,
    messageQueue,
    showMessage,
    showPresetMessage,
    hideMessage,
    clearAllMessages,
    queueMessage,
    processQueue,
  };
}
