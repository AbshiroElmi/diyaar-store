/**
 * Every backend endpoint the app calls, in one place.
 * These are the same store-portal endpoints the Diyaar web admin panel uses.
 *
 * Live URL = VITE_API_BASE_URL + VITE_API_METHOD_PATH + "." + endpoint
 *   e.g. https://diyaar-app.easytouch.cloud/api/method/diyaar_backend.admin_api.get_orders
 */

export const ENDPOINTS = {
  // Auth (Frappe session cookie + CSRF token)
  login: "admin_login",
  sendOtp: "admin_send_otp",
  verifyOtp: "admin_verify_otp",
  logout: "admin_logout",
  currentUser: "get_current_user",

  // Store
  getSettings: "get_store_settings",
  /** Applies at once; only for fields a store may change itself (open now, auto-accept). */
  updateSettings: "update_store_settings",
  /** Profile and hours changes go to Diyaar for approval. */
  submitEditRequest: "submit_store_edit_request",
  getPendingEditRequest: "get_pending_store_edit_request",
  uploadImage: "upload_store_image",

  // Dashboard & orders
  getDashboard: "get_store_dashboard",
  getOrders: "get_orders",
  getOrder: "get_order_details",
  updateOrderStatus: "update_store_order_status",

  // Catalog
  getProducts: "get_products",
  createProduct: "create_product",
  updateProduct: "update_product",
  deleteProduct: "delete_product",
  getCategories: "get_categories",
  /** A product's price, discount, availability and stock at each of the store's locations. */
  getProductLocations: "get_product_location_overrides",
  setProductLocations: "set_product_location_overrides",
  /** The store's branches; a new product has no location rows yet. */
  getStoreLocations: "get_store_locations",

  // Reviews & money
  getReviews: "get_store_reviews",
  getEarnings: "get_store_earnings",

  // Team
  getTeam: "get_admin_users",
  createMember: "create_admin_user",
  updateMember: "update_admin_user",

  // Run by Diyaar; the customer app reads the same ones. A full module path is called as is.
  getBanners: "diyaar_backend.customer_api.get_banners",
  getPromotions: "diyaar_backend.customer_api.get_promotions",
} as const;

export type Endpoint = (typeof ENDPOINTS)[keyof typeof ENDPOINTS];
