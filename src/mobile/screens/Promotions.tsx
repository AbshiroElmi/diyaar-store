import { useState } from "react";
import { addDays, format } from "date-fns";
import { BadgePercent, Gift, Megaphone, Plus, Tag, Truck } from "lucide-react";
import { ActionsButton, ActionsGroup, ActionsLabel, BlockTitle, Link as KLink, List, ListInput } from "konsta/react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useDeletePromotion, usePromotions, useSavePromotion } from "@/hooks/queries";
import type { Promotion, PromotionType } from "@/api";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Actions, ChipBar, Empty, ErrorBlock, FormSheet, Loading, Screen } from "../ui";

const TYPES: Array<{ value: PromotionType; label: string; icon: typeof Tag; color: string }> = [
  { value: "percentage", label: "% off", icon: BadgePercent, color: "from-[#ff2d55] to-[#ff6482]" },
  { value: "fixed", label: "$ off", icon: Tag, color: "from-[#5856d6] to-[#7d7aff]" },
  { value: "free_delivery", label: "Free delivery", icon: Truck, color: "from-[#219186] to-[#2bb5a7]" },
  { value: "bogo", label: "Buy 1 get 1", icon: Gift, color: "from-[#ff9500] to-[#ffb340]" },
];

const headline = (p: Pick<Promotion, "type" | "value">) =>
  p.type === "percentage" ? `${p.value}% OFF` : p.type === "fixed" ? `${formatMoney(p.value)} OFF` : p.type === "free_delivery" ? "FREE DELIVERY" : "BUY 1 GET 1";

const day = (d: Date) => format(d, "yyyy-MM-dd");

function NewPromotionSheet({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const save = useSavePromotion();
  const [type, setType] = useState<PromotionType>("percentage");
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("10");
  const [minOrder, setMinOrder] = useState("0");
  const [code, setCode] = useState("");
  const [start, setStart] = useState(day(new Date()));
  const [end, setEnd] = useState(day(addDays(new Date(), 14)));
  const needsValue = type === "percentage" || type === "fixed";

  const submit = () =>
    save.mutate(
      {
        data: {
          title: title.trim(),
          type,
          value: needsValue ? Number(value) : 0,
          min_order: Number(minOrder) || 0,
          code: code.trim().toUpperCase() || undefined,
          starts_at: new Date(`${start}T00:00`).toISOString(),
          ends_at: new Date(`${end}T23:59`).toISOString(),
        },
      },
      {
        onSuccess: () => {
          onClose();
          setTitle("");
          setCode("");
        },
      },
    );

  return (
    <FormSheet opened={opened} onClose={onClose} title="New promotion" saveLabel="Create" onSave={submit} saving={save.isPending} canSave={!!title.trim() && (!needsValue || Number(value) > 0)}>
      <div className="grid grid-cols-2 gap-2 px-4 pt-4">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={cn("flex items-center gap-2 rounded-2xl border-2 p-3 text-left text-[15px] font-medium transition-colors", type === t.value ? "border-primary bg-primary/5" : "border-transparent bg-black/[0.04] dark:bg-white/5")}
          >
            <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-white", t.color)}>
              <t.icon className="h-4 w-4" />
            </span>
            {t.label}
          </button>
        ))}
      </div>
      <List strongIos insetIos>
        <ListInput label="Title" placeholder="e.g. Weekend Grill Deal" value={title} onInput={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} />
        {needsValue && <ListInput label={type === "percentage" ? "Discount (%)" : "Discount ($)"} inputMode="decimal" value={value} onInput={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)} />}
        <ListInput label="Minimum order ($)" inputMode="decimal" value={minOrder} onInput={(e: React.ChangeEvent<HTMLInputElement>) => setMinOrder(e.target.value)} />
        <ListInput label="Promo code (optional)" placeholder="Applied automatically if empty" value={code} onInput={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value.toUpperCase())} />
      </List>
      <BlockTitle>Dates</BlockTitle>
      <List strongIos insetIos>
        <ListInput label="Starts" type="date" value={start} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStart(e.target.value)} />
        <ListInput label="Ends" type="date" value={end} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEnd(e.target.value)} />
      </List>
    </FormSheet>
  );
}

