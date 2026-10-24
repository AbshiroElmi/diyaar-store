import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Area, AreaChart, ResponsiveContainer, XAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, BarChart3, Bell, ChefHat, ChevronRight, Headphones, Megaphone, PackageCheck, PackagePlus, ReceiptText, ShoppingBag, Star } from "lucide-react";
import { Toggle } from "konsta/react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useBanners, useDashboard, useNotifications, useSetStoreOpen, useStore } from "@/hooks/queries";
import type { Kpi as KpiData } from "@/api";
import { formatMoney, formatNumber, initials, timeAgo } from "@/lib/format";
import { haptic } from "@/lib/native";
import { cn } from "@/lib/utils";
import { BannerCarousel } from "../BannerCarousel";
import { ErrorBlock, Loading, Screen } from "../ui";

const PIPELINE = [
  { key: "confirming", label: "New", icon: ReceiptText, bg: "bg-[#fff1e0]", fg: "text-[#ff8a00]" },
  { key: "accepted", label: "Accepted", icon: PackageCheck, bg: "bg-[#e6f1ff]", fg: "text-[#007aff]" },
  { key: "preparing", label: "Cooking", icon: ChefHat, bg: "bg-[#efedff]", fg: "text-[#5856d6]" },
  { key: "ready", label: "Ready", icon: ShoppingBag, bg: "bg-[#e5f8ec]", fg: "text-[#28a745]" },
] as const;

