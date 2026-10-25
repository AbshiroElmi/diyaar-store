import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Bike, Check, ChefHat, Clock, History as HistoryIcon, Inbox, LayoutGrid, PackageCheck, Phone, Search, StickyNote, Store } from "lucide-react";
import { Button, Link as KLink, List, ListItem } from "konsta/react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useOrderCounts, useOrders, useUpdateOrderStatus } from "@/hooks/queries";
import { useDebounce } from "@/hooks/use-debounce";
import type { Order, OrderStatus } from "@/api";
import { formatMoney, formatDay, formatTime, initials } from "@/lib/format";
import { haptic } from "@/lib/native";
import { cn } from "@/lib/utils";
import { Empty, ErrorBlock, Loading, Screen, SearchField } from "../ui";

type Stage = "confirming" | "accepted" | "preparing" | "ready";

/** Kitchen board columns: each stage has its own colour, used for the tab, the ticket edge and its main button. */
const STAGES: Array<{ key: Stage; label: string; color: string; soft: string; empty: string }> = [
  { key: "confirming", label: "New", color: "#e07b00", soft: "bg-[#fff4e0]", empty: "No new orders — they'll pop up here with a sound." },
  { key: "accepted", label: "Accepted", color: "#1f6fe5", soft: "bg-[#e8f1ff]", empty: "Nothing waiting to be cooked." },
  { key: "preparing", label: "Cooking", color: "#5b4ee0", soft: "bg-[#f0eeff]", empty: "The kitchen is clear." },
  { key: "ready", label: "Ready", color: "#1a9d4b", soft: "bg-[#e8f7ee]", empty: "No orders waiting for pickup." },
];

const isPickup = (o: Order) => o.delivery_type.includes("pickup");
const minutesAgo = (iso: string) => Math.max(0, Math.floor((Date.now() - +new Date(iso)) / 60_000));

const NEXT: Partial<Record<OrderStatus, { status: OrderStatus; label: string; icon: typeof Check }>> = {
  accepted: { status: "preparing", label: "Start cooking", icon: ChefHat },
  preparing: { status: "ready", label: "Mark ready", icon: PackageCheck },
};

