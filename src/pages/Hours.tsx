import { useEffect, useState } from "react";
import { CalendarOff, Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/shared/PageHeader";
import { SaveBar } from "@/components/shared/SaveBar";
import { ErrorState } from "@/components/shared/States";
import { useHours, useUpdateHours } from "@/hooks/queries";
import type { StoreHours } from "@/api";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const TODAY = new Date().toLocaleDateString("en-US", { weekday: "long" });

export default function Hours() {
  const { data, isLoading, error, refetch } = useHours();
  const update = useUpdateHours();
  const [hours, setHours] = useState<StoreHours | null>(null);
  const [newClosure, setNewClosure] = useState({ title: "", date: "" });

  useEffect(() => {
    if (data) setHours(structuredClone(data));
  }, [data]);

  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (isLoading || !hours) return <Skeleton className="h-96 w-full" />;

  const dirty = JSON.stringify(hours) !== JSON.stringify(data);
  const setDay = (i: number, patch: Partial<StoreHours["weekly"][number]>) =>
    setHours((h) => h && { ...h, weekly: h.weekly.map((d, j) => (j === i ? { ...d, ...patch } : d)) });

  const copyToAll = (i: number) => {
    const src = hours.weekly[i];
    setHours((h) => h && { ...h, weekly: h.weekly.map((d) => ({ ...d, is_open: src.is_open, open_time: src.open_time, close_time: src.close_time })) });
  };

  return (
    <div className="space-y-6 pb-16">
      <PageHeader title="Opening Hours" description="Your store opens and closes automatically on this schedule." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weekly schedule</CardTitle>
          <CardDescription>You can still close manually at any time from the top bar.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {hours.weekly.map((d, i) => {
            const invalid = d.is_open && d.close_time <= d.open_time;
            return (
              <div key={d.day} className={cn("flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap sm:px-6", d.day === TODAY && "bg-accent/30")}>
                <div className="flex w-full items-center justify-between gap-3 sm:w-44">
                  <span className="font-medium">
                    {d.day}
                    {d.day === TODAY && <span className="ml-2 text-xs font-normal text-primary">Today</span>}
                  </span>
                  <Switch checked={d.is_open} onCheckedChange={(v) => setDay(i, { is_open: v })} aria-label={`${d.day} open`} />
                </div>
                {d.is_open ? (
                  <div className="flex flex-1 items-center gap-2">
                    <Input type="time" value={d.open_time} onChange={(e) => setDay(i, { open_time: e.target.value })} className={cn("w-full sm:w-32", invalid && "border-destructive")} aria-label="Opens" />
                    <span className="text-muted-foreground">–</span>
                    <Input type="time" value={d.close_time} onChange={(e) => setDay(i, { close_time: e.target.value })} className={cn("w-full sm:w-32", invalid && "border-destructive")} aria-label="Closes" />
                    <Button variant="ghost" size="sm" className="hidden shrink-0 text-xs md:inline-flex" onClick={() => copyToAll(i)}>
                      <Copy className="mr-1.5 h-3.5 w-3.5" /> Apply to all
                    </Button>
                  </div>
                ) : (
                  <span className="flex-1 text-sm text-muted-foreground">Closed all day</span>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Holiday closures</CardTitle>
          <CardDescription>Special days when your store is closed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {hours.closures.map((c) => (
            <div key={c.name} className="flex items-center gap-3 rounded-lg border p-3">
              <CalendarOff className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">{c.title}</p>
                <p className="text-xs text-muted-foreground">{formatDate(c.date)}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setHours((h) => h && { ...h, closures: h.closures.filter((x) => x.name !== c.name) })} aria-label="Remove">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input placeholder="e.g. Eid al-Adha" value={newClosure.title} onChange={(e) => setNewClosure((n) => ({ ...n, title: e.target.value }))} />
            <Input type="date" className="sm:w-44" value={newClosure.date} onChange={(e) => setNewClosure((n) => ({ ...n, date: e.target.value }))} />
            <Button
              variant="outline"
              disabled={!newClosure.title.trim() || !newClosure.date}
              onClick={() => {
                setHours((h) => h && { ...h, closures: [...h.closures, { name: `CL-${Date.now()}`, title: newClosure.title.trim(), date: new Date(newClosure.date).toISOString() }] });
                setNewClosure({ title: "", date: "" });
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {dirty && (
        <SaveBar onDiscard={() => setHours(structuredClone(data!))} onSave={() => update.mutate(hours)} saving={update.isPending} disabled={hours.weekly.some((d) => d.is_open && d.close_time <= d.open_time)} saveLabel="Save hours" />
      )}
    </div>
  );
}
