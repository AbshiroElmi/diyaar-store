import { api, ApiError, session } from "../client";
import { ENDPOINTS } from "../endpoints";
import type { StoreUser } from "../types";

interface UserPayload {
  name: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  user_type: string;
  store: string;
  store_name: string;
}

interface LoginResult {
  success: boolean;
  csrf_token?: string;
  user: UserPayload;
}

function toStoreUser(u: UserPayload): StoreUser {
  // Platform staff use the web admin panel; this app is only for store teams.
  if (!u.store) throw new ApiError("This account isn't linked to a store. Use the Diyaar admin panel instead.", 403);
  return {
    name: u.name,
    full_name: u.full_name || u.email,
    email: u.email,
    phone: u.phone,
    role: u.user_type === "store_staff" ? "Staff" : "Owner",
    is_store_admin: u.user_type !== "store_staff",
    store: u.store,
    store_name: u.store_name,
  };
}

/** Starts the session and returns the user; signs straight back out if it's not a store account. */
async function begin(r: LoginResult) {
  session.start(r.csrf_token);
  try {
    return toStoreUser(r.user);
  } catch (err) {
    await authService.logout().catch(() => undefined);
    session.clear();
    throw err;
  }
}

export const authService = {
  requestOtp: (phone: string) => api.post<{ success: boolean; otp_sent: boolean; message: string }>(ENDPOINTS.sendOtp, { phone }),
  verifyOtp: (phone: string, otp: string) => api.post<LoginResult>(ENDPOINTS.verifyOtp, { phone, otp }).then(begin),
  login: (email: string, password: string) => api.post<LoginResult>(ENDPOINTS.login, { email, password }).then(begin),
  logout: () => api.post<{ success: boolean }>(ENDPOINTS.logout),
  me: async () => {
    const r = await api.get<LoginResult>(ENDPOINTS.currentUser);
    session.setCsrf(r.csrf_token);
    return toStoreUser(r.user);
  },
};