/** Ticket-style card: order number + timer on top, perforated edge, customer and items, one main action. */
function Ticket({ order }: { order: Order }) {
  const navigate = useNavigate();
  const update = useUpdateOrderStatus();
  const stage = STAGES.find((x) => x.key === order.status) ?? STAGES[1];
  const mins = minutesAgo(order.creation);
  const late = order.status === "confirming" ? mins >= 3 : mins >= 25;
  const next = order.status === "ready" && isPickup(order) ? { status: "completed" as OrderStatus, label: "Picked up", icon: Check } : NEXT[order.status];
  const items = order.order_items;
  const advance = (status: OrderStatus) => {
    haptic.press();
    update.mutate({ id: order.name, status });
  };

  return (
    <div className="mx-4 mb-3 overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_20px_-12px_rgba(0,0,0,0.18)] dark:bg-[#1c1c1d]">
      <button onClick={() => navigate(`/orders/${order.name}`)} className="block w-full text-left">
        {/* ticket head */}
        <div className={cn("flex items-center gap-2 px-4 py-2.5", stage.soft, "dark:bg-white/[0.06]")}>
          <span className="tabular text-[15px] font-extrabold" style={{ color: stage.color }}>
            #{order.name.split("-").pop()}
          </span>
          <span className="flex items-center gap-1 text-[12.5px] font-semibold text-black/50 dark:text-white/55">
            {isPickup(order) ? <Store className="h-3.5 w-3.5" /> : <Bike className="h-3.5 w-3.5" />}
            {isPickup(order) ? "Pickup" : "Delivery"}
          </span>
          <span className={cn("tabular ml-auto flex items-center gap-1 rounded-full px-2 text-[12px] font-bold leading-[22px]", late ? "bg-[#ff3b30] text-white" : "bg-white/80 text-black/60 dark:bg-black/30 dark:text-white/70")}>
            <Clock className="h-3 w-3" />
            {mins < 1 ? "now" : `${mins} min`}
          </span>
        </div>
        {/* perforation */}
        <div className="relative h-0">
          <span className="absolute -left-2 -top-2 h-4 w-4 rounded-full bg-[#f7f9f9] dark:bg-black" />
          <span className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-[#f7f9f9] dark:bg-black" />
          <span className="absolute inset-x-3 top-0 border-t-2 border-dashed border-black/[0.07] dark:border-white/10" />
        </div>
        {/* body */}
        <div className="px-4 pb-3 pt-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate text-[16px] font-bold">{order.customer_name}</p>
            <p className="tabular text-[16px] font-extrabold">{formatMoney(order.grand_total)}</p>
          </div>
          <p className="mt-1 line-clamp-2 text-[14px] leading-snug text-black/65 dark:text-white/65">
            {items.slice(0, 3).map((it, i) => (
              <span key={it.product}>
                {i > 0 && <span className="text-black/25 dark:text-white/25"> · </span>}
                <span className="font-bold text-black dark:text-white">{it.quantity}</span> {it.product_name}
              </span>
            ))}
            {items.length > 3 && <span className="font-semibold text-black/40 dark:text-white/40"> +{items.length - 3} more</span>}
          </p>
          {order.notes && (
            <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-[#ff9500]/10 px-2.5 py-1.5 text-[13px] font-medium text-[#b86400]">
              <StickyNote className="mt-px h-3.5 w-3.5 shrink-0" /> {order.notes}
            </p>
          )}
        </div>
      </button>

      {/* action */}
      <div className="flex gap-2 px-4 pb-4">
        {order.status === "confirming" ? (
          <button
            disabled={update.isPending}
            onClick={() => advance("accepted")}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary text-[15px] font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            <Check className="h-[18px] w-[18px]" strokeWidth={3} /> Accept
          </button>
        ) : next ? (
          <button
            disabled={update.isPending}
            onClick={() => advance(next.status)}
            style={{ backgroundColor: STAGES.find((x) => x.key === next.status)?.color ?? stage.color }}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-[15px] font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            <next.icon className="h-[18px] w-[18px]" /> {next.label}
          </button>
        ) : order.driver_name ? (
          <div className="flex h-11 flex-1 items-center gap-2.5 rounded-xl bg-[#34c759]/10 pl-2 pr-1.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[12px] font-extrabold text-[#1a9d4b] dark:bg-black/30">{initials(order.driver_name)}</span>
            <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[#14803c] dark:text-[#5fd88a]">
              {order.driver_name} {order.status === "ready" ? "is collecting it" : "is on the way"}
            </span>
            {order.driver_phone && (
              <a href={`tel:${order.driver_phone}`} aria-label="Call driver" className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#1a9d4b] dark:bg-black/30">
                <Phone className="h-4 w-4" />
              </a>
            )}
          </div>
        ) : (
          <p className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-black/[0.035] text-[14px] font-medium text-black/55 dark:bg-white/[0.06] dark:text-white/60">
            <Bike className="h-4 w-4" /> {isPickup(order) ? "Waiting for the customer" : "Waiting for a Diyaar driver"}
          </p>
        )}
      </div>
    </div>
  );
}

/** Stage tabs with big counts; the active one gets its colour and an underline. */
function StageTabs({ value, onChange, counts }: { value: Stage; onChange: (s: Stage) => void; counts?: Partial<Record<Stage, number>> }) {
  return (
    <div className="k-stage-tabs grid w-full grid-cols-4">
      {STAGES.map((st) => {
        const active = st.key === value;
        const n = counts?.[st.key] ?? 0;
        return (
          <button
            key={st.key}
            type="button"
            onClick={() => {
              haptic.tap();
              onChange(st.key);
            }}
            className="relative flex flex-col items-center justify-center pb-2 pt-1"
          >
            <span className={cn("tabular text-[22px] font-extrabold leading-none transition-colors", !active && "text-black/30 dark:text-white/30")} style={active ? { color: st.color } : undefined}>
              {n}
            </span>
            <span className={cn("mt-1 text-[11px] font-bold uppercase tracking-wide", active ? "text-black/80 dark:text-white/85" : "text-black/40 dark:text-white/40")}>{st.label}</span>
            {st.key === "confirming" && n > 0 && !active && <span className="absolute right-[22%] top-0.5 h-2 w-2 rounded-full bg-[#ff3b30]" />}
            <span className={cn("absolute inset-x-4 bottom-0 h-[3px] rounded-full transition-opacity", active ? "opacity-100" : "opacity-0")} style={{ backgroundColor: st.color }} />
          </button>
        );
      })}
    </div>
  );
}

function Board({ stage }: { stage: Stage }) {
  const { data, isLoading, error, refetch } = useOrders({ status: stage, page_size: 100 });
  const info = STAGES.find((x) => x.key === stage)!;

  return (
    <div className="pt-3">
      {error ? (
        <ErrorBlock error={error} onRetry={refetch} />
      ) : isLoading ? (
        <Loading />
      ) : !data?.data.length ? (
        <Empty icon={Inbox} title="All caught up" text={info.empty} />
      ) : (
        data.data.map((o) => <Ticket key={o.name} order={o} />)
      )}
    </div>
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
      <div className="px-2 pt-2">
        <SearchField
          placeholder="Order, customer or phone"
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
      </div>
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
              <Button large disabled={isFetching} onClick={() => setPage((p) => p + 1)}>
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
  const history = params.get("tab") === "history";
  const raw = params.get("status");
  const stage: Stage = STAGES.some((x) => x.key === raw) ? (raw as Stage) : "confirming";
  const { data: counts, refetch } = useOrderCounts();

  const toggle = (
    <KLink
      navbar
      iconOnly
      onClick={() => {
        haptic.tap();
        setParams(history ? {} : { tab: "history" }, { replace: true });
      }}
    >
      {history ? <LayoutGrid className="h-6 w-6" /> : <HistoryIcon className="h-6 w-6" />}
    </KLink>
  );

  return (
    <Screen
      title={history ? "Order history" : "Orders"}
      tabbar
      onRefresh={refetch}
      right={toggle}
      subnavbar={history ? undefined : <StageTabs value={stage} counts={counts} onChange={(s) => setParams(s === "confirming" ? {} : { status: s }, { replace: true })} />}
    >
      {history ? <History /> : <Board stage={stage} />}
    </Screen>
  );
}
