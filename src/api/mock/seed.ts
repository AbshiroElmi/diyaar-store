/**
 * Builds the demo store's data. Uses a fixed random seed so every
 * fresh start looks the same, with dates relative to "now".
 */

import type {
  AppNotification,
  Category,
  HolidayClosure,
  OpeningHours,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  Payout,
  Product,
  Promotion,
  Review,
  Store,
  StoreSettings,
  StoreUser,
  SupportTicket,
  TeamMember,
  Transaction,
  BankAccount,
  DeliveryType,
} from "../types";

// ── Deterministic random ────────────────────────────────────

export function createRandom(seed: number) {
  let s = seed;
  const next = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T,>(arr: readonly T[]) => arr[Math.floor(next() * arr.length)],
    chance: (p: number) => next() < p,
  };
}

const rnd = createRandom(20261024);

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const iso = (ms: number) => new Date(ms).toISOString();
const round2 = (n: number) => Math.round(n * 100) / 100;

// ── Store ───────────────────────────────────────────────────

export const seedStore = (): Store => ({
  name: "STORE-0007",
  store_name: "Xamar Grill & Café",
  description: "Charcoal-grilled meats, fresh juices and Somali breakfast classics, made to order since 2019.",
  logo: undefined,
  cover_image: undefined,
  phone: "+252 61 555 0107",
  email: "hello@xamargrill.so",
  address: "Maka Al Mukarama Rd, near KM4",
  city: "Mogadishu",
  service_type: "Food Delivery",
  status: "Active",
  is_open: 1,
  busy_mode: 0,
  rating: 4.7,
  review_count: 0,
  delivery_time_min: 25,
  delivery_time_max: 40,
  delivery_fee: 1.5,
  minimum_order: 5,
  preparation_time: 18,
  accepts_scheduled_orders: 1,
  auto_accept_orders: 0,
  commission_rate: 15,
  owner_name: "Abdi Hassan",
  owner_phone: "+252613187029",
});

export const seedUser = (): StoreUser => ({
  name: "abdi@xamargrill.so",
  full_name: "Abdi Hassan",
  email: "abdi@xamargrill.so",
  phone: "+252613187029",
  role: "Owner",
});

// ── Catalog ─────────────────────────────────────────────────

const CATEGORY_DEFS: Array<[string, string]> = [
  ["Breakfast", "Served until 11:30 AM"],
  ["Grills", "Charcoal-grilled meats and platters"],
  ["Rice & Pasta", "Bariis, baasto and house specials"],
  ["Sandwiches & Wraps", "Quick bites and shawarma"],
  ["Fresh Juices", "Pressed to order"],
  ["Desserts", "Sweet endings"],
];

const PRODUCT_DEFS: Array<[string, string, number, string]> = [
  ["Canjeero with Suqaar", "Breakfast", 4.5, "Somali pancakes with diced beef suqaar and onions."],
  ["Beer Iyo Muufo", "Breakfast", 5, "Pan-fried liver with fresh muufo bread."],
  ["Foul & Eggs", "Breakfast", 3.5, "Slow-cooked fava beans with two eggs and bread."],
  ["Mixed Grill Platter", "Grills", 14, "Lamb chops, chicken tikka and kebab with salad and bariis."],
  ["Grilled Chicken Half", "Grills", 8.5, "Half chicken marinated 24h in xawaash spices."],
  ["Lamb Chops", "Grills", 12, "Six chops, charcoal-grilled, with garlic sauce."],
  ["Hilib Ari (Goat Meat)", "Grills", 11, "Tender goat on the bone with banana on the side."],
  ["Beef Kebab Skewers", "Grills", 7.5, "Three skewers with grilled tomatoes and peppers."],
  ["Bariis Iskukaris", "Rice & Pasta", 6.5, "Spiced Somali rice with raisins and fried onions."],
  ["Baasto Suugo", "Rice & Pasta", 6, "Spaghetti with rich Somali meat sauce."],
  ["Chicken Biryani", "Rice & Pasta", 7, "Fragrant basmati with tender chicken."],
  ["Chicken Shawarma Wrap", "Sandwiches & Wraps", 4, "Garlic toum, pickles and fries inside."],
  ["Beef Burger Deluxe", "Sandwiches & Wraps", 6.5, "Double patty, cheddar, house sauce."],
  ["Falafel Wrap", "Sandwiches & Wraps", 3.5, "Crispy falafel, tahini and fresh veg."],
  ["Mango Juice", "Fresh Juices", 2.5, "Fresh mango, no sugar added."],
  ["Papaya & Lime", "Fresh Juices", 2.5, "Papaya pressed with fresh lime."],
  ["Avocado Shake", "Fresh Juices", 3, "Creamy avocado with milk and honey."],
  ["Cambe & Ginger", "Fresh Juices", 2.75, "Mango with a ginger kick."],
  ["Xalwo Cup", "Desserts", 2.5, "Traditional Somali sweet with cardamom."],
  ["Kac Kac", "Desserts", 2, "Fried sweet dough, six pieces."],
  ["Basbousa", "Desserts", 3, "Semolina cake with syrup and coconut."],
];

