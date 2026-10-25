/**
 * Typed access to environment settings.
 * Every VITE_* variable is read here and nowhere else.
 */

const raw = import.meta.env;

const toNumber = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export const env = {
  appName: raw.VITE_APP_NAME || "Diyaar Store",
  currency: raw.VITE_DEFAULT_CURRENCY || "USD",
  locale: raw.VITE_DEFAULT_LOCALE || "en-US",
  apiBaseUrl: (raw.VITE_API_BASE_URL || "https://diyaar-app.easytouch.cloud").replace(/\/$/, ""),
  apiMethodPath: raw.VITE_API_METHOD_PATH || "/api/method/diyaar_backend.admin_api",
  apiTimeoutMs: toNumber(raw.VITE_API_TIMEOUT_MS, 20000),
} as const;
