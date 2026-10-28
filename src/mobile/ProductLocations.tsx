import { useState } from "react";
import { Toggle } from "konsta/react";
import type { ProductLocation } from "@/api";
import { formatMoney } from "@/lib/format";
import { haptic } from "@/lib/native";
import { cn } from "@/lib/utils";

const round2 = (n: number) => Math.round(n * 100) / 100;

/** The % off of a sale price, 0 without a valid one. */
export const percentOff = (price: number, discount: number) => (price > 0 && discount > 0 && discount < price ? round2(((price - discount) / price) * 100) : 0);
export const priceFromPercent = (price: number, percent: number) => round2(price * (1 - percent / 100));

const toNumber = (text: string) => (text.trim() === "" || Number.isNaN(Number(text)) ? null : Number(text));

/** The product's own price and stock, which a location falls back to. */
export interface LocationDefaults {
  price: number;
  discount: number;
  tracksStock: boolean;
  stock: number;
}

/** What a location charges: the struck-through original and the sale price (0 = no sale). Same rules as the backend. */
function effectivePrice(row: ProductLocation, defaults: LocationDefaults) {
  const original = row.price ?? defaults.price;
  const discount = row.discount_price ?? (row.price === null ? defaults.discount : 0);
  return { original, discount: discount > 0 && discount < original ? discount : 0 };
}

/** Why a location's discount can't be saved, or null. */
export function locationError(row: ProductLocation, defaults: LocationDefaults) {
  if (row.discount_price === null) return null;
  const original = row.price ?? defaults.price;
  if (row.discount_price >= original) return `Discount must be lower than the price (${formatMoney(original)})`;
  return null;
}

/** Price, discount, % off, availability and stock of the product at each location. */
export function ProductLocations({ rows, defaults, onChange }: { rows: ProductLocation[]; defaults: LocationDefaults; onChange: (rows: ProductLocation[]) => void }) {
  const update = (location: string, change: Partial<ProductLocation>) => onChange(rows.map((r) => (r.location === location ? { ...r, ...change } : r)));
  return (
    // my-8 like a Konsta List, which BlockTitle and BlockFooter overlap into.
    <div className="my-8 space-y-3 px-4">
      {rows.map((row) => (
        <LocationCard key={row.location} row={row} defaults={defaults} onChange={(change) => update(row.location, change)} />
      ))}
    </div>
  );
}