export function seedCatalog(): { categories: Category[]; products: Product[] } {
  const categories: Category[] = CATEGORY_DEFS.map(([category_name, description], i) => ({
    name: `CAT-${String(i + 1).padStart(3, "0")}`,
    category_name,
    description,
    is_active: 1,
    sort_order: i + 1,
    product_count: 0,
  }));

  const products: Product[] = PRODUCT_DEFS.map(([product_name, category, price, description], i) => {
    const status = i === 20 ? "Pending" : i === 7 ? "Inactive" : "Active";
    return {
      name: `PROD-${String(i + 1).padStart(4, "0")}`,
      product_name,
      description,
      category,
      price,
      discount_price: i === 3 ? 12.5 : i === 11 ? 3.5 : undefined,
      is_available: i === 6 || i === 16 ? 0 : 1,
      is_popular: [0, 3, 8, 11, 14].includes(i) ? 1 : 0,
      is_featured: [3, 4].includes(i) ? 1 : 0,
      preparation_time: rnd.int(8, 25),
      status,
      sort_order: i + 1,
      sold_count: rnd.int(20, 640),
      rating: round2(3.9 + rnd.next() * 1.1),
    } as Product;
  });

  return { categories, products };
}

// ── Orders ──────────────────────────────────────────────────

const FIRST = ["Ahmed", "Fadumo", "Hodan", "Mohamed", "Ayaan", "Hassan", "Ifrah", "Omar", "Sahra", "Yusuf", "Nasra", "Ali", "Hamdi", "Abdirahman", "Khadra", "Bashir", "Ilhan", "Liban"];
const LAST = ["Ali", "Warsame", "Abdi", "Farah", "Hussein", "Mohamud", "Osman", "Jama", "Nur", "Aden", "Ibrahim", "Yusuf"];
const AREAS = ["Hodan, KM5", "Wadajir, Airport Rd", "Hamar Weyne", "Waberi, Taleex", "Dharkenley", "Howlwadaag, Bakaara", "Karaan", "Shibis, Sana'a St"];
const DRIVERS = ["Abdikarim M.", "Said O.", "Mahad F.", "Guled A.", "Daud H."];
const NOTES = ["Extra spicy please", "No onions", "Call when outside", "Ring the bell twice", "Less sugar in the juice"];

const randomPhone = () => `+25261${rnd.int(1000000, 9999999)}`;
export const randomCustomer = () => `${rnd.pick(FIRST)} ${rnd.pick(LAST)}`;

