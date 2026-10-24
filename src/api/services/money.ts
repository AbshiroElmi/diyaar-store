import { api } from "../client";
import { ENDPOINTS } from "../endpoints";
import type { EarningsData, Promotion, PromotionInput } from "../types";

export const earningsService = {
  get: () => api.get<{ success: boolean; data: EarningsData }>(ENDPOINTS.getEarnings).then((r) => r.data),
  requestPayout: () => api.post<{ success: boolean; message: string }>(ENDPOINTS.requestPayout),
};

export const promotionsService = {
  list: () => api.get<{ success: boolean; promotions: Promotion[] }>(ENDPOINTS.getPromotions).then((r) => r.promotions),
  create: (data: PromotionInput) =>
    api.post<{ success: boolean; promotion: Promotion }>(ENDPOINTS.createPromotion, data).then((r) => r.promotion),
  update: (promotionId: string, data: Partial<Promotion>) =>
    api.post<{ success: boolean; promotion: Promotion }>(ENDPOINTS.updatePromotion, { promotion_id: promotionId, ...data }).then((r) => r.promotion),
  remove: (promotionId: string) => api.post<{ success: boolean }>(ENDPOINTS.deletePromotion, { promotion_id: promotionId }),
};
