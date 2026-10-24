import { useState } from "react";
import { useParams } from "react-router-dom";
import { Bike, Clock, CreditCard, Flame, MapPin, MapPinOff, MessageSquare, PackageX, Phone, Store, User, type LucideIcon } from "lucide-react";
import { ActionsGroup, ActionsLabel, BlockTitle, Button, List, ListItem, Toolbar } from "konsta/react";
import { StatusBadge, statusLabel } from "@/components/shared/StatusBadge";
import { useOrder, useUpdateOrderStatus } from "@/hooks/queries";
import type { Order, OrderStatus } from "@/api";
import { formatDateTime, formatMoney, formatTime } from "@/lib/format";
import { haptic } from "@/lib/native";
import { cn } from "@/lib/utils";
import { ActionItem, Actions, ErrorBlock, IconTile, Loading, Screen } from "../ui";

const REASONS: Array<[string, LucideIcon]> = [
  ["Item out of stock", PackageX],
  ["Kitchen too busy", Flame],
  ["Closing soon", Clock],
  ["Delivery area too far", MapPinOff],
];
const PAYMENT: Record<Order["payment_method"], string> = { cash: "Cash on delivery", card: "Card", wallet: "Diyaar wallet", mobile_money: "Mobile money (EVC)" };
const isPickup = (o: Order) => o.delivery_type.includes("pickup");

/** iOS-style action sheet with reject reasons. */
export function RejectSheet({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const update = useUpdateOrderStatus();
  return (
    <Actions opened={!!order} onBackdropClick={onClose}>
      <ActionsGroup>
        <ActionsLabel>Why are you rejecting {order?.name}? The customer will be refunded.</ActionsLabel>
        {REASONS.map(([r, icon]) => (
          <ActionItem
            key={r}
            icon={icon}
            danger
            onClick={() => {
              haptic.warning();
              if (order) update.mutate({ id: order.name, status: "rejected", reason: r });
              onClose();
            }}
          >
            {r}
          </ActionItem>
        ))}
      </ActionsGroup>
    </Actions>
  );
}

function ActionBar({ order, onReject }: { order: Order; onReject: () => void }) {
  const update = useUpdateOrderStatus();
  const run = (status: OrderStatus) => {
    haptic.press();
    update.mutate({ id: order.name, status });
  };
  let content: React.ReactNode = null;
  if (order.status === "confirming")
    content = (
      <>
        <Button outline large className="flex-1 !border-[#ff3b30]/40 !text-[#ff3b30]" onClick={onReject}>
          Reject
        </Button>
        <Button large className="flex-[2]" disabled={update.isPending} onClick={() => run("accepted")}>
          Accept order
        </Button>
      </>
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
  const [rejecting, setRejecting] = useState(false);

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
            <ListItem link href={`tel:${order.customer_phone}`} media={<IconTile icon={Phone} className="bg-[#34c759]" />} title={order.customer_phone} after="Call" />
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
              {order.timeline.map((t, i) => {
                const last = i === order.timeline.length - 1;
                return (
                  <div key={i} className="relative flex gap-3 pb-4 last:pb-0">
                    {!last && <span className="absolute left-[5px] top-4 h-full w-0.5 bg-black/10 dark:bg-white/15" />}
                    <span className={cn("relative mt-1.5 h-3 w-3 shrink-0 rounded-full", last ? "bg-primary ring-4 ring-primary/20" : "bg-black/20 dark:bg-white/30")} />
                    <div>
                      <p className="text-[15px] font-medium">{statusLabel(t.status)}</p>
                      <p className="text-[13px] capitalize text-black/50 dark:text-white/50">
                        {formatTime(t.timestamp)} · {t.actor_type}
                        {t.note ? ` · ${t.note}` : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </List>

          <ActionBar order={order} onReject={() => setRejecting(true)} />
          <RejectSheet order={rejecting ? order : null} onClose={() => setRejecting(false)} />
        </>
      )}
    </Screen>
  );
}