export function buildOrder(
  seq: number,
  createdAt: number,
  status: OrderStatus,
  products: Product[],
  random = rnd,
): Order {
  const active = products.filter((p) => p.status === "Active");
  const lineCount = random.int(1, 4);
  const items: OrderItem[] = [];
  for (let i = 0; i < lineCount; i++) {
    const p = random.pick(active);
    if (items.some((it) => it.product === p.name)) continue;
    const quantity = random.chance(0.75) ? 1 : random.int(2, 3);
    const unit = p.discount_price ?? p.price;
    items.push({
      product: p.name,
      product_name: p.product_name,
      quantity,
      unit_price: unit,
      total_price: round2(unit * quantity),
      special_instructions: random.chance(0.12) ? random.pick(NOTES) : undefined,
    });
  }

  const deliveryType: DeliveryType = random.chance(0.18) ? "pickup" : random.chance(0.06) ? "scheduled_delivery" : "delivery";
  const isPickup = deliveryType === "pickup";
  const subtotal = round2(items.reduce((s, it) => s + it.total_price, 0));
  const delivery_fee = isPickup ? 0 : 1.5;
  const discount = random.chance(0.15) ? round2(subtotal * 0.1) : 0;
  const payment_method: PaymentMethod = random.pick(["mobile_money", "mobile_money", "cash", "card", "wallet"] as const);

  const flow: OrderStatus[] = isPickup
    ? ["confirming", "accepted", "preparing", "ready", "completed"]
    : ["confirming", "accepted", "preparing", "ready", "picked_up", "delivered"];
  const timeline: Order["timeline"] = [];
  if (status === "rejected" || status === "cancelled") {
    timeline.push({ status: "confirming", timestamp: iso(createdAt), actor_type: "customer" });
    timeline.push({
      status,
      timestamp: iso(createdAt + random.int(1, 6) * MIN),
      actor_type: status === "rejected" ? "store" : "customer",
      note: status === "rejected" ? "Item out of stock" : "Customer changed their mind",
    });
  } else {
    const upto = flow.indexOf(status === "completed" && !isPickup ? "delivered" : status);
    let t = createdAt;
    flow.slice(0, upto + 1).forEach((s, i) => {
      timeline.push({ status: s, timestamp: iso(t), actor_type: i === 0 ? "customer" : s === "picked_up" || s === "delivered" ? "driver" : "store" });
      t += random.int(2, 12) * MIN;
    });
  }

  const hasDriver = !isPickup && ["ready", "picked_up", "delivered", "completed"].includes(status);

  return {
    name: `DY-${String(seq).padStart(6, "0")}`,
    status,
    creation: iso(createdAt),
    customer_name: randomCustomer(),
    customer_phone: randomPhone(),
    delivery_type: deliveryType,
    delivery_address: isPickup ? undefined : `${random.pick(AREAS)}, Mogadishu`,
    scheduled_for: deliveryType === "scheduled_delivery" ? iso(createdAt + 2 * HOUR) : undefined,
    payment_method,
    payment_status: payment_method === "cash" && !["delivered", "completed"].includes(status) ? "unpaid" : status === "rejected" || status === "cancelled" ? "refunded" : "paid",
    subtotal,
    delivery_fee,
    discount,
    grand_total: round2(subtotal + delivery_fee - discount),
    notes: random.chance(0.2) ? random.pick(NOTES) : undefined,
    order_items: items,
    item_count: items.reduce((s, it) => s + it.quantity, 0),
    driver_name: hasDriver ? random.pick(DRIVERS) : undefined,
    driver_phone: hasDriver ? randomPhone() : undefined,
    cancel_reason: status === "rejected" ? "Item out of stock" : status === "cancelled" ? "Customer changed their mind" : undefined,
    timeline,
  };
}