export default function PromotionsScreen() {
  const { data, isLoading, error, refetch } = usePromotions();
  const save = useSavePromotion();
  const remove = useDeletePromotion();
  const [filter, setFilter] = useState<"running" | "scheduled" | "ended">("running");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Promotion | null>(null);

  const rows = (data ?? []).filter((p) => (filter === "running" ? p.status === "active" || p.status === "paused" : p.status === filter));
  const count = (f: typeof filter) => (data ?? []).filter((p) => (f === "running" ? p.status === "active" || p.status === "paused" : p.status === f)).length;

  return (
    <Screen
      title="Promotions"
      back
      tabbar
      onRefresh={refetch}
      right={
        <KLink navbar iconOnly onClick={() => setCreating(true)}>
          <Plus className="h-7 w-7" />
        </KLink>
      }
    >
      <ChipBar
        value={filter}
        onChange={setFilter}
        items={[
          { value: "running", label: "Running", count: count("running") },
          { value: "scheduled", label: "Scheduled", count: count("scheduled") },
          { value: "ended", label: "Ended", count: count("ended") },
        ]}
      />
      {error ? (
        <ErrorBlock error={error} onRetry={refetch} />
      ) : isLoading ? (
        <Loading />
      ) : !rows.length ? (
        <Empty icon={Megaphone} title="No promotions" text="Bring in more orders with a discount." action={<button className="font-semibold text-primary" onClick={() => setCreating(true)}>Create one</button>} />
      ) : (
        <div className="space-y-3 px-4 pt-2">
          {rows.map((p) => {
            const t = TYPES.find((x) => x.value === p.type)!;
            return (
              <button key={p.name} onClick={() => setSelected(p)} className="block w-full overflow-hidden rounded-2xl border border-black/[0.06] bg-white text-left dark:bg-[#1c1c1d]">
                <div className={cn("relative bg-gradient-to-br p-4 text-white", t.color, p.status === "ended" && "grayscale")}>
                  <t.icon className="absolute right-3 top-3 h-14 w-14 opacity-20" />
                  <p className="text-[13px] font-medium opacity-90">{p.title}</p>
                  <p className="mt-0.5 text-[26px] font-extrabold tracking-tight">{headline(p)}</p>
                  <p className="text-[13px] opacity-90">{p.min_order ? `On orders over ${formatMoney(p.min_order)}` : "On any order"}</p>
                </div>
                <div className="flex items-center gap-3 p-3.5">
                  <StatusBadge status={p.status} />
                  {p.code && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard?.writeText(p.code!);
                        toast.success(`Copied ${p.code}`);
                      }}
                      className="rounded-md border border-dashed border-black/20 px-2 py-0.5 font-mono text-[12px] dark:border-white/25"
                    >
                      {p.code}
                    </span>
                  )}
                  <span className="ml-auto text-right text-[12px] text-black/45 dark:text-white/45">
                    <span className="tabular block font-semibold text-black dark:text-white">{p.usage_count} uses</span>
                    until {formatDate(p.ends_at)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <NewPromotionSheet opened={creating} onClose={() => setCreating(false)} />

      <Actions opened={!!selected} onBackdropClick={() => setSelected(null)}>
        <ActionsGroup>
          <ActionsLabel>
            {selected?.title} · {selected && formatMoney(selected.revenue)} in sales
          </ActionsLabel>
          {selected?.status === "active" && <ActionsButton onClick={() => (save.mutate({ id: selected.name, data: { status: "paused" } }), setSelected(null))}>Pause</ActionsButton>}
          {selected?.status === "paused" && <ActionsButton onClick={() => (save.mutate({ id: selected.name, data: { status: "active" } }), setSelected(null))}>Resume</ActionsButton>}
          {selected && selected.status !== "ended" && <ActionsButton onClick={() => (save.mutate({ id: selected.name, data: { status: "ended", ends_at: new Date().toISOString() } }), setSelected(null))}>End now</ActionsButton>}
          <ActionsButton className="!text-[#ff3b30]" onClick={() => (selected && remove.mutate(selected.name), setSelected(null))}>
            Delete
          </ActionsButton>
        </ActionsGroup>
        <ActionsGroup>
          <ActionsButton bold onClick={() => setSelected(null)}>
            Cancel
          </ActionsButton>
        </ActionsGroup>
      </Actions>
    </Screen>
  );
}
