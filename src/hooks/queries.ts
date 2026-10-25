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
  ordersService,
  productsService,
  reviewsService,
  storeService,
  teamService,
  type Banner,
  type OrderListParams,
  type OrderStatus,
  type ProductInput,
  type ProductListParams,
} from "@/api";

export const qk = {
  dashboard: ["dashboard"] as const,
  banners: ["banners"] as const,
  store: ["store"] as const,
  orders: (p?: OrderListParams) => ["orders", p ?? {}] as const,
  orderCounts: ["orders", "counts"] as const,
  order: (id: string) => ["orders", "detail", id] as const,
  products: (p?: ProductListParams) => ["products", p ?? {}] as const,
  categories: ["categories"] as const,
  reviews: (p?: object) => ["reviews", p ?? {}] as const,
  reviewSummary: ["reviews", "summary"] as const,
  earnings: ["earnings"] as const,
  team: ["team"] as const,
};

const LIVE_POLL_MS = 15_000;

const onError = (err: unknown) => {
  haptic.error();
  toast.error(err instanceof Error ? err.message : "Something went wrong");
};

// ── Store ───────────────────────────────────────────────────

// Store details and opening hours share one request.
export const useStore = () => useQuery({ queryKey: qk.store, queryFn: storeService.get, select: (d) => d.store });
export const useHours = () => useQuery({ queryKey: qk.store, queryFn: storeService.get, select: (d) => d.hours });

export function useSubmitProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: storeService.submitProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.store });
      toast.success("Sent to Diyaar for approval");
    },
    onError,
  });
}

export function useSubmitHours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: storeService.submitHours,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.store });
      toast.success("New hours sent to Diyaar for approval");
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
      toast.success(isOpen ? "Your store is open for orders" : "Your store is closed — no new orders");
    },
    onError,
  });
}

export function useSetAutoAccept() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: storeService.setAutoAccept,
    onSuccess: (_, on) => {
      qc.invalidateQueries({ queryKey: qk.store });
      toast.success(on ? "New orders are accepted automatically" : "You'll accept each order yourself");
    },
    onError,
  });
}

// ── Dashboard ───────────────────────────────────────────────

export const useDashboard = () =>
  useQuery({ queryKey: qk.dashboard, queryFn: dashboardService.get, refetchInterval: LIVE_POLL_MS });

// ── Banners (saved on this phone for now) ───────────────────

export const useBanners = () => useQuery({ queryKey: qk.banners, queryFn: bannersService.list });

export function useSaveBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, silent: _ }: { id?: string; data: Partial<Banner>; silent?: boolean }) => (id ? bannersService.update(id, data) : bannersService.create(data as Omit<Banner, "name">)),
    onSuccess: (_, { id, silent }) => {
      qc.invalidateQueries({ queryKey: qk.banners });
      if (!silent) toast.success(id ? "Banner updated" : "Banner added to Home");
    },
    onError,
  });
}

export function useDeleteBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bannersService.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.banners });
      toast.success("Banner deleted");
    },
    onError,
  });
}

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
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => ordersService.updateStatus(id, status),
    onSuccess: (order) => {
      qc.setQueryData(qk.order(order.name), order);
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: qk.dashboard });
      const labels: Partial<Record<OrderStatus, string>> = {
        accepted: "Order accepted",
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

/** Every category the store can file a product under (the product form's picker). */
export const useCategories = () => useQuery({ queryKey: qk.categories, queryFn: categoriesService.list, staleTime: 10 * 60_000 });
/** Only the categories this store's products are in, for Home, the Categories screen and the Products list. */
export const useStoreCategories = () =>
  useQuery({ queryKey: qk.categories, queryFn: categoriesService.list, staleTime: 10 * 60_000, select: (all) => all.filter((c) => c.in_store) });

function useCatalogInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["products"] });
    // A product in a new category puts that category on the store's list.
    qc.invalidateQueries({ queryKey: qk.categories });
    qc.invalidateQueries({ queryKey: qk.dashboard });
  };
}

export function useSaveProduct() {
  const invalidate = useCatalogInvalidate();
  return useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: ProductInput }) => (id ? (await productsService.update(id, data), { pending: false }) : productsService.create(data)),
    onSuccess: ({ pending }, { id }) => {
      invalidate();
      toast.success(id ? "Product updated" : pending ? "Product submitted for approval" : "Product added");
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
      else toast.success(`${added} items imported`);
    },
    onError,
  });
}

export function useToggleProduct() {
  const invalidate = useCatalogInvalidate();
  return useMutation({
    mutationFn: ({ id, is_available }: { id: string; is_available: boolean }) => productsService.update(id, { is_available: is_available ? 1 : 0 }),
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

// ── Reviews ─────────────────────────────────────────────────

export const useReviews = (params: { rating?: number; max_rating?: number; page?: number }) =>
  useQuery({ queryKey: qk.reviews(params), queryFn: () => reviewsService.list(params), placeholderData: keepPreviousData });

export const useReviewSummary = () => useQuery({ queryKey: qk.reviewSummary, queryFn: reviewsService.summary, staleTime: 5 * 60_000 });

// ── Money ───────────────────────────────────────────────────

export const useEarnings = () => useQuery({ queryKey: qk.earnings, queryFn: earningsService.get });

// ── Team ────────────────────────────────────────────────────

export const useTeam = () => useQuery({ queryKey: qk.team, queryFn: teamService.list });

export function useAddMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: teamService.create,
    onSuccess: (_, m) => {
      qc.invalidateQueries({ queryKey: qk.team });
      toast.success(`${m.full_name} can now sign in with ${m.email}`);
    },
    onError,
  });
}

export function useSetMemberActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => teamService.setActive(id, active),
    onSuccess: (_, { active }) => {
      qc.invalidateQueries({ queryKey: qk.team });
      toast.success(active ? "Access turned back on" : "Access turned off");
    },
    onError,
  });
}
