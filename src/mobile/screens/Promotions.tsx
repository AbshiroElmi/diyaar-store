import { useState } from "react";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import {
  BadgePercent,
  CalendarDays,
  Check,
  CircleStop,
  Gift,
  Megaphone,
  Pause,
  Play,
  Plus,
  Tag,
  Trash2,
  Truck,
} from "lucide-react";
import {
  ActionsGroup,
  ActionsLabel,
  Link as KLink,
  List,
  ListInput,
} from "konsta/react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  useDeletePromotion,
  usePromotions,
  useSavePromotion,
} from "@/hooks/queries";
import type { Promotion, PromotionType } from "@/api";
import { formatDate, formatMoney } from "@/lib/format";
import { haptic } from "@/lib/native";
import { cn } from "@/lib/utils";
import {
  ActionItem,
  Actions,
  CARD,
  ChipBar,
  Empty,
  ErrorBlock,
  FormSheet,
  Loading,
  Screen,
} from "../ui";

const TYPES: Array<{
  value: PromotionType;
  label: string;
  icon: typeof Tag;
  color: string;
}> = [
  {
    value: "percentage",
    label: "% off",
    icon: BadgePercent,
    color: "from-[#ff2d55] to-[#ff6482]",
  },
  {
    value: "fixed",
    label: "$ off",
    icon: Tag,
    color: "from-[#5856d6] to-[#7d7aff]",
  },
  {
    value: "free_delivery",
    label: "Free delivery",
    icon: Truck,
    color: "from-[#219186] to-[#2bb5a7]",
  },
  {
    value: "bogo",
    label: "Buy 1 get 1",
    icon: Gift,
    color: "from-[#ff9500] to-[#ffb340]",
  },
];

const headline = (p: Pick<Promotion, "type" | "value">) =>
  p.type === "percentage"
    ? `${p.value}% OFF`
    : p.type === "fixed"
    ? `${formatMoney(p.value)} OFF`
    : p.type === "free_delivery"
    ? "FREE DELIVERY"
    : "BUY 1 GET 1";

const day = (d: Date) => format(d, "yyyy-MM-dd");

const LENGTHS = [
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
  { label: "1 month", days: 30 },
];

/** Date row: label on the left, a tappable date pill on the right (native picker underneath). */
function DateRow({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: string;
  min?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="flex items-center gap-2.5 text-[16px] font-medium">
        <CalendarDays className="h-[18px] w-[18px] text-primary" /> {label}
      </span>
      <label className="relative rounded-lg bg-primary/[0.08] px-3 py-1.5 text-[15px] font-semibold text-primary">
        {format(new Date(`${value}T00:00`), "EEE, d MMM yyyy")}
        <input
          type="date"
          value={value}
          min={min}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="absolute inset-0 h-full w-full opacity-0"
        />
      </label>
    </div>
  );
}

