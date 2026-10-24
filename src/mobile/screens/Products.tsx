import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Plus, TrendingUp } from "lucide-react";
import { Fab, List, ListItem, Searchbar, Toggle } from "konsta/react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useCategories, useProducts, useToggleProduct } from "@/hooks/queries";
import { useDebounce } from "@/hooks/use-debounce";
import type { Product } from "@/api";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ChipBar, Empty, ErrorBlock, Loading, Screen, Thumb } from "../ui";

export default function ProductsScreen() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const debounced = useDebounce(search, 250);
  const { data: categories } = useCategories();
  const { data, isLoading, error, refetch } = useProducts({ search: debounced || undefined, category: category === "all" ? undefined : category });
  const toggle = useToggleProduct();

  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>();
    data?.data.forEach((p) => map.set(p.category, [...(map.get(p.category) ?? []), p]));
    const order = categories?.map((c) => c.category_name) ?? [];
    return [...map.entries()].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
  }, [data, categories]);

  const soldOut = data?.data.filter((p) => !p.is_available).length ?? 0;

  return (
    <Screen
      title="Products"
      subtitle={data ? `${data.total} items${soldOut ? ` · ${soldOut} sold out` : ""}` : undefined}
      large
      tabbar
      onRefresh={refetch}
      subnavbar={
        <Searchbar
          placeholder="Search menu"
          value={search}
          onInput={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          disableButton
          disableButtonText="Cancel"
          onDisable={() => setSearch("")}
        />
      }
    >
      <ChipBar
        value={category}
        onChange={setCategory}
        items={[{ value: "all", label: "All" }, ...(categories ?? []).map((c) => ({ value: c.category_name, label: c.category_name, count: c.product_count }))]}
      />

      {error ? (
        <ErrorBlock error={error} onRetry={refetch} />
      ) : isLoading ? (
        <Loading />
      ) : !grouped.length ? (
        <Empty icon={Package} title="No products" text={search ? "Try another search." : "Tap + to add your first item."} />
      ) : (
        grouped.map(([cat, items]) => (
          <div key={cat}>
            <p className="px-8 pb-1.5 pt-4 text-[13px] uppercase text-black/45 dark:text-white/45">{cat}</p>
            <List strong inset dividers className="!my-0">
              {items.map((p) => (
                <ListItem
                  key={p.name}
                  link
                  chevron={false}
                  onClick={() => navigate(`/products/${p.name}`)}
                  media={<Thumb id={p.name} label={p.product_name} image={p.image} className={cn(!p.is_available && "opacity-40 grayscale")} />}
                  title={
                    <span className={cn("flex items-center gap-1.5", !p.is_available && "text-black/40 dark:text-white/40")}>
                      {p.product_name}
                      {!!p.is_popular && <TrendingUp className="h-3.5 w-3.5 text-primary" />}
                    </span>
                  }
                  text={
                    <span className="flex items-center gap-2">
                      {p.discount_price ? (
                        <>
                          <span className="tabular font-semibold text-[#34c759]">{formatMoney(p.discount_price)}</span>
                          <span className="tabular line-through">{formatMoney(p.price)}</span>
                        </>
                      ) : (
                        <span className="tabular font-medium text-black/70 dark:text-white/70">{formatMoney(p.price)}</span>
                      )}
                      {p.status !== "Active" && <StatusBadge status={p.status} dot={false} className="px-1.5 py-0 text-[11px]" />}
                      {!p.is_available && <span className="text-[12px] font-medium text-[#ff3b30]">Sold out</span>}
                    </span>
                  }
                  after={
                    <span onClick={(e) => e.stopPropagation()}>
                      <Toggle checked={!!p.is_available} onChange={() => toggle.mutate({ id: p.name, is_available: !p.is_available })} />
                    </span>
                  }
                />
              ))}
            </List>
          </div>
        ))
      )}

      <Fab
        className="fixed right-4 z-20 bottom-[calc(5.5rem+env(safe-area-inset-bottom))]"
        icon={<Plus className="h-6 w-6" />}
        onClick={() => navigate("/products/new")}
        aria-label="Add product"
      />
    </Screen>
  );
}
