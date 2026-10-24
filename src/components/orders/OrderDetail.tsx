import { Bike, Clock, CreditCard, MapPin, MessageSquare, Phone, Printer, Store, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, statusLabel } from "@/components/shared/StatusBadge";
import { useOrder } from "@/hooks/queries";
import { useIsMobile } from "@/hooks/use-media";
import type { Order } from "@/api";
import { formatDateTime, formatMoney, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { OrderActions, isPickup } from "./OrderActions";

const PAYMENT_LABEL: Record<Order["payment_method"], string> = {
  cash: "Cash on delivery",
  card: "Card",
  wallet: "Diyaar wallet",
  mobile_money: "Mobile money (EVC)",
};

function Row({ icon: Icon, label, children }: { icon: typeof User; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}

function OrderBody({ order }: { order: Order }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={order.status} />
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{isPickup(order) ? "Pickup" : "Delivery"}</span>
        <span className="text-xs text-muted-foreground">Placed {formatDateTime(order.creation)}</span>
      </div>

      {order.notes && (
        <div className="flex gap-2 rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm">
          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <span>
            <span className="font-medium">Customer note: </span>
            {order.notes}
          </span>
        </div>
      )}

      {/* Items */}
      <div>
        <p className="mb-2 text-sm font-semibold">Items ({order.item_count})</p>
        <div className="divide-y rounded-lg border">
          {order.order_items.map((it) => (
            <div key={it.product} className="flex gap-3 p-3">
              <span className="tabular flex h-6 min-w-6 items-center justify-center rounded bg-muted px-1 text-xs font-semibold">{it.quantity}×</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{it.product_name}</p>
                {it.special_instructions && <p className="text-xs text-warning">“{it.special_instructions}”</p>}
              </div>
              <span className="tabular text-sm">{formatMoney(it.total_price)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular">{formatMoney(order.subtotal)}</span>
          </div>
          {order.delivery_fee > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery fee</span>
              <span className="tabular">{formatMoney(order.delivery_fee)}</span>
            </div>
          )}
          {order.discount > 0 && (
            <div className="flex justify-between text-success">
              <span>Discount</span>
              <span className="tabular">−{formatMoney(order.discount)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span className="tabular">{formatMoney(order.grand_total)}</span>
          </div>
        </div>
      </div>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2">
        <Row icon={User} label="Customer">
          <p className="font-medium">{order.customer_name}</p>
          <a href={`tel:${order.customer_phone}`} className="inline-flex items-center gap-1 text-primary hover:underline">
            <Phone className="h-3 w-3" /> {order.customer_phone}
          </a>
        </Row>
        <Row icon={CreditCard} label="Payment">
          <p>{PAYMENT_LABEL[order.payment_method]}</p>
          <p className={cn("text-xs capitalize", order.payment_status === "paid" ? "text-success" : "text-muted-foreground")}>{order.payment_status}</p>
        </Row>
        {isPickup(order) ? (
          <Row icon={Store} label="Pickup">
            Customer collects from your store
          </Row>
        ) : (
          <Row icon={MapPin} label="Delivery address">
            {order.delivery_address}
          </Row>
        )}
        {order.driver_name && (
          <Row icon={Bike} label="Driver">
            <p className="font-medium">{order.driver_name}</p>
            <a href={`tel:${order.driver_phone}`} className="text-primary hover:underline">
              {order.driver_phone}
            </a>
          </Row>
        )}
        {order.scheduled_for && (
          <Row icon={Clock} label="Scheduled for">
            {formatDateTime(order.scheduled_for)}
          </Row>
        )}
      </div>

      {order.cancel_reason && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <span className="font-medium">Reason: </span>
          {order.cancel_reason}
        </div>
      )}

      <Separator />

      {/* Timeline */}
      <div>
        <p className="mb-3 text-sm font-semibold">Timeline</p>
        <ol className="relative space-y-4 border-l pl-5">
          {order.timeline.map((t, i) => (
            <li key={i} className="relative">
              <span className={cn("absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-background", i === order.timeline.length - 1 ? "bg-primary" : "bg-muted-foreground/40")} />
              <p className="text-sm font-medium">{statusLabel(t.status)}</p>
              <p className="text-xs capitalize text-muted-foreground">
                {formatTime(t.timestamp)} · by {t.actor_type}
                {t.note ? ` · ${t.note}` : ""}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function OrderDetail({ orderId, onClose }: { orderId: string | null; onClose: () => void }) {
  const isMobile = useIsMobile();
  const { data: order, isLoading } = useOrder(orderId);
  const open = !!orderId;

  const body = isLoading || !order ? (
    <div className="space-y-4">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  ) : (
    <OrderBody order={order} />
  );

  const footer = order && (
    <div className="flex items-center gap-2 border-t bg-background p-4">
      <Button variant="outline" size="icon" onClick={() => window.print()} aria-label="Print receipt" className="shrink-0">
        <Printer className="h-4 w-4" />
      </Button>
      <OrderActions order={order} className="flex-1 justify-end [&>button]:flex-1" />
    </div>
  );

  const title = `Order ${orderId ?? ""}`;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
        <DrawerContent className="max-h-[94dvh]">
          <DrawerTitle className="px-4 pt-2 text-lg">{title}</DrawerTitle>
          <div className="overflow-y-auto px-4 py-4">{body}</div>
          <div className="pb-safe">{footer}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5">{body}</div>
        {footer}
      </SheetContent>
    </Sheet>
  );
}
