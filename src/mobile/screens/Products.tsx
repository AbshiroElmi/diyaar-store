import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Package, Plus, TrendingUp } from "lucide-react";
import { Fab, Searchbar } from "konsta/react";
import { useCategories, useProducts, useToggleProduct } from "@/hooks/queries";
import { useDebounce } from "@/hooks/use-debounce";
import type { Product } from "@/api";
import { formatMoney } from "@/lib/format";
import { haptic } from "@/lib/native";
import { cn } from "@/lib/utils";
import { CARD, categoryLook, Empty, ErrorBlock, Loading, ProductArt, Screen } from "../ui";

function ProductCard({ p }: { p: Product }) {
  const navigate = useNavigate();
  const toggle = useToggleProduct();
  const off = !p.is_available;
  const discount = p.discount_price ? Math.round((1 - p.discount_price / p.price) * 100) : 0;

  return (
    <div className={cn(CARD, "relative flex flex-col overflow-hidden p-2")}>
      <button onClick={() => navigate(`/products/${p.name}`)} className="text-left">
        <div className="relative">
          <ProductArt category={p.category} image={p.image} className={cn("h-[96px] w-full rounded-xl", off && "opacity-40 grayscale")} emojiClassName="text-[46px]" />
          {discount > 0 && <span className="absolute left-0 top-0 rounded-br-lg rounded-tl-xl bg-[#1f6fe5] px-1.5 text-[10px] font-extrabold leading-[18px] text-white">{discount}% OFF</span>}
          {p.status === "Pending" && <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 text-[9px] font-bold uppercase leading-[16px] text-white">In review</span>}
        </div>
        <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-black/45 dark:text-white/50">
          {p.sold_count} sold {!!p.is_popular && <TrendingUp className="h-3 w-3 text-primary" />}
        </p>
        <p className={cn("line-clamp-2 h-[34px] text-[13px] font-bold leading-tight", off && "text-black/40 dark:text-white/40")}>{p.product_name}</p>
      </button>
      <div className="mt-2 flex items-end justify-between gap-1">
        <div className="leading-tight">
          <p className="tabular text-[14px] font-extrabold">{formatMoney(p.discount_price ?? p.price)}</p>
          {!!p.discount_price && <p className="tabular text-[11px] text-black/40 line-through dark:text-white/40">{formatMoney(p.price)}</p>}
        </div>
        <button
          onClick={() => {
            haptic.tap();
            toggle.mutate({ id: p.name, is_available: off });
          }}
          className={cn(
            "h-8 shrink-0 rounded-lg border px-2 text-[11px] font-extrabold uppercase tracking-wide transition-colors",
            off ? "border-black/15 bg-black/[0.04] text-black/50 dark:border-white/20 dark:text-white/60" : "border-primary bg-primary/[0.08] text-primary",
          )}
        >
          {off ? "Sold out" : "In stock"}
        </button>
      </div>
    </div>
  );
}

export default function ProductsScreen() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const category = params.get("category") ?? "all";
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 250);
  const { data: categories } = useCategories();
  const { data: all } = useProducts();
  const { data, isLoading, error, refetch } = useProducts({ search: debounced || undefined, category: category === "all" ? undefined : category });

  // Keep the rail pinned just under the navbar (its height differs on iOS / Material).
  const railRef = useRef<HTMLElement>(null);
  const [railTop, setRailTop] = useState(0);
  useLayoutEffect(() => {
    const navbar = railRef.current?.closest(".k-page, [class*='overflow-auto']")?.firstElementChild as HTMLElement | null;
    if (navbar) setRailTop(navbar.offsetHeight);
  }, []);

  const soldOut = all?.data.filter((p) => !p.is_available).length ?? 0;
  const rail = useMemo(() => [{ name: "all", category_name: "All", product_count: all?.total ?? 0 }, ...(categories ?? [])], [categories, all]);

  const setCategory = (c: string) => {
    haptic.tap();
    setParams(c === "all" ? {} : { category: c }, { replace: true });
  };

  return (
    <Screen
      title="Menu items"
      subtitle={all ? `${all.total} items · ${soldOut} sold out` : undefined}
      tabbar
      onRefresh={refetch}
      subnavbar={
        <Searchbar
          placeholder="Search your menu"
          value={search}
          onInput={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          disableButton
          disableButtonText="Cancel"
          onDisable={() => setSearch("")}
        />
      }
    >
      <div className="flex">
        {/* Category rail (Blinkit-style) */}
        <nav ref={railRef} style={{ top: railTop }} className="sticky w-[78px] shrink-0 self-start border-r border-black/[0.06] bg-white pb-28 dark:border-white/10 dark:bg-[#111]">
          {rail.map((c) => {
            const active = (c.name === "all" ? "all" : c.category_name) === category;
            const [, emoji, tint] = c.name === "all" ? [null, "🍽️", "bg-[#eef3f2]"] : categoryLook(c.category_name);
            return (
              <button key={c.name} onClick={() => setCategory(c.name === "all" ? "all" : c.category_name)} className="relative flex w-full flex-col items-center gap-1 px-1.5 py-2.5">
                {active && <span className="absolute right-0 top-2 h-[calc(100%-16px)] w-1 rounded-l-full bg-primary" />}
                <span className={cn("flex h-12 w-12 items-center justify-center rounded-xl text-[24px] transition-transform", tint, active && "scale-110 ring-2 ring-primary/30")}>{emoji}</span>
                <span className={cn("line-clamp-2 text-center text-[10.5px] leading-tight", active ? "font-extrabold text-primary" : "font-semibold text-black/60 dark:text-white/60")}>{c.category_name}</span>
              </button>
            );
          })}
        </nav>

        {/* Product grid */}
        <div className="min-w-0 flex-1 p-2.5">
          {error ? (
            <ErrorBlock error={error} onRetry={refetch} />
          ) : isLoading ? (
            <Loading />
          ) : !data?.data.length ? (
            <Empty icon={Package} title="No items" text={search ? "Try another search." : "Tap + to add one."} />
          ) : (
            <>
              <p className="px-1 pb-2 text-[13px] font-extrabold">
                {category === "all" ? "All items" : category} <span className="font-semibold text-black/40 dark:text-white/40">· {data.total}</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {data.data.map((p) => (
                  <ProductCard key={p.name} p={p} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Fab
        className="fixed right-4 z-20 bottom-[calc(9.5rem+env(safe-area-inset-bottom))]"
        icon={<Plus className="h-6 w-6" />}
        text="Add item"
        onClick={() => navigate("/products/new")}
      />
    </Screen>
  );
}