export function seedOrders(products: Product[], now: number): Order[] {
  const orders: Order[] = [];
  let seq = 48210;

  // Live queue right now
  const live: Array<[OrderStatus, number]> = [
    ["confirming", 1],
    ["confirming", 3],
    ["accepted", 6],
    ["preparing", 9],
    ["preparing", 14],
    ["ready", 19],
  ];
  live.forEach(([status, minsAgo]) => orders.push(buildOrder(seq++, now - minsAgo * MIN, status, products)));

  // History for the last 90 days
  for (let d = 0; d < 90; d++) {
    const dayStart = new Date(now - d * DAY);
    dayStart.setHours(0, 0, 0, 0);
    const weekend = [5, 6].includes(dayStart.getDay());
    const count = d === 0 ? 14 : rnd.int(weekend ? 22 : 14, weekend ? 34 : 26) - Math.floor(d / 30);
    for (let i = 0; i < count; i++) {
      const hour = rnd.pick([7, 8, 9, 11, 12, 12, 13, 13, 14, 17, 18, 19, 19, 20, 20, 21, 22]);
      const t = dayStart.getTime() + hour * HOUR + rnd.int(0, 59) * MIN;
      if (t > now - 25 * MIN) continue;
      const r = rnd.next();
      const status: OrderStatus = r < 0.04 ? "rejected" : r < 0.08 ? "cancelled" : rnd.chance(0.2) ? "completed" : "delivered";
      orders.push(buildOrder(seq++, t, status, products));
    }
  }

  return orders.sort((a, b) => +new Date(b.creation) - +new Date(a.creation));
}

// ── Reviews ─────────────────────────────────────────────────

const REVIEW_TEXT: Record<number, string[]> = {
  5: ["Best mixed grill in Mogadishu. Arrived hot!", "Fast delivery and the suqaar was perfect.", "Always consistent, my family's favourite.", "The mango juice is amazing, very fresh.", "Great portions, will order again."],
  4: ["Food was great, delivery took a bit long.", "Tasty biryani, could use a little more spice.", "Good value. Packaging could be better."],
  3: ["Okay overall, the fries were cold.", "Burger was fine, nothing special."],
  2: ["Order was missing the juice.", "Took over an hour to arrive."],
  1: ["Wrong order delivered and no one answered the phone."],
};

export function seedReviews(orders: Order[]): Review[] {
  const done = orders.filter((o) => o.status === "delivered" || o.status === "completed");
  const reviews: Review[] = [];
  done.slice(0, 160).forEach((o, i) => {
    if (!rnd.chance(0.35)) return;
    const r = rnd.next();
    const rating = r < 0.62 ? 5 : r < 0.86 ? 4 : r < 0.94 ? 3 : r < 0.98 ? 2 : 1;
    const created = +new Date(o.creation) + rnd.int(40, 180) * MIN;
    const replied = i > 12 && rnd.chance(0.92);
    reviews.push({
      name: `REV-${String(9000 + i)}`,
      order: o.name,
      customer_name: o.customer_name,
      rating,
      comment: rnd.pick(REVIEW_TEXT[rating]),
      creation: iso(created),
      reply: replied ? (rating >= 4 ? "Thank you! We're happy you enjoyed it. 🙏" : "Sorry about that — we've shared this with the kitchen team and will do better.") : undefined,
      reply_at: replied ? iso(created + 3 * HOUR) : undefined,
    });
  });
  return reviews;
}

// ── Money ───────────────────────────────────────────────────

export function seedPayouts(now: number): Payout[] {
  return Array.from({ length: 10 }, (_, i) => {
    const end = now - (i * 7 + 1) * DAY;
    return {
      name: `PAY-${String(3120 - i)}`,
      amount: round2(rnd.int(900, 1700) + rnd.next()),
      status: i === 6 ? "failed" : "paid",
      method: "EVC Plus",
      account: "•••• 0107",
      period_start: iso(end - 6 * DAY),
      period_end: iso(end),
      creation: iso(end + 2 * HOUR),
    } as Payout;
  });
}

export const seedAccount = (): BankAccount => ({
  bank_name: "EVC Plus (Hormuud)",
  account_name: "Xamar Grill & Café",
  account_number_masked: "+252 61 ••• 0107",
  method: "mobile_money",
});

