/**
 * Native (iOS / Android) integration via Capacitor.
 * Every call is a no-op in the browser, so pages can use these freely.
 */

import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { Keyboard } from "@capacitor/keyboard";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform() as "ios" | "android" | "web";

const safe = (fn: () => Promise<unknown>) => {
  if (isNative) fn().catch(() => undefined);
};

export const haptic = {
  tap: () => safe(() => Haptics.impact({ style: ImpactStyle.Light })),
  press: () => safe(() => Haptics.impact({ style: ImpactStyle.Medium })),
  success: () => safe(() => Haptics.notification({ type: NotificationType.Success })),
  warning: () => safe(() => Haptics.notification({ type: NotificationType.Warning })),
  error: () => safe(() => Haptics.notification({ type: NotificationType.Error })),
};

/** Status bar icons: dark icons on light screens, light icons on dark screens. */
export function setStatusBarTheme(dark: boolean) {
  safe(() => StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }));
  if (platform === "android") safe(() => StatusBar.setOverlaysWebView({ overlay: true }));
}

export function hideSplash() {
  safe(() => SplashScreen.hide({ fadeOutDuration: 250 }));
}

/**
 * Android hardware back button: close an open sheet first, then go back,
 * and leave the app from the home screen.
 */
export function registerBackButton(goBack: () => void, isHome: () => boolean) {
  if (platform !== "android") return () => undefined;
  const handle = App.addListener("backButton", () => {
    const openLayer = document.querySelector('[role="dialog"][data-state="open"], [vaul-drawer][data-state="open"]');
    if (openLayer) {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      return;
    }
    if (isHome()) App.minimizeApp();
    else goBack();
  });
  return () => {
    handle.then((h) => h.remove());
  };
}

/** Marks <html> so CSS can tweak the native look (no text selection, etc.). */
export function initNativeShell() {
  if (!isNative) return;
  document.documentElement.classList.add("native", `native-${platform}`);
  safe(() => Keyboard.setAccessoryBarVisible({ isVisible: true }));
}
