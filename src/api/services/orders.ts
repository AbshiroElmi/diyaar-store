import { api } from "../client";
import { ENDPOINTS } from "../endpoints";
import type { Order, OrderCounts, OrderListParams, OrderStatus, Paginated } from "../types";

export const ordersService = {
  list: (params: OrderListParams) => api.get<Paginated<Order>>(ENDPOINTS.getOrders, { ...params }),
  counts: () => api.get<{ success: boolean; counts: OrderCounts }>(ENDPOINTS.getOrderCounts).then((r) => r.counts),
  get: (orderId: string) => api.get<{ success: boolean; order: Order }>(ENDPOINTS.getOrder, { order_id: orderId }).then((r) => r.order),
  updateStatus: (orderId: string, status: OrderStatus, rejectReason?: string) =>
    api
      .post<{ success: boolean; order: Order }>(ENDPOINTS.updateOrderStatus, {
        order_number: orderId,
        status,
        reject_reason: rejectReason,
      })
      .then((r) => r.order),
};