const QUICK = [
  { label: "Add item", icon: PackagePlus, href: "/products/new", bg: "bg-[#e5f6f3]", fg: "text-[#229085]" },
  { label: "Promo", icon: Megaphone, href: "/promotions", bg: "bg-[#ffe9ee]", fg: "text-[#ff2d55]" },
  { label: "Reports", icon: BarChart3, href: "/reports", bg: "bg-[#e6f1ff]", fg: "text-[#007aff]" },
  { label: "Help", icon: Headphones, href: "/support", bg: "bg-[#f3eaff]", fg: "text-[#af52de]" },
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function Delta({ kpi }: { kpi: KpiData }) {
  const d = kpi.previous ? ((kpi.value - kpi.previous) / kpi.previous) * 100 : 0;
  const up = d >= 0;
  return (
    <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold", up ? "bg-[#e5f8ec] text-[#28a745]" : "bg-[#ffeceb] text-[#ff3b30]")}>
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(d).toFixed(0)}%
    </span>
  );
}

const card = "rounded-[24px] bg-white shadow-[0_2px_14px_-6px_rgba(0,0,0,0.08)] dark:bg-[#1c1c1d]";

export default function HomeScreen() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useDashboard();
  const { data: banners } = useBanners();
  const { data: store } = useStore();
  const { data: notifications } = useNotifications();
  const setOpen = useSetStoreOpen();
  const firstName = user?.full_name.split(" ")[0] ?? "";
  const go = (href: string) => {
    haptic.tap();
    navigate(href);
  };

  return (
    <Screen title="Home" bare tabbar onRefresh={() => qc.invalidateQueries()}>
      {/* ── Header ─────────────────────────────── */}
      <div className="relative overflow-hidden rounded-b-[32px] bg-gradient-to-b from-[#d9f7f1] via-[#eafaf6] to-transparent pb-4 pt-[calc(env(safe-area-inset-top)+12px)] dark:from-[#103a35] dark:via-[#0b2724]">
        <span className="pointer-events-none absolute -right-10 -top-14 h-48 w-48 rounded-full bg-[#BEFF00]/30 blur-2xl" />
        <span className="pointer-events-none absolute -left-16 top-10 h-40 w-40 rounded-full bg-[#2bb5a7]/20 blur-2xl" />

        <div className="relative flex items-center gap-3 px-5">
          <button onClick={() => go("/store")} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2bb5a7] to-[#176c63] text-[16px] font-bold text-white shadow-md shadow-[#229085]/30">
            {store ? initials(store.store_name) : ""}
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] text-black/55 dark:text-white/60">
              {greeting()}
              {firstName ? `, ${firstName}` : ""} 👋
            </p>
            <p className="truncate text-[20px] font-bold tracking-tight">{store?.store_name ?? " "}</p>
          </div>
          <button onClick={() => go("/notifications")} className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur dark:bg-white/10" aria-label="Notifications">
            <Bell className="h-[22px] w-[22px]" />
            {!!notifications?.unread && (
              <span className="tabular absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-[#ff3b30] px-1 text-[10px] font-bold text-white dark:border-[#0b2724]">
                {notifications.unread > 9 ? "9+" : notifications.unread}
              </span>
            )}
          </button>
        </div>

        {/* Open / closed */}
        <div className="relative mx-4 mt-4 flex items-center gap-3 rounded-[22px] bg-white/85 px-4 py-3 shadow-sm backdrop-blur dark:bg-white/10">
          <span className="relative flex h-3 w-3">
            {!!store?.is_open && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34c759] opacity-60" />}
            <span className={cn("relative h-3 w-3 rounded-full", store?.is_open ? "bg-[#34c759]" : "bg-black/25 dark:bg-white/30")} />
          </span>
          <div className="flex-1">
            <p className="text-[15px] font-semibold">{store?.is_open ? "You're open" : "You're closed"}</p>
            <p className="text-[12px] text-black/50 dark:text-white/50">{store?.is_open ? (store.busy_mode ? "Busy mode is on" : "Customers can order now") : "Turn on to start getting orders"}</p>
          </div>
          <Toggle
            checked={!!store?.is_open}
            onChange={() => {
              haptic.press();
              setOpen.mutate(!store?.is_open);
            }}
          />
        </div>
      </div>

      {error ? (
        <ErrorBlock error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <Loading />
      ) : (
        <div className="space-y-6 pt-1">
          {/* ── Banners ─────────────────────────── */}
          {!!banners?.length && <BannerCarousel banners={banners} />}

          {/* ── Quick actions ───────────────────── */}
          <div className="grid grid-cols-4 gap-2 px-4">
            {QUICK.map((q) => (
              <button key={q.label} onClick={() => go(q.href)} className="flex flex-col items-center gap-1.5 transition-transform active:scale-95">
                <span className={cn("flex h-14 w-14 items-center justify-center rounded-[20px]", q.bg, q.fg)}>
                  <q.icon className="h-6 w-6" strokeWidth={2} />
                </span>
                <span className="text-[12px] font-medium text-black/70 dark:text-white/75">{q.label}</span>
              </button>
            ))}
          </div>

          {/* ── Live orders ─────────────────────── */}
          <section>
            <div className="flex items-end justify-between px-5 pb-2.5">
              <p className="text-[19px] font-bold tracking-tight">Live orders</p>
              <button onClick={() => go("/orders")} className="flex items-center text-[14px] font-semibold text-primary">
                See all <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
              {PIPELINE.map((p) => {
                const count = data.today[p.key];
                const hot = p.key === "confirming" && count > 0;
                return (
                  <button
                    key={p.key}
                    onClick={() => go(`/orders?status=${p.key}`)}
                    className={cn("flex min-w-[104px] flex-1 flex-col rounded-[22px] p-3.5 text-left transition-transform active:scale-95", p.bg, hot && "ring-2 ring-[#ff8a00] ring-offset-2 ring-offset-[#efeff4] dark:ring-offset-black")}
                  >
                    <span className={cn("flex h-9 w-9 items-center justify-center rounded-full bg-white/80", p.fg)}>
                      <p.icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="tabular mt-3 text-[26px] font-bold leading-none text-[#1c1c1e]">{count}</span>
                    <span className={cn("mt-1 text-[13px] font-semibold", p.fg)}>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Today ───────────────────────────── */}
          <section className="px-4">
            <p className="px-1 pb-2.5 text-[19px] font-bold tracking-tight">Today</p>
            <div className={cn(card, "grid grid-cols-2")}>
              {[
                { label: "Sales", value: formatMoney(data.kpis.revenue.value), kpi: data.kpis.revenue },
                { label: "Orders", value: formatNumber(data.kpis.orders.value), kpi: data.kpis.orders },
                { label: "Avg. order", value: formatMoney(data.kpis.avg_order_value.value), kpi: data.kpis.avg_order_value },
                { label: "Rating", value: data.kpis.rating.value.toFixed(1), kpi: null },
              ].map((s, i) => (
                <div key={s.label} className={cn("p-4", i % 2 === 0 && "border-r border-black/5 dark:border-white/10", i < 2 && "border-b border-black/5 dark:border-white/10")}>
                  <p className="text-[13px] text-black/50 dark:text-white/50">{s.label}</p>
                  <p className="tabular mt-0.5 flex items-center gap-1 text-[22px] font-bold tracking-tight">
                    {s.value}
                    {!s.kpi && <Star className="h-4 w-4 fill-[#ffb800] text-[#ffb800]" />}
                  </p>
                  <div className="mt-1">{s.kpi ? <Delta kpi={s.kpi} /> : <span className="text-[11px] text-black/45 dark:text-white/45">{data.today.cancelled} cancelled</span>}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Week chart ──────────────────────── */}
          <section className="px-4">
            <button onClick={() => go("/reports")} className={cn(card, "block w-full p-4 text-left")}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[13px] text-black/50 dark:text-white/50">Sales · last 7 days</p>
                  <p className="tabular text-[24px] font-bold tracking-tight">{formatMoney(data.trend.reduce((s, d) => s + d.revenue, 0))}</p>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/10">
                  <ChevronRight className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trend} margin={{ top: 4, left: 0, right: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="home-rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2bb5a7" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#2bb5a7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), "EEE")} tickLine={false} axisLine={false} fontSize={11} stroke="#a1a1a6" interval={0} padding={{ left: 14, right: 14 }} />
                    <Area type="monotone" dataKey="revenue" stroke="#229085" strokeWidth={3} fill="url(#home-rev)" dot={false} activeDot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </button>
          </section>

          {/* ── Recent orders ───────────────────── */}
          <section className="px-4">
            <div className="flex items-end justify-between px-1 pb-2.5">
              <p className="text-[19px] font-bold tracking-tight">Recent orders</p>
              <button onClick={() => go("/orders?tab=history")} className="flex items-center text-[14px] font-semibold text-primary">
                History <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className={cn(card, "divide-y divide-black/5 overflow-hidden dark:divide-white/10")}>
              {data.recent_orders.slice(0, 5).map((o) => {
                const pipe = PIPELINE.find((p) => p.key === o.status);
                return (
                  <button key={o.name} onClick={() => go(`/orders/${o.name}`)} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-black/5 dark:active:bg-white/5">
                    <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold", pipe ? cn(pipe.bg, pipe.fg) : "bg-black/5 text-black/50 dark:bg-white/10 dark:text-white/60")}>
                      {initials(o.customer_name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold">{o.customer_name}</span>
                      <span className="block text-[12px] text-black/45 dark:text-white/45">
                        {o.item_count} item{o.item_count > 1 ? "s" : ""} · {timeAgo(o.creation)}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="tabular block text-[15px] font-semibold">{formatMoney(o.grand_total)}</span>
                      <span className={cn("block text-[12px] font-medium", pipe?.fg ?? "text-black/40 dark:text-white/45")}>{pipe?.label ?? (o.status === "cancelled" || o.status === "rejected" ? "Cancelled" : "Done")}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Latest review ───────────────────── */}
          {data.recent_reviews[0] && (
            <section className="px-4">
              <button onClick={() => go("/reviews")} className={cn(card, "flex w-full gap-3 p-4 text-left")}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff6d6] text-[20px]">⭐</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between">
                    <span className="text-[15px] font-semibold">{data.recent_reviews[0].customer_name}</span>
                    <span className="flex items-center gap-0.5 text-[13px] font-semibold text-[#ffb800]">
                      {data.recent_reviews[0].rating} <Star className="h-3.5 w-3.5 fill-current" />
                    </span>
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-[14px] text-black/60 dark:text-white/65">“{data.recent_reviews[0].comment}”</span>
                </span>
              </button>
            </section>
          )}
        </div>
      )}
    </Screen>
  );
}
