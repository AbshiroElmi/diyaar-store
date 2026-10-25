/** Preferences that belong to this device, not the store (kept in local storage). */

import { useState, useSyncExternalStore } from "react";

const SOUND_KEY = "portal_order_sound";

export function orderSoundEnabled() {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

export function useOrderSound() {
  const [on, setOn] = useState(orderSoundEnabled);
  const set = (next: boolean) => {
    setOn(next);
    try {
      localStorage.setItem(SOUND_KEY, next ? "on" : "off");
    } catch {
      /* storage unavailable */
    }
  };
  return [on, set] as const;
}

// ── Categories shown on Home ────────────────────────────────

const HOME_CATEGORIES_KEY = "portal_home_categories";
const HOME_CATEGORIES_EVENT = "portal:home-categories";
/** Until the owner picks, Home shows the first few categories. */
export const HOME_CATEGORIES_DEFAULT = 8;

function readHomeCategories(): string | null {
  try {
    return localStorage.getItem(HOME_CATEGORIES_KEY);
  } catch {
    return null;
  }
}

const subscribeHomeCategories = (cb: () => void) => {
  window.addEventListener(HOME_CATEGORIES_EVENT, cb);
  return () => window.removeEventListener(HOME_CATEGORIES_EVENT, cb);
};

/** Which category IDs the owner chose for Home; null means they haven't chosen yet. */
export function useHomeCategories(allIds: string[]) {
  const raw = useSyncExternalStore(subscribeHomeCategories, readHomeCategories);
  const chosen: string[] | null = raw ? JSON.parse(raw) : null;
  const shown = new Set(chosen ?? allIds.slice(0, HOME_CATEGORIES_DEFAULT));
  const toggle = (id: string) => {
    const next = shown.has(id) ? [...shown].filter((x) => x !== id) : [...shown, id];
    try {
      localStorage.setItem(HOME_CATEGORIES_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
    window.dispatchEvent(new Event(HOME_CATEGORIES_EVENT));
  };
  return { shown, toggle };
}
