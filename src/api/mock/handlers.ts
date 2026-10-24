/**
 * Mock API. One handler per endpoint, backed by an in-memory database
 * that is saved to IndexedDB so changes survive a page reload or app restart.
 */

import { ENDPOINTS as E, type Endpoint } from "../endpoints";
import type {
  Banner,
  AppNotification,
  Category,
  DashboardData,
  EarningsData,
  Order,
  OrderCounts,
  OrderListParams,
  OrderStatus,
  Paginated,
  Period,
  Product,
  ProductListParams,
  Promotion,
  ReportsData,
  Review,
  ReviewSummary,
  Store,
  StoreHours,
  StoreSettings,
  StoreUser,
  SupportTicket,
  TeamMember,
  TicketStatus,
} from "../types";
import * as seed from "./seed";

const DB_KEY = "portal_mock_db_v1";
export const MOCK_OTP = "123456";

const MIN = 60_000;
const DAY = 86_400_000;
const round2 = (n: number) => Math.round(n * 100) / 100;

interface MockDb {
  store: Store;
  user: StoreUser;
  categories: Category[];
  products: Product[];
  orders: Order[];
  reviews: Review[];
  payouts: ReturnType<typeof seed.seedPayouts>;
  account: ReturnType<typeof seed.seedAccount>;
  promotions: Promotion[];
  hours: StoreHours;
  team: TeamMember[];
  notifications: AppNotification[];
  tickets: SupportTicket[];
  settings: StoreSettings;
  banners?: Banner[];
  seq: number;
  lastIncomingAt: number;
}

function createDb(): MockDb {
  const now = Date.now();
  const { categories, products } = seed.seedCatalog();
  const orders = seed.seedOrders(products, now);
  const reviews = seed.seedReviews(orders);
  const store = seed.seedStore();
  store.review_count = reviews.length;
  store.rating = round2(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length);
  return {
    store,
    user: seed.seedUser(),
    categories,
    products,
    orders,
    reviews,
    payouts: seed.seedPayouts(now),
    account: seed.seedAccount(),
    promotions: seed.seedPromotions(now),
    hours: seed.seedHours(),
    team: seed.seedTeam(now),
    notifications: seed.seedNotifications(orders, now),
    tickets: seed.seedTickets(now),
    settings: seed.seedSettings(),
    seq: 60000,
    lastIncomingAt: now,
  };
}

// Persistence: IndexedDB, because the demo data (orders, photos as data URLs) outgrows
// localStorage's ~5 MB and saves there start failing silently. localStorage is only read
// once, to carry over data saved by older builds.

const IDB_NAME = "portal-mock";
const IDB_STORE = "db";

