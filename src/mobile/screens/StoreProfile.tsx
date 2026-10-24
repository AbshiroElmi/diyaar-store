import { useEffect, useState } from "react";
import { MapPin, Star } from "lucide-react";
import { BlockFooter, BlockTitle, Link as KLink, List, ListInput, ListItem, Toggle } from "konsta/react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useStore, useUpdateStore } from "@/hooks/queries";
import type { Store } from "@/api";
import { formatMoney, initials } from "@/lib/format";
import { Loading, Screen } from "../ui";

type Form = Pick<Store, "store_name" | "description" | "phone" | "email" | "address" | "delivery_time_min" | "delivery_time_max" | "delivery_fee" | "minimum_order" | "preparation_time" | "accepts_scheduled_orders">;
const pick = (s: Store): Form => ({
  store_name: s.store_name,
  description: s.description,
  phone: s.phone,
  email: s.email,
  address: s.address,
  delivery_time_min: s.delivery_time_min,
  delivery_time_max: s.delivery_time_max,
  delivery_fee: s.delivery_fee,
  minimum_order: s.minimum_order,
  preparation_time: s.preparation_time,
  accepts_scheduled_orders: s.accepts_scheduled_orders,
});

export default function StoreProfileScreen() {
  const { data: store } = useStore();
  const update = useUpdateStore();
  const [form, setForm] = useState<Form | null>(null);

  useEffect(() => {
    if (store) setForm(pick(store));
  }, [store]);

  const dirty = !!store && !!form && JSON.stringify(form) !== JSON.stringify(pick(store));
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const text = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value as never);
  const num = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, Number(e.target.value) as never);

  return (
    <Screen
      title="Store Profile"
      back
      tabbar
      right={
        dirty && (
          <KLink navbar className="font-semibold" onClick={() => form && update.mutate(form)}>
            {update.isPending ? "Saving…" : "Save"}
          </KLink>
        )
      }
    >
      {!store || !form ? (
        <Loading />
      ) : (
        <>
          <div className="flex flex-col items-center px-4 pb-2 pt-6 text-center">
            <span className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-[#2bb5a7] to-[#155e57] text-[32px] font-bold text-white shadow-lg shadow-[#219186]/30">{initials(store.store_name)}</span>
            <p className="mt-3 text-[22px] font-bold tracking-tight">{store.store_name}</p>
            <p className="mt-1 flex items-center gap-3 text-[14px] text-black/50 dark:text-white/50">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-[#ff9500] text-[#ff9500]" /> {store.rating.toFixed(1)} ({store.review_count})
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {store.city}
              </span>
            </p>
            <StatusBadge status={store.status} className="mt-2" />
          </div>

          <BlockTitle>About</BlockTitle>
          <List strongIos insetIos>
            <ListInput label="Store name" value={form.store_name} onInput={text("store_name")} />
            <ListInput label="Description" type="textarea" inputClassName="!h-20 resize-none" value={form.description} onInput={text("description")} />
          </List>

          <BlockTitle>Contact</BlockTitle>
          <List strongIos insetIos>
            <ListInput label="Phone" type="tel" value={form.phone} onInput={text("phone")} />
            <ListInput label="Email" type="email" value={form.email} onInput={text("email")} />
            <ListInput label="Address" value={form.address} onInput={text("address")} />
          </List>
          <BlockFooter>To move your map pin, contact Diyaar support.</BlockFooter>

          <BlockTitle>Delivery & ordering</BlockTitle>
          <List strongIos insetIos>
            <ListInput label="Delivery time from (min)" inputMode="numeric" value={String(form.delivery_time_min)} onInput={num("delivery_time_min")} />
            <ListInput label="Delivery time to (min)" inputMode="numeric" value={String(form.delivery_time_max)} onInput={num("delivery_time_max")} />
            <ListInput label="Delivery fee ($)" inputMode="decimal" value={String(form.delivery_fee)} onInput={num("delivery_fee")} />
            <ListInput label="Minimum order ($)" inputMode="decimal" value={String(form.minimum_order)} onInput={num("minimum_order")} />
            <ListInput label="Default prep time (min)" inputMode="numeric" value={String(form.preparation_time)} onInput={num("preparation_time")} />
          </List>
          <List strong inset>
            <ListItem title="Scheduled orders" text="Customers can order ahead" after={<Toggle checked={!!form.accepts_scheduled_orders} onChange={() => set("accepts_scheduled_orders", form.accepts_scheduled_orders ? 0 : 1)} />} />
          </List>
          <BlockFooter>
            Customers see: {form.delivery_time_min}–{form.delivery_time_max} min · {form.delivery_fee ? formatMoney(form.delivery_fee) : "Free"} delivery · min {formatMoney(form.minimum_order)}
          </BlockFooter>
        </>
      )}
    </Screen>
  );
}
