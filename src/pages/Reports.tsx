import { useState } from "react";
import { format } from "date-fns";
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Ban, ChefHat, CircleDollarSign, ReceiptText, ShoppingBag, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { SegmentedTabs } from "@/components/shared/SegmentedTabs";
import { StatCard } from "@/components/shared/StatCard";
import { ErrorState } from "@/components/shared/States";
import { useReports } from "@/hooks/queries";
import type { Period } from "@/api";
import { formatMoney, formatNumber } from "@/lib/format";

const PERIODS: Array<{ value: Period; label: string; compare: string }> = [
  { value: "today", label: "Today", compare: "vs yesterday" },
  { value: "week", label: "7 days", compare: "vs previous 7 days" },
  { value: "month", label: "30 days", compare: "vs previous 30 days" },
  { value: "quarter", label: "90 days", compare: "vs previous 90 days" },
];

const PAYMENT_LABEL = { mobile_money: "Mobile money", cash: "Cash", card: "Card", wallet: "Wallet" } as const;
const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--info))", "hsl(var(--warning))", "hsl(var(--success))"];

const tooltipStyle = { borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))", fontSize: 12 };
const axis = { tickLine: false, axisLine: false, fontSize: 12, stroke: "hsl(var(--muted-foreground))" };

function ChartCard({ title, subtitle, children, className, loading }: { title: string; subtitle?: string; children: React.ReactNode; className?: string; loading?: boolean }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </CardHeader>
      <CardContent className="h-64 pl-0 pr-4 sm:h-72">{loading ? <Skeleton className="ml-4 h-full w-full" /> : children}</CardContent>
    </Card>
  );
}

export default function Reports() {
  const [period, setPeriod] = useState<Period>("week");
  const { data, isLoading, error, refetch } = useReports(period);
  const compare = PERIODS.find((p) => p.value === period)!.compare;

  if (error) return <ErrorState error={error} onRetry={refetch} />;
  const k = data?.kpis;

  const xFormat = (d: string) => (period === "today" ? format(new Date(d), "ha") : period === "week" ? format(new Date(d), "EEE") : format(new Date(d), "MMM d"));

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Understand your sales, busiest hours and best sellers." />

      <SegmentedTabs value={period} onChange={setPeriod} segments={PERIODS.map(({ value, label }) => ({ value, label }))} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        <StatCard loading={isLoading} label="Gross sales" value={formatMoney(k?.revenue.value ?? 0)} icon={CircleDollarSign} current={k?.revenue.value} previous={k?.revenue.previous} compareLabel={compare} />
        <StatCard loading={isLoading} label="Net earnings" value={formatMoney(k?.net_earnings.value ?? 0)} icon={Wallet} current={k?.net_earnings.value} previous={k?.net_earnings.previous} compareLabel={compare} />
        <StatCard loading={isLoading} label="Orders" value={formatNumber(k?.orders.value ?? 0)} icon={ShoppingBag} current={k?.orders.value} previous={k?.orders.previous} compareLabel={compare} />
        <StatCard loading={isLoading} label="Avg. order" value={formatMoney(k?.avg_order_value.value ?? 0)} icon={ReceiptText} current={k?.avg_order_value.value} previous={k?.avg_order_value.previous} compareLabel={compare} />
        <StatCard loading={isLoading} label="Cancel rate" value={`${(k?.cancel_rate.value ?? 0).toFixed(1)}%`} icon={Ban} current={k?.cancel_rate.value} previous={k?.cancel_rate.previous} compareLabel={compare} invert />
        <StatCard loading={isLoading} label="Avg. prep time" value={`${Math.round(k?.avg_prep_minutes.value ?? 0)} min`} icon={ChefHat} current={k?.avg_prep_minutes.value} previous={k?.avg_prep_minutes.previous} compareLabel={compare} invert />
      </div>

      <ChartCard title="Sales & orders" subtitle={period === "today" ? "By hour, today" : "By day"} loading={isLoading}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data?.series} margin={{ top: 8 }}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tickFormatter={xFormat} {...axis} minTickGap={16} />
            <YAxis yAxisId="rev" tickFormatter={(v) => `$${v}`} width={56} {...axis} />
            <YAxis yAxisId="ord" orientation="right" width={32} {...axis} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(d) => format(new Date(d), period === "today" ? "h a" : "EEE, MMM d")}
              formatter={(v: number, name) => (name === "revenue" ? [formatMoney(v), "Sales"] : [v, "Orders"])}
            />
            <Bar yAxisId="rev" dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Line yAxisId="ord" dataKey="orders" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} type="monotone" />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Busiest hours" subtitle="Orders placed per hour of the day" loading={isLoading}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.by_hour} margin={{ top: 8 }}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" {...axis} interval={2} />
              <YAxis width={32} {...axis} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, "Orders"]} cursor={{ fill: "hsl(var(--muted))" }} />
              <Bar dataKey="orders" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Payment methods" subtitle="Share of sales" loading={isLoading}>
          <div className="flex h-full flex-col items-center gap-4 pl-4 sm:flex-row">
            <ResponsiveContainer width="100%" height="70%" className="sm:!h-full sm:!w-1/2">
              <PieChart>
                <Pie data={data?.by_payment} dataKey="revenue" nameKey="method" innerRadius="55%" outerRadius="85%" paddingAngle={2} strokeWidth={0}>
                  {data?.by_payment.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n) => [formatMoney(v), PAYMENT_LABEL[n as keyof typeof PAYMENT_LABEL]]} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="grid w-full grid-cols-2 gap-2 text-sm sm:w-1/2 sm:grid-cols-1">
              {data?.by_payment.map((p, i) => (
                <li key={p.method} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="flex-1 text-muted-foreground">{PAYMENT_LABEL[p.method]}</span>
                  <span className="tabular font-medium">{formatMoney(p.revenue)}</span>
                </li>
              ))}
            </ul>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top products</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="mx-6 my-3 h-8" />)
                : data?.top_products.map((p, i) => (
                    <div key={p.product} className="flex items-center gap-3 px-4 py-2.5 sm:px-6">
                      <span className="tabular w-5 text-sm text-muted-foreground">{i + 1}</span>
                      <span className="flex-1 truncate text-sm font-medium">{p.product_name}</span>
                      <span className="tabular text-sm text-muted-foreground">{p.quantity} sold</span>
                      <span className="tabular w-20 text-right text-sm font-medium">{formatMoney(p.revenue)}</span>
                    </div>
                  ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sales by category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8" />)
              : data?.by_category.map((c) => {
                  const total = data.by_category.reduce((s, x) => s + x.revenue, 0) || 1;
                  const pct = (c.revenue / total) * 100;
                  return (
                    <div key={c.category}>
                      <div className="flex justify-between text-sm">
                        <span>{c.category}</span>
                        <span className="tabular text-muted-foreground">
                          {formatMoney(c.revenue)} · {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
