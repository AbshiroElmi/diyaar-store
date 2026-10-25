/** Is the phone online? Follows the browser's online/offline events. */

import { useSyncExternalStore } from "react";
import { ApiError } from "@/api";

const subscribe = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

export const useOnline = () => useSyncExternalStore(subscribe, () => navigator.onLine);

/** The request never got an answer: no internet, the server unreachable, or too slow. */
export const isConnectionError = (err: unknown) => err instanceof ApiError && err.status === 0;
