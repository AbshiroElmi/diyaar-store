/**
 * Custom login background (video or photo) chosen by the owner in Settings.
 * The login screen shows before anyone signs in, so this lives on the device
 * (IndexedDB — videos are too big for localStorage), not on the store account.
 *
 * Every file the owner picks is kept in a small library so it can be reused later;
 * the "active" key points at the one currently shown.
 */

import { useEffect, useState } from "react";

export type LoginMediaKind = "video" | "image";
interface LibraryItem {
  id: string;
  kind: LoginMediaKind;
  blob: Blob;
  name: string;
  added: number;
}
/** Version 1 stored the background itself under the active key. */
interface LegacyStored {
  kind: LoginMediaKind;
  blob: Blob;
}

const DB = "diyaar-device";
const STORE = "media";
const LIBRARY = "library";
const KEY = "login-background";
const EVENT = "login-media-change";
/** Keep it reasonable: a short looping clip, not a whole film. */
export const MAX_LOGIN_MEDIA_MB = 60;
/** Oldest unused files drop off past this, so the phone doesn't fill up. */
export const MAX_LIBRARY_ITEMS = 8;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      if (!db.objectStoreNames.contains(LIBRARY)) db.createObjectStore(LIBRARY, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(store, mode).objectStore(store));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const changed = () => window.dispatchEvent(new Event(EVENT));
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

async function addToLibrary(kind: LoginMediaKind, blob: Blob, name: string): Promise<string> {
  const item: LibraryItem = { id: newId(), kind, blob, name, added: Date.now() };
  await run(LIBRARY, "readwrite", (s) => s.put(item));
  return item.id;
}

/** Active library id; moves a version-1 background into the library on first read. */
async function getActiveId(): Promise<string | null> {
  const value = await run<string | LegacyStored | undefined>(STORE, "readonly", (s) => s.get(KEY));
  if (!value) return null;
  if (typeof value === "string") return value;
  const id = await addToLibrary(value.kind, value.blob, value.kind === "video" ? "Video" : "Photo");
  await run(STORE, "readwrite", (s) => s.put(id, KEY));
  return id;
}

export async function getLoginLibrary(): Promise<{ items: LibraryItem[]; activeId: string | null }> {
  try {
    const activeId = await getActiveId();
    const items = await run<LibraryItem[]>(LIBRARY, "readonly", (s) => s.getAll());
    return { items: items.sort((a, b) => b.added - a.added), activeId };
  } catch {
    return { items: [], activeId: null };
  }
}

/** Add a new file to the library and show it. */
export async function setLoginMedia(file: File) {
  const kind: LoginMediaKind | null = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : null;
  if (!kind) throw new Error("Choose a video or a photo");
  if (file.size > MAX_LOGIN_MEDIA_MB * 1024 * 1024) throw new Error(`That file is too big — keep it under ${MAX_LOGIN_MEDIA_MB} MB`);

  const { items } = await getLoginLibrary();
  const same = items.find((x) => x.name === file.name && x.blob.size === file.size && x.kind === kind);
  const id = same?.id ?? (await addToLibrary(kind, file, file.name));
  await run(STORE, "readwrite", (s) => s.put(id, KEY));

  // Trim the oldest files beyond the limit (never the one just chosen).
  const extra = [...(same ? items : [{ id } as LibraryItem, ...items])].slice(MAX_LIBRARY_ITEMS).filter((x) => x.id !== id);
  for (const x of extra) await run(LIBRARY, "readwrite", (s) => s.delete(x.id));
  changed();
}

/** Show a file that's already in the library. */
export async function selectLibraryItem(id: string) {
  await run(STORE, "readwrite", (s) => s.put(id, KEY));
  changed();
}

export async function removeLibraryItem(id: string) {
  if ((await getActiveId()) === id) await run(STORE, "readwrite", (s) => s.delete(KEY));
  await run(LIBRARY, "readwrite", (s) => s.delete(id));
  changed();
}

/** Back to the built-in background; the library is kept. */
export async function clearLoginMedia() {
  await run(STORE, "readwrite", (s) => s.delete(KEY));
  changed();
}

export interface LibraryEntry {
  id: string;
  kind: LoginMediaKind;
  url: string;
  name: string;
}

/** The library (with playable URLs) and which entry is active; null active = built-in background. */
export function useLoginLibrary() {
  const [items, setItems] = useState<LibraryEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let urls: string[] = [];
    const load = async () => {
      const lib = await getLoginLibrary();
      urls.forEach((u) => URL.revokeObjectURL(u));
      const next = lib.items.map((x) => ({ id: x.id, kind: x.kind, name: x.name, url: URL.createObjectURL(x.blob) }));
      urls = next.map((x) => x.url);
      setItems(next);
      setActiveId(lib.items.some((x) => x.id === lib.activeId) ? lib.activeId : null);
      setReady(true);
    };
    load();
    window.addEventListener(EVENT, load);
    return () => {
      window.removeEventListener(EVENT, load);
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  return { items, activeId, ready };
}

/** The custom background as a playable URL, or null to use the built-in one. */
export function useLoginMedia() {
  const { items, activeId, ready } = useLoginLibrary();
  const active = items.find((x) => x.id === activeId);
  return { media: active ? { kind: active.kind, url: active.url } : null, ready };
}
