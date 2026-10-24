import { useEffect, useState } from "react";
import { addDays, format } from "date-fns";
import { BadgePercent, Copy, Gift, Loader2, Megaphone, MoreVertical, Pause, Play, Plus, Tag, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { ResponsiveDialog } from "@/components/shared/ResponsiveDialog";
import { SegmentedTabs } from "@/components/shared/SegmentedTabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState, ErrorState } from "@/components/shared/States";
import { useDeletePromotion, usePromotions, useSavePromotion } from "@/hooks/queries";
import type { Promotion, PromotionType } from "@/api";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const TYPES: Array<{ value: PromotionType; label: string; icon: typeof Tag; hint: string }> = [
  { value: "percentage", label: "% off", icon: BadgePercent, hint: "e.g. 15% off the order" },
  { value: "fixed", label: "$ off", icon: Tag, hint: "e.g. $3 off the order" },
  { value: "free_delivery", label: "Free delivery", icon: Truck, hint: "Customer pays no delivery fee" },
  { value: "bogo", label: "Buy 1 get 1", icon: Gift, hint: "Second item is free" },
];

function describe(p: Pick<Promotion, "type" | "value" | "min_order">) {
  const base = p.type === "percentage" ? `${p.value}% off` : p.type === "fixed" ? `${formatMoney(p.value)} off` : p.type === "free_delivery" ? "Free delivery" : "Buy 1, get 1 free";
  return p.min_order ? `${base} on orders over ${formatMoney(p.min_order)}` : base;
}

const toInput = (iso: string) => format(new Date(iso), "yyyy-MM-dd");

function PromotionForm({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const save = useSavePromotion();
  const [type, setType] = useState<PromotionType>("percentage");
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("10");
  const [minOrder, setMinOrder] = useState("0");
  const [code, setCode] = useState("");
  const [limit, setLimit] = useState("");
  const [start, setStart] = useState(toInput(new Date().toISOString()));
  const [end, setEnd] = useState(toInput(addDays(new Date(), 14).toISOString()));

  useEffect(() => {
    if (!open) return;
    setType("percentage");
    setTitle("");
    setValue("10");
    setMinOrder("0");
    setCode("");
    setLimit("");
    setStart(toInput(new Date().toISOString()));
    setEnd(toInput(addDays(new Date(), 14).toISOString()));
  }, [open]);

  const needsValue = type === "percentage" || type === "fixed";
  const valid = title.trim() && (!needsValue || Number(value) > 0) && (type !== "percentage" || Number(value) <= 90);

  const submit = () =>
    save.mutate(
      {
        data: {
          title: title.trim(),
          type,
          value: needsValue ? Number(value) : 0,
          min_order: Number(minOrder) || 0,
          code: code.trim().toUpperCase() || undefined,
          usage_limit: limit ? Number(limit) : undefined,
          starts_at: new Date(`${start}T00:00`).toISOString(),
          ends_at: new Date(`${end}T23:59`).toISOString(),
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="New promotion"
      description="Attract more orders with a discount. Diyaar shows active deals in the customer app."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!valid || save.isPending}>
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={cn("flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors", type === t.value ? "border-primary bg-accent/60" : "hover:bg-muted")}
            >
              <t.icon className={cn("h-4 w-4", type === t.value ? "text-primary" : "text-muted-foreground")} />
              <span className="text-sm font-medium">{t.label}</span>
              <span className="text-xs text-muted-foreground">{t.hint}</span>
            </button>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pr-title">Title</Label>
          <Input id="pr-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekend Grill Deal" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {needsValue && (
            <div className="space-y-1.5">
              <Label htmlFor="pr-value">{type === "percentage" ? "Discount (%)" : "Discount ($)"}</Label>
              <Input id="pr-value" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="pr-min">Minimum order ($)</Label>
            <Input id="pr-min" inputMode="decimal" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pr-code">Promo code (optional)</Label>
            <Input id="pr-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Auto-applied if empty" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pr-limit">Usage limit</Label>
            <Input id="pr-limit" inputMode="numeric" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="Unlimited" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pr-start">Starts</Label>
            <Input id="pr-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pr-end">Ends</Label>
            <Input id="pr-end" type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        {valid && <p className="rounded-lg bg-muted p-3 text-sm">Customers will see: <span className="font-medium">{describe({ type, value: Number(value), min_order: Number(minOrder) })}</span></p>}
      </div>
    </ResponsiveDialog>
  );
}

export default function Promotions() {
  const { data, isLoading, error, refetch } = usePromotions();
  const save = useSavePromotion();
  const remove = useDeletePromotion();
  const [filter, setFilter] = useState<"all" | "active" | "scheduled" | "ended">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Promotion | null>(null);

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const rows = (data ?? []).filter((p) => filter === "all" || (filter === "active" ? p.status === "active" || p.status === "paused" : p.status === filter));
  const count = (s: Promotion["status"]) => data?.filter((p) => p.status === s).length ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Promotions"
        description="Run discounts and promo codes for your store."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New promotion
          </Button>
        }
      />

      <SegmentedTabs
        value={filter}
        onChange={setFilter}
        segments={[
          { value: "all", label: "All", count: data?.length },
          { value: "active", label: "Running", count: count("active") + count("paused") },
          { value: "scheduled", label: "Scheduled", count: count("scheduled") },
          { value: "ended", label: "Ended", count: count("ended") },
        ]}
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-52 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : !rows.length ? (
        <Card>
          <EmptyState icon={Megaphone} title="No promotions here" description="Create a promotion to bring in more customers." action={<Button onClick={() => setFormOpen(true)}>New promotion</Button>} />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((p) => {
            const Icon = TYPES.find((t) => t.value === p.type)!.icon;
            return (
              <Card key={p.name} className={cn("flex flex-col p-5", p.status === "ended" && "opacity-70")}>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{p.title}</p>
                    <p className="text-sm text-muted-foreground">{describe(p)}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="-mr-2 -mt-1 h-8 w-8" aria-label="Actions">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {p.status === "active" && (
                        <DropdownMenuItem onClick={() => save.mutate({ id: p.name, data: { status: "paused" } })}>
                          <Pause className="mr-2 h-4 w-4" /> Pause
                        </DropdownMenuItem>
                      )}
                      {p.status === "paused" && (
                        <DropdownMenuItem onClick={() => save.mutate({ id: p.name, data: { status: "active" } })}>
                          <Play className="mr-2 h-4 w-4" /> Resume
                        </DropdownMenuItem>
                      )}
                      {p.status !== "ended" && (
                        <DropdownMenuItem onClick={() => save.mutate({ id: p.name, data: { status: "ended", ends_at: new Date().toISOString() } })}>End now</DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleting(p)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <StatusBadge status={p.status} />
                  {p.code && (
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(p.code!);
                        toast.success(`Copied ${p.code}`);
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-dashed px-2 py-0.5 font-mono text-xs hover:bg-muted"
                    >
                      {p.code} <Copy className="h-3 w-3" />
                    </button>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDate(p.starts_at)} – {formatDate(p.ends_at)}
                  </span>
                </div>

                <div className="mt-auto pt-4">
                  <div className="grid grid-cols-2 gap-3 border-t pt-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Times used</p>
                      <p className="tabular font-semibold">
                        {p.usage_count}
                        {p.usage_limit ? <span className="font-normal text-muted-foreground"> / {p.usage_limit}</span> : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Sales generated</p>
                      <p className="tabular font-semibold">{formatMoney(p.revenue)}</p>
                    </div>
                  </div>
                  {p.usage_limit ? <Progress value={(p.usage_count / p.usage_limit) * 100} className="mt-3 h-1.5" /> : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <PromotionForm open={formOpen} onOpenChange={setFormOpen} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete “${deleting?.title}”?`}
        description="The promotion stops immediately and its stats are removed."
        confirmLabel="Delete"
        destructive
        onConfirm={() => deleting && remove.mutate(deleting.name)}
      />
    </div>
  );
}