export function buildTransactions(orders: Order[], payouts: Payout[], commissionRate: number): Transaction[] {
  const tx: Transaction[] = [];
  orders
    .filter((o) => o.status === "delivered" || o.status === "completed")
    .slice(0, 80)
    .forEach((o) => {
      tx.push({ name: `TX-${o.name}`, type: "order", reference: o.name, description: `Order ${o.name}`, amount: o.subtotal, creation: o.creation });
      tx.push({ name: `TX-${o.name}-C`, type: "commission", reference: o.name, description: `Diyaar commission (${commissionRate}%)`, amount: -round2((o.subtotal * commissionRate) / 100), creation: o.creation });
    });
  orders
    .filter((o) => o.status === "cancelled" && o.payment_status === "refunded")
    .slice(0, 5)
    .forEach((o) => tx.push({ name: `TX-${o.name}-R`, type: "refund", reference: o.name, description: `Refund for ${o.name}`, amount: -o.subtotal, creation: o.creation }));
  payouts
    .filter((p) => p.status !== "failed")
    .forEach((p) => tx.push({ name: `TX-${p.name}`, type: "payout", reference: p.name, description: `Payout to ${p.method}`, amount: -p.amount, creation: p.creation }));
  return tx.sort((a, b) => +new Date(b.creation) - +new Date(a.creation));
}

// ── Promotions ──────────────────────────────────────────────

export function seedPromotions(now: number): Promotion[] {
  return [
    { name: "PROMO-001", title: "Weekend Grill Deal", type: "percentage", value: 15, code: undefined, min_order: 10, starts_at: iso(now - 12 * DAY), ends_at: iso(now + 18 * DAY), status: "active", usage_count: 142, usage_limit: 500, revenue: 2140.5 },
    { name: "PROMO-002", title: "Free Delivery Fridays", type: "free_delivery", value: 0, code: undefined, min_order: 8, starts_at: iso(now - 30 * DAY), ends_at: iso(now + 30 * DAY), status: "active", usage_count: 311, revenue: 3988 },
    { name: "PROMO-003", title: "New Customer $3 Off", type: "fixed", value: 3, code: "XAMAR3", min_order: 12, starts_at: iso(now - 5 * DAY), ends_at: iso(now + 25 * DAY), status: "active", usage_count: 47, usage_limit: 200, revenue: 812.25 },
    { name: "PROMO-004", title: "Juice Buy 1 Get 1", type: "bogo", value: 0, code: undefined, min_order: 0, starts_at: iso(now + 4 * DAY), ends_at: iso(now + 11 * DAY), status: "scheduled", usage_count: 0, revenue: 0 },
    { name: "PROMO-005", title: "Ramadan Iftar Special", type: "percentage", value: 20, code: "IFTAR20", min_order: 15, starts_at: iso(now - 80 * DAY), ends_at: iso(now - 50 * DAY), status: "ended", usage_count: 528, usage_limit: 600, revenue: 9320 },
  ];
}

// ── Hours ───────────────────────────────────────────────────

export const seedHours = (): { weekly: OpeningHours[]; closures: HolidayClosure[] } => ({
  weekly: (["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const).map((day) => ({
    day,
    is_open: true,
    open_time: day === "Friday" ? "14:00" : "07:00",
    close_time: day === "Friday" || day === "Saturday" ? "23:30" : "22:30",
  })),
  closures: [{ name: "CL-1", title: "Independence Day", date: new Date(new Date().getFullYear() + 1, 6, 1).toISOString() }],
});

// ── Team ────────────────────────────────────────────────────

