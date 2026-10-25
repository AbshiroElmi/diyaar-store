import { api } from "../client";
import { ENDPOINTS } from "../endpoints";
import { mapOrder } from "../map";
import type { Order, OrderCounts, OrderListParams, OrderStatus, Paginated } from "../types";

/** Backend status values behind each app status (the backend also keeps a few legacy ones). */
const SERVER_STATUSES: Partial<Record<OrderStatus | "history", string[]>> = {
  confirming: ["confirming", "pending"],
  picked_up: ["picking_up", "heading_your_way"],
  history: ["delivered", "completed", "cancelled", "rejected"],
};

interface OrderPage {
  data: Record<string, unknown>[];
  total: number;
  page: number;
  page_size: number;
  counts?: { completed?: number };
}

function listParams({ status, search, page = 1, page_size = 20 }: OrderListParams) {
  const base = { search, page, page_size };
  if (!status) return base;
  if (status === "active") return { ...base, status: "active" };
  return { ...base, filters: { orderStatus: SERVER_STATUSES[status] ?? [status] } };
}

export const ordersService = {
  list: async (params: OrderListParams): Promise<Paginated<Order>> => {
    const r = await api.get<OrderPage>(ENDPOINTS.getOrders, listParams(params));
    return { data: r.data.map(mapOrder), total: r.total, page: r.page, page_size: r.page_size };
  },
  /** Counts for the stage tabs, worked out from the active orders. */
  counts: async (): Promise<OrderCounts> => {
    const r = await api.get<OrderPage>(ENDPOINTS.getOrders, { status: "active", page: 1, page_size: 50 });
    const c: OrderCounts = { confirming: 0, accepted: 0, preparing: 0, ready: 0, active: r.total, history: r.counts?.completed ?? 0 };
    for (const o of r.data.map(mapOrder)) if (o.status in c) c[o.status as keyof OrderCounts]++;
    return c;
  },
  get: (orderId: string) => api.get<{ order: Record<string, unknown> }>(ENDPOINTS.getOrder, { order_id: orderId }).then((r) => mapOrder(r.order)),
  updateStatus: async (orderId: string, status: OrderStatus) => {
    await api.post(ENDPOINTS.updateOrderStatus, { order_id: orderId, new_status: status });
    return ordersService.get(orderId);
  },
};
