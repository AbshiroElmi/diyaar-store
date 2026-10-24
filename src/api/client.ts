/**
 * The single API client.
 * Services call `api.get` / `api.post`; this file decides whether the call
 * goes to the mock API or to the live Frappe backend (VITE_API_MODE).
 */

import { env, isMockApi } from "@/lib/env";
import type { Endpoint } from "./endpoints";
import { mockHandlers, mockReady } from "./mock/handlers";

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0,
    public endpoint?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Params = Record<string, unknown>;

// ── Session token (api_key:api_secret from store_verify_otp) ──

const TOKEN_KEY = "portal_token";

export const session = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

/** Fired when the backend rejects the session, so the app can sign out. */
export const UNAUTHORIZED_EVENT = "portal:unauthorized";

// ── Mock transport ──────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callMock<T>(endpoint: Endpoint, params: Params): Promise<T> {
  const handler = mockHandlers[endpoint];
  if (!handler) throw new ApiError(`Mock handler missing for "${endpoint}"`, 404, endpoint);
  await mockReady;
  await sleep(env.mockLatencyMs * (0.6 + Math.random() * 0.8));
  try {
    // Clone so callers can never mutate the mock database by accident.
    return structuredClone(handler(params)) as T;
  } catch (err) {
    throw new ApiError(err instanceof Error ? err.message : "Request failed", 400, endpoint);
  }
}

// ── Live transport (Frappe) ─────────────────────────────────

function buildUrl(endpoint: Endpoint) {
  return `${env.apiBaseUrl}${env.apiMethodPath}.${endpoint}`;
}

function extractFrappeError(body: any): string {
  if (body?._server_messages) {
    try {
      const messages = JSON.parse(body._server_messages);
      const first = JSON.parse(messages[0]);
      return first.message || "Request failed";
    } catch {
      /* fall through */
    }
  }
  return body?.message?.message || body?.exception || body?.message || "Request failed";
}

async function callLive<T>(method: "GET" | "POST", endpoint: Endpoint, params: Params): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = session.get();
  if (token) headers.Authorization = `token ${token}`;

  let url = buildUrl(endpoint);
  let body: string | undefined;

  if (method === "GET") {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    });
    if (qs.size) url += `?${qs}`;
  } else {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(params);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.apiTimeoutMs);

  let res: Response;
  try {
    res = await fetch(url, { method, headers, body, signal: controller.signal, credentials: "include" });
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === "AbortError";
    throw new ApiError(aborted ? "The server took too long to respond" : "Cannot reach the server", 0, endpoint);
  } finally {
    clearTimeout(timer);
  }

  const json = await res.json().catch(() => ({}));

  if (res.status === 401 || res.status === 403) {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }
  if (!res.ok) throw new ApiError(extractFrappeError(json), res.status, endpoint);

  // Frappe wraps whitelisted return values in { message }.
  const data = json?.message ?? json;
  if (data && data.success === false) throw new ApiError(data.message || "Request failed", res.status, endpoint);
  return data as T;
}

// ── Public client ───────────────────────────────────────────

export const api = {
  get<T>(endpoint: Endpoint, params: Params = {}): Promise<T> {
    return isMockApi ? callMock<T>(endpoint, params) : callLive<T>("GET", endpoint, params);
  },
  post<T>(endpoint: Endpoint, params: Params = {}): Promise<T> {
    return isMockApi ? callMock<T>(endpoint, params) : callLive<T>("POST", endpoint, params);
  },
};