export const seedTeam = (now: number): TeamMember[] => [
  { name: "abdi@xamargrill.so", full_name: "Abdi Hassan", email: "[EMAIL_ADDRESS]", phone: "+252613187029", role: "Owner", status: "active", last_active: iso(now - 2 * MIN) },
  { name: "hodan@xamargrill.so", full_name: "Hodan Warsame", email: "hodan@xamargrill.so", phone: "+252613187029", role: "Manager", status: "active", last_active: iso(now - 40 * MIN) },
  { name: "omar@xamargrill.so", full_name: "Omar Jama", email: "omar@xamargrill.so", phone: "+252613187029", role: "Staff", status: "active", last_active: iso(now - 3 * HOUR) },
  { name: "sahra@xamargrill.so", full_name: "Sahra Nur", email: "sahra@xamargrill.so", phone: "+252613187029", role: "Staff", status: "invited" },
];

// ── Notifications ───────────────────────────────────────────

export const seedNotifications = (orders: Order[], now: number): AppNotification[] => {
  const pending = orders.filter((o) => o.status === "confirming");
  return [
    ...pending.map((o, i) => ({
      name: `NTF-O-${o.name}`,
      type: "order" as const,
      title: "New order received",
      body: `${o.customer_name} placed ${o.name} · ${o.item_count} item${o.item_count > 1 ? "s" : ""}`,
      read: false,
      creation: o.creation,
      link: `/orders?order=${o.name}`,
    })),
    { name: "NTF-1", type: "review", title: "New 5★ review", body: "“Best mixed grill in Mogadishu. Arrived hot!”", read: false, creation: iso(now - 50 * MIN), link: "/reviews" },
    { name: "NTF-2", type: "payout", title: "Payout processing", body: "Your weekly payout is on its way to EVC Plus.", read: false, creation: iso(now - 5 * HOUR), link: "/earnings" },
    { name: "NTF-3", type: "product", title: "Product under review", body: "“Basbousa” is waiting for Diyaar approval.", read: true, creation: iso(now - 1 * DAY), link: "/products" },
    { name: "NTF-4", type: "system", title: "New feature: Busy mode", body: "Pause new orders for 15–60 minutes when the kitchen is full.", read: true, creation: iso(now - 3 * DAY) },
    { name: "NTF-5", type: "review", title: "Review needs a reply", body: "A customer left a 2★ review about a late delivery.", read: true, creation: iso(now - 4 * DAY), link: "/reviews" },
  ];
};

// ── Support ─────────────────────────────────────────────────

export const seedTickets = (now: number): SupportTicket[] => [
  {
    name: "TCK-2041",
    subject: "Payout for last week shows as failed",
    category: "payment",
    priority: "high",
    status: "pending",
    creation: iso(now - 2 * DAY),
    modified: iso(now - 6 * HOUR),
    messages: [
      { name: "M1", from: "store", author: "Abdi Hassan", body: "Hi, the payout PAY-3114 is marked as failed. Can you check what happened?", creation: iso(now - 2 * DAY) },
      { name: "M2", from: "support", author: "Diyaar Support", body: "Thanks Abdi — the EVC transfer was rejected by the provider. We've retried it; you'll see it within 24 hours.", creation: iso(now - 6 * HOUR) },
    ],
  },
  {
    name: "TCK-2017",
    subject: "Customer says order was not delivered",
    category: "order",
    priority: "normal",
    status: "resolved",
    order: "DY-048233",
    creation: iso(now - 9 * DAY),
    modified: iso(now - 8 * DAY),
    messages: [
      { name: "M3", from: "store", author: "Hodan Warsame", body: "The driver marked it delivered, but the customer called us. Please check.", creation: iso(now - 9 * DAY) },
      { name: "M4", from: "support", author: "Diyaar Support", body: "We confirmed with the driver and the customer. Delivery was made to a neighbour. Closing this one.", creation: iso(now - 8 * DAY) },
    ],
  },
];

export const seedSettings = (): StoreSettings => ({
  notifications: {
    new_order_sound: true,
    new_order_push: true,
    new_order_sms: false,
    review_alerts: true,
    payout_alerts: true,
    daily_summary_email: true,
  },
  orders: {
    auto_accept_orders: false,
    accept_timeout_minutes: 5,
    print_receipt_on_accept: false,
  },
  language: "en",
});
