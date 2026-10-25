/**
 * Data shapes the screens use. The services in ./services map the Diyaar
 * backend's responses into these, so screens never see raw API rows.
 */

// ── Auth ────────────────────────────────────────────────────

export interface StoreUser {
  name: string;
  full_name: string;
  email: string;
  phone: string;
  role: TeamRole;
  /** Store owners can manage the team; staff can't. */
  is_store_admin: boolean;
  store: string;
  store_name: string;
}

// ── Store ───────────────────────────────────────────────────

export interface Store {
  name: string;
  store_name: string;
  tagline: string;
  description: string;
  logo?: string;
  phone: string;
  email: string;
  address: string;
  status: string;
  is_open: 0 | 1;
  busy_mode: 0 | 1;
  minimum_order: number;
  preparation_time: number;
  auto_accept_orders: 0 | 1;
  commission_rate: number;
  owner_name: string;
  owner_phone: string;
  /** Profile or hours changes sent to Diyaar and not approved yet. */
  pending_approval: boolean;
}

/** Fields the store can change; they go to Diyaar for approval. */
export type StoreProfileInput = Pick<Store, "tagline" | "description" | "phone" | "email" | "address" | "minimum_order" | "preparation_time">;

export interface OpeningHours {
  day: Weekday;
  is_open: boolean;
  open_time: string; // "08:00"
  close_time: string; // "22:00"
}

export type Weekday = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export interface StoreHours {
  weekly: OpeningHours[];
}

// ── Orders ──────────────────────────────────────────────────

export type OrderStatus =
  | "confirming"
  | "accepted"
  | "preparing"
  | "ready"
  | "picked_up"
  | "delivered"
  | "completed"
  | "rejected"
  | "cancelled";

export type DeliveryType = "delivery" | "pickup" | "scheduled_delivery" | "scheduled_pickup";
export type PaymentMethod = "cash" | "card" | "wallet" | "mobile_money";

export interface OrderItem {
  product: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions?: string;
}

export interface OrderTimelineEntry {
  status: OrderStatus;
  timestamp: string;
  actor_type: "customer" | "store" | "driver" | "system";
  note?: string;
}

export interface Order {
  name: string;
  status: OrderStatus;
  creation: string;
  customer_name: string;
  customer_phone: string;
  delivery_type: DeliveryType;
  delivery_address?: string;
  scheduled_for?: string;
  payment_method: PaymentMethod;
  payment_status: "paid" | "unpaid" | "refunded";
  subtotal: number;
  delivery_fee: number;
  discount: number;
  grand_total: number;
  notes?: string;
  order_items: OrderItem[];
  item_count: number;
  driver?: string;
  driver_name?: string;
  driver_phone?: string;
  cancel_reason?: string;
  timeline: OrderTimelineEntry[];
}

export interface OrderListParams {
  status?: OrderStatus | "active" | "history";
  search?: string;
  page?: number;
  page_size?: number;
}

export interface OrderCounts {
  confirming: number;
  accepted: number;
  preparing: number;
  ready: number;
  active: number;
  history: number;
}

// ── Catalog ─────────────────────────────────────────────────

export type ProductStatus = "Active" | "Pending" | "Inactive" | "Rejected";

export interface Product {
  name: string;
  product_name: string;
  description: string;
  /** Category ID (Diyaar Category). */
  category: string;
  category_name: string;
  price: number;
  discount_price?: number;
  image?: string;
  is_available: 0 | 1;
  status: ProductStatus;
}

export interface ProductInput {
  product_name: string;
  description?: string;
  category: string;
  price: number;
  discount_price?: number | null;
  is_available?: 0 | 1;
  image?: string | null;
}

export interface ProductListParams {
  category?: string;
  status?: ProductStatus;
  search?: string;
  availability?: "available" | "unavailable";
  page?: number;
  page_size?: number;
}

export interface Category {
  name: string;
  category_name: string;
  image?: string;
  is_active: 0 | 1;
  product_count: number;
  /** At least one of this store's products is in it. */
  in_store: boolean;
}

// ── Reviews ─────────────────────────────────────────────────

export interface Review {
  name: string;
  order: string;
  customer_name: string;
  rating: number;
  comment: string;
  creation: string;
}

export interface ReviewSummary {
  average: number;
  total: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

// ── Money ───────────────────────────────────────────────────

export interface EarningsData {
  /** Completed-order sales minus commission, not yet paid out. */
  pending_payout: number;
  total_revenue: number;
  total_earned: number;
  commission_paid: number;
  commission_rate: number;
  this_month_gross: number;
  this_month_net: number;
  order_count: number;
  /** Where payouts go, e.g. "Salaam Bank · 1234" or "EVC Plus · 61xxxxxxx". */
  payout_accounts: string[];
}

// ── Analytics ───────────────────────────────────────────────

export interface Kpi {
  value: number;
  previous: number;
}

export interface DashboardData {
  store_name: string;
  kpis: {
    revenue: Kpi;
    orders: Kpi;
    avg_order_value: Kpi;
    rating: Kpi;
  };
  today: Record<"confirming" | "accepted" | "preparing" | "ready" | "completed" | "cancelled", number>;
  trend: Array<{ date: string; revenue: number; orders: number }>;
  recent_orders: Order[];
}

// ── Team ────────────────────────────────────────────────────

export type TeamRole = "Owner" | "Staff";

export interface TeamMember {
  name: string;
  full_name: string;
  email: string;
  phone: string;
  role: TeamRole;
  status: "active" | "disabled";
  last_active?: string;
  /** Whether the signed-in user may disable or remove this person. */
  can_manage: boolean;
}

export interface TeamMemberInput {
  full_name: string;
  email: string;
  phone: string;
  password: string;
}

// ── Diyaar banners and promotions (read-only) ──────────────

export interface Banner {
  name: string;
  title: string;
  subtitle: string;
  image?: string;
  /** "image": the picture already carries its own text, so none is drawn over it. */
  display_mode: string;
  /** Solid or gradient banners have no picture. */
  background?: string;
  /** The store the banner promotes, when it opens one. */
  store?: { id: string; name: string; logo?: string };
}

export type PromotionType = "percentage" | "fixed" | "free_delivery" | "bogo" | "cashback";

export interface Promotion {
  name: string;
  title: string;
  description: string;
  type: PromotionType;
  value: number;
  /** Promo code customers type in, when the offer has one. */
  code?: string;
  min_order?: number;
  max_discount?: number;
  image?: string;
  valid_until?: string;
}

// ── Common ──────────────────────────────────────────────────

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}
