import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Bike, Inbox, Search, Store } from "lucide-react";
import { Button, List, ListItem, Searchbar, Segmented, SegmentedButton } from "konsta/react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useOrderCounts, useOrders, useUpdateOrderStatus } from "@/hooks/queries";
import { useDebounce } from "@/hooks/use-debounce";
import type { Order, OrderStatus } from "@/api";
import { formatMoney, formatDay, formatTime } from "@/lib/format";
import { haptic } from "@/lib/native";
import { cn } from "@/lib/utils";
import { ChipBar, Empty, ErrorBlock, Loading, Screen } from "../ui";
import { RejectSheet } from "./OrderDetail";

type LiveFilter = "active" | "confirming" | "accepted" | "preparing" | "ready";

const isPickup = (o: Order) => o.delivery_type.includes("pickup");
const minutesAgo = (iso: string) => Math.max(0, Math.floor((Date.now() - +new Date(iso)) / 60_000));

const NEXT: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  accepted: { status: "preparing", label: "Start cooking" },
  preparing: { status: "ready", label: "Mark ready" },
};

function LiveCard({ order, onReject }: { order: Order; onReject: () => void }) {
  const navigate = useNavigate();
  const update = useUpdateOrderStatus();
  const mins = minutesAgo(order.creation);
  const isNew = order.status === "confirming";
  const next = order.status === "ready" && isPickup(order) ? { status: "completed" as OrderStatus, label: "Picked up" } : NEXT[order.status];

  return (
    <div className={cn("mx-4 mb-3 overflow-hidden rounded-2xl border border-black/[0.06] bg-white dark:bg-[#1c1c1d]", isNew && "ring-2 ring-[#ff9500]")}>
      <button onClick={() => navigate(`/orders/${order.name}`)} className="block w-full p-4 text-left active:bg-black/5 dark:active:bg-white/5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[17px] font-extrabold">{order.customer_name}</p>
            <p className="text-[13px] text-black/50 dark:text-white/50">
              {order.name} · {isPickup(order) ? "Pickup" : "Delivery"}
            </p>
          </div>
          <div className="text-right">
            <p className="tabular text-[17px] font-extrabold">{formatMoney(order.grand_total)}</p>
            <p className={cn("text-[13px]", isNew && mins >= 3 ? "font-semibold text-[#ff3b30]" : "text-black/50 dark:text-white/50")}>{mins < 1 ? "now" : `${mins} min`}</p>
          </div>
        </div>
        <div className="mt-3 space-y-1">
          {order.order_items.slice(0, 3).map((it) => (
            <p key={it.product} className="flex gap-2 text-[15px]">
              <span className="tabular w-6 font-semibold text-primary">{it.quantity}×</span>
              <span className="truncate">{it.product_name}</span>
            </p>
          ))}
          {order.order_items.length > 3 && <p className="pl-8 text-[13px] text-black/45 dark:text-white/45">+{order.order_items.length - 3} more</p>}
        </div>
        {order.notes && <p className="mt-2 rounded-lg bg-[#ff9500]/10 px-2.5 py-1.5 text-[13px] text-[#c76e00]">📝 {order.notes}</p>}
      </button>
      <div className="flex gap-2 border-t border-black/5 p-3 dark:border-white/10">
        {isNew ? (
          <>
            <Button rounded outline className="flex-1 !text-[#ff3b30] !border-[#ff3b30]/40" onClick={onReject}>
              Reject
            </Button>
            <Button rounded
              className="flex-[2]"
              disabled={update.isPending}
              onClick={() => {
                haptic.press();
                update.mutate({ id: order.name, status: "accepted" });
              }}
            >
              Accept order
            </Button>
          </>
        ) : next ? (
          <Button rounded
            tonal={order.status === "accepted"}
            className={cn("flex-1", order.status === "preparing" && "!bg-[#34c759]")}
            disabled={update.isPending}
            onClick={() => {
              haptic.press();
              update.mutate({ id: order.name, status: next.status });
            }}
          >
            {next.label}
          </Button>
        ) : (
          <p className="flex flex-1 items-center justify-center gap-2 py-1.5 text-[15px] text-black/55 dark:text-white/55">
            <Bike className="h-4 w-4" /> {order.driver_name ? `${order.driver_name} is on the way` : "Waiting for a driver…"}
          </p>
        )}
      </div>
    </div>
  );
}

