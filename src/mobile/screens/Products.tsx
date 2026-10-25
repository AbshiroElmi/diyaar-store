import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Download, FileDown, FileUp, Package, PackagePlus, Plus } from "lucide-react";
import { ActionsGroup, ActionsLabel } from "konsta/react";
import { toast } from "sonner";
import { useCategories, useStoreCategories, useImportProducts, useProducts, useToggleProduct } from "@/hooks/queries";
import { useDebounce } from "@/hooks/use-debounce";
import type { Product } from "@/api";
import { productsToCsv, productTemplateCsv, readProductsCsv, saveCsv, type ImportRow } from "@/lib/csv";
import { formatMoney } from "@/lib/format";
import { haptic } from "@/lib/native";
import { cn } from "@/lib/utils";
import { ActionItem, Actions, CARD, Empty, ErrorBlock, FormSheet, Loading, ProductArt, Screen, SearchField } from "../ui";


function ProductCard({ p }: { p: Product }) {
  const navigate = useNavigate();
  const toggle = useToggleProduct();
  const off = !p.is_available;
  const discount = p.discount_price ? Math.round((1 - p.discount_price / p.price) * 100) : 0;

  return (
    <div className={cn(CARD, "relative flex flex-col overflow-hidden p-2")}>
      <button onClick={() => navigate(`/products/${p.name}`)} className="text-left">
        <div className="relative">
          <ProductArt category={p.category_name} image={p.image} className={cn("h-[96px] w-full rounded-xl", off && "opacity-40 grayscale")} emojiClassName="text-[46px]" />
          {discount > 0 && <span className="absolute left-0 top-0 rounded-br-lg rounded-tl-xl bg-[#1f6fe5] px-1.5 text-[10px] font-extrabold leading-[18px] text-white">{discount}% OFF</span>}
          {p.status === "Pending" && <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 text-[9px] font-bold uppercase leading-[16px] text-white">In review</span>}
        </div>
        <p className="mt-2 truncate text-[11px] font-semibold text-black/45 dark:text-white/50">{p.category_name}</p>
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
  // The rail shows this store's categories; a CSV may name any category the store can use.
  const { data: categories } = useStoreCategories();
  const { data: allCategories } = useCategories();
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

  // ── Add / import / export menu ──
  const [menuOpen, setMenuOpen] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[] | null>(null);
  const importer = useImportProducts();
  const fileRef = useRef<HTMLInputElement>(null);
  const goodRows = importRows?.filter((r) => r.data) ?? [];
  const badRows = importRows?.filter((r) => r.error) ?? [];

  const pick = (fn: () => void) => () => {
    haptic.tap();
    setMenuOpen(false);
    fn();
  };
  const exportCsv = async () => {
    if (!all?.data.length) return toast.error("No items to export yet");
    try {
      await saveCsv(`menu-items-${new Date().toISOString().slice(0, 10)}.csv`, productsToCsv(all.data));
    } catch (err) {
      if (!/cancel/i.test(String((err as Error)?.message))) toast.error("Couldn't export the file");
    }
  };
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const rows = readProductsCsv(await file.text(), allCategories ?? []);
      if (!rows.length) return toast.error("No items found in that file");
      setImportRows(rows);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

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
        <SearchField placeholder="Search your menu" value={search} onChange={setSearch} />
      }
    >
      <div>
        {/* Category row across the top, pinned under the navbar while scrolling; the URL holds the category ID */}
        <nav ref={railRef} style={{ top: railTop }} className="no-scrollbar sticky z-10 flex gap-2 overflow-x-auto border-b border-black/[0.06] bg-[#f7f9f9]/95 px-3 py-2.5 backdrop-blur dark:border-white/10 dark:bg-black/90">
          {rail.map((c) => {
            const active = c.name === category;
            return (
              <button
                key={c.name}
                onClick={() => setCategory(c.name)}
                className={cn(
                  "flex h-10 shrink-0 items-center gap-2 rounded-full pl-1 pr-3.5 text-[14px] transition-colors active:scale-95",
                  active ? "bg-primary font-bold text-white" : "bg-white font-semibold text-black/70 ring-1 ring-black/[0.06] dark:bg-white/10 dark:text-white/75 dark:ring-white/10",
                )}
              >
                <ProductArt category={c.name === "all" ? "" : c.category_name} image={"image" in c ? c.image : undefined} className="h-8 w-8 rounded-full" emojiClassName="text-[16px]" />
                <span className="whitespace-nowrap">{c.category_name}</span>
              </button>
            );
          })}
        </nav>

        {/* Product grid */}
        <div className="p-2.5">
          {error ? (
            <ErrorBlock error={error} onRetry={refetch} />
          ) : isLoading ? (
            <Loading />
          ) : !data?.data.length ? (
            <Empty icon={Package} title="No items" text={search ? "Try another search." : "Tap + to add one."} />
          ) : (
            <>
              <p className="px-1 pb-2 text-[13px] font-extrabold">
                {category === "all" ? "All items" : (categories?.find((c) => c.name === category)?.category_name ?? "Items")} <span className="font-semibold text-black/40 dark:text-white/40">· {data.total}</span>
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

      <button
        type="button"
        onClick={() => {
          haptic.tap();
          setMenuOpen(true);
        }}
        className="hide-on-kb fixed right-4 z-20 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] flex h-11 items-center gap-1.5 rounded-xl bg-primary pl-3 pr-4 text-[15px] font-bold text-white shadow-[0_8px_20px_-8px_rgba(33,145,134,0.65)] transition-transform active:scale-95"
      >
        <Plus className="h-5 w-5" strokeWidth={2.5} />
        Add item
      </button>

      <input ref={fileRef} type="file" accept=".csv,text/csv,text/comma-separated-values" className="hidden" onChange={onFile} />

      <Actions opened={menuOpen} onBackdropClick={() => setMenuOpen(false)}>
        <ActionsGroup>
          <ActionsLabel>Menu items</ActionsLabel>
          <ActionItem icon={PackagePlus} onClick={pick(() => navigate("/products/new"))}>
            Add item
          </ActionItem>
          <ActionItem icon={FileUp} onClick={pick(() => fileRef.current?.click())}>
            Import from CSV
          </ActionItem>
          <ActionItem icon={FileDown} onClick={pick(exportCsv)}>
            Export CSV{all ? ` (${all.total})` : ""}
          </ActionItem>
          <ActionItem icon={Download} onClick={pick(() => saveCsv("menu-items-template.csv", productTemplateCsv(categories?.length ? categories : (allCategories ?? []))))}>
            Download CSV template
          </ActionItem>
        </ActionsGroup>
      </Actions>

      <FormSheet
        opened={!!importRows}
        onClose={() => setImportRows(null)}
        title="Import items"
        saveLabel={`Import ${goodRows.length}`}
        saving={importer.isPending}
        canSave={goodRows.length > 0}
        onSave={() => importer.mutate(goodRows.map((r) => r.data!), { onSuccess: () => setImportRows(null) })}
      >
        <div className="space-y-3 p-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-primary/10 p-3">
              <p className="flex items-center gap-1.5 text-[12px] font-bold text-primary"><CheckCircle2 className="h-4 w-4" /> Ready</p>
              <p className="tabular mt-1 text-[24px] font-extrabold leading-none">{goodRows.length}</p>
            </div>
            <div className={cn("rounded-xl p-3", badRows.length ? "bg-[#ff3b30]/10" : "bg-black/[0.04] dark:bg-white/10")}>
              <p className={cn("flex items-center gap-1.5 text-[12px] font-bold", badRows.length ? "text-[#ff3b30]" : "text-black/45 dark:text-white/50")}><AlertCircle className="h-4 w-4" /> Skipped</p>
              <p className="tabular mt-1 text-[24px] font-extrabold leading-none">{badRows.length}</p>
            </div>
          </div>

          {!!badRows.length && (
            <div className={cn(CARD, "divide-y divide-black/[0.06] dark:divide-white/10")}>
              {badRows.map((r) => (
                <p key={r.line} className="flex gap-2 px-3 py-2 text-[13px]">
                  <span className="shrink-0 font-bold text-black/40 dark:text-white/40">Row {r.line}</span>
                  <span className="text-[#ff3b30]">{r.error}</span>
                </p>
              ))}
            </div>
          )}

          {!!goodRows.length && (
            <div className={cn(CARD, "divide-y divide-black/[0.06] dark:divide-white/10")}>
              {goodRows.map(({ line, data: d, categoryName }) => (
                <div key={line} className="flex items-center gap-3 px-3 py-2.5">
                  <ProductArt category={categoryName ?? ""} className="h-10 w-10 shrink-0 rounded-lg" emojiClassName="text-[20px]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold">{d!.product_name}</p>
                    <p className="truncate text-[12px] text-black/45 dark:text-white/50">
                      {categoryName}
                      {d!.is_available ? "" : " · sold out"}
                    </p>
                  </div>
                  <p className="tabular text-[14px] font-extrabold">{formatMoney(d!.discount_price ?? d!.price)}</p>
                </div>
              ))}
            </div>
          )}

          <p className="px-1 text-[12px] text-black/45 dark:text-white/50">Categories must already exist on the Diyaar web panel. New items may be reviewed by Diyaar before customers can see them. Photos can be added to each item afterwards.</p>
        </div>
      </FormSheet>
    </Screen>
  );
}
