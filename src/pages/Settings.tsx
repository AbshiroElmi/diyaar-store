import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Database, Loader2, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { SaveBar } from "@/components/shared/SaveBar";
import { ErrorState } from "@/components/shared/States";
import { resetMockDb } from "@/api/mock/handlers";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings, useUpdateSettings } from "@/hooks/queries";
import type { StoreSettings } from "@/api";
import { env, isMockApi } from "@/lib/env";
import { cn } from "@/lib/utils";

function ToggleRow({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

export default function Settings() {
  const { data, isLoading, error, refetch } = useSettings();
  const update = useUpdateSettings();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [s, setS] = useState<StoreSettings | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    if (data) setS(structuredClone(data));
  }, [data]);

  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (isLoading || !s) return <Skeleton className="h-96 w-full" />;

  const dirty = JSON.stringify(s) !== JSON.stringify(data);
  const setN = (k: keyof StoreSettings["notifications"]) => (v: boolean) => setS({ ...s, notifications: { ...s.notifications, [k]: v } });
  const setO = <K extends keyof StoreSettings["orders"]>(k: K, v: StoreSettings["orders"][K]) => setS({ ...s, orders: { ...s.orders, [k]: v } });

  return (
    <div className="space-y-6 pb-16">
      <PageHeader title="Settings" description="Preferences for you and your store." />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orders</CardTitle>
            <CardDescription>How new orders are handled.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y pt-0">
            <ToggleRow title="Auto-accept orders" description="Skip the accept step — orders go straight to Accepted" checked={s.orders.auto_accept_orders} onChange={(v) => setO("auto_accept_orders", v)} />
            <ToggleRow title="Print receipt on accept" description="Needs a connected receipt printer" checked={s.orders.print_receipt_on_accept} onChange={(v) => setO("print_receipt_on_accept", v)} />
            <div className="flex items-center justify-between gap-4 py-3">
              <span>
                <span className="block text-sm font-medium">Accept within</span>
                <span className="block text-xs text-muted-foreground">Orders not accepted in time are cancelled</span>
              </span>
              <Select value={String(s.orders.accept_timeout_minutes)} onValueChange={(v) => setO("accept_timeout_minutes", Number(v))}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[3, 5, 8, 10].map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m} min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notifications</CardTitle>
            <CardDescription>Choose how we tell you about things.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y pt-0">
            <ToggleRow title="New order sound" description="Play a chime when an order arrives" checked={s.notifications.new_order_sound} onChange={setN("new_order_sound")} />
            <ToggleRow title="Push notifications" description="On this device" checked={s.notifications.new_order_push} onChange={setN("new_order_push")} />
            <ToggleRow title="SMS for new orders" description="Useful if you're away from the screen" checked={s.notifications.new_order_sms} onChange={setN("new_order_sms")} />
            <ToggleRow title="Review alerts" description="When customers leave a review" checked={s.notifications.review_alerts} onChange={setN("review_alerts")} />
            <ToggleRow title="Payout alerts" description="When money is sent to you" checked={s.notifications.payout_alerts} onChange={setN("payout_alerts")} />
            <ToggleRow title="Daily summary email" description="Sales recap every evening" checked={s.notifications.daily_summary_email} onChange={setN("daily_summary_email")} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appearance & language</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: "light", label: "Light", icon: Sun },
                  { v: "dark", label: "Dark", icon: Moon },
                  { v: "system", label: "System", icon: Monitor },
                ].map((t) => (
                  <button
                    key={t.v}
                    onClick={() => setTheme(t.v)}
                    className={cn("flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm", theme === t.v ? "border-primary bg-accent/60" : "hover:bg-muted")}
                  >
                    <t.icon className="h-4 w-4" /> {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={s.language} onValueChange={(v) => setS({ ...s, language: v as StoreSettings["language"] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="so">Soomaali</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              <p>
                API mode: <span className="font-mono font-medium text-foreground">{env.apiMode}</span>
              </p>
              {!isMockApi && (
                <p className="mt-1 break-all">
                  Endpoint: <span className="font-mono">{env.apiBaseUrl || window.location.origin}{env.apiMethodPath}</span>
                </p>
              )}
            </div>
            {isMockApi && (
              <Button variant="outline" className="w-full" onClick={() => setResetOpen(true)}>
                <Database className="mr-2 h-4 w-4" /> Reset demo data
              </Button>
            )}
            <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </CardContent>
        </Card>
      </div>

      {dirty && (
        <SaveBar onDiscard={() => setS(structuredClone(data!))} onSave={() => update.mutate(s)} saving={update.isPending} />
      )}

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset demo data?"
        description="All changes you made in demo mode will be lost and the sample store is restored."
        confirmLabel="Reset"
        destructive
        onConfirm={() => {
          resetMockDb().then(() => window.location.reload());
        }}
      />
    </div>
  );
}