function Live() {
  const [params, setParams] = useSearchParams();
  const filter = (params.get("status") as LiveFilter) || "active";
  const { data: counts } = useOrderCounts();
  const { data, isLoading, error, refetch } = useOrders({ status: filter, page_size: 100 });
  const [rejecting, setRejecting] = useState<Order | null>(null);

  return (
    <>
      <ChipBar
        value={filter}
        onChange={(v) => setParams(v === "active" ? {} : { status: v }, { replace: true })}
        items={[
          { value: "active", label: "All", count: counts?.active },
          { value: "confirming", label: "New", count: counts?.confirming },
          { value: "accepted", label: "Accepted", count: counts?.accepted },
          { value: "preparing", label: "Cooking", count: counts?.preparing },
          { value: "ready", label: "Ready", count: counts?.ready },
        ]}
      />
      <div className="pt-2">
        {error ? (
          <ErrorBlock error={error} onRetry={refetch} />
        ) : isLoading ? (
          <Loading />
        ) : !data?.data.length ? (
          <Empty icon={Inbox} title="All caught up" text="New orders will appear here with a sound." />
        ) : (
          data.data.map((o) => <LiveCard key={o.name} order={o} onReject={() => setRejecting(o)} />)
        )}
      </div>
      <RejectSheet order={rejecting} onClose={() => setRejecting(null)} />
    </>
  );
}

function History() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search, 300);
  const { data, isLoading, isFetching } = useOrders({ status: "history", search: debounced, page, page_size: 30 });

  const groups = (data?.data ?? []).reduce<Record<string, Order[]>>((acc, o) => {
    (acc[formatDay(o.creation)] ??= []).push(o);
    return acc;
  }, {});

  return (
    <>
      <Searchbar
        placeholder="Order, customer or phone"
        value={search}
        onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        onClear={() => setSearch("")}
        disableButton
        disableButtonText="Cancel"
        onDisable={() => setSearch("")}
      />
      {isLoading ? (
        <Loading />
      ) : !data?.data.length ? (
        <Empty icon={Search} title="No orders found" />
      ) : (
        <>
          {Object.entries(groups).map(([day, orders]) => (
            <div key={day}>
              <p className="px-8 pb-1.5 pt-4 text-[13px] uppercase text-black/45 dark:text-white/45">{day}</p>
              <List strong inset dividers className="!my-0">
                {orders.map((o) => (
                  <ListItem
                    key={o.name}
                    link
                    onClick={() => navigate(`/orders/${o.name}`)}
                    media={<span className={cn("flex h-9 w-9 items-center justify-center rounded-full", isPickup(o) ? "bg-[#5856d6]/10 text-[#5856d6]" : "bg-primary/10 text-primary")}>{isPickup(o) ? <Store className="h-[18px] w-[18px]" /> : <Bike className="h-[18px] w-[18px]" />}</span>}
                    title={o.customer_name}
                    after={<span className="tabular text-black dark:text-white">{formatMoney(o.grand_total)}</span>}
                    text={
                      <span className="flex items-center gap-1.5">
                        <StatusBadge status={o.status} dot={false} className="px-1.5 py-0 text-[11px]" />
                        {formatTime(o.creation)}
                      </span>
                    }
                  />
                ))}
              </List>
            </div>
          ))}
          {data.total > page * 30 && (
            <div className="px-4 pt-4">
              <Button rounded tonal large disabled={isFetching} onClick={() => setPage((p) => p + 1)}>
                {isFetching ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default function OrdersScreen() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "history" ? "history" : "live";
  const { data: counts, refetch } = useOrderCounts();

  return (
    <Screen
      title="Orders"
      large
      tabbar
      onRefresh={refetch}
      subnavbar={
        <Segmented strong>
          <SegmentedButton strong active={tab === "live"} onClick={() => setParams({}, { replace: true })}>
            Live{counts?.active ? ` (${counts.active})` : ""}
          </SegmentedButton>
          <SegmentedButton strong active={tab === "history"} onClick={() => setParams({ tab: "history" }, { replace: true })}>
            History
          </SegmentedButton>
        </Segmented>
      }
    >
      {tab === "live" ? <Live /> : <History />}
    </Screen>
  );
}
