import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useTheme } from "next-themes";
import { Area, AreaChart, ResponsiveContainer, XAxis } from "recharts";
import { ChefHat, ChevronDown, Clock, PackageCheck, PackagePlus, ReceiptText, Search, ShoppingBag, Star, Users } from "lucide-react";
import limeHand from "@/assets/logo-hand-lime.png";
import { useBanners, useCategories, useDashboard, useOrderCounts, useProducts, useSetStoreOpen, useStore } from "@/hooks/queries";
import { formatMoney, formatNumber, initials, timeAgo } from "@/lib/format";
import { haptic, setStatusBarTheme } from "@/lib/native";
import { useHomeCategories } from "@/lib/prefs";
import { cn } from "@/lib/utils";
import { BannerCarousel } from "../BannerCarousel";
import { CARD, ErrorBlock, Kpi, Loading, ProductArt, Screen, SectionTitle } from "../ui";

const PIPELINE = [
  { key: "confirming", label: "New", icon: ReceiptText, tint: "bg-[#fff4e0]", fg: "text-[#e07b00]" },
  { key: "accepted", label: "Accepted", icon: PackageCheck, tint: "bg-[#e8f1ff]", fg: "text-[#1f6fe5]" },
  { key: "preparing", label: "Cooking", icon: ChefHat, tint: "bg-[#f0eeff]", fg: "text-[#5b4ee0]" },
  { key: "ready", label: "Ready", icon: ShoppingBag, tint: "bg-[#e8f7ee]", fg: "text-[#1a9d4b]" },
] as const;

const QUICK = [
  { label: "Add item", icon: PackagePlus, href: "/products/new" },
  { label: "Reviews", icon: Star, href: "/reviews" },
  { label: "Hours", icon: Clock, href: "/hours" },
  { label: "Team", icon: Users, href: "/team" },
];

