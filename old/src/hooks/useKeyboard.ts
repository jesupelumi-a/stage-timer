import { useEffect, useCallback } from "react";

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

/**
 * Hook for managing keyboard shortcuts
 */
export function useKeyboard(
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatches =
          event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey;
        const altMatches = !!shortcut.altKey === event.altKey;
        const shiftMatches = !!shortcut.shiftKey === event.shiftKey;
        const metaMatches = !!shortcut.metaKey === event.metaKey;

        if (
          keyMatches &&
          ctrlMatches &&
          altMatches &&
          shiftMatches &&
          metaMatches
        ) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (enabled) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [handleKeyDown, enabled]);
}

/**
 * Hook for timer-specific keyboard shortcuts
 */
export function useTimerKeyboard(
  onStart: () => void,
  onPause: () => void,
  onReset: () => void,
  onStop: () => void,
  enabled: boolean = true
) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: " ", // Spacebar
      action: onStart,
      description: "Start/Resume timer",
    },
    {
      key: "p",
      action: onPause,
      description: "Pause timer",
    },
    {
      key: "r",
      action: onReset,
      description: "Reset timer",
    },
    {
      key: "s",
      action: onStop,
      description: "Stop timer",
    },
    {
      key: "Escape",
      action: onStop,
      description: "Stop timer (Escape)",
    },
  ];

  useKeyboard(shortcuts, enabled);
}

/**
 * Hook for fullscreen keyboard shortcuts
 */
export function useFullscreenKeyboard(
  onToggleFullscreen: () => void,
  enabled: boolean = true
) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: "f11",
      action: onToggleFullscreen,
      description: "Toggle fullscreen",
    },
    {
      key: "f",
      ctrlKey: true,
      action: onToggleFullscreen,
      description: "Toggle fullscreen (Ctrl+F)",
    },
  ];

  useKeyboard(shortcuts, enabled);
}

/**
 * Hook for message keyboard shortcuts
 */
export function useMessageKeyboard(
  onClearMessage: () => void,
  onShowPresetMessage: (index: number) => void,
  enabled: boolean = true
) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: "c",
      action: onClearMessage,
      description: "Clear current message",
    },
    {
      key: "1",
      action: () => onShowPresetMessage(0),
      description: "Show preset message 1",
    },
    {
      key: "2",
      action: () => onShowPresetMessage(1),
      description: "Show preset message 2",
    },
    {
      key: "3",
      action: () => onShowPresetMessage(2),
      description: "Show preset message 3",
    },
    {
      key: "4",
      action: () => onShowPresetMessage(3),
      description: "Show preset message 4",
    },
    {
      key: "5",
      action: () => onShowPresetMessage(4),
      description: "Show preset message 5",
    },
  ];

  useKeyboard(shortcuts, enabled);
}

/**
 * Hook for general app keyboard shortcuts
 */
export function useAppKeyboard(
  onToggleView: () => void,
  onToggleTheme: () => void,
  enabled: boolean = true
) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: "v",
      ctrlKey: true,
      action: onToggleView,
      description: "Toggle view mode (Ctrl+V)",
    },
    {
      key: "t",
      ctrlKey: true,
      action: onToggleTheme,
      description: "Toggle theme (Ctrl+T)",
    },
  ];

  useKeyboard(shortcuts, enabled);
}

/**
 * Get all available keyboard shortcuts for display in help
 */
export function getKeyboardShortcuts(): KeyboardShortcut[] {
  return [
    { key: "Space", action: () => {}, description: "Start/Resume timer" },
    { key: "P", action: () => {}, description: "Pause timer" },
    { key: "R", action: () => {}, description: "Reset timer" },
    { key: "S", action: () => {}, description: "Stop timer" },
    { key: "Escape", action: () => {}, description: "Stop timer" },
    { key: "F11", action: () => {}, description: "Toggle fullscreen" },
    { key: "Ctrl+F", action: () => {}, description: "Toggle fullscreen" },
    { key: "C", action: () => {}, description: "Clear current message" },
    { key: "1-5", action: () => {}, description: "Show preset messages" },
    { key: "Ctrl+V", action: () => {}, description: "Toggle view mode" },
    { key: "Ctrl+T", action: () => {}, description: "Toggle theme" },
  ];
}
