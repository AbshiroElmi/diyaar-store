import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useTheme } from "next-themes";
import { Area, AreaChart, ResponsiveContainer, XAxis } from "recharts";
import { BarChart3, Bell, ChefHat, ChevronDown, ChevronRight, Clock, Headphones, Megaphone, PackageCheck, PackagePlus, ReceiptText, Search, ShoppingBag, Star } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useBanners, useCategories, useDashboard, useNotifications, useProducts, useSetStoreOpen, useStore } from "@/hooks/queries";
import { formatMoney, formatNumber, initials, timeAgo } from "@/lib/format";
import { haptic, setStatusBarTheme } from "@/lib/native";
import { cn } from "@/lib/utils";
import { BannerCarousel } from "../BannerCarousel";
import { CARD, categoryLook, ErrorBlock, Kpi, Loading, ProductArt, Screen, SectionTitle } from "../ui";

const PIPELINE = [
  { key: "confirming", label: "New", icon: ReceiptText, tint: "bg-[#fff4e0]", fg: "text-[#e07b00]" },
  { key: "accepted", label: "Accepted", icon: PackageCheck, tint: "bg-[#e8f1ff]", fg: "text-[#1f6fe5]" },
  { key: "preparing", label: "Cooking", icon: ChefHat, tint: "bg-[#f0eeff]", fg: "text-[#5b4ee0]" },
  { key: "ready", label: "Ready", icon: ShoppingBag, tint: "bg-[#e8f7ee]", fg: "text-[#1a9d4b]" },
] as const;

const QUICK = [
  { label: "Add item", icon: PackagePlus, href: "/products/new" },
  { label: "Offers", icon: Megaphone, href: "/promotions" },
  { label: "Reports", icon: BarChart3, href: "/reports" },
  { label: "Help", icon: Headphones, href: "/support" },
];

