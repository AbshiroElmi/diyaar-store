/**
 * The single API client for the Diyaar (Frappe) backend.
 *
 * Auth is a Frappe session cookie, like the web admin panel: login sets the cookie,
 * and every POST carries the CSRF token the server hands back. In the native app,
 * CapacitorHttp keeps the cookie in the device's cookie store.
 */

import { env } from "@/lib/env";
import { isNative } from "@/lib/native";
import type { Endpoint } from "./endpoints";

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

// ── Session (the cookie itself is httpOnly; we only remember that we have one) ──

const SESSION_KEY = "portal_session";
const CSRF_KEY = "portal_csrf";

const store = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* storage unavailable */
    }
  },
  remove: (k: string) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* storage unavailable */
    }
  },
};

export const session = {
  active: () => store.get(SESSION_KEY) === "1",
  start(csrf?: string | null) {
    store.set(SESSION_KEY, "1");
    if (csrf) store.set(CSRF_KEY, csrf);
  },
  setCsrf(csrf?: string | null) {
    if (csrf) store.set(CSRF_KEY, csrf);
  },
  clear() {
    store.remove(SESSION_KEY);
    store.remove(CSRF_KEY);
  },
};

/** Fired when the backend says we're no longer signed in, so the app can sign out. */
export const UNAUTHORIZED_EVENT = "portal:unauthorized";

// ── Transport ───────────────────────────────────────────────

// The browser build calls its own origin (the dev server proxies /api); the phone app calls the backend directly.
const baseUrl = isNative ? env.apiBaseUrl : "";
// Store-portal endpoints are short names on VITE_API_METHOD_PATH; a dotted name is a full module path.
const buildUrl = (endpoint: Endpoint) => (endpoint.includes(".") ? `${baseUrl}/api/method/${endpoint}` : `${baseUrl}${env.apiMethodPath}.${endpoint}`);

/** Uploaded files come back as "/files/…"; the phone app needs the full address to show them. */
export const fileUrl = (path?: string | null) => (path?.startsWith("/") ? `${baseUrl}${path}` : path || undefined);
/** The inverse, for sending a file the server already has back to it. */
export const filePath = (url: string) => (baseUrl && url.startsWith(baseUrl) ? url.slice(baseUrl.length) : url);

const stripTags = (s: string) => s.replace(/<[^>]*>/g, "").trim();

function extractFrappeError(body: any): string {
  if (body?._server_messages) {
    try {
      const first = JSON.parse(JSON.parse(body._server_messages)[0]);
      if (first.message) return stripTags(first.message);
    } catch {
      /* fall through */
    }
  }
  const msg = body?.message?.message || body?.message || body?.exception;
  return typeof msg === "string" ? stripTags(msg) : "Request failed";
}

const SIGNED_OUT = /login to access|not logged in|session expired/i;

async function send<T>(method: "GET" | "POST", endpoint: Endpoint, params: Params, body?: FormData, retried = false): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  let url = buildUrl(endpoint);
  let payload: BodyInit | undefined = body;

  if (method === "GET") {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.set(k, typeof v === "object" ? JSON.stringify(v) : String(v));
    });
    if (qs.size) url += `?${qs}`;
  } else {
    const csrf = store.get(CSRF_KEY);
    if (csrf) headers["X-Frappe-CSRF-Token"] = csrf;
    if (!body) {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(params);
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.apiTimeoutMs);

  let res: Response;
  try {
    res = await fetch(url, { method, headers, body: payload, signal: controller.signal, credentials: "include" });
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === "AbortError";
    throw new ApiError(aborted ? "The server took too long to respond" : "Cannot reach the server", 0, endpoint);
  } finally {
    clearTimeout(timer);
  }

  const json = await res.json().catch(() => ({}));

  // An expired CSRF token: fetch a fresh one and try once more.
  if (json?.exc_type === "CSRFTokenError" && !retried) {
    await refreshCsrf();
    return send<T>(method, endpoint, params, body, true);
  }

  if (!res.ok) {
    const message = extractFrappeError(json);
    if (res.status === 401 || (res.status === 403 && SIGNED_OUT.test(message))) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(message, res.status, endpoint);
  }

  // Frappe wraps whitelisted return values in { message }.
  const data = json?.message ?? json;
  if (data && data.success === false) throw new ApiError(data.message || data.error || "Request failed", res.status, endpoint);
  return data as T;
}

async function refreshCsrf() {
  const r = await send<{ csrf_token?: string }>("GET", "get_current_user", {}).catch(() => null);
  session.setCsrf(r?.csrf_token);
}

// ── Public client ───────────────────────────────────────────

export const api = {
  get: <T>(endpoint: Endpoint, params: Params = {}) => send<T>("GET", endpoint, params),
  post: <T>(endpoint: Endpoint, params: Params = {}) => send<T>("POST", endpoint, params),
  /** Multipart upload (photos). */
  upload<T>(endpoint: Endpoint, file: Blob, fileName: string, fields: Record<string, string> = {}) {
    const form = new FormData();
    form.append("file", file, fileName);
    Object.entries(fields).forEach(([k, v]) => form.append(k, v));
    return send<T>("POST", endpoint, {}, form);
  },
};
