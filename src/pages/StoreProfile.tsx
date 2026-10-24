import { useEffect, useState } from "react";
import { Camera, Loader2, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/PageHeader";
import { SaveBar } from "@/components/shared/SaveBar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ErrorState } from "@/components/shared/States";
import { useStore, useUpdateStore } from "@/hooks/queries";
import type { Store } from "@/api";
import { formatMoney, initials } from "@/lib/format";

type Form = Pick<
  Store,
  "store_name" | "description" | "phone" | "email" | "address" | "delivery_time_min" | "delivery_time_max" | "delivery_fee" | "minimum_order" | "preparation_time" | "accepts_scheduled_orders"
>;

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

function Field({ label, id, children, hint }: { label: string; id: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function StoreProfile() {
  const { data: store, isLoading, error, refetch } = useStore();
  const update = useUpdateStore();
  const [form, setForm] = useState<Form | null>(null);

  useEffect(() => {
    if (store) setForm(pick(store));
  }, [store]);

  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (isLoading || !store || !form) return <Skeleton className="h-96 w-full" />;

  const dirty = JSON.stringify(form) !== JSON.stringify(pick(store));
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const num = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, Number(e.target.value) as never);

  return (
    <div className="space-y-6 pb-16">
      <PageHeader title="Store Profile" description="This is what customers see in the Diyaar app." />

      {/* Cover + identity */}
      <Card className="overflow-hidden">
        <div className="relative h-28 bg-gradient-to-r from-primary/80 via-primary to-[hsl(190_70%_32%)] sm:h-36">
          <Button size="sm" variant="secondary" className="absolute right-3 top-3 h-8 bg-white/90 text-xs text-foreground hover:bg-white" disabled>
            <Camera className="mr-1.5 h-3.5 w-3.5" /> Change cover
          </Button>
        </div>
        <CardContent className="relative flex flex-col gap-4 pb-5 sm:flex-row sm:items-end">
          <span className="-mt-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-card bg-primary text-2xl font-semibold text-primary-foreground shadow">
            {initials(store.store_name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{store.store_name}</h2>
              <StatusBadge status={store.status} />
            </div>
            <p className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" /> {store.rating.toFixed(1)} ({store.review_count})
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {store.city}
              </span>
              <span>{store.service_type}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic information</CardTitle>
            <CardDescription>Name, description and contact details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Store name" id="s-name">
              <Input id="s-name" value={form.store_name} onChange={(e) => set("store_name", e.target.value)} />
            </Field>
            <Field label="Description" id="s-desc" hint={`${form.description.length}/300`}>
              <Textarea id="s-desc" rows={3} maxLength={300} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone" id="s-phone">
                <Input id="s-phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </Field>
              <Field label="Email" id="s-email">
                <Input id="s-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
              </Field>
            </div>
            <Field label="Address" id="s-addr" hint="To move your pin on the map, contact Diyaar support.">
              <Input id="s-addr" value={form.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Delivery & ordering</CardTitle>
            <CardDescription>Shown to customers before they order.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Delivery time — min" id="s-dmin">
                <Input id="s-dmin" type="number" min={5} value={form.delivery_time_min} onChange={num("delivery_time_min")} />
              </Field>
              <Field label="Delivery time — max" id="s-dmax">
                <Input id="s-dmax" type="number" min={form.delivery_time_min} value={form.delivery_time_max} onChange={num("delivery_time_max")} />
              </Field>
              <Field label="Delivery fee ($)" id="s-fee" hint={form.delivery_fee ? undefined : "Free delivery"}>
                <Input id="s-fee" type="number" step="0.25" min={0} value={form.delivery_fee} onChange={num("delivery_fee")} />
              </Field>
              <Field label="Minimum order ($)" id="s-min">
                <Input id="s-min" type="number" step="0.5" min={0} value={form.minimum_order} onChange={num("minimum_order")} />
              </Field>
              <Field label="Default prep time (min)" id="s-prep">
                <Input id="s-prep" type="number" min={1} value={form.preparation_time} onChange={num("preparation_time")} />
              </Field>
            </div>
            <label className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <span>
                <span className="block text-sm font-medium">Accept scheduled orders</span>
                <span className="block text-xs text-muted-foreground">Customers can order ahead for later today or tomorrow</span>
              </span>
              <Switch checked={!!form.accepts_scheduled_orders} onCheckedChange={(v) => set("accepts_scheduled_orders", v ? 1 : 0)} />
            </label>
            <div className="rounded-lg bg-muted p-3 text-sm">
              Customers see: <span className="font-medium">{form.delivery_time_min}–{form.delivery_time_max} min</span> ·{" "}
              <span className="font-medium">{form.delivery_fee ? formatMoney(form.delivery_fee) : "Free"} delivery</span> · min{" "}
              <span className="font-medium">{formatMoney(form.minimum_order)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {dirty && (
        <SaveBar message="You have unsaved changes" onDiscard={() => setForm(pick(store))} onSave={() => update.mutate(form)} saving={update.isPending} disabled={!form.store_name.trim()} />
      )}
    </div>
  );
}
