import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MoreVertical, Package, Pencil, Plus, Search, Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { SegmentedTabs } from "@/components/shared/SegmentedTabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/shared/States";
import { ProductForm } from "@/components/products/ProductForm";
import { useCategories, useDeleteProduct, useProducts, useToggleProduct } from "@/hooks/queries";
import { useDebounce } from "@/hooks/use-debounce";
import type { Product } from "@/api";
import { formatMoney, initials } from "@/lib/format";
import { cn } from "@/lib/utils";

type Filter = "all" | "available" | "unavailable" | "Pending";

const TILE_COLORS = ["bg-primary/15 text-primary", "bg-info/15 text-info", "bg-warning/20 text-[hsl(32_90%_36%)]", "bg-success/15 text-success", "bg-destructive/10 text-destructive"];

export function ProductThumb({ product, className }: { product: Pick<Product, "product_name" | "image" | "name">; className?: string }) {
  const color = TILE_COLORS[product.name.charCodeAt(product.name.length - 1) % TILE_COLORS.length];
  if (product.image) return <img src={product.image} alt="" className={cn("h-12 w-12 rounded-lg object-cover", className)} />;
  return <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-sm font-semibold", color, className)}>{initials(product.product_name)}</span>;
}

export default function Products() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const debounced = useDebounce(search, 250);

  const { data: categories } = useCategories();
  const { data: all } = useProducts();
  const { data, isLoading, error, refetch } = useProducts({
    search: debounced || undefined,
    category: category === "all" ? undefined : category,
    availability: filter === "available" || filter === "unavailable" ? filter : undefined,
    status: filter === "Pending" ? "Pending" : undefined,
  });
  const toggle = useToggleProduct();
  const remove = useDeleteProduct();

  const counts = useMemo(() => {
    const rows = all?.data ?? [];
    return {
      all: rows.length,
      available: rows.filter((p) => p.is_available).length,
      unavailable: rows.filter((p) => !p.is_available).length,
      Pending: rows.filter((p) => p.status === "Pending").length,
    };
  }, [all]);

  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>();
    data?.data.forEach((p) => map.set(p.category, [...(map.get(p.category) ?? []), p]));
    const order = categories?.map((c) => c.category_name) ?? [];
    return [...map.entries()].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
  }, [data, categories]);

  const openForm = (p: Product | null) => {
    setEditing(p);
    setFormOpen(true);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Products"
        description={`${counts.all} items on your menu · ${counts.unavailable} sold out`}
        actions={
          <>
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link to="/categories">Manage categories</Link>
            </Button>
            <Button onClick={() => openForm(null)}>
              <Plus className="mr-1.5 h-4 w-4" /> Add product
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search products" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="lg:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.name} value={c.category_name}>
                {c.category_name} ({c.product_count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <SegmentedTabs
        value={filter}
        onChange={setFilter}
        segments={[
          { value: "all", label: "All", count: counts.all },
          { value: "available", label: "In stock", count: counts.available },
          { value: "unavailable", label: "Sold out", count: counts.unavailable },
          { value: "Pending", label: "In review", count: counts.Pending },
        ]}
      />

      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading ? (
        <Card>
          <ListSkeleton rows={8} />
        </Card>
      ) : !grouped.length ? (
        <Card>
          <EmptyState
            icon={Package}
            title="No products found"
            description={search ? "Try a different search." : "Add your first product to start selling."}
            action={!search && <Button onClick={() => openForm(null)}>Add product</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(([cat, items]) => (
            <section key={cat}>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                {cat} <span className="font-normal">({items.length})</span>
              </h2>
              <Card className="divide-y overflow-hidden">
                {items.map((p) => (
                  <div key={p.name} className={cn("flex items-center gap-3 p-3 sm:p-4", !p.is_available && "bg-muted/30")}>
                    <button onClick={() => openForm(p)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <ProductThumb product={p} className={cn(!p.is_available && "opacity-50")} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2">
                          <span className="truncate font-medium">{p.product_name}</span>
                          {!!p.is_popular && <TrendingUp className="h-3.5 w-3.5 shrink-0 text-primary" aria-label="Popular" />}
                        </p>
                        <p className="hidden truncate text-sm text-muted-foreground sm:block">{p.description}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm">
                          {p.discount_price ? (
                            <>
                              <span className="tabular font-medium text-success">{formatMoney(p.discount_price)}</span>
                              <span className="tabular text-xs text-muted-foreground line-through">{formatMoney(p.price)}</span>
                            </>
                          ) : (
                            <span className="tabular font-medium">{formatMoney(p.price)}</span>
                          )}
                          <span className="text-xs text-muted-foreground">· {p.sold_count} sold</span>
                        </p>
                      </div>
                    </button>
                    {p.status !== "Active" && <StatusBadge status={p.status} className="hidden sm:inline-flex" />}
                    <div className="flex flex-col items-center gap-0.5">
                      <Switch
                        checked={!!p.is_available}
                        onCheckedChange={(v) => toggle.mutate({ id: p.name, is_available: v })}
                        aria-label={p.is_available ? "Mark sold out" : "Mark in stock"}
                      />
                      <span className="text-[10px] text-muted-foreground">{p.is_available ? "In stock" : "Sold out"}</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="More actions">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openForm(p)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleting(p)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </Card>
            </section>
          ))}
        </div>
      )}

      <ProductForm open={formOpen} onOpenChange={setFormOpen} product={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete “${deleting?.product_name}”?`}
        description="It will be removed from your menu. Past orders are not affected."
        confirmLabel="Delete"
        destructive
        onConfirm={() => deleting && remove.mutate(deleting.name)}
      />
    </div>
  );
}