export default function HomeScreen() {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const { data, isLoading, error, refetch } = useDashboard();
  const { data: store } = useStore();
  // Diyaar's banners from the customer app; the store's own ones come first.
  const { data: allBanners } = useBanners();
  const isMyBanner = (b: { store?: { name: string } }) => !!store && b.store?.name === store.store_name;
  const banners = allBanners && [...allBanners.filter(isMyBanner), ...allBanners.filter((b) => !isMyBanner(b))];
  const { data: allCategories } = useCategories();
  const activeCategories = allCategories?.filter((c) => c.is_active) ?? [];
  // The owner picks which categories show here (Categories screen, saved on this phone).
  const { shown } = useHomeCategories(activeCategories.map((c) => c.name));
  const categories = activeCategories.filter((c) => shown.has(c.name));
  // Products the owner tagged "Best seller" (Edit product → Tag).
  const { data: products } = useProducts();
  const bestSellers = products?.data.filter((p) => p.tags.includes("best_seller")) ?? [];
  // Live counts cover every active order, not just today's.
  const { data: counts } = useOrderCounts();
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
  const toggleOpen = () => {
    haptic.press();
    setOpen.mutate(!open);
  };

  // Once the search bar scrolls under the status bar, slide in the compact header.
  const searchRef = useRef<HTMLButtonElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const el = searchRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setCollapsed(!e.isIntersecting && e.boundingClientRect.top < 100), { rootMargin: "-100px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Big header content fades and drifts up in step with the scroll.
  const heroRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const hero = heroRef.current;
    let scroller: HTMLElement | null = hero?.parentElement ?? null;
    while (scroller && !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement;
    if (!hero || !scroller) return;
    const sc = scroller;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const p = Math.min(Math.max(sc.scrollTop / 140, 0), 1);
        hero.style.opacity = String(1 - p);
        hero.style.transform = `translateY(${p * 24}px) scale(${1 - p * 0.04})`;
      });
    };
    sc.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      sc.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const newOrders = counts?.confirming ?? data?.today.confirming ?? 0;

  return (
    <Screen title="Home" bare tabbar>
      {/* ── Compact sticky header (appears on scroll) ─────── */}
      <div
        aria-hidden={!collapsed}
        className={cn(
          "fixed inset-x-0 top-0 z-40 bg-gradient-to-r from-[#219186] to-[#0f4f48] px-4 pb-2.5 pt-[calc(env(safe-area-inset-top)+6px)] text-white shadow-[0_8px_24px_-12px_rgba(15,79,72,0.6)] transition-all duration-300 ease-out",
          collapsed ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0",
        )}
      >
        <div className="flex items-center gap-2.5">
          <button onClick={() => go("/store")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[12px] font-extrabold text-[#219186]">
            {store ? initials(store.store_name) : ""}
          </button>
          <button onClick={() => go("/store")} className="min-w-0 flex-1 text-left">
            <p className="truncate text-[15px] font-extrabold leading-tight">{store?.store_name}</p>
            {newOrders > 0 ? (
              <p className="flex items-center gap-1.5 truncate text-[12px] font-bold text-[#BEFF00]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#BEFF00] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#BEFF00]" />
                </span>
                {newOrders} new {newOrders === 1 ? "order" : "orders"} waiting
              </p>
            ) : (
              <p className="truncate text-[12px] font-medium text-white/80">{open ? (store?.busy_mode ? "Busy right now" : "Open for orders") : "Store is closed"}</p>
            )}
          </button>
          <button onClick={toggleOpen} className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-[12px] font-extrabold active:bg-white/25">
            <span className={cn("h-2 w-2 rounded-full", open ? "bg-[#BEFF00]" : "bg-[#ff4d4f]")} />
            {open ? "Open" : "Closed"}
          </button>
          <button onClick={() => go("/orders?tab=history")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15" aria-label="Search">
            <Search className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      {/* ── Brand header ───────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#3fd0bd] via-[#219186] to-[#0f4f48] px-4 pb-14 pt-[calc(env(safe-area-inset-top)+10px)] text-white">
        {/* bottom of the header fades into the page */}
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent via-[#f7f9f9]/70 to-[#f7f9f9] dark:via-black/70 dark:to-black" />
        {/* soft glows on the gradient */}
        <span className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#BEFF00]/20 blur-3xl" />
        <span className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div ref={heroRef} className="relative origin-top will-change-transform">
        <div className="relative flex items-start gap-3">
          <button onClick={() => go("/store")} className="min-w-0 flex-1 text-left">
            <p className="text-[12px] font-bold uppercase tracking-wider text-white/75">Diyaar Store</p>
            <p className="mt-0.5 truncate text-[22px] font-extrabold leading-tight tracking-tight">{open ? (store?.busy_mode ? "Busy right now" : "Open for orders") : "Store is closed"}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[13px] font-medium text-white/85">
              <span className="truncate">{store?.store_name}</span>
              <ChevronDown className="h-4 w-4 shrink-0" />
            </p>
          </button>
          <button onClick={() => go("/store")} className="shrink-0 active:scale-95" aria-label="Store profile">
            <img src={limeHand} alt="Diyaar" className="h-10 w-10 drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]" draggable={false} />
          </button>
        </div>

        {/* Prep time · rating · online switch */}
        <div className="relative mt-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-[13px] font-bold">
            <Clock className="h-4 w-4" /> {store?.preparation_time ?? "–"} min prep
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-[13px] font-bold">
            <Star className="h-4 w-4 fill-[#BEFF00] text-[#BEFF00]" /> {data ? data.kpis.rating.value.toFixed(1) : "–"}
          </span>
          <button
            onClick={toggleOpen}
            className="ml-auto inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5 text-[13px] font-extrabold text-white transition-colors active:bg-white/25"
          >
            <span className={cn("h-2 w-2 rounded-full", open ? "bg-[#BEFF00]" : "bg-[#ff4d4f]")} />
            {open ? "Open" : "Closed"}
          </button>
        </div>

        </div>

        {/* Search */}
        <button ref={searchRef} onClick={() => go("/orders?tab=history")} className="relative z-10 mt-3 flex h-11 w-full items-center gap-2.5 rounded-xl bg-white px-3.5 text-left text-[15px] text-black/45 shadow-[0_6px_20px_-8px_rgba(15,79,72,0.35)]">
          <Search className="h-5 w-5 text-black/60" />
          Search orders, customers…
        </button>
      </div>

      {error ? (
        <ErrorBlock error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <Loading />
      ) : (
        <div className="-mt-8 space-y-6">
          {/* ── Offer banners ─────────────────────────── */}
          {!!banners?.length && <BannerCarousel banners={banners} isMine={isMyBanner} onOpenMine={() => go("/products")} />}

          {/* ── Live orders ───────────────────────────── */}
          <section>
            <SectionTitle action="See all" onAction={() => go("/orders")}>
              Live orders
            </SectionTitle>
            <div className="grid grid-cols-4 gap-2 px-4">
              {PIPELINE.map((p) => {
                const count = counts?.[p.key] ?? data.today[p.key];
                const hot = p.key === "confirming" && count > 0;
                return (
                  <button key={p.key} onClick={() => go(`/orders?status=${p.key}`)} className={cn("relative flex flex-col items-center rounded-xl py-3 transition-transform active:scale-95", p.tint, hot && "ring-2 ring-[#e07b00]")}>
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
            <SectionTitle>Today's business</SectionTitle>
            <div className="grid grid-cols-2 gap-2 px-4">
              <Kpi label="Sales" value={formatMoney(data.kpis.revenue.value)} current={data.kpis.revenue.value} previous={data.kpis.revenue.previous} hint="vs yesterday" />
              <Kpi label="Orders" value={formatNumber(data.kpis.orders.value)} current={data.kpis.orders.value} previous={data.kpis.orders.previous} hint="vs yesterday" />
            </div>
            <div className={cn(CARD, "mx-4 mt-2 p-3.5")}>
              <p className="text-[12px] font-semibold uppercase tracking-wide text-black/45 dark:text-white/50">Last 7 days</p>
              <p className="tabular text-[22px] font-extrabold tracking-tight">{formatMoney(data.trend.reduce((s, d) => s + d.revenue, 0))}</p>
              <div className="mt-2 h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trend} margin={{ top: 4, left: 0, right: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="home-rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#BEFF00" stopOpacity={0.55} />
                        <stop offset="100%" stopColor="#BEFF00" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), "EEE")} tickLine={false} axisLine={false} fontSize={10} stroke="#9a9a9f" interval={0} padding={{ left: 12, right: 12 }} />
                    <Area type="monotone" dataKey="revenue" stroke={resolvedTheme === "dark" ? "#BEFF00" : "#2B330F"} strokeWidth={2.5} fill="url(#home-rev)" dot={false} activeDot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* ── Quick actions ─────────────────────────── */}
          <div className="grid grid-cols-4 gap-2 px-4">
            {QUICK.map((q) => (
              <button key={q.label} onClick={() => go(q.href)} className={cn(CARD, "flex flex-col items-center gap-1.5 py-3 transition-transform active:scale-95")}>
                <q.icon className="h-6 w-6 text-primary" strokeWidth={2.2} />
                <span className="text-[12px] font-bold">{q.label}</span>
              </button>
            ))}
          </div>



          {/* ── Your menu (category tiles) ──────────────── */}
          {!!activeCategories.length && (
            <section>
              <SectionTitle action="Manage" onAction={() => go("/categories")}>
                Your menu
              </SectionTitle>
              {!categories.length && (
                <button onClick={() => go("/categories")} className={cn(CARD, "mx-4 block w-[calc(100%-2rem)] p-3.5 text-left text-[14px] text-black/55 dark:text-white/55")}>
                  No categories on Home. Tap to choose some.
                </button>
              )}
              {/* One row that scrolls sideways, however many categories are switched on. */}
              <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
                {categories.map((c) => (
                  <button key={c.name} onClick={() => go(`/products?category=${encodeURIComponent(c.name)}`)} className="flex w-[76px] shrink-0 flex-col items-center gap-1.5 transition-transform active:scale-95">
                    <ProductArt category={c.category_name} image={c.image} className="h-[76px] w-[76px] rounded-xl" emojiClassName="text-[34px]" />
                    <span className="line-clamp-2 text-center text-[11px] font-bold leading-tight">{c.category_name}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── Best sellers (tagged by the owner) ──────── */}
          {!!bestSellers.length && (
            <section>
              <SectionTitle action="All items" onAction={() => go("/products")}>
                Best sellers
              </SectionTitle>
              <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
                {bestSellers.map((p) => (
                  <button key={p.name} onClick={() => go(`/products/${encodeURIComponent(p.name)}`)} className={cn(CARD, "w-[140px] shrink-0 overflow-hidden text-left transition-transform active:scale-95")}>
                    <ProductArt category={p.category_name} image={p.image} className={cn("aspect-square w-full", !p.is_available && "opacity-50")} emojiClassName="text-[44px]" />
                    <span className="block px-2.5 pb-2.5 pt-2">
                      <span className="block truncate text-[14px] font-bold">{p.product_name}</span>
                      <span className="mt-0.5 flex items-baseline gap-1.5">
                        <span className="tabular text-[14px] font-extrabold">{formatMoney(p.discount_price || p.price)}</span>
                        {!!p.discount_price && <span className="tabular text-[11px] text-black/40 line-through dark:text-white/40">{formatMoney(p.price)}</span>}
                      </span>
                      {!p.is_available && <span className="block text-[11px] font-bold uppercase text-[#ff3b30]">Sold out</span>}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

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
                        {timeAgo(o.creation)}
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
      {/* Room for the floating "new orders" bar, which only shows on Home. */}
      {newOrders > 0 && <div className="h-16" />}
    </Screen>
  );
}
