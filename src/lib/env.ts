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
  appName: raw.VITE_APP_NAME || "Diyaar Portal",
  currency: raw.VITE_DEFAULT_CURRENCY || "USD",
  locale: raw.VITE_DEFAULT_LOCALE || "en-US",
  apiMode: raw.VITE_API_MODE === "live" ? "live" : "mock",
  apiBaseUrl: (raw.VITE_API_BASE_URL || "").replace(/\/$/, ""),
  apiMethodPath: raw.VITE_API_METHOD_PATH || "/api/method/diyaar_backend.api.stores.self_service",
  apiTimeoutMs: toNumber(raw.VITE_API_TIMEOUT_MS, 20000),
  mockLatencyMs: toNumber(raw.VITE_MOCK_LATENCY_MS, 350),
} as const;

export const isMockApi = env.apiMode === "mock";
