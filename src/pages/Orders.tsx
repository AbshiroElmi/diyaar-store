import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Clock, Inbox, Search, Store, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { SegmentedTabs } from "@/components/shared/SegmentedTabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/shared/States";
import { OrderActions, isPickup } from "@/components/orders/OrderActions";
import { OrderDetail } from "@/components/orders/OrderDetail";
import { useOrderCounts, useOrders } from "@/hooks/queries";
import { useDebounce } from "@/hooks/use-debounce";
import type { Order, OrderStatus } from "@/api";
import { formatDateTime, formatMoney, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

type ActiveFilter = "active" | "confirming" | "accepted" | "preparing" | "ready";
type HistoryFilter = "history" | "delivered" | "completed" | "rejected" | "cancelled";

const PAGE_SIZE = 15;

function minutesSince(iso: string) {
  return Math.floor((Date.now() - +new Date(iso)) / 60_000);
}

function LiveOrderCard({ order, onOpen }: { order: Order; onOpen: () => void }) {
  const waiting = minutesSince(order.creation);
  const urgent = order.status === "confirming" && waiting >= 3;
  return (
    <Card className={cn("flex flex-col overflow-hidden transition-shadow hover:shadow-md", order.status === "confirming" && "border-warning/60 ring-1 ring-warning/30")}>
      <button onClick={onOpen} className="flex flex-1 flex-col justify-start p-4 text-left [&>*]:w-full">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold">{order.name}</p>
            <p className="truncate text-sm text-muted-foreground">{order.customer_name}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <ul className="mt-3 space-y-1 text-sm">
          {order.order_items.slice(0, 3).map((it) => (
            <li key={it.product} className="flex gap-2">
              <span className="tabular w-6 shrink-0 font-medium text-muted-foreground">{it.quantity}×</span>
              <span className="truncate">{it.product_name}</span>
            </li>
          ))}
          {order.order_items.length > 3 && <li className="pl-8 text-xs text-muted-foreground">+{order.order_items.length - 3} more</li>}
        </ul>
        {order.notes && <p className="mt-2 line-clamp-1 rounded bg-warning/10 px-2 py-1 text-xs">📝 {order.notes}</p>}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span className={cn("inline-flex items-center gap-1", urgent && "font-medium text-destructive")}>
            <Clock className="h-3.5 w-3.5" /> {waiting < 1 ? "Just now" : `${waiting} min ago`}
          </span>
          <span className="inline-flex items-center gap-1">
            {isPickup(order) ? <Store className="h-3.5 w-3.5" /> : <Bike className="h-3.5 w-3.5" />}
            {isPickup(order) ? "Pickup" : "Delivery"}
          </span>
          <span className="tabular font-semibold text-foreground">{formatMoney(order.grand_total)}</span>
        </div>
      </button>
      <div className="border-t bg-muted/30 p-3">
        <OrderActions order={order} size="sm" className="justify-end" />
      </div>
    </Card>
  );
}

function ActiveOrders({ onOpen }: { onOpen: (id: string) => void }) {
  const [params, setParams] = useSearchParams();
  const filter = (params.get("status") as ActiveFilter) || "active";
  const { data: counts } = useOrderCounts();
  const { data, isLoading, error, refetch } = useOrders({ status: filter, page_size: 100 });

  const setFilter = (f: ActiveFilter) => {
    const next = new URLSearchParams(params);
    if (f === "active") next.delete("status");
    else next.set("status", f);
    setParams(next, { replace: true });
  };

  return (
    <div className="space-y-4">
      <SegmentedTabs
        value={filter}
        onChange={setFilter}
        segments={[
          { value: "active", label: "All active", count: counts?.active },
          { value: "confirming", label: "New", count: counts?.confirming },
          { value: "accepted", label: "Accepted", count: counts?.accepted },
          { value: "preparing", label: "Preparing", count: counts?.preparing },
          { value: "ready", label: "Ready", count: counts?.ready },
        ]}
      />
      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-56 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : !data?.data.length ? (
        <Card>
          <EmptyState icon={Inbox} title="No orders here right now" description="New orders appear automatically — keep this page open and you'll hear a chime." />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.data.map((o) => (
            <LiveOrderCard key={o.name} order={o} onOpen={() => onOpen(o.name)} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderHistory({ onOpen }: { onOpen: (id: string) => void }) {
  const [filter, setFilter] = useState<HistoryFilter>("history");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search, 300);
  const { data, isLoading, error, refetch, isFetching } = useOrders({ status: filter as OrderStatus | "history", search: debounced, page, page_size: PAGE_SIZE });
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <SegmentedTabs
          value={filter}
          onChange={(f) => {
            setFilter(f);
            setPage(1);
          }}
          segments={[
            { value: "history", label: "All" },
            { value: "delivered", label: "Delivered" },
            { value: "completed", label: "Picked up" },
            { value: "rejected", label: "Rejected" },
            { value: "cancelled", label: "Cancelled" },
          ]}
        />
        <div className="relative md:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Order ID, customer or phone"
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <Card className={cn("overflow-hidden transition-opacity", isFetching && !isLoading && "opacity-70")}>
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isLoading ? (
          <ListSkeleton rows={8} />
        ) : !data?.data.length ? (
          <EmptyState icon={Search} title="No orders found" description="Try a different filter or search term." />
        ) : (
          <>
            {/* Mobile list */}
            <div className="divide-y md:hidden">
              {data.data.map((o) => (
                <button key={o.name} onClick={() => onOpen(o.name)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{o.customer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.name} · {timeAgo(o.creation)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="tabular text-sm font-medium">{formatMoney(o.grand_total)}</p>
                    <StatusBadge status={o.status} dot={false} className="mt-0.5" />
                  </div>
                </button>
              ))}
            </div>
            {/* Desktop table */}
            <Table className="hidden md:table">
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((o) => (
                  <TableRow key={o.name} className="cursor-pointer" onClick={() => onOpen(o.name)}>
                    <TableCell className="font-medium">{o.name}</TableCell>
                    <TableCell>{o.customer_name}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(o.creation)}</TableCell>
                    <TableCell className="text-muted-foreground">{isPickup(o) ? "Pickup" : "Delivery"}</TableCell>
                    <TableCell className="tabular">{o.item_count}</TableCell>
                    <TableCell className="tabular text-right font-medium">{formatMoney(o.grand_total)}</TableCell>
                    <TableCell>
                      <StatusBadge status={o.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                {data.total.toLocaleString()} orders · page {page} of {totalPages}
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

export default function Orders() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "history" ? "history" : "live";
  const orderId = params.get("order");
  const { data: counts } = useOrderCounts();

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === "tab") next.delete("status");
    setParams(next, { replace: key !== "order" });
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Orders" description="Accept new orders quickly — customers see your response time." />

      <div className="inline-flex rounded-lg border bg-muted/50 p-1">
        {(["live", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => update("tab", t === "live" ? null : t)}
            className={cn("rounded-md px-4 py-1.5 text-sm font-medium transition-colors", tab === t ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            {t === "live" ? "Live" : "History"}
            {t === "live" && !!counts?.confirming && <span className="ml-2 rounded-full bg-destructive px-1.5 text-[11px] text-destructive-foreground">{counts.confirming}</span>}
          </button>
        ))}
      </div>

      {tab === "live" ? <ActiveOrders onOpen={(id) => update("order", id)} /> : <OrderHistory onOpen={(id) => update("order", id)} />}

      <OrderDetail orderId={orderId} onClose={() => update("order", null)} />
    </div>
  );
}
