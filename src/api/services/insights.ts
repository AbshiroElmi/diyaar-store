import { subDays } from "date-fns";
import { api } from "../client";
import { ENDPOINTS } from "../endpoints";
import { mapOrder } from "../map";
import type { DashboardData, Paginated, Review, ReviewSummary } from "../types";
import { currentStore } from "./store";

interface DashboardRow {
  store_name: string;
  store_rating: number;
  trend: Array<{ revenue: number; orders: number }>;
  today: { total_orders: number; pending: number; accepted: number; preparing: number; ready: number; completed: number; cancelled: number; revenue: number };
  overall: { avg_order_value: number };
  recent_orders: Record<string, unknown>[];
}

export const dashboardService = {
  get: async (): Promise<DashboardData> => {
    const { data: d } = await api.get<{ data: DashboardRow }>(ENDPOINTS.getDashboard);
    // The last 7 days, oldest first; the backend's dates are display strings, so rebuild them.
    const trend = d.trend.map((t, i) => ({ date: subDays(new Date(), d.trend.length - 1 - i).toISOString(), revenue: t.revenue, orders: t.orders }));
    const yesterday = trend[trend.length - 2] ?? { revenue: 0, orders: 0 };
    return {
      store_name: d.store_name,
      kpis: {
        // Sales count completed orders only, the same as the 7-day trend.
        revenue: { value: d.today.revenue, previous: yesterday.revenue },
        orders: { value: d.today.completed, previous: yesterday.orders },
        avg_order_value: { value: d.overall.avg_order_value, previous: d.overall.avg_order_value },
        rating: { value: d.store_rating, previous: d.store_rating },
      },
      today: {
        confirming: d.today.pending,
        accepted: d.today.accepted,
        preparing: d.today.preparing,
        ready: d.today.ready,
        completed: d.today.completed,
        cancelled: d.today.cancelled,
      },
      trend,
      recent_orders: d.recent_orders.map(mapOrder),
    };
  },
};

interface ReviewRow {
  id: string;
  orderId: string;
  customer_name: string;
  rating: number;
  comment: string;
  creation: string;
}

const reviewPage = (params: { rating?: number; max_rating?: number; page?: number; page_size?: number }) =>
  api.get<{ reviews: ReviewRow[]; total: number }>(ENDPOINTS.getReviews, { store_id: currentStore.id, page: 1, page_size: 30, ...params });

export const reviewsService = {
  list: async (params: { rating?: number; max_rating?: number; page?: number }): Promise<Paginated<Review>> => {
    const r = await reviewPage(params);
    return {
      data: r.reviews.map((x) => ({ name: x.id, order: x.orderId, customer_name: x.customer_name, rating: x.rating, comment: x.comment, creation: x.creation })),
      total: r.total,
      page: params.page ?? 1,
      page_size: 30,
    };
  },
  /** Star breakdown: one tiny count request per star. */
  summary: async (): Promise<ReviewSummary> => {
    const counts = await Promise.all([1, 2, 3, 4, 5].map((n) => reviewPage({ rating: n, page_size: 1 }).then((r) => r.total)));
    const total = counts.reduce((a, b) => a + b, 0);
    const average = total ? counts.reduce((sum, c, i) => sum + c * (i + 1), 0) / total : 0;
    return { total, average, distribution: { 1: counts[0], 2: counts[1], 3: counts[2], 4: counts[3], 5: counts[4] } };
  },
};
