import { useParams } from "react-router-dom";
import { Bike, CreditCard, MapPin, MessageSquare, Phone, Store, User } from "lucide-react";
import { BlockTitle, Button, List, ListItem, Toolbar } from "konsta/react";
import { StatusBadge, statusLabel } from "@/components/shared/StatusBadge";
import { useOrder, useUpdateOrderStatus } from "@/hooks/queries";
import type { Order, OrderStatus } from "@/api";
import { formatDateTime, formatMoney, formatTime } from "@/lib/format";
import { haptic } from "@/lib/native";
import { cn } from "@/lib/utils";
import { ErrorBlock, IconTile, Loading, Screen } from "../ui";

const PAYMENT: Record<Order["payment_method"], string> = { cash: "Cash on delivery", card: "Card", wallet: "Diyaar wallet", mobile_money: "Mobile money (EVC)" };
const isPickup = (o: Order) => o.delivery_type.includes("pickup");

interface Step {
  label: string;
  /** When it happened; empty for steps still to come. */
  time?: string;
  /** Who did it: customer, store, or the driver's name. */
  who: string;
  done: boolean;
}

/**
 * The order's journey as one row per step. The backend logs several driver updates
 * (assigned, picking up, on the way…), so each step keeps only its first entry.
 * Steps that haven't happened yet are listed too, greyed out.
 */
function buildSteps(order: Order): Step[] {
  const firstAt = (...statuses: OrderStatus[]) => order.timeline.find((t) => statuses.includes(t.status))?.timestamp;
  const driver = order.driver_name ?? "Driver";
  const flow: Array<{ status: OrderStatus[]; label: string; who: string }> = [
    { status: ["confirming"], label: "New", who: "Customer" },
    { status: ["accepted"], label: "Accepted", who: "Store" },
    { status: ["preparing"], label: "Preparing", who: "Store" },
    { status: ["ready"], label: "Ready", who: "Store" },
    ...(isPickup(order)
      ? [{ status: ["completed", "delivered"] as OrderStatus[], label: "Picked up", who: "Customer" }]
      : [
          { status: ["picked_up"] as OrderStatus[], label: "On the way", who: driver },
          { status: ["delivered", "completed"] as OrderStatus[], label: "Delivered", who: driver },
        ]),
  ];
  // How far the order has got, even if a step was never logged.
  const reached = flow.findIndex((f) => f.status.includes(order.status));
  const steps = flow.map((f, i) => {
    const time = firstAt(...f.status);
    return { label: f.label, time, who: f.who, done: !!time || (reached >= 0 && i <= reached) };
  });
  if (order.status === "cancelled" || order.status === "rejected") {
    // A stopped order shows what happened, then why it ended.
    const end = order.timeline.find((t) => t.status === order.status);
    return [...steps.filter((x) => x.done), { label: statusLabel(order.status), time: end?.timestamp, who: end?.actor_type === "store" ? "Store" : end?.actor_type === "customer" ? "Customer" : "Diyaar", done: true }];
  }
  return steps;
}

/** The next step for the store. Diyaar assigns drivers, so delivery orders end at "ready". */
function ActionBar({ order }: { order: Order }) {
  const update = useUpdateOrderStatus();
  const run = (status: OrderStatus) => {
    haptic.press();
    update.mutate({ id: order.name, status });
  };
  let content: React.ReactNode = null;
  if (order.status === "confirming")
    content = (
      <Button large disabled={update.isPending} onClick={() => run("accepted")}>
        Accept order
      </Button>
    );
  else if (order.status === "accepted")
    content = (
      <Button large disabled={update.isPending} onClick={() => run("preparing")}>
        Start cooking
      </Button>
    );
  else if (order.status === "preparing")
    content = (
      <Button large className="!bg-[#34c759]" disabled={update.isPending} onClick={() => run("ready")}>
        Mark ready
      </Button>
    );
  else if (order.status === "ready" && isPickup(order))
    content = (
      <Button large disabled={update.isPending} onClick={() => run("completed")}>
        Picked up by customer
      </Button>
    );
  if (!content) return null;
  return (
    <Toolbar className="fixed bottom-0 left-0 z-20 !h-auto" innerClassName="!h-auto gap-2 !px-4 !py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      {content}
    </Toolbar>
  );
}

