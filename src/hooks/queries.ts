/**
 * React Query hooks for every screen. Pages use these, never the services directly,
 * so caching, refetching and cache invalidation live in one place.
 */

import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { haptic } from "@/lib/native";
import {
  bannersService,
  categoriesService,
  dashboardService,
  earningsService,
  notificationsService,
  ordersService,
  productsService,
  promotionsService,
  reportsService,
  reviewsService,
  settingsService,
  storeService,
  supportService,
  teamService,
  type OrderListParams,
  type OrderStatus,
  type Period,
  type ProductInput,
  type ProductListParams,
} from "@/api";

export const qk = {
  dashboard: ["dashboard"] as const,
  banners: ["banners"] as const,
  store: ["store"] as const,
  hours: ["store", "hours"] as const,
  orders: (p?: OrderListParams) => ["orders", p ?? {}] as const,
  orderCounts: ["orders", "counts"] as const,
  order: (id: string) => ["orders", "detail", id] as const,
  products: (p?: ProductListParams) => ["products", p ?? {}] as const,
  categories: ["categories"] as const,
  reviews: (p?: object) => ["reviews", p ?? {}] as const,
  reports: (period: Period) => ["reports", period] as const,
  earnings: ["earnings"] as const,
  promotions: ["promotions"] as const,
  team: ["team"] as const,
  notifications: ["notifications"] as const,
  tickets: ["tickets"] as const,
  settings: ["settings"] as const,
};

const LIVE_POLL_MS = 15_000;

const onError = (err: unknown) => {
  haptic.error();
  toast.error(err instanceof Error ? err.message : "Something went wrong");
};

// ── Store ───────────────────────────────────────────────────

export const useStore = () => useQuery({ queryKey: qk.store, queryFn: storeService.getProfile });

export function useUpdateStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: storeService.updateProfile,
    onSuccess: (store) => {
      qc.setQueryData(qk.store, store);
      toast.success("Store details saved");
    },
    onError,
  });
}

export function useSetStoreOpen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: storeService.setOpen,
    onSuccess: (_, isOpen) => {
      qc.invalidateQueries({ queryKey: qk.store });
      qc.invalidateQueries({ queryKey: qk.dashboard });
      toast.success(isOpen ? "Your store is open for orders" : "Your store is closed — no new orders");
    },
    onError,
  });
}

export function useSetBusy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: storeService.setBusy,
    onSuccess: (_, busy) => {
      qc.invalidateQueries({ queryKey: qk.store });
      toast.success(busy ? "Busy mode on — customers see longer wait times" : "Busy mode off");
    },
    onError,
  });
}

export const useHours = () => useQuery({ queryKey: qk.hours, queryFn: storeService.getHours });

export function useUpdateHours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: storeService.updateHours,
    onSuccess: (hours) => {
      qc.setQueryData(qk.hours, hours);
      toast.success("Opening hours saved");
    },
    onError,
  });
}

// ── Dashboard & reports ─────────────────────────────────────

export const useDashboard = () =>
  useQuery({ queryKey: qk.dashboard, queryFn: dashboardService.get, refetchInterval: LIVE_POLL_MS });

export const useBanners = () => useQuery({ queryKey: qk.banners, queryFn: bannersService.list, staleTime: 5 * 60_000 });

export const useReports = (period: Period) =>
  useQuery({ queryKey: qk.reports(period), queryFn: () => reportsService.get(period), placeholderData: keepPreviousData });

// ── Orders ──────────────────────────────────────────────────

export const useOrders = (params: OrderListParams) =>
  useQuery({
    queryKey: qk.orders(params),
    queryFn: () => ordersService.list(params),
    placeholderData: keepPreviousData,
    refetchInterval: params.status === "active" ? LIVE_POLL_MS : false,
  });

export const useOrderCounts = () =>
  useQuery({ queryKey: qk.orderCounts, queryFn: ordersService.counts, refetchInterval: LIVE_POLL_MS });

export const useOrder = (id: string | null) =>
  useQuery({ queryKey: qk.order(id ?? ""), queryFn: () => ordersService.get(id!), enabled: !!id });

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: OrderStatus; reason?: string }) =>
      ordersService.updateStatus(id, status, reason),
    onSuccess: (order) => {
      qc.setQueryData(qk.order(order.name), order);
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: qk.dashboard });
      qc.invalidateQueries({ queryKey: qk.notifications });
      const labels: Partial<Record<OrderStatus, string>> = {
        accepted: "Order accepted",
        rejected: "Order rejected",
        preparing: "Marked as preparing",
        ready: "Marked as ready for pickup",
        completed: "Order completed",
      };
      haptic.success();
      toast.success(`${labels[order.status] ?? "Order updated"} · ${order.name}`);
    },
    onError,
  });
}

// ── Catalog ─────────────────────────────────────────────────

export const useProducts = (params: ProductListParams = {}) =>
  useQuery({ queryKey: qk.products(params), queryFn: () => productsService.list(params), placeholderData: keepPreviousData });

function useCatalogInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: qk.categories });
  };
}