export default function HomeScreen() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { resolvedTheme } = useTheme();
  const { data, isLoading, error, refetch } = useDashboard();
  const { data: banners } = useBanners();
  const { data: categories } = useCategories();
  const { data: store } = useStore();
  const { data: products } = useProducts();
  const categoryOf = (id: string) => products?.data.find((x) => x.name === id)?.category ?? "";
  const { data: notifications } = useNotifications();
  const setOpen = useSetStoreOpen();
  const go = (href: string) => {
    haptic.tap();
    navigate(href);
  };

  // White status-bar icons on the brand header; restore when leaving Home.
  useEffect(() => {
    setStatusBarTheme(true);
    return () => setStatusBarTheme(resolvedTheme === "dark");
  }, [resolvedTheme]);

  const open = !!store?.is_open;

  return (
    <Screen title="Home" bare tabbar onRefresh={() => qc.invalidateQueries()}>
      {/* ── Brand header ───────────────────────────────── */}
      <div className="bg-[#219186] px-4 pb-4 pt-[calc(env(safe-area-inset-top)+10px)] text-white">
        <div className="flex items-start gap-3">
          <button onClick={() => go("/store")} className="min-w-0 flex-1 text-left">
            <p className="text-[12px] font-bold uppercase tracking-wider text-white/75">Diyaar Store</p>
            <p className="mt-0.5 truncate text-[22px] font-extrabold leading-tight tracking-tight">{open ? (store?.busy_mode ? "Busy right now" : "Open for orders") : "Store is closed"}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[13px] font-medium text-white/85">
              <span className="truncate">{store?.store_name}</span>
              <ChevronDown className="h-4 w-4 shrink-0" />
            </p>
          </button>
          <button onClick={() => go("/notifications")} className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            {!!notifications?.unread && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#BEFF00] ring-2 ring-[#219186]" />}
          </button>
          <button onClick={() => go("/store")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-extrabold text-[#219186]">
            {store ? initials(store.store_name) : ""}
          </button>
        </div>

        {/* Prep time · rating · online switch */}
        <div className="mt-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-[13px] font-bold">
            <Clock className="h-4 w-4" /> {store?.preparation_time ?? "–"} min prep
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-[13px] font-bold">
            <Star className="h-4 w-4 fill-[#BEFF00] text-[#BEFF00]" /> {store?.rating.toFixed(1) ?? "–"}
          </span>
          <button
            onClick={() => {
              haptic.press();
              setOpen.mutate(!open);
            }}
            className={cn("ml-auto inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-extrabold transition-colors", open ? "bg-[#BEFF00] text-[#2B330F]" : "bg-white text-[#e5383b]")}
          >
            <span className={cn("h-2 w-2 rounded-full", open ? "bg-[#2B330F]" : "bg-[#e5383b]")} />
            {open ? "ONLINE" : "OFFLINE"}
          </button>
        </div>

        {/* Search */}
        <button onClick={() => go("/orders?tab=history")} className="mt-3 flex h-11 w-full items-center gap-2.5 rounded-xl bg-white px-3.5 text-left text-[15px] text-black/45 shadow-sm">
          <Search className="h-5 w-5 text-black/60" />
          Search orders, customers…
        </button>
      </div>

      {error ? (
        <ErrorBlock error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <Loading />
      ) : (
        <div className="space-y-6 pt-4">
          {/* ── Offer banners ─────────────────────────── */}
          {!!banners?.length && <BannerCarousel banners={banners} />}

          {/* ── Live orders ───────────────────────────── */}
          <section>
            <SectionTitle action="See all" onAction={() => go("/orders")}>
              Live orders
            </SectionTitle>
            <div className="grid grid-cols-4 gap-2 px-4">
              {PIPELINE.map((p) => {
                const count = data.today[p.key];
                const hot = p.key === "confirming" && count > 0;
                return (
                  <button key={p.key} onClick={() => go(`/orders?status=${p.key}`)} className={cn("relative flex flex-col items-center rounded-2xl py-3 transition-transform active:scale-95", p.tint, hot && "ring-2 ring-[#e07b00]")}>
                    {hot && <span className="absolute -top-2 rounded bg-[#e5383b] px-1.5 text-[9px] font-extrabold uppercase leading-[16px] text-white">New</span>}
                    <p.icon className={cn("h-5 w-5", p.fg)} />
                    <span className="tabular mt-1.5 text-[24px] font-extrabold leading-none text-[#1c1c1e]">{count}</span>
                    <span className={cn("mt-1 text-[11px] font-bold", p.fg)}>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Today ─────────────────────────────────── */}
          <section>
            <SectionTitle action="Reports" onAction={() => go("/reports")}>
              Today's business
            </SectionTitle>
            <div className="grid grid-cols-2 gap-2 px-4">
              <Kpi label="Sales" value={formatMoney(data.kpis.revenue.value)} current={data.kpis.revenue.value} previous={data.kpis.revenue.previous} hint="vs yesterday" />
              <Kpi label="Orders" value={formatNumber(data.kpis.orders.value)} current={data.kpis.orders.value} previous={data.kpis.orders.previous} hint="vs yesterday" />
            </div>
            <button onClick={() => go("/reports")} className={cn(CARD, "mx-4 mt-2 block w-[calc(100%-2rem)] p-3.5 text-left")}>
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-black/45 dark:text-white/50">Last 7 days</p>
                <ChevronRight className="h-4 w-4 text-black/30" />
              </div>
              <p className="tabular text-[22px] font-extrabold tracking-tight">{formatMoney(data.trend.reduce((s, d) => s + d.revenue, 0))}</p>
              <div className="mt-2 h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trend} margin={{ top: 4, left: 0, right: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="home-rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#219186" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#219186" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), "EEE")} tickLine={false} axisLine={false} fontSize={10} stroke="#9a9a9f" interval={0} padding={{ left: 12, right: 12 }} />
                    <Area type="monotone" dataKey="revenue" stroke="#219186" strokeWidth={2.5} fill="url(#home-rev)" dot={false} activeDot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </button>
          </section>

          {/* ── Quick actions ─────────────────────────── */}
          <div className="grid grid-cols-4 gap-2 px-4">
            {QUICK.map((q) => (
              <button key={q.label} onClick={() => go(q.href)} className={cn(CARD, "flex flex-col items-center gap-1.5 py-3 transition-transform active:scale-95")}>
                <q.icon className="h-6 w-6 text-[#219186]" strokeWidth={2.2} />
                <span className="text-[12px] font-bold">{q.label}</span>
              </button>
            ))}
          </div>

          {/* ── Your menu (category tiles) ────────────── */}
          {!!categories?.length && (
            <section>
              <SectionTitle action="Manage" onAction={() => go("/categories")}>
                Your menu
              </SectionTitle>
              <div className="grid grid-cols-4 gap-x-2 gap-y-3 px-4">
                {categories.map((c) => {
                  const [, emoji, tint] = categoryLook(c.category_name);
                  return (
                    <button key={c.name} onClick={() => go(`/products?category=${encodeURIComponent(c.category_name)}`)} className="flex flex-col items-center gap-1.5 transition-transform active:scale-95">
                      <span className={cn("flex aspect-square w-full items-center justify-center rounded-2xl text-[34px]", tint, !c.is_active && "opacity-40 grayscale")}>{emoji}</span>
                      <span className="line-clamp-2 text-center text-[11px] font-bold leading-tight">{c.category_name}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Best sellers ──────────────────────────── */}
          <section>
            <SectionTitle action="See all" onAction={() => go("/products")}>
              Best sellers this week
            </SectionTitle>
            <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-4 pb-1">
              {data.top_products.map((p, i) => (
                <button key={p.product} onClick={() => go(`/products/${p.product}`)} className={cn(CARD, "relative w-[132px] shrink-0 p-2.5 text-left")}>
                  {i === 0 && <span className="absolute left-4 top-4 z-10 rounded-md bg-[#BEFF00] px-1.5 text-[10px] font-extrabold uppercase leading-[18px] text-[#2B330F]">#1</span>}
                  <ProductArt category={categoryOf(p.product)} className="h-[110px] w-full rounded-xl" emojiClassName="text-[52px]" />
                  <p className="mt-2 line-clamp-2 h-9 text-[13px] font-bold leading-tight">{p.product_name}</p>
                  <p className="mt-1 text-[11px] font-semibold text-black/45 dark:text-white/50">{p.quantity} sold</p>
                  <p className="tabular text-[14px] font-extrabold">{formatMoney(p.revenue)}</p>
                </button>
              ))}
            </div>
          </section>

          {/* ── Recent orders ─────────────────────────── */}
          <section>
            <SectionTitle action="History" onAction={() => go("/orders?tab=history")}>
              Recent orders
            </SectionTitle>
            <div className={cn(CARD, "mx-4 divide-y divide-black/[0.06] overflow-hidden dark:divide-white/10")}>
              {data.recent_orders.slice(0, 5).map((o) => {
                const pipe = PIPELINE.find((p) => p.key === o.status);
                return (
                  <button key={o.name} onClick={() => go(`/orders/${o.name}`)} className="flex w-full items-center gap-3 px-3.5 py-3 text-left active:bg-black/5">
                    <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[13px] font-extrabold", pipe ? cn(pipe.tint, pipe.fg) : "bg-black/5 text-black/50")}>{initials(o.customer_name)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-bold">{o.customer_name}</span>
                      <span className="block text-[12px] text-black/45 dark:text-white/50">
                        {o.item_count} item{o.item_count > 1 ? "s" : ""} · {timeAgo(o.creation)}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="tabular block text-[15px] font-extrabold">{formatMoney(o.grand_total)}</span>
                      <span className={cn("block text-[11px] font-bold uppercase", pipe?.fg ?? "text-black/40")}>{pipe?.label ?? "Done"}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </Screen>
  );
}
