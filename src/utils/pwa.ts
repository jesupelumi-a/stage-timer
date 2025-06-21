/**
 * PWA utilities for service worker registration and app installation
 */

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

/**
 * Register the service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");

      console.log("Service Worker registered successfully:", registration);

      // Listen for updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New content is available, prompt user to refresh
              if (confirm("New version available! Refresh to update?")) {
                window.location.reload();
              }
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      return null;
    }
  } else {
    console.log("Service Worker not supported");
    return null;
  }
}

/**
 * Check if the app can be installed
 */
export function canInstallApp(): boolean {
  return deferredPrompt !== null;
}

/**
 * Show the app installation prompt
 */
export async function showInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    return false;
  }

  try {
    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;

    console.log("Install prompt result:", choiceResult.outcome);

    deferredPrompt = null;
    return choiceResult.outcome === "accepted";
  } catch (error) {
    console.error("Error showing install prompt:", error);
    return false;
  }
}

/**
 * Check if the app is running in standalone mode (installed as PWA)
 */
export function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.navigator as any).standalone === true ||
    document.referrer.includes("android-app://")
  );
}

/**
 * Check if the app is running on mobile
 */
export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Initialize PWA features
 */
export function initializePWA(): void {
  // Listen for the beforeinstallprompt event
  window.addEventListener("beforeinstallprompt", (e) => {
    console.log("Before install prompt event fired");
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;

    // Dispatch custom event to notify the app
    window.dispatchEvent(new CustomEvent("pwa-installable"));
  });

  // Listen for app installed event
  window.addEventListener("appinstalled", () => {
    console.log("PWA was installed");
    deferredPrompt = null;

    // Dispatch custom event to notify the app
    window.dispatchEvent(new CustomEvent("pwa-installed"));
  });

  // Register service worker
  registerServiceWorker();
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if ("Notification" in window) {
    const permission = await Notification.requestPermission();
    console.log("Notification permission:", permission);
    return permission;
  }
  return "denied";
}

/**
 * Show a local notification
 */
export function showNotification(
  title: string,
  options: NotificationOptions = {}
): Notification | null {
  if ("Notification" in window && Notification.permission === "granted") {
    return new Notification(title, {
      icon: "/icon.svg",
      badge: "/icon.svg",
      ...options,
    });
  }
  return null;
}

/**
 * Check if notifications are supported and permitted
 */
export function canShowNotifications(): boolean {
  return "Notification" in window && Notification.permission === "granted";
}

/**
 * Get app installation status
 */
export function getInstallationStatus(): {
  canInstall: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  isMobile: boolean;
} {
  return {
    canInstall: canInstallApp(),
    isInstalled: isStandalone(),
    isStandalone: isStandalone(),
    isMobile: isMobile(),
  };
}