function LocationCard({ row, defaults, onChange }: { row: ProductLocation; defaults: LocationDefaults; onChange: (change: Partial<ProductLocation>) => void }) {
  const [percentDraft, setPercentDraft] = useState<string | null>(null);
  const { original, discount } = effectivePrice(row, defaults);
  const percent = percentOff(original, discount);
  const error = locationError(row, defaults);
  const inheritsDiscount = row.discount_price === null && row.price === null && defaults.discount > 0;
  const stock = row.track_own_stock ? (row.stock_quantity ?? 0) : defaults.stock;

  const onPercent = (text: string) => {
    setPercentDraft(text);
    const value = toNumber(text);
    onChange({ discount_price: value === null || value <= 0 ? null : value >= 100 ? original : priceFromPercent(original, value) });
  };

  return (
    <div className={cn("rounded-2xl bg-white p-3.5 dark:bg-[#1c1c1d]", !row.is_available && "opacity-70")}>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold">{row.location_name}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {!row.is_available ? (
              <Badge tone="muted">Unavailable</Badge>
            ) : (
              <>
                {row.price !== null && <Badge tone="info">Custom price</Badge>}
                {discount > 0 && <Badge tone="sale">On sale</Badge>}
                {row.price === null && !discount && <Badge tone="ok">Available</Badge>}
              </>
            )}
            {defaults.tracksStock && <Badge tone={stock <= 0 ? "out" : stock <= 5 ? "low" : "ok"}>{stock <= 0 ? "Out of stock" : `${stock} in stock`}</Badge>}
          </div>
        </div>
        <Toggle
          checked={row.is_available}
          onChange={() => {
            haptic.tap();
            onChange({ is_available: !row.is_available });
          }}
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Field label="Price" placeholder={String(defaults.price || 0)} value={row.price ?? ""} onChange={(t) => onChange({ price: toNumber(t) })} />
        <Field
          label="Discount"
          placeholder={inheritsDiscount ? String(defaults.discount) : "None"}
          value={row.discount_price ?? ""}
          onChange={(t) => {
            setPercentDraft(null);
            onChange({ discount_price: toNumber(t) });
          }}
        />
        <Field label="% off" placeholder="0" value={percentDraft ?? (percent > 0 ? String(percent) : "")} onChange={onPercent} onBlur={() => setPercentDraft(null)} />
      </div>
      {error && <p className="mt-1.5 text-[12px] text-[#ff3b30]">{error}</p>}

      {defaults.tracksStock && (
        <div className="mt-3 flex items-center gap-2.5">
          <Toggle
            checked={row.track_own_stock}
            onChange={() => {
              haptic.tap();
              onChange({ track_own_stock: !row.track_own_stock });
            }}
          />
          <span className="text-[14px] font-medium">Own stock</span>
          {row.track_own_stock ? (
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              aria-label={`Quantity at ${row.location_name}`}
              value={row.stock_quantity ?? ""}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                onChange({ stock_quantity: digits ? Number(digits) : null });
              }}
              className="ml-auto h-9 w-20 rounded-xl bg-black/[0.05] px-3 text-right text-[16px] outline-none dark:bg-white/10"
            />
          ) : (
            <span className="ml-auto truncate text-[13px] text-black/45 dark:text-white/45">Shares product stock ({defaults.stock})</span>
          )}
        </div>
      )}

      <div className="mt-3 flex items-baseline justify-between border-t border-black/10 pt-2.5 dark:border-white/10">
        <span className="text-[13px] text-black/45 dark:text-white/45">Customers pay here</span>
        <span className="flex items-baseline gap-2 text-[16px] font-bold tabular-nums">
          {discount > 0 && <span className="text-[13px] font-normal text-black/40 line-through dark:text-white/40">{formatMoney(original)}</span>}
          {formatMoney(discount || original)}
        </span>
      </div>
    </div>
  );
}

function Field({ label, placeholder, value, onChange, onBlur }: { label: string; placeholder: string; value: string | number; onChange: (text: string) => void; onBlur?: () => void }) {
  return (
    <label className="block min-w-0">
      <span className="text-[12px] text-black/45 dark:text-white/45">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="mt-1 h-10 w-full rounded-xl bg-black/[0.05] px-3 text-[16px] tabular-nums outline-none placeholder:text-black/30 dark:bg-white/10 dark:placeholder:text-white/30"
      />
    </label>
  );
}

const BADGE_TONES = {
  ok: "bg-[#e8f6ef] text-[#1a7f4b] dark:bg-[#1a7f4b]/25 dark:text-[#6fd3a0]",
  info: "bg-[#e6f2fb] text-[#1b6fa8] dark:bg-[#1b6fa8]/25 dark:text-[#7cc0ef]",
  sale: "bg-[#fff1e0] text-[#b25e00] dark:bg-[#b25e00]/25 dark:text-[#ffb867]",
  low: "bg-[#fff6d6] text-[#8a6500] dark:bg-[#8a6500]/25 dark:text-[#f2cf5b]",
  out: "bg-[#fdeaea] text-[#c62828] dark:bg-[#c62828]/25 dark:text-[#ff8a8a]",
  muted: "bg-black/[0.06] text-black/55 dark:bg-white/10 dark:text-white/55",
};

function Badge({ tone, children }: { tone: keyof typeof BADGE_TONES; children: React.ReactNode }) {
  return <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", BADGE_TONES[tone])}>{children}</span>;
}
