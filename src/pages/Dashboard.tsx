import { Link } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, ChefHat, CircleDollarSign, Clock, PackageCheck, Power, ReceiptText, ShoppingBag, Star } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ErrorState } from "@/components/shared/States";
import { OpenStoreButton } from "@/layouts/StoreStatusControl";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/hooks/queries";
import { formatMoney, formatNumber, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

const PIPELINE = [
  { key: "confirming", label: "New", icon: ReceiptText, tone: "text-warning bg-warning/10" },
  { key: "accepted", label: "Accepted", icon: PackageCheck, tone: "text-info bg-info/10" },
  { key: "preparing", label: "Preparing", icon: ChefHat, tone: "text-primary bg-primary/10" },
  { key: "ready", label: "Ready", icon: ShoppingBag, tone: "text-success bg-success/10" },
] as const;

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useDashboard();
  const firstName = user?.full_name.split(" ")[0] ?? "there";

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const k = data?.kpis;
  const active = data ? data.today.confirming + data.today.accepted + data.today.preparing + data.today.ready : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description={`Here's how ${data?.store_name ?? "your store"} is doing today · ${format(new Date(), "EEEE, MMM d")}`}
      />

      {data && !data.is_open && (
        <Card className="flex flex-col gap-3 border-warning/40 bg-warning/5 p-4 sm:flex-row sm:items-center">
          <Power className="h-5 w-5 shrink-0 text-warning" />
          <div className="flex-1">
            <p className="font-medium">Your store is closed</p>
            <p className="text-sm text-muted-foreground">Customers can see your menu but can't place orders.</p>
          </div>
          <OpenStoreButton />
        </Card>
      )}

      {/* Live order pipeline */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-base">Live orders</CardTitle>
            <p className="text-sm text-muted-foreground">{isLoading ? "Loading…" : active ? `${active} order${active > 1 ? "s" : ""} in progress` : "No orders in progress"}</p>
          </div>
          <Button asChild size="sm" variant={data?.today.confirming ? "default" : "outline"}>
            <Link to="/orders">
              Open orders <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PIPELINE.map((p) => {
            const count = data?.today[p.key] ?? 0;
            return (
              <Link
                key={p.key}
                to={`/orders?status=${p.key}`}
                className={cn(
                  "group rounded-xl border p-3 transition-colors hover:bg-muted/50 sm:p-4",
                  p.key === "confirming" && count > 0 && "border-warning/50 bg-warning/5",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", p.tone)}>
                    <p.icon className="h-4 w-4" />
                  </span>
                  {p.key === "confirming" && count > 0 && <span className="h-2 w-2 animate-pulse rounded-full bg-warning" />}
                </div>
                {isLoading ? <Skeleton className="mt-3 h-7 w-10" /> : <p className="tabular mt-3 text-2xl font-semibold">{count}</p>}
                <p className="text-xs text-muted-foreground sm:text-sm">{p.label}</p>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard loading={isLoading} label="Sales today" value={formatMoney(k?.revenue.value ?? 0)} icon={CircleDollarSign} current={k?.revenue.value} previous={k?.revenue.previous} compareLabel="vs yesterday" />
        <StatCard loading={isLoading} label="Orders completed" value={formatNumber(k?.orders.value ?? 0)} icon={ShoppingBag} current={k?.orders.value} previous={k?.orders.previous} compareLabel="vs yesterday" />
        <StatCard loading={isLoading} label="Avg. order value" value={formatMoney(k?.avg_order_value.value ?? 0)} icon={ReceiptText} current={k?.avg_order_value.value} previous={k?.avg_order_value.previous} compareLabel="vs yesterday" />
        <StatCard loading={isLoading} label="Store rating" value={(k?.rating.value ?? 0).toFixed(1)} icon={Star} hint={`${data?.today.cancelled ?? 0} cancelled today`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Trend */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">Sales — last 7 days</CardTitle>
              <p className="text-sm text-muted-foreground">
                {data ? `${formatMoney(data.trend.reduce((s, d) => s + d.revenue, 0))} from ${formatNumber(data.trend.reduce((s, d) => s + d.orders, 0))} orders` : " "}
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/reports">Reports</Link>
            </Button>
          </CardHeader>
          <CardContent className="h-64 pl-0 pr-4 sm:h-72">
            {isLoading ? (
              <Skeleton className="ml-4 h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.trend} margin={{ top: 8, left: 0, right: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), "EEE")} tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tickFormatter={(v) => `$${v}`} tickLine={false} axisLine={false} fontSize={12} width={52} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))", fontSize: 12 }}
                    labelFormatter={(d) => format(new Date(d), "EEEE, MMM d")}
                    formatter={(v: number, name) => [name === "revenue" ? formatMoney(v) : v, name === "revenue" ? "Sales" : "Orders"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top products */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Best sellers this week</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
              : data?.top_products.map((p, i) => {
                  const max = data.top_products[0]?.revenue || 1;
                  return (
                    <div key={p.product}>
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate">
                          <span className="mr-2 text-muted-foreground">{i + 1}</span>
                          {p.product_name}
                        </span>
                        <span className="tabular shrink-0 font-medium">{formatMoney(p.revenue)}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-muted">
                        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${(p.revenue / max) * 100}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{p.quantity} sold</p>
                    </div>
                  );
                })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Recent orders */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Recent orders</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/orders?tab=history">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="mx-6 my-3 h-10" />)
                : data?.recent_orders.map((o) => (
                    <Link key={o.name} to={`/orders?order=${o.name}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 sm:px-6">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {o.customer_name} <span className="font-normal text-muted-foreground">· {o.name}</span>
                        </p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> {timeAgo(o.creation)} · {o.item_count} item{o.item_count > 1 ? "s" : ""}
                        </p>
                      </div>
                      <span className="tabular hidden text-sm font-medium sm:block">{formatMoney(o.grand_total)}</span>
                      <StatusBadge status={o.status} />
                    </Link>
                  ))}
            </div>
          </CardContent>
        </Card>

        {/* Latest reviews */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Latest reviews</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/reviews">All</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
              : data?.recent_reviews.map((r) => (
                  <div key={r.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{r.customer_name}</p>
                      <span className="flex items-center gap-0.5 text-xs">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn("h-3.5 w-3.5", i < r.rating ? "fill-warning text-warning" : "text-muted")} />
                        ))}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">“{r.comment}”</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(r.creation)}</p>
                  </div>
                ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
