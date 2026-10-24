/**
 * Data shapes shared by the mock API and the live Frappe API.
 * Field names follow the backend (snake_case) so the live switch needs no mapping.
 */

// ── Auth ────────────────────────────────────────────────────

export interface StoreUser {
  name: string;
  full_name: string;
  email: string;
  phone: string;
  role: TeamRole;
  avatar?: string;
}

export interface LoginResponse {
  success: boolean;
  store: Store;
  user: StoreUser;
  api_key: string;
  api_secret: string;
}

// ── Store ───────────────────────────────────────────────────

export type StoreStatus = "Active" | "Inactive" | "Pending" | "Suspended";

export interface Store {
  name: string;
  store_name: string;
  description: string;
  logo?: string;
  cover_image?: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  service_type: string;
  status: StoreStatus;
  is_open: 0 | 1;
  busy_mode: 0 | 1;
  rating: number;
  review_count: number;
  delivery_time_min: number;
  delivery_time_max: number;
  delivery_fee: number;
  minimum_order: number;
  preparation_time: number;
  accepts_scheduled_orders: 0 | 1;
  auto_accept_orders: 0 | 1;
  commission_rate: number;
  owner_name: string;
  owner_phone: string;
}

export interface OpeningHours {
  day: Weekday;
  is_open: boolean;
  open_time: string; // "08:00"
  close_time: string; // "22:00"
}

export type Weekday = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export interface HolidayClosure {
  name: string;
  title: string;
  date: string;
}

export interface StoreHours {
  weekly: OpeningHours[];
  closures: HolidayClosure[];
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
  category: string;
  price: number;
  discount_price?: number;
  image?: string;
  is_available: 0 | 1;
  is_popular: 0 | 1;
  is_featured: 0 | 1;
  preparation_time?: number;
  status: ProductStatus;
  sort_order: number;
  sold_count: number;
  rating: number;
}

export type ProductInput = Partial<Omit<Product, "name" | "sold_count" | "rating" | "status">> & {
  product_name: string;
  category: string;
  price: number;
};

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
  description?: string;
  /** Photo URL (or data URL from the device); falls back to the category emoji. */
  image?: string;
  is_active: 0 | 1;
  sort_order: number;
  product_count: number;
}

// ── Reviews ─────────────────────────────────────────────────

export interface Review {
  name: string;
  order: string;
  customer_name: string;
  rating: number;
  comment: string;
  creation: string;
  reply?: string;
  reply_at?: string;
}

export interface ReviewSummary {
  average: number;
  total: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  unreplied: number;
}

// ── Money ───────────────────────────────────────────────────

export interface EarningsSummary {
  available_balance: number;
  pending_balance: number;
  total_earned: number;
  commission_paid: number;
  commission_rate: number;
  next_payout_date: string;
  this_month_gross: number;
  this_month_net: number;
}

export interface Transaction {
  name: string;
  type: "order" | "commission" | "payout" | "refund" | "adjustment";
  reference: string;
  description: string;
  amount: number;
  creation: string;
}

export interface Payout {
  name: string;
  amount: number;
  status: "paid" | "processing" | "failed";
  method: string;
  account: string;
  period_start: string;
  period_end: string;
  creation: string;
}

export interface BankAccount {
  bank_name: string;
  account_name: string;
  account_number_masked: string;
  method: "bank" | "mobile_money";
}

export interface EarningsData {
  summary: EarningsSummary;
  transactions: Transaction[];
  payouts: Payout[];
  account: BankAccount;
}

// ── Marketing ───────────────────────────────────────────────

export type PromotionType = "percentage" | "fixed" | "free_delivery" | "bogo";
export type PromotionStatus = "active" | "scheduled" | "paused" | "ended";

export interface Promotion {
  name: string;
  title: string;
  type: PromotionType;
  value: number;
  code?: string;
  min_order: number;
  starts_at: string;
  ends_at: string;
  status: PromotionStatus;
  usage_count: number;
  usage_limit?: number;
  revenue: number;
}

export type PromotionInput = Omit<Promotion, "name" | "status" | "usage_count" | "revenue">;

// ── Analytics ───────────────────────────────────────────────

export type Period = "today" | "week" | "month" | "quarter";

export interface Kpi {
  value: number;
  previous: number;
}

export interface DashboardData {
  store_name: string;
  is_open: 0 | 1;
  kpis: {
    revenue: Kpi;
    orders: Kpi;
    avg_order_value: Kpi;
    rating: Kpi;
  };
  today: Record<"confirming" | "accepted" | "preparing" | "ready" | "completed" | "cancelled", number>;
  trend: Array<{ date: string; revenue: number; orders: number }>;
  top_products: Array<{ product: string; product_name: string; quantity: number; revenue: number }>;
  recent_orders: Order[];
  recent_reviews: Review[];
}

export interface ReportsData {
  period: Period;
  kpis: {
    revenue: Kpi;
    net_earnings: Kpi;
    orders: Kpi;
    avg_order_value: Kpi;
    cancel_rate: Kpi;
    avg_prep_minutes: Kpi;
  };
  series: Array<{ date: string; revenue: number; orders: number }>;
  by_hour: Array<{ hour: string; orders: number }>;
  by_payment: Array<{ method: PaymentMethod; orders: number; revenue: number }>;
  by_category: Array<{ category: string; revenue: number }>;
  top_products: Array<{ product: string; product_name: string; quantity: number; revenue: number }>;
}

// ── Team ────────────────────────────────────────────────────

export type TeamRole = "Owner" | "Manager" | "Staff";

export interface TeamMember {
  name: string;
  full_name: string;
  email: string;
  phone: string;
  role: TeamRole;
  status: "active" | "invited" | "disabled";
  last_active?: string;
}

// ── Notifications ───────────────────────────────────────────

export interface AppNotification {
  name: string;
  type: "order" | "review" | "payout" | "product" | "system";
  title: string;
  body: string;
  read: boolean;
  creation: string;
  link?: string;
}

// ── Support ─────────────────────────────────────────────────

export type TicketStatus = "open" | "pending" | "resolved" | "closed";

export interface TicketMessage {
  name: string;
  from: "store" | "support";
  author: string;
  body: string;
  creation: string;
}

export interface SupportTicket {
  name: string;
  subject: string;
  category: "order" | "payment" | "account" | "technical" | "other";
  priority: "low" | "normal" | "high";
  status: TicketStatus;
  order?: string;
  creation: string;
  modified: string;
  messages: TicketMessage[];
}

// ── Settings ────────────────────────────────────────────────

export interface StoreSettings {
  notifications: {
    new_order_sound: boolean;
    new_order_push: boolean;
    new_order_sms: boolean;
    review_alerts: boolean;
    payout_alerts: boolean;
    daily_summary_email: boolean;
  };
  orders: {
    auto_accept_orders: boolean;
    accept_timeout_minutes: number;
    print_receipt_on_accept: boolean;
  };
  language: "en" | "so" | "ar";
}

// ── Banners (home carousel) ─────────────────────────────

export interface Banner {
  name: string;
  title: string;
  subtitle: string;
  cta: string;
  /** In-app route or external URL. */
  link: string;
  theme: "lime" | "teal" | "sunset" | "violet" | "ocean";
  emoji: string;
  image?: string;
  /** Hidden banners stay saved but don't show on Home. */
  is_active?: 0 | 1;
  sort_order?: number;
}

// ── Common ──────────────────────────────────────────────────

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}
