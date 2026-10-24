import { api } from "../client";
import { ENDPOINTS } from "../endpoints";
import type { Banner, DashboardData, Paginated, Period, ReportsData, Review, ReviewSummary } from "../types";

export const dashboardService = {
  get: () => api.get<{ success: boolean; data: DashboardData }>(ENDPOINTS.getDashboard).then((r) => r.data),
};

export const reportsService = {
  get: (period: Period) => api.get<{ success: boolean; data: ReportsData }>(ENDPOINTS.getReports, { period }).then((r) => r.data),
};

export const reviewsService = {
  list: (params: { rating?: number; filter?: "all" | "unreplied"; page?: number; page_size?: number }) =>
    api.get<Paginated<Review> & { summary: ReviewSummary }>(ENDPOINTS.getReviews, params),
  reply: (reviewId: string, reply: string) =>
    api.post<{ success: boolean; review: Review }>(ENDPOINTS.replyReview, { review_id: reviewId, reply }).then((r) => r.review),
};

export const bannersService = {
  list: () => api.get<{ success: boolean; banners: Banner[] }>(ENDPOINTS.getBanners).then((r) => r.banners),
};
