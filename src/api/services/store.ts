import { api } from "../client";
import { ENDPOINTS } from "../endpoints";
import type { Store, StoreHours } from "../types";

export const storeService = {
  getProfile: () => api.get<{ success: boolean; store: Store }>(ENDPOINTS.getProfile).then((r) => r.store),
  updateProfile: (data: Partial<Store>) =>
    api.post<{ success: boolean; store: Store }>(ENDPOINTS.updateProfile, data).then((r) => r.store),
  setOpen: (isOpen: boolean) => api.post<{ success: boolean; is_open: number }>(ENDPOINTS.updateStatus, { is_open: isOpen ? 1 : 0 }),
  setBusy: (busy: boolean) => api.post<{ success: boolean; busy_mode: number }>(ENDPOINTS.setBusyMode, { busy }),
  getHours: () => api.get<{ success: boolean; hours: StoreHours }>(ENDPOINTS.getHours).then((r) => r.hours),
  updateHours: (hours: StoreHours) =>
    api.post<{ success: boolean; hours: StoreHours }>(ENDPOINTS.updateHours, { hours }).then((r) => r.hours),
};
