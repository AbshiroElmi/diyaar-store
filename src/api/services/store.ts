import { api, fileUrl } from "../client";
import { ENDPOINTS } from "../endpoints";
import type { OpeningHours, Store, StoreHours, StoreProfileInput, Weekday } from "../types";

/** The signed-in user's store; AuthContext sets it on sign-in. */
export const currentStore = { id: "" };

const WEEK: Weekday[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface DayHours {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface SettingsRow {
  storeId: string;
  storeName: string;
  tagline: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  autoAcceptOrders: boolean;
  preparationTime: number;
  minimumOrder: number;
  commissionRate: number;
  isOpen: boolean;
  status: string;
  ownerName: string;
  ownerPhone: string;
  logo: string;
  operatingHours: Record<string, DayHours>;
}

type Changes = Record<string, unknown>;

const getPending = (storeId: string) =>
  api.get<{ request: { proposed_changes: Changes | string } | null }>(ENDPOINTS.getPendingEditRequest, { store_id: storeId }).then((r) => r.request);

function toStore(s: SettingsRow, pending: boolean): Store {
  return {
    name: s.storeId,
    store_name: s.storeName,
    tagline: s.tagline,
    description: s.description,
    logo: fileUrl(s.logo),
    phone: s.phone,
    email: s.email,
    address: s.address,
    status: s.status,
    is_open: s.isOpen ? 1 : 0,
    busy_mode: 0,
    minimum_order: Number(s.minimumOrder) || 0,
    preparation_time: Number(s.preparationTime) || 0,
    auto_accept_orders: s.autoAcceptOrders ? 1 : 0,
    commission_rate: Number(s.commissionRate) || 0,
    owner_name: s.ownerName,
    owner_phone: s.ownerPhone,
    pending_approval: pending,
  };
}

const toHours = (h: Record<string, DayHours>): StoreHours => ({
  weekly: WEEK.map<OpeningHours>((day) => {
    const d = h?.[day.toLowerCase()];
    return { day, is_open: !!d?.isOpen, open_time: (d?.openTime || "09:00").slice(0, 5), close_time: (d?.closeTime || "22:00").slice(0, 5) };
  }),
});

/**
 * Profile and hours changes go to Diyaar for approval, like on the web panel.
 * A new request replaces the pending one, so merge with what's already waiting.
 */
async function submitForApproval(changes: Changes) {
  const pending = await getPending(currentStore.id);
  const waiting = typeof pending?.proposed_changes === "string" ? JSON.parse(pending.proposed_changes || "{}") : (pending?.proposed_changes ?? {});
  return api.post<{ success: boolean; message: string }>(ENDPOINTS.submitEditRequest, {
    store_id: currentStore.id,
    proposed_changes: JSON.stringify({ ...waiting, ...changes }),
  });
}

const updateNow = (changes: Changes) => api.post<{ success: boolean }>(ENDPOINTS.updateSettings, { store_id: currentStore.id, ...changes });

export const storeService = {
  /** Store details and opening hours come from the same settings call. */
  get: async () => {
    const [r, pending] = await Promise.all([
      api.get<{ settings: SettingsRow }>(ENDPOINTS.getSettings, { store_id: currentStore.id }),
      getPending(currentStore.id).catch(() => null),
    ]);
    return { store: toStore(r.settings, !!pending), hours: toHours(r.settings.operatingHours) };
  },
  submitProfile: (p: StoreProfileInput) =>
    submitForApproval({
      tagline: p.tagline,
      description: p.description,
      phone: p.phone,
      email: p.email,
      address: p.address,
      minimumOrder: p.minimum_order,
      preparationTime: p.preparation_time,
    }),
  submitHours: (hours: StoreHours) =>
    submitForApproval({
      operatingHours: Object.fromEntries(hours.weekly.map((d) => [d.day.toLowerCase(), { isOpen: d.is_open, openTime: d.open_time, closeTime: d.close_time }])),
    }),
  setOpen: (isOpen: boolean) => updateNow({ isOpen }),
  setAutoAccept: (on: boolean) => updateNow({ autoAcceptOrders: on }),
  /** Uploads a photo and returns its file URL. */
  uploadImage: (file: Blob, fileName: string) =>
    api.upload<{ file_url: string }>(ENDPOINTS.uploadImage, file, fileName, { image_type: "product" }).then((r) => r.file_url),
};