function NewPromotionSheet({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const save = useSavePromotion();
  const [type, setType] = useState<PromotionType>("percentage");
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("10");
  const [minOrder, setMinOrder] = useState("");
  const [code, setCode] = useState("");
  const [start, setStart] = useState(day(new Date()));
  const [end, setEnd] = useState(day(addDays(new Date(), 14)));
  const needsValue = type === "percentage" || type === "fixed";
  const t = TYPES.find((x) => x.value === type)!;
  const length = differenceInCalendarDays(
    new Date(`${end}T00:00`),
    new Date(`${start}T00:00`)
  );

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
      }
    );

  return (
    <FormSheet
      opened={opened}
      onClose={onClose}
      title="New promotion"
      saveLabel="Create"
      onSave={submit}
      saving={save.isPending}
      canSave={
        !!title.trim() && (!needsValue || Number(value) > 0) && length >= 0
      }
    >
      {/* Live preview — the card customers will see */}
      <div className="px-4 pt-4">
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white shadow-[0_12px_28px_-14px_rgba(0,0,0,0.45)] transition-colors",
            t.color
          )}
        >
          <t.icon className="absolute -right-2 -top-2 h-24 w-24 opacity-15" />
          <p className="text-[12px] font-bold uppercase tracking-wider opacity-80">
            Preview
          </p>
          <p className="mt-1 truncate text-[14px] font-semibold opacity-95">
            {title.trim() || "Your promotion"}
          </p>
          <p className="text-[28px] font-extrabold leading-tight tracking-tight">
            {headline({ type, value: Number(value) || 0 })}
          </p>
          <p className="mt-0.5 text-[13px] opacity-90">
            {Number(minOrder) > 0
              ? `On orders over ${formatMoney(Number(minOrder))}`
              : "On any order"}
            {code.trim() && (
              <span className="ml-2 rounded-md border border-dashed border-white/60 px-1.5 py-px font-mono text-[12px]">
                {code.trim()}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Type */}
      <p className="px-5 pb-2 pt-5 text-[13px] font-bold uppercase tracking-wide text-black/45 dark:text-white/50">
        Type
      </p>
      <div className="grid grid-cols-4 gap-2 px-4">
        {TYPES.map((x) => {
          const active = type === x.value;
          return (
            <button
              key={x.value}
              type="button"
              onClick={() => {
                haptic.tap();
                setType(x.value);
              }}
              className={cn(
                "relative flex flex-col items-center gap-1.5 rounded-2xl border-2 bg-white px-1 pb-2.5 pt-3 transition-all active:scale-95 dark:bg-[#1c1c1d]",
                active
                  ? "border-primary shadow-[0_6px_16px_-10px_rgba(33,145,134,0.7)]"
                  : "border-black/[0.06] dark:border-white/10"
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
                  x.color
                )}
              >
                <x.icon className="h-5 w-5" />
              </span>
              <span
                className={cn(
                  "text-center text-[12px] font-bold leading-tight",
                  active ? "text-primary" : "text-black/70 dark:text-white/70"
                )}
              >
                {x.label}
              </span>
              {active && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white ring-2 ring-[#f7f9f9] dark:ring-[#111]">
                  <Check className="h-3 w-3" strokeWidth={3.5} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Details */}
      <p className="px-5 pb-0 pt-5 text-[13px] font-bold uppercase tracking-wide text-black/45 dark:text-white/50">
        Details
      </p>
      <List strongIos insetIos className="!mt-2">
        <ListInput
          label="Title"
          placeholder="e.g. Weekend Grill Deal"
          value={title}
          onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
            setTitle(e.target.value)
          }
        />
        {needsValue && (
          <ListInput
            label={type === "percentage" ? "Discount (%)" : "Discount ($)"}
            inputMode="decimal"
            placeholder={type === "percentage" ? "10" : "2.00"}
            value={value}
            onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
              setValue(e.target.value)
            }
          />
        )}
        <ListInput
          label="Minimum order ($)"
          inputMode="decimal"
          placeholder="None"
          value={minOrder}
          onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
            setMinOrder(e.target.value)
          }
        />
        <ListInput
          label="Promo code"
          placeholder="Optional — applied automatically if empty"
          value={code}
          onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
            setCode(e.target.value.toUpperCase().replace(/\s/g, ""))
          }
        />
      </List>

      {/* Dates */}
      <p className="px-5 pt-5 text-[13px] font-bold uppercase tracking-wide text-black/45 dark:text-white/50">
        Runs for
      </p>
      <div className="flex gap-2 px-4 pt-2">
        {LENGTHS.map((l) => (
          <button
            key={l.days}
            type="button"
            onClick={() => {
              haptic.tap();
              setEnd(day(addDays(new Date(`${start}T00:00`), l.days)));
            }}
            className={cn(
              "h-9 flex-1 rounded-full border text-[14px] font-bold transition-colors",
              length === l.days
                ? "border-primary bg-primary text-white"
                : "border-black/10 bg-white text-black/70 dark:border-white/15 dark:bg-[#1c1c1d] dark:text-white/70"
            )}
          >
            {l.label}
          </button>
        ))}
      </div>
      <div
        className={cn(
          CARD,
          "mx-4 mt-3 divide-y divide-black/[0.06] dark:divide-white/10"
        )}
      >
        <DateRow
          label="Starts"
          value={start}
          min={day(new Date())}
          onChange={(v) => {
            setStart(v);
            if (v > end) setEnd(day(addDays(new Date(`${v}T00:00`), 14)));
          }}
        />
        <DateRow label="Ends" value={end} min={start} onChange={setEnd} />
      </div>
      <p className="px-5 pt-2 text-[12px] text-black/45 dark:text-white/50">
        {length >= 0
          ? `Runs ${length + 1} ${length ? "days" : "day"}, ends at midnight.`
          : "End date must be after the start."}
      </p>
    </FormSheet>
  );
}

