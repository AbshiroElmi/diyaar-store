/**
 * Every backend endpoint the Portal calls, in one place.
 *
 * Live URL = VITE_API_BASE_URL + VITE_API_METHOD_PATH + "." + endpoint
 *   e.g. /api/method/diyaar_backend.api.stores.self_service.get_store_orders
 *
 * `ready`   → already exists in diyaar_backend/api/stores/self_service.py
 * `planned` → mocked only for now; the backend still needs this endpoint
 */

export const ENDPOINTS = {
  // Auth
  login: "store_login", // ready — sends OTP to owner phone
  verifyOtp: "store_verify_otp", // ready
  logout: "store_logout", // planned

  // Store
  getProfile: "get_store_profile", // ready
  updateProfile: "update_store_profile", // ready
  updateStatus: "update_store_status", // ready — open / closed
  setBusyMode: "set_store_busy_mode", // planned
  getHours: "get_store_hours", // planned
  updateHours: "update_store_hours", // planned

  // Dashboard & analytics
  getDashboard: "get_store_dashboard", // planned (admin_api has a similar one)
  getAnalytics: "get_store_analytics", // ready — basic totals
  getReports: "get_store_reports", // planned
  getBanners: "get_store_banners", // planned — home carousel

  // Orders
  getOrders: "get_store_orders", // ready
  getOrderCounts: "get_store_order_counts", // planned
  getOrder: "get_store_order", // planned
  updateOrderStatus: "update_store_order_status", // ready

  // Products
  getProducts: "get_store_products_list", // ready
  createProduct: "create_store_product", // ready
  updateProduct: "update_store_product", // ready
  deleteProduct: "delete_store_product", // ready

  // Categories
  getCategories: "get_store_categories", // planned
  createCategory: "create_store_category", // planned
  updateCategory: "update_store_category", // planned
  deleteCategory: "delete_store_category", // planned

  // Reviews
  getReviews: "get_store_reviews", // planned (admin_api has a similar one)
  replyReview: "reply_store_review", // planned

  // Earnings
  getEarnings: "get_store_earnings", // planned (admin_api has a similar one)
  requestPayout: "request_store_payout", // planned

  // Promotions
  getPromotions: "get_store_promotions", // planned
  createPromotion: "create_store_promotion", // planned
  updatePromotion: "update_store_promotion", // planned
  deletePromotion: "delete_store_promotion", // planned

  // Team
  getTeam: "get_store_team", // planned
  inviteMember: "invite_store_member", // planned
  updateMember: "update_store_member", // planned
  removeMember: "remove_store_member", // planned

  // Notifications
  getNotifications: "get_store_notifications", // planned
  markNotificationsRead: "mark_store_notifications_read", // planned

  // Support
  getTickets: "get_store_tickets", // planned
  createTicket: "create_store_ticket", // planned
  replyTicket: "reply_store_ticket", // planned

  // Settings
  getSettings: "get_store_portal_settings", // planned
  updateSettings: "update_store_portal_settings", // planned
} as const;

export type Endpoint = (typeof ENDPOINTS)[keyof typeof ENDPOINTS];