let conn: Promise<IDBDatabase> | null = null;
function idb(): Promise<IDBDatabase> {
  return (conn ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

function legacyDb(): MockDb | null {
  try {
    const saved = localStorage.getItem(DB_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null; // corrupted or unavailable — start fresh
  }
}

let db: MockDb = legacyDb() ?? createDb();

/** Resolves once the saved database has been loaded; the mock transport waits on it. */
export const mockReady: Promise<void> = (async () => {
  try {
    const store = await idb();
    const saved = await new Promise<MockDb | undefined>((resolve, reject) => {
      const req = store.transaction(IDB_STORE).objectStore(IDB_STORE).get(DB_KEY);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (saved) db = saved;
    else save(); // first run on IndexedDB: move whatever we have across
    localStorage.removeItem(DB_KEY);
  } catch {
    /* IndexedDB unavailable — keep the in-memory copy */
  }
})();

/** Home banners; seeded lazily so demo data saved before banners existed still works. */
function banners(): Banner[] {
  db.banners ??= [
    { name: "BN-1", title: "Free Delivery Fridays", subtitle: "Stores using it get 32% more orders", cta: "Create promo", link: "/promotions", theme: "lime", emoji: "🛵", is_active: 1, sort_order: 1 },
    { name: "BN-2", title: "Your week in numbers", subtitle: `${db.store.store_name} is up this week — see what sold best`, cta: "View report", link: "/reports", theme: "teal", emoji: "📈", is_active: 1, sort_order: 2 },
    { name: "BN-3", title: "Reply to your reviews", subtitle: "Stores that reply get higher ratings", cta: "Open reviews", link: "/reviews", theme: "sunset", emoji: "⭐", is_active: 1, sort_order: 3 },
    { name: "BN-4", title: "Add photos to your menu", subtitle: "Items with photos sell up to 2× more", cta: "Edit menu", link: "/products", theme: "violet", emoji: "📸", is_active: 1, sort_order: 4 },
  ];
  return db.banners;
}

let saving: Promise<void> | null = null;

/** Persist the database; several changes in the same tick are written once. Resolves when it's on disk. */
function save(): Promise<void> {
  return (saving ??= Promise.resolve().then(async () => {
    saving = null;
    try {
      const tx = (await idb()).transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(db, DB_KEY);
      await new Promise((resolve) => (tx.oncomplete = tx.onerror = tx.onabort = resolve));
    } catch {
      /* storage unavailable — keep in memory */
    }
  }));
}

export function resetMockDb() {
  db = createDb();
  return save();
}

// ── Helpers ─────────────────────────────────────────────────

const fail = (message: string): never => {
  throw new Error(message);
};

const nextId = (prefix: string) => `${prefix}-${++db.seq}`;

const ACTIVE: OrderStatus[] = ["confirming", "accepted", "preparing", "ready"];
const DONE: OrderStatus[] = ["delivered", "completed"];

const isDone = (o: Order) => DONE.includes(o.status);

function paginate<T>(rows: T[], page = 1, pageSize = 20): Paginated<T> {
  const p = Math.max(1, Number(page) || 1);
  const size = Math.max(1, Number(pageSize) || 20);
  return { data: rows.slice((p - 1) * size, p * size), total: rows.length, page: p, page_size: size };
}

function refreshCategoryCounts() {
  db.categories.forEach((c) => {
    c.product_count = db.products.filter((p) => p.category === c.category_name && p.status !== "Inactive").length;
  });
}
refreshCategoryCounts();

function addNotification(n: Omit<AppNotification, "name" | "read" | "creation">) {
  db.notifications.unshift({ ...n, name: nextId("NTF"), read: false, creation: new Date().toISOString() });
}

/** Simulates a customer placing a new order every ~75 seconds while the store is open. */
function maybeInjectIncomingOrder() {
  const now = Date.now();
  if (!db.store.is_open || db.store.busy_mode) return;
  if (now - db.lastIncomingAt < 75_000) return;
  db.lastIncomingAt = now;
  const order = seed.buildOrder(++db.seq, now, "confirming", db.products, seed.createRandom(now));
  db.orders.unshift(order);
  addNotification({
    type: "order",
    title: "New order received",
    body: `${order.customer_name} placed ${order.name} · ${order.item_count} item${order.item_count > 1 ? "s" : ""}`,
    link: `/orders?order=${order.name}`,
  });
  save();
}

// ── Period math ─────────────────────────────────────────────

const PERIOD_DAYS: Record<Period, number> = { today: 1, week: 7, month: 30, quarter: 90 };

function rangeFor(period: Period, offset = 0) {
  const days = PERIOD_DAYS[period] ?? 7;
  const end = new Date();
  if (period === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return { start: start.getTime() - offset * DAY, end: end.getTime() - offset * DAY };
  }
  return { start: end.getTime() - days * DAY * (offset + 1), end: end.getTime() - days * DAY * offset };
}

const inRange = (o: Order, r: { start: number; end: number }) => {
  const t = +new Date(o.creation);
  return t >= r.start && t < r.end;
};

function summarize(orders: Order[]) {
  const done = orders.filter(isDone);
  const revenue = round2(done.reduce((s, o) => s + o.subtotal, 0));
  const cancelled = orders.filter((o) => o.status === "cancelled" || o.status === "rejected").length;
  return {
    revenue,
    orders: done.length,
    aov: done.length ? round2(revenue / done.length) : 0,
    cancelRate: orders.length ? round2((cancelled / orders.length) * 100) : 0,
  };
}

function topProducts(orders: Order[], limit = 5) {
  const map = new Map<string, { product: string; product_name: string; quantity: number; revenue: number }>();
  orders.filter(isDone).forEach((o) =>
    o.order_items.forEach((it) => {
      const row = map.get(it.product) ?? { product: it.product, product_name: it.product_name, quantity: 0, revenue: 0 };
      row.quantity += it.quantity;
      row.revenue = round2(row.revenue + it.total_price);
      map.set(it.product, row);
    }),
  );
  return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

function dailySeries(orders: Order[], days: number) {
  const out: Array<{ date: string; revenue: number; orders: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const start = d.getTime() - i * DAY;
    const s = summarize(orders.filter((o) => inRange(o, { start, end: start + DAY })));
    out.push({ date: new Date(start).toISOString(), revenue: s.revenue, orders: s.orders });
  }
  return out;
}

function hourlySeries(orders: Order[]) {
  const out: Array<{ date: string; revenue: number; orders: number }> = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let h = 6; h <= 23; h++) {
    const start = d.getTime() + h * 3_600_000;
    const s = summarize(orders.filter((o) => inRange(o, { start, end: start + 3_600_000 })));
    out.push({ date: new Date(start).toISOString(), revenue: s.revenue, orders: s.orders });
  }
  return out;
}

// ── Handlers ────────────────────────────────────────────────

type Handler = (params: any) => unknown;

export const mockHandlers: Partial<Record<Endpoint, Handler>> = {
  // Auth
  [E.login]: ({ phone }: { phone: string }) => {
    if (!phone || String(phone).replace(/\D/g, "").length < 7) fail("Enter a valid phone number");
    return { success: true, otp_sent: true, message: `Demo mode: use code ${MOCK_OTP}` };
  },
  [E.verifyOtp]: ({ otp }: { phone: string; otp: string }) => {
    if (String(otp) !== MOCK_OTP) fail("Incorrect code. Please try again.");
    return { success: true, store: db.store, user: db.user, api_key: "mock_key", api_secret: "mock_secret" };
  },
  [E.logout]: () => ({ success: true }),

  // Store
  [E.getProfile]: () => ({ success: true, store: db.store, user: db.user }),
  [E.updateProfile]: (data: Partial<Store>) => {
    const allowed: Array<keyof Store> = ["store_name", "description", "logo", "cover_image", "phone", "email", "address", "delivery_time_min", "delivery_time_max", "delivery_fee", "minimum_order", "preparation_time", "accepts_scheduled_orders"];
    allowed.forEach((k) => {
      if (k in data) (db.store as any)[k] = data[k];
    });
    save();
    return { success: true, store: db.store };
  },
  [E.updateStatus]: ({ is_open }: { is_open: boolean | number }) => {
    db.store.is_open = Number(is_open) ? 1 : 0;
    if (!db.store.is_open) db.store.busy_mode = 0;
    save();
    return { success: true, is_open: db.store.is_open };
  },
  [E.setBusyMode]: ({ busy }: { busy: boolean }) => {
    db.store.busy_mode = busy ? 1 : 0;
    save();
    return { success: true, busy_mode: db.store.busy_mode };
  },
  [E.getHours]: () => ({ success: true, hours: db.hours }),
  [E.updateHours]: ({ hours }: { hours: StoreHours }) => {
    db.hours = hours;
    save();
    return { success: true, hours: db.hours };
  },

  // Dashboard & analytics
  [E.getDashboard]: (): { success: true; data: DashboardData } => {
    maybeInjectIncomingOrder();
    const today = rangeFor("today");
    const yesterday = rangeFor("today", 1);
    const t = summarize(db.orders.filter((o) => inRange(o, today)));
    const y = summarize(db.orders.filter((o) => inRange(o, yesterday)));
    const todayOrders = db.orders.filter((o) => inRange(o, today));
    const count = (s: OrderStatus[]) => todayOrders.filter((o) => s.includes(o.status)).length;
    const week = db.orders.filter((o) => inRange(o, rangeFor("week")));
    const recentReviews = [...db.reviews].sort((a, b) => +new Date(b.creation) - +new Date(a.creation)).slice(0, 3);
    return {
      success: true,
      data: {
        store_name: db.store.store_name,
        is_open: db.store.is_open,
        kpis: {
          revenue: { value: t.revenue, previous: y.revenue },
          orders: { value: t.orders, previous: y.orders },
          avg_order_value: { value: t.aov, previous: y.aov },
          rating: { value: db.store.rating, previous: 4.6 },
        },
        today: {
          confirming: db.orders.filter((o) => o.status === "confirming").length,
          accepted: db.orders.filter((o) => o.status === "accepted").length,
          preparing: db.orders.filter((o) => o.status === "preparing").length,
          ready: db.orders.filter((o) => o.status === "ready").length,
          completed: count(DONE),
          cancelled: count(["cancelled", "rejected"]),
        },
        trend: dailySeries(db.orders, 7),
        top_products: topProducts(week),
        recent_orders: db.orders.slice(0, 6),
        recent_reviews: recentReviews,
      },
    };
  },
  [E.getAnalytics]: ({ period = "today" }: { period: Period }) => {
    const s = summarize(db.orders.filter((o) => inRange(o, rangeFor(period))));
    return { success: true, period, total_orders: s.orders, total_revenue: s.revenue, pending_orders: db.orders.filter((o) => ACTIVE.includes(o.status)).length, average_order_value: s.aov };
  },
  [E.getReports]: ({ period = "week" }: { period: Period }): { success: true; data: ReportsData } => {
    const cur = db.orders.filter((o) => inRange(o, rangeFor(period)));
    const prev = db.orders.filter((o) => inRange(o, rangeFor(period, 1)));
    const c = summarize(cur);
    const p = summarize(prev);
    const commission = db.store.commission_rate / 100;
    const prep = (orders: Order[]) => {
      const mins = orders
        .map((o) => {
          const a = o.timeline.find((t) => t.status === "accepted");
          const r = o.timeline.find((t) => t.status === "ready");
          return a && r ? (+new Date(r.timestamp) - +new Date(a.timestamp)) / MIN : null;
        })
        .filter((m): m is number => m !== null);
      return mins.length ? round2(mins.reduce((s, m) => s + m, 0) / mins.length) : 0;
    };
    const byHour = Array.from({ length: 18 }, (_, i) => i + 6).map((h) => ({
      hour: `${h % 12 || 12}${h < 12 ? "am" : "pm"}`,
      orders: cur.filter((o) => new Date(o.creation).getHours() === h).length,
    }));
    const methods = ["mobile_money", "cash", "card", "wallet"] as const;
    const byPayment = methods.map((m) => {
      const rows = cur.filter((o) => isDone(o) && o.payment_method === m);
      return { method: m, orders: rows.length, revenue: round2(rows.reduce((s, o) => s + o.subtotal, 0)) };
    });
    const catRevenue = new Map<string, number>();
    cur.filter(isDone).forEach((o) =>
      o.order_items.forEach((it) => {
        const cat = db.products.find((p) => p.name === it.product)?.category ?? "Other";
        catRevenue.set(cat, round2((catRevenue.get(cat) ?? 0) + it.total_price));
      }),
    );
    return {
      success: true,
      data: {
        period,
        kpis: {
          revenue: { value: c.revenue, previous: p.revenue },
          net_earnings: { value: round2(c.revenue * (1 - commission)), previous: round2(p.revenue * (1 - commission)) },
          orders: { value: c.orders, previous: p.orders },
          avg_order_value: { value: c.aov, previous: p.aov },
          cancel_rate: { value: c.cancelRate, previous: p.cancelRate },
          avg_prep_minutes: { value: prep(cur), previous: prep(prev) },
        },
        series: period === "today" ? hourlySeries(db.orders) : dailySeries(db.orders, PERIOD_DAYS[period]),
        by_hour: byHour,
        by_payment: byPayment,
        by_category: [...catRevenue.entries()].map(([category, revenue]) => ({ category, revenue })).sort((a, b) => b.revenue - a.revenue),
        top_products: topProducts(cur, 8),
      },
    };
  },

  [E.getBanners]: () => ({ success: true, banners: banners().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) }),
  [E.createBanner]: (input: Omit<Banner, "name">) => {
    if (!input.title?.trim()) fail("Title is required");
    const list = banners();
    const banner: Banner = { ...input, name: nextId("BN"), is_active: input.is_active ?? 1, sort_order: Math.max(0, ...list.map((b) => b.sort_order ?? 0)) + 1 };
    list.push(banner);
    save();
    return { success: true, banner };
  },
  [E.updateBanner]: ({ banner_id, ...changes }: { banner_id: string } & Partial<Banner>) => {
    const banner = banners().find((b) => b.name === banner_id) ?? fail("Banner not found");
    Object.assign(banner, changes);
    save();
    return { success: true, banner };
  },
  [E.deleteBanner]: ({ banner_id }: { banner_id: string }) => {
    db.banners = banners().filter((b) => b.name !== banner_id);
    save();
    return { success: true };
  },

  // Orders
  [E.getOrders]: ({ status, search, page, page_size }: OrderListParams) => {
    maybeInjectIncomingOrder();
    let rows = db.orders;
    if (status === "active") rows = rows.filter((o) => ACTIVE.includes(o.status));
    else if (status === "history") rows = rows.filter((o) => !ACTIVE.includes(o.status));
    else if (status) rows = rows.filter((o) => o.status === status);
    if (search) {
      const q = String(search).toLowerCase();
      rows = rows.filter((o) => o.name.toLowerCase().includes(q) || o.customer_name.toLowerCase().includes(q) || o.customer_phone.includes(q));
    }
    return { success: true, ...paginate(rows, page, page_size) };
  },
  [E.getOrderCounts]: (): { success: true; counts: OrderCounts } => {
    const c = (s: OrderStatus) => db.orders.filter((o) => o.status === s).length;
    const active = db.orders.filter((o) => ACTIVE.includes(o.status)).length;
    return { success: true, counts: { confirming: c("confirming"), accepted: c("accepted"), preparing: c("preparing"), ready: c("ready"), active, history: db.orders.length - active } };
  },
  [E.getOrder]: ({ order_id }: { order_id: string }) => {
    const order = db.orders.find((o) => o.name === order_id) ?? fail("Order not found");
    return { success: true, order };
  },
  [E.updateOrderStatus]: ({ order_number, status, reject_reason }: { order_number: string; status: OrderStatus; reject_reason?: string }) => {
    const order = db.orders.find((o) => o.name === order_number) ?? fail("Order not found");
    const transitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
      confirming: ["accepted", "rejected"],
      accepted: ["preparing"],
      preparing: ["ready"],
      ...(order.delivery_type.includes("pickup") ? { ready: ["completed"] as OrderStatus[] } : {}),
    };
    if (!transitions[order.status]?.includes(status)) fail("Invalid status transition");
    order.status = status;
    if (status === "rejected") {
      order.cancel_reason = reject_reason;
      order.payment_status = order.payment_status === "paid" ? "refunded" : order.payment_status;
    }
    if (status === "ready" && !order.delivery_type.includes("pickup")) {
      order.driver_name = "Abdikarim M.";
      order.driver_phone = "+252617771234";
    }
    order.timeline.push({ status, timestamp: new Date().toISOString(), actor_type: "store", note: status === "rejected" ? reject_reason : undefined });
    db.notifications.forEach((n) => {
      if (n.link?.endsWith(order.name)) n.read = true;
    });
    save();
    return { success: true, order };
  },

  // Products
  [E.getProducts]: ({ category, status, search, availability, page, page_size }: ProductListParams) => {
    let rows = [...db.products].sort((a, b) => a.sort_order - b.sort_order);
    if (category) rows = rows.filter((p) => p.category === category);
    if (status) rows = rows.filter((p) => p.status === status);
    if (availability) rows = rows.filter((p) => (availability === "available" ? p.is_available : !p.is_available));
    if (search) {
      const q = String(search).toLowerCase();
      rows = rows.filter((p) => p.product_name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    return { success: true, ...paginate(rows, page, page_size ?? 100) };
  },
  [E.createProduct]: (input: Partial<Product>) => {
    if (!input.product_name?.trim()) fail("Product name is required");
    if (!(Number(input.price) > 0)) fail("Price must be greater than 0");
    const product: Product = {
      name: nextId("PROD"),
      product_name: input.product_name!.trim(),
      description: input.description ?? "",
      category: input.category ?? db.categories[0].category_name,
      price: Number(input.price),
      discount_price: input.discount_price ? Number(input.discount_price) : undefined,
      image: input.image,
      is_available: input.is_available ?? 1,
      is_popular: input.is_popular ?? 0,
      is_featured: input.is_featured ?? 0,
      preparation_time: input.preparation_time,
      status: "Pending",
      sort_order: db.products.length + 1,
      sold_count: 0,
      rating: 0,
    };
    db.products.push(product);
    refreshCategoryCounts();
    addNotification({ type: "product", title: "Product submitted", body: `“${product.product_name}” is waiting for Diyaar approval.`, link: "/products" });
    save();
    return { success: true, product };
  },
  [E.updateProduct]: ({ product_id, ...changes }: { product_id: string } & Partial<Product>) => {
    const product = db.products.find((p) => p.name === product_id) ?? fail("Product not found");
    Object.assign(product, changes);
    refreshCategoryCounts();
    save();
    return { success: true, product };
  },
  [E.deleteProduct]: ({ product_id }: { product_id: string }) => {
    db.products = db.products.filter((p) => p.name !== product_id);
    refreshCategoryCounts();
    save();
    return { success: true, message: "Product deleted" };
  },

  // Categories
  [E.getCategories]: () => ({ success: true, categories: [...db.categories].sort((a, b) => a.sort_order - b.sort_order) }),
  [E.createCategory]: ({ category_name, description, image }: { category_name: string; description?: string; image?: string }) => {
    if (!category_name?.trim()) fail("Category name is required");
    if (db.categories.some((c) => c.category_name.toLowerCase() === category_name.trim().toLowerCase())) fail("A category with this name already exists");
    const category: Category = { name: nextId("CAT"), category_name: category_name.trim(), description, image, is_active: 1, sort_order: db.categories.length + 1, product_count: 0 };
    db.categories.push(category);
    save();
    return { success: true, category };
  },
  [E.updateCategory]: ({ category_id, ...changes }: { category_id: string } & Partial<Category>) => {
    const category = db.categories.find((c) => c.name === category_id) ?? fail("Category not found");
    if (changes.category_name && changes.category_name !== category.category_name) {
      db.products.forEach((p) => {
        if (p.category === category.category_name) p.category = changes.category_name!;
      });
    }
    Object.assign(category, changes);
    save();
    return { success: true, category };
  },
  [E.deleteCategory]: ({ category_id }: { category_id: string }) => {
    const category = db.categories.find((c) => c.name === category_id) ?? fail("Category not found");
    if (category.product_count > 0) fail("Move or delete the products in this category first");
    db.categories = db.categories.filter((c) => c.name !== category_id);
    save();
    return { success: true };
  },

  // Reviews
  [E.getReviews]: ({ rating, filter, page, page_size }: { rating?: number; filter?: "all" | "unreplied"; page?: number; page_size?: number }) => {
    let rows = [...db.reviews].sort((a, b) => +new Date(b.creation) - +new Date(a.creation));
    const summary: ReviewSummary = {
      average: db.store.rating,
      total: rows.length,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      unreplied: rows.filter((r) => !r.reply).length,
    };
    rows.forEach((r) => (summary.distribution[r.rating as 1 | 2 | 3 | 4 | 5] += 1));
    if (rating) rows = rows.filter((r) => r.rating === Number(rating));
    if (filter === "unreplied") rows = rows.filter((r) => !r.reply);
    return { success: true, summary, ...paginate(rows, page, page_size ?? 20) };
  },
  [E.replyReview]: ({ review_id, reply }: { review_id: string; reply: string }) => {
    const review = db.reviews.find((r) => r.name === review_id) ?? fail("Review not found");
    if (!reply?.trim()) fail("Reply cannot be empty");
    review.reply = reply.trim();
    review.reply_at = new Date().toISOString();
    save();
    return { success: true, review };
  },

  // Earnings
  [E.getEarnings]: (): { success: true; data: EarningsData } => {
    const rate = db.store.commission_rate;
    const tx = seed.buildTransactions(db.orders, db.payouts, rate);
    const lastPayout = db.payouts.find((p) => p.status !== "failed");
    const since = lastPayout ? +new Date(lastPayout.period_end) : 0;
    const unpaid = db.orders.filter((o) => isDone(o) && +new Date(o.creation) > since);
    const gross = round2(unpaid.reduce((s, o) => s + o.subtotal, 0));
    const month = db.orders.filter((o) => isDone(o) && inRange(o, rangeFor("month")));
    const monthGross = round2(month.reduce((s, o) => s + o.subtotal, 0));
    const allDone = db.orders.filter(isDone);
    const totalGross = round2(allDone.reduce((s, o) => s + o.subtotal, 0));
    const nextPayout = new Date();
    nextPayout.setDate(nextPayout.getDate() + ((8 - nextPayout.getDay()) % 7 || 7));
    return {
      success: true,
      data: {
        summary: {
          available_balance: round2(gross * (1 - rate / 100) * 0.7),
          pending_balance: round2(gross * (1 - rate / 100) * 0.3),
          total_earned: round2(totalGross * (1 - rate / 100)),
          commission_paid: round2((totalGross * rate) / 100),
          commission_rate: rate,
          next_payout_date: nextPayout.toISOString(),
          this_month_gross: monthGross,
          this_month_net: round2(monthGross * (1 - rate / 100)),
        },
        transactions: tx.slice(0, 120),
        payouts: db.payouts,
        account: db.account,
      },
    };
  },
  [E.requestPayout]: () => {
    if (db.payouts[0]?.status === "processing") fail("A payout is already being processed");
    const amount = (mockHandlers[E.getEarnings]!({}) as any).data.summary.available_balance;
    if (amount < 10) fail("Minimum payout is $10");
    const now = new Date();
    db.payouts.unshift({ name: nextId("PAY"), amount, status: "processing", method: "EVC Plus", account: "•••• 0107", period_start: new Date(+now - 7 * DAY).toISOString(), period_end: now.toISOString(), creation: now.toISOString() });
    save();
    return { success: true, message: "Payout requested" };
  },

  // Promotions
  [E.getPromotions]: () => ({ success: true, promotions: db.promotions }),
  [E.createPromotion]: (input: Omit<Promotion, "name" | "status" | "usage_count" | "revenue">) => {
    if (!input.title?.trim()) fail("Title is required");
    if (new Date(input.ends_at) <= new Date(input.starts_at)) fail("End date must be after the start date");
    const starts = new Date(input.starts_at);
    const promo: Promotion = { ...input, name: nextId("PROMO"), status: starts > new Date() ? "scheduled" : "active", usage_count: 0, revenue: 0 };
    db.promotions.unshift(promo);
    save();
    return { success: true, promotion: promo };
  },
  [E.updatePromotion]: ({ promotion_id, ...changes }: { promotion_id: string } & Partial<Promotion>) => {
    const promo = db.promotions.find((p) => p.name === promotion_id) ?? fail("Promotion not found");
    Object.assign(promo, changes);
    save();
    return { success: true, promotion: promo };
  },
  [E.deletePromotion]: ({ promotion_id }: { promotion_id: string }) => {
    db.promotions = db.promotions.filter((p) => p.name !== promotion_id);
    save();
    return { success: true };
  },

  // Team
  [E.getTeam]: () => ({ success: true, members: db.team }),
  [E.inviteMember]: ({ full_name, email, phone, role }: Pick<TeamMember, "full_name" | "email" | "phone" | "role">) => {
    if (!full_name?.trim() || !email?.includes("@")) fail("Name and a valid email are required");
    if (db.team.some((m) => m.email.toLowerCase() === email.toLowerCase())) fail("This person is already on your team");
    const member: TeamMember = { name: email, full_name, email, phone, role, status: "invited" };
    db.team.push(member);
    save();
    return { success: true, member };
  },
  [E.updateMember]: ({ member_id, ...changes }: { member_id: string } & Partial<TeamMember>) => {
    const member = db.team.find((m) => m.name === member_id) ?? fail("Member not found");
    if (member.role === "Owner") fail("The owner account cannot be changed here");
    Object.assign(member, changes);
    save();
    return { success: true, member };
  },
  [E.removeMember]: ({ member_id }: { member_id: string }) => {
    const member = db.team.find((m) => m.name === member_id) ?? fail("Member not found");
    if (member.role === "Owner") fail("The owner cannot be removed");
    db.team = db.team.filter((m) => m.name !== member_id);
    save();
    return { success: true };
  },

  // Notifications
  [E.getNotifications]: () => {
    maybeInjectIncomingOrder();
    return { success: true, notifications: db.notifications.slice(0, 50), unread: db.notifications.filter((n) => !n.read).length };
  },
  [E.markNotificationsRead]: ({ ids }: { ids?: string[] }) => {
    db.notifications.forEach((n) => {
      if (!ids || ids.includes(n.name)) n.read = true;
    });
    save();
    return { success: true };
  },

  // Support
  [E.getTickets]: () => ({ success: true, tickets: [...db.tickets].sort((a, b) => +new Date(b.modified) - +new Date(a.modified)) }),
  [E.createTicket]: ({ subject, category, priority, order, message }: { subject: string; category: SupportTicket["category"]; priority: SupportTicket["priority"]; order?: string; message: string }) => {
    if (!subject?.trim() || !message?.trim()) fail("Subject and message are required");
    const now = new Date().toISOString();
    const ticket: SupportTicket = {
      name: nextId("TCK"),
      subject: subject.trim(),
      category,
      priority,
      status: "open",
      order: order || undefined,
      creation: now,
      modified: now,
      messages: [{ name: nextId("M"), from: "store", author: db.user.full_name, body: message.trim(), creation: now }],
    };
    db.tickets.unshift(ticket);
    save();
    return { success: true, ticket };
  },
  [E.replyTicket]: ({ ticket_id, message, status }: { ticket_id: string; message?: string; status?: TicketStatus }) => {
    const ticket = db.tickets.find((t) => t.name === ticket_id) ?? fail("Ticket not found");
    const now = new Date().toISOString();
    if (message?.trim()) {
      ticket.messages.push({ name: nextId("M"), from: "store", author: db.user.full_name, body: message.trim(), creation: now });
      if (ticket.status === "resolved" || ticket.status === "closed") ticket.status = "open";
    }
    if (status) ticket.status = status;
    ticket.modified = now;
    save();
    return { success: true, ticket };
  },

  // Settings
  [E.getSettings]: () => ({ success: true, settings: db.settings }),
  [E.updateSettings]: ({ settings }: { settings: StoreSettings }) => {
    db.settings = settings;
    db.store.auto_accept_orders = settings.orders.auto_accept_orders ? 1 : 0;
    save();
    return { success: true, settings: db.settings };
  },
};