export default function OrderDetailScreen() {
  const { id } = useParams();
  const { data: order, isLoading, error, refetch } = useOrder(id ?? null);

  return (
    <Screen title={id} subtitle={order ? statusLabel(order.status) : undefined} back footer={order && <div className="h-24" />}>
      {error ? (
        <ErrorBlock error={error} onRetry={refetch} />
      ) : isLoading || !order ? (
        <Loading />
      ) : (
        <>
          <div className="flex flex-col items-center px-4 pb-1 pt-4 text-center">
            <StatusBadge status={order.status} className="text-[13px]" />
            <p className="tabular mt-3 text-[34px] font-bold tracking-tight">{formatMoney(order.grand_total)}</p>
            <p className="text-[15px] text-black/50 dark:text-white/50">
              {isPickup(order) ? "Pickup" : "Delivery"} · {formatDateTime(order.creation)}
            </p>
          </div>

          {order.notes && (
            <div className="mx-4 mt-4 flex gap-2 rounded-xl bg-[#ff9500]/10 p-3 text-[15px] text-[#b86500]">
              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" /> {order.notes}
            </div>
          )}

          <BlockTitle>Items</BlockTitle>
          <List strong inset dividers>
            {order.order_items.map((it) => (
              <ListItem
                key={it.product}
                media={<span className="tabular flex h-7 min-w-7 items-center justify-center rounded-lg bg-primary/10 px-1.5 text-[13px] font-bold text-primary">{it.quantity}×</span>}
                title={it.product_name}
                footer={it.special_instructions ? <span className="text-[#c76e00]">“{it.special_instructions}”</span> : undefined}
                after={<span className="tabular text-black dark:text-white">{formatMoney(it.total_price)}</span>}
              />
            ))}
            <ListItem title={<span className="text-black/55 dark:text-white/55">Subtotal</span>} after={<span className="tabular">{formatMoney(order.subtotal)}</span>} />
            {order.delivery_fee > 0 && <ListItem title={<span className="text-black/55 dark:text-white/55">Delivery fee</span>} after={<span className="tabular">{formatMoney(order.delivery_fee)}</span>} />}
            {order.discount > 0 && <ListItem title={<span className="text-[#34c759]">Discount</span>} after={<span className="tabular text-[#34c759]">−{formatMoney(order.discount)}</span>} />}
            <ListItem title={<span className="font-semibold">Total</span>} after={<span className="tabular font-semibold text-black dark:text-white">{formatMoney(order.grand_total)}</span>} />
          </List>

          <BlockTitle>Customer</BlockTitle>
          <List strong inset dividers>
            <ListItem media={<IconTile icon={User} className="bg-[#007aff]" />} title={order.customer_name} />
            {order.customer_phone && <ListItem link href={`tel:${order.customer_phone}`} media={<IconTile icon={Phone} className="bg-[#34c759]" />} title={order.customer_phone} after="Call" />}
            {isPickup(order) ? (
              <ListItem media={<IconTile icon={Store} className="bg-[#5856d6]" />} title="Collects from your store" />
            ) : (
              <ListItem media={<IconTile icon={MapPin} className="bg-[#ff3b30]" />} title={order.delivery_address} />
            )}
            <ListItem media={<IconTile icon={CreditCard} className="bg-[#ff9500]" />} title={PAYMENT[order.payment_method]} after={<span className={cn("capitalize", order.payment_status === "paid" && "text-[#34c759]")}>{order.payment_status}</span>} />
          </List>

          {order.driver_name && (
            <>
              <BlockTitle>Driver</BlockTitle>
              <List strong inset dividers>
                <ListItem link href={`tel:${order.driver_phone}`} media={<IconTile icon={Bike} className="bg-primary" />} title={order.driver_name} after="Call" />
              </List>
            </>
          )}

          {order.cancel_reason && (
            <div className="mx-4 mt-6 rounded-xl bg-[#ff3b30]/10 p-3 text-[15px] text-[#ff3b30]">Reason: {order.cancel_reason}</div>
          )}

          <BlockTitle>Timeline</BlockTitle>
          <List strong inset>
            <div className="px-4 py-3">
              {(() => {
                const steps = buildSteps(order);
                const current = steps.map((x) => x.done).lastIndexOf(true);
                return steps.map((st, i) => {
                  const last = i === steps.length - 1;
                  const now = i === current;
                  return (
                    <div key={st.label} className="relative flex gap-3 pb-4 last:pb-0">
                      {!last && <span className={cn("absolute left-[5px] top-4 h-full w-0.5", i < current ? "bg-primary/40" : "bg-black/10 dark:bg-white/15")} />}
                      <span
                        className={cn(
                          "relative mt-1.5 h-3 w-3 shrink-0 rounded-full",
                          now ? "bg-primary ring-4 ring-primary/20" : st.done ? "bg-primary/50" : "border-2 border-black/15 bg-white dark:border-white/20 dark:bg-transparent",
                        )}
                      />
                      <div>
                        <p className={cn("text-[15px] font-medium", !st.done && "text-black/35 dark:text-white/35")}>{st.label}</p>
                        <p className={cn("text-[13px]", st.done ? "text-black/50 dark:text-white/50" : "text-black/30 dark:text-white/30")}>
                          {st.time ? `${formatTime(st.time)} · ${st.who}` : st.done ? st.who : st.who === "Driver" ? "Waiting for a driver" : st.who}
                        </p>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </List>

          <ActionBar order={order} />
        </>
      )}
    </Screen>
  );
}

