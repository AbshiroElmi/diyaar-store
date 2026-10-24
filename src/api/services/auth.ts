import { api } from "../client";
import { ENDPOINTS } from "../endpoints";
import type { LoginResponse, Store, StoreUser } from "../types";

export const authService = {
  requestOtp: (phone: string) =>
    api.post<{ success: boolean; otp_sent: boolean; message: string }>(ENDPOINTS.login, { phone }),
  verifyOtp: (phone: string, otp: string) => api.post<LoginResponse>(ENDPOINTS.verifyOtp, { phone, otp }),
  logout: () => api.post<{ success: boolean }>(ENDPOINTS.logout),
  me: () => api.get<{ success: boolean; store: Store; user: StoreUser }>(ENDPOINTS.getProfile),
};