export function useSaveProduct() {
  const invalidate = useCatalogInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: any }) => (id ? productsService.update(id, data) : productsService.create(data)),
    onSuccess: (_, { id }) => {
      invalidate();
      toast.success(id ? "Product updated" : "Product submitted for approval");
    },
    onError,
  });
}

/** Create many products one by one; partial success is kept and reported. */
export function useImportProducts() {
  const invalidate = useCatalogInvalidate();
  return useMutation({
    mutationFn: async (rows: ProductInput[]) => {
      let added = 0;
      for (const row of rows) {
        try {
          await productsService.create(row);
          added++;
        } catch {
          // keep going; the count tells the owner how many made it
        }
      }
      return { added, failed: rows.length - added };
    },
    onSuccess: ({ added, failed }) => {
      invalidate();
      if (failed) toast.warning(`${added} items imported, ${failed} failed`);
      else toast.success(`${added} items imported for approval`);
    },
    onError,
  });
}

export function useToggleProduct() {
  const invalidate = useCatalogInvalidate();
  return useMutation({
    mutationFn: ({ id, is_available }: { id: string; is_available: boolean }) =>
      productsService.update(id, { is_available: is_available ? 1 : 0 }),
    onSuccess: (p) => {
      haptic.tap();
      invalidate();
      toast.success(p.is_available ? `${p.product_name} is back in stock` : `${p.product_name} marked sold out`);
    },
    onError,
  });
}

export function useDeleteProduct() {
  const invalidate = useCatalogInvalidate();
  return useMutation({
    mutationFn: productsService.remove,
    onSuccess: () => {
      invalidate();
      toast.success("Product deleted");
    },
    onError,
  });
}

export const useCategories = () => useQuery({ queryKey: qk.categories, queryFn: categoriesService.list });

export function useSaveCategory() {
  const invalidate = useCatalogInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: any }) => (id ? categoriesService.update(id, data) : categoriesService.create(data)),
    onSuccess: (_, { id }) => {
      invalidate();
      toast.success(id ? "Category updated" : "Category created");
    },
    onError,
  });
}

export function useDeleteCategory() {
  const invalidate = useCatalogInvalidate();
  return useMutation({
    mutationFn: categoriesService.remove,
    onSuccess: () => {
      invalidate();
      toast.success("Category deleted");
    },
    onError,
  });
}

// ── Reviews ─────────────────────────────────────────────────

export const useReviews = (params: { rating?: number; filter?: "all" | "unreplied"; page?: number }) =>
  useQuery({ queryKey: qk.reviews(params), queryFn: () => reviewsService.list(params), placeholderData: keepPreviousData });

export function useReplyReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: string }) => reviewsService.reply(id, reply),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Reply posted");
    },
    onError,
  });
}

// ── Money ───────────────────────────────────────────────────

export const useEarnings = () => useQuery({ queryKey: qk.earnings, queryFn: earningsService.get });

export function useRequestPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: earningsService.requestPayout,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.earnings });
      toast.success("Payout requested — it usually arrives within 24 hours");
    },
    onError,
  });
}

export const usePromotions = () => useQuery({ queryKey: qk.promotions, queryFn: promotionsService.list });

export function useSavePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: any }) => (id ? promotionsService.update(id, data) : promotionsService.create(data)),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: qk.promotions });
      toast.success(id ? "Promotion updated" : "Promotion created");
    },
    onError,
  });
}

export function useDeletePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: promotionsService.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.promotions });
      toast.success("Promotion deleted");
    },
    onError,
  });
}

// ── Team ────────────────────────────────────────────────────

export const useTeam = () => useQuery({ queryKey: qk.team, queryFn: teamService.list });

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: teamService.invite,
    onSuccess: (m) => {
      qc.invalidateQueries({ queryKey: qk.team });
      toast.success(`Invitation sent to ${m.email}`);
    },
    onError,
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => teamService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.team });
      toast.success("Team member updated");
    },
    onError,
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: teamService.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.team });
      toast.success("Team member removed");
    },
    onError,
  });
}

// ── Notifications ───────────────────────────────────────────

export const useNotifications = () =>
  useQuery({ queryKey: qk.notifications, queryFn: notificationsService.list, refetchInterval: LIVE_POLL_MS });

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids?: string[]) => notificationsService.markRead(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications }),
    onError,
  });
}

// ── Support ─────────────────────────────────────────────────

export const useTickets = () => useQuery({ queryKey: qk.tickets, queryFn: supportService.list });

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: supportService.create,
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: qk.tickets });
      toast.success(`Ticket ${t.name} created — we'll reply soon`);
    },
    onError,
  });
}

export function useReplyTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; message?: string; status?: any }) => supportService.reply(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.tickets }),
    onError,
  });
}

// ── Settings ────────────────────────────────────────────────

export const useSettings = () => useQuery({ queryKey: qk.settings, queryFn: settingsService.get });

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: settingsService.update,
    onSuccess: (s) => {
      qc.setQueryData(qk.settings, s);
      qc.invalidateQueries({ queryKey: qk.store });
      toast.success("Settings saved");
    },
    onError,
  });
}
