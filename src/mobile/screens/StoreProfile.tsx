import { useEffect, useState } from "react";
import { Hourglass, Lock } from "lucide-react";
import { BlockFooter, BlockTitle, Link as KLink, List, ListInput, ListItem } from "konsta/react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useStore, useSubmitProfile } from "@/hooks/queries";
import type { Store, StoreProfileInput } from "@/api";
import { initials } from "@/lib/format";
import { Loading, Screen } from "../ui";

const pick = (s: Store): StoreProfileInput => ({
  tagline: s.tagline,
  description: s.description,
  phone: s.phone,
  email: s.email,
  address: s.address,
  minimum_order: s.minimum_order,
  preparation_time: s.preparation_time,
});

export default function StoreProfileScreen() {
  const { data: store } = useStore();
  const submit = useSubmitProfile();
  const [form, setForm] = useState<StoreProfileInput | null>(null);

  useEffect(() => {
    if (store) setForm(pick(store));
  }, [store]);

  const dirty = !!store && !!form && JSON.stringify(form) !== JSON.stringify(pick(store));
  const set = <K extends keyof StoreProfileInput>(k: K, v: StoreProfileInput[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const text = (k: keyof StoreProfileInput) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value as never);
  const num = (k: keyof StoreProfileInput) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, Number(e.target.value) as never);

  return (
    <Screen
      title="Store Profile"
      back
      tabbar
      right={
        dirty && (
          <KLink navbar className="font-semibold" onClick={() => form && submit.mutate(form)}>
            {submit.isPending ? "Sending…" : "Send"}
          </KLink>
        )
      }
    >
      {!store || !form ? (
        <Loading />
      ) : (
        <>
          <div className="flex flex-col items-center px-4 pb-2 pt-6 text-center">
            {store.logo ? (
              <img src={store.logo} alt="" className="h-24 w-24 rounded-[28px] object-cover shadow-lg shadow-[#219186]/30" />
            ) : (
              <span className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-[#2bb5a7] to-[#155e57] text-[32px] font-bold text-white shadow-lg shadow-[#219186]/30">{initials(store.store_name)}</span>
            )}
            <p className="mt-3 text-[22px] font-bold tracking-tight">{store.store_name}</p>
            {store.tagline && <p className="mt-1 text-[14px] text-black/50 dark:text-white/50">{store.tagline}</p>}
            <StatusBadge status={store.status} className="mt-2" />
          </div>

          {store.pending_approval && (
            <div className="mx-4 mt-4 flex gap-2 rounded-xl bg-[#ff9500]/10 p-3 text-[14px] text-[#b86500]">
              <Hourglass className="mt-0.5 h-4 w-4 shrink-0" /> Your last changes are waiting for Diyaar to approve them.
            </div>
          )}

          <BlockTitle>About</BlockTitle>
          <List strongIos insetIos>
            <ListItem header="Store name" title={store.store_name} after={<Lock className="h-4 w-4 text-black/30 dark:text-white/30" />} />
            <ListInput label="Tagline" placeholder="e.g. Pizza & Kebab" value={form.tagline} onInput={text("tagline")} />
            <ListInput label="Description" type="textarea" inputClassName="!h-20 resize-none" value={form.description} onInput={text("description")} />
          </List>
          <BlockFooter>Contact Diyaar support to change your store name.</BlockFooter>

          <BlockTitle>Contact</BlockTitle>
          <List strongIos insetIos>
            <ListInput label="Phone" type="tel" value={form.phone} onInput={text("phone")} />
            <ListInput label="Email" type="email" value={form.email} onInput={text("email")} />
            <ListInput label="Address" value={form.address} onInput={text("address")} />
          </List>

          <BlockTitle>Ordering</BlockTitle>
          <List strongIos insetIos>
            <ListInput label="Minimum order ($)" inputMode="decimal" value={String(form.minimum_order)} onInput={num("minimum_order")} />
            <ListInput label="Preparation time (min)" inputMode="numeric" value={String(form.preparation_time)} onInput={num("preparation_time")} />
          </List>
          <BlockFooter>Changes go to Diyaar for approval. Logo, map location, payouts and documents are edited on the Diyaar web panel.</BlockFooter>
        </>
      )}
    </Screen>
  );
}
