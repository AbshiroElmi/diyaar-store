/// <reference types="vite/client" />

/** package.json "version", injected by vite.config.ts. */
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_DEFAULT_CURRENCY?: string;
  readonly VITE_DEFAULT_LOCALE?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_METHOD_PATH?: string;
  readonly VITE_API_TIMEOUT_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