export default function PromotionsScreen() {
  const { data, isLoading, error, refetch } = usePromotions();
  const save = useSavePromotion();
  const remove = useDeletePromotion();
  const [filter, setFilter] = useState<"running" | "scheduled" | "ended">(
    "running"
  );
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Promotion | null>(null);

  const rows = (data ?? []).filter((p) =>
    filter === "running"
      ? p.status === "active" || p.status === "paused"
      : p.status === filter
  );
  const count = (f: typeof filter) =>
    (data ?? []).filter((p) =>
      f === "running"
        ? p.status === "active" || p.status === "paused"
        : p.status === f
    ).length;

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
        <Empty
          icon={Megaphone}
          title="No promotions"
          text="Bring in more orders with a discount."
          action={
            <button
              className="font-semibold text-primary"
              onClick={() => setCreating(true)}
            >
              Create one
            </button>
          }
        />
      ) : (
        <div className="space-y-3 px-4 pt-2">
          {rows.map((p) => {
            const t = TYPES.find((x) => x.value === p.type)!;
            return (
              <button
                key={p.name}
                onClick={() => setSelected(p)}
                className="block w-full overflow-hidden rounded-2xl border border-black/[0.06] bg-white text-left dark:bg-[#1c1c1d]"
              >
                <div
                  className={cn(
                    "relative bg-gradient-to-br p-4 text-white",
                    t.color,
                    p.status === "ended" && "grayscale"
                  )}
                >
                  <t.icon className="absolute right-3 top-3 h-14 w-14 opacity-20" />
                  <p className="text-[13px] font-medium opacity-90">
                    {p.title}
                  </p>
                  <p className="mt-0.5 text-[26px] font-extrabold tracking-tight">
                    {headline(p)}
                  </p>
                  <p className="text-[13px] opacity-90">
                    {p.min_order
                      ? `On orders over ${formatMoney(p.min_order)}`
                      : "On any order"}
                  </p>
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
                    <span className="tabular block font-semibold text-black dark:text-white">
                      {p.usage_count} uses
                    </span>
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
            {selected?.title} · {selected && formatMoney(selected.revenue)} in
            sales
          </ActionsLabel>
          {selected?.status === "active" && (
            <ActionItem
              icon={Pause}
              onClick={() => (
                save.mutate({ id: selected.name, data: { status: "paused" } }),
                setSelected(null)
              )}
            >
              Pause
            </ActionItem>
          )}
          {selected?.status === "paused" && (
            <ActionItem
              icon={Play}
              onClick={() => (
                save.mutate({ id: selected.name, data: { status: "active" } }),
                setSelected(null)
              )}
            >
              Resume
            </ActionItem>
          )}
          {selected && selected.status !== "ended" && (
            <ActionItem
              icon={CircleStop}
              onClick={() => (
                save.mutate({
                  id: selected.name,
                  data: { status: "ended", ends_at: new Date().toISOString() },
                }),
                setSelected(null)
              )}
            >
              End now
            </ActionItem>
          )}
          <ActionItem
            icon={Trash2}
            danger
            onClick={() => (
              selected && remove.mutate(selected.name), setSelected(null)
            )}
          >
            Delete
          </ActionItem>
        </ActionsGroup>
      </Actions>
    </Screen>
  );
}
