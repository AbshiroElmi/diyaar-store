/**
 * Maps raw Diyaar backend rows into the shapes in ./types.
 * The backend mixes casing and legacy values, so everything is normalised here.
 */

import { fileUrl } from "./client";
import type { DeliveryType, Order, OrderItem, OrderStatus, OrderTimelineEntry, PaymentMethod, Product, ProductStatus } from "./types";

type Row = Record<string, any>;

const num = (v: unknown) => Number(v) || 0;
const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

const ORDER_STATUS: Record<string, OrderStatus> = {
  pending: "confirming",
  "place order": "confirming",
  confirming: "confirming",
  confirmed: "accepted",
  accepted: "accepted",
  preparing: "preparing",
  ready: "ready",
  picking_up: "picked_up",
  "picking up": "picked_up",
  picked_up: "picked_up",
  heading_your_way: "picked_up",
  "on the way": "picked_up",
  delivered: "delivered",
  completed: "completed",
  rejected: "rejected",
  cancelled: "cancelled",
  canceled: "cancelled",
};

export const orderStatus = (s: unknown): OrderStatus => ORDER_STATUS[str(s).toLowerCase()] ?? "confirming";

const deliveryType = (t: unknown): DeliveryType => {
  const v = str(t).toLowerCase();
  if (v === "pickup" || v === "scheduled_pickup") return v;
  return v === "scheduled" ? "scheduled_delivery" : "delivery";
};

const paymentMethod = (m: unknown): PaymentMethod => {
  const v = str(m).toLowerCase();
  if (v.includes("cash")) return "cash";
  if (v.includes("card")) return "card";
  if (v.includes("wallet")) return "wallet";
  return "mobile_money";
};

const paymentStatus = (s: unknown): Order["payment_status"] => {
  const v = str(s).toLowerCase();
  return v === "paid" ? "paid" : v.includes("refund") ? "refunded" : "unpaid";
};

const actor = (a: unknown): OrderTimelineEntry["actor_type"] => {
  const v = str(a).toLowerCase();
  return v === "customer" || v === "store" || v === "driver" ? v : "system";
};

export function mapOrder(r: Row): Order {
  const items: OrderItem[] = (r.items ?? r.order_items ?? []).map((i: Row) => ({
    product: str(i.product || i.name),
    product_name: str(i.product_name || i.product),
    quantity: num(i.quantity),
    unit_price: num(i.unit_price),
    total_price: num(i.total_price),
    special_instructions: i.special_instructions || undefined,
  }));
  const driverName = str(r.driver_name);
  return {
    name: str(r.name),
    status: orderStatus(r.status),
    creation: str(r.creation),
    customer_name: str(r.customer_name) || "Customer",
    customer_phone: str(r.customer_phone),
    delivery_type: deliveryType(r.delivery_type),
    delivery_address: r.delivery_address || undefined,
    scheduled_for: r.scheduled_datetime || undefined,
    payment_method: paymentMethod(r.payment_method),
    payment_status: paymentStatus(r.payment_status),
    subtotal: num(r.subtotal),
    delivery_fee: num(r.delivery_fee),
    discount: num(r.discount_amount),
    grand_total: num(r.grand_total),
    notes: r.notes || undefined,
    order_items: items,
    item_count: items.reduce((n, i) => n + i.quantity, 0),
    driver: r.driver || undefined,
    driver_name: driverName && driverName !== "Not Assigned" ? driverName : undefined,
    driver_phone: r.driver_phone || undefined,
    cancel_reason: r.cancel_reason || undefined,
    timeline: (r.status_logs ?? []).map((l: Row) => ({
      status: orderStatus(l.status),
      timestamp: str(l.timestamp),
      actor_type: actor(l.actor_type),
      note: l.note || undefined,
    })),
  };
}

const productStatus = (s: unknown): ProductStatus => {
  const v = str(s).toLowerCase();
  if (v.startsWith("pending") || v.includes("changes")) return "Pending";
  if (v.includes("reject")) return "Rejected";
  return v === "active" ? "Active" : "Inactive";
};

export function mapProduct(r: Row): Product {
  return {
    name: str(r.name),
    product_name: str(r.product_name),
    description: str(r.description),
    category: str(r.category_id || r.category),
    category_name: str(r.category_name || r.category),
    price: num(r.price),
    discount_price: num(r.discount_price) || undefined,
    image: fileUrl(r.image),
    is_available: r.is_available ? 1 : 0,
    stock_quantity: num(r.stock_quantity),
    // Older products have no flag and count stock.
    is_stock_item: r.is_stock_item === 0 || r.is_stock_item === "0" ? 0 : 1,
    sku: str(r.sku),
    tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
    status: productStatus(r.status),
  };
}
