import { useState } from "react";
import { format } from "date-fns";
import { Bar, BarChart, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BlockTitle, List, ListItem, Segmented, SegmentedButton } from "konsta/react";
import { useReports } from "@/hooks/queries";
import type { Period } from "@/api";
import { formatMoney, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ErrorBlock, Kpi, Loading, Screen } from "../ui";

const PERIODS: Array<{ value: Period; label: string; hint: string }> = [
  { value: "today", label: "Today", hint: "vs yesterday" },
  { value: "week", label: "7 days", hint: "vs last week" },
  { value: "month", label: "30 days", hint: "vs last month" },
  { value: "quarter", label: "90 days", hint: "vs before" },
];
const PAY = { mobile_money: "Mobile money", cash: "Cash", card: "Card", wallet: "Wallet" } as const;
const PAY_COLORS = ["bg-[#229085]", "bg-[#007aff]", "bg-[#ff9500]", "bg-[#af52de]"];
const tooltip = { borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.12)", fontSize: 12 };

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-4 mt-2 rounded-2xl bg-white p-4 dark:bg-[#1c1c1d]">
      <p className="text-[15px] font-semibold">{title}</p>
      <div className="mt-3 h-44">{children}</div>
    </div>
  );
}

export default function ReportsScreen() {
  const [period, setPeriod] = useState<Period>("week");
  const { data, isLoading, error, refetch } = useReports(period);
  const hint = PERIODS.find((p) => p.value === period)!.hint;
  const k = data?.kpis;
  const xFmt = (d: string) => (period === "today" ? format(new Date(d), "ha") : period === "week" ? format(new Date(d), "EEE") : format(new Date(d), "d MMM"));

  return (
    <Screen
      title="Reports"
      back
      tabbar
      onRefresh={refetch}
      subnavbar={
        <Segmented strong>
          {PERIODS.map((p) => (
            <SegmentedButton key={p.value} strong active={period === p.value} onClick={() => setPeriod(p.value)}>
              {p.label}
            </SegmentedButton>
          ))}
        </Segmented>
      }
    >
      {error ? (
        <ErrorBlock error={error} onRetry={refetch} />
      ) : isLoading || !data || !k ? (
        <Loading />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 px-4 pt-4">
            <Kpi label="Gross sales" value={formatMoney(k.revenue.value)} current={k.revenue.value} previous={k.revenue.previous} hint={hint} />
            <Kpi label="Net earnings" value={formatMoney(k.net_earnings.value)} current={k.net_earnings.value} previous={k.net_earnings.previous} hint={hint} />
            <Kpi label="Orders" value={formatNumber(k.orders.value)} current={k.orders.value} previous={k.orders.previous} hint={hint} />
            <Kpi label="Avg. order" value={formatMoney(k.avg_order_value.value)} current={k.avg_order_value.value} previous={k.avg_order_value.previous} hint={hint} />
            <Kpi label="Cancel rate" value={`${k.cancel_rate.value.toFixed(1)}%`} current={k.cancel_rate.value} previous={k.cancel_rate.previous} invert hint={hint} />
            <Kpi label="Prep time" value={`${Math.round(k.avg_prep_minutes.value)} min`} current={k.avg_prep_minutes.value} previous={k.avg_prep_minutes.previous} invert hint={hint} />
          </div>

          <ChartCard title="Sales">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.series}>
                <XAxis dataKey="date" tickFormatter={xFmt} tickLine={false} axisLine={false} fontSize={11} stroke="#8e8e93" minTickGap={12} />
                <Tooltip contentStyle={tooltip} labelFormatter={(d) => format(new Date(d), "EEE, d MMM")} formatter={(v: number, n) => (n === "revenue" ? [formatMoney(v), "Sales"] : [v, "Orders"])} />
                <YAxis yAxisId={0} hide />
                <YAxis yAxisId={1} hide orientation="right" />
                <Bar dataKey="revenue" yAxisId={0} fill="#229085" radius={[6, 6, 0, 0]} maxBarSize={22} />
                <Line dataKey="orders" stroke="#ff9500" strokeWidth={2} dot={false} type="monotone" yAxisId={1} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Busiest hours">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.by_hour}>
                <XAxis dataKey="hour" tickLine={false} axisLine={false} fontSize={10} stroke="#8e8e93" interval={2} />
                <Tooltip contentStyle={tooltip} formatter={(v: number) => [v, "Orders"]} cursor={{ fill: "rgba(0,0,0,.04)" }} />
                <Bar dataKey="orders" fill="#007aff" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <BlockTitle>Payment methods</BlockTitle>
          <div className="mx-4 rounded-2xl bg-white p-4 dark:bg-[#1c1c1d]">
            {(() => {
              const total = data.by_payment.reduce((s, p) => s + p.revenue, 0) || 1;
              return (
                <>
                  <div className="flex h-3 overflow-hidden rounded-full">
                    {data.by_payment.map((p, i) => (
                      <span key={p.method} className={PAY_COLORS[i]} style={{ width: `${(p.revenue / total) * 100}%` }} />
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {data.by_payment.map((p, i) => (
                      <div key={p.method} className="flex items-center gap-2">
                        <span className={cn("h-2.5 w-2.5 rounded-full", PAY_COLORS[i])} />
                        <span className="flex-1 text-[14px] text-black/60 dark:text-white/60">{PAY[p.method]}</span>
                        <span className="tabular text-[14px] font-medium">{((p.revenue / total) * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>

          <BlockTitle>Top products</BlockTitle>
          <List strong inset dividers>
            {data.top_products.map((p, i) => (
              <ListItem
                key={p.product}
                media={<span className="tabular w-5 text-center text-[15px] font-semibold text-black/40 dark:text-white/40">{i + 1}</span>}
                title={p.product_name}
                text={`${p.quantity} sold`}
                after={<span className="tabular font-medium text-black dark:text-white">{formatMoney(p.revenue)}</span>}
              />
            ))}
          </List>

          <BlockTitle>By category</BlockTitle>
          <List strong inset dividers>
            {data.by_category.map((c) => {
              const total = data.by_category.reduce((s, x) => s + x.revenue, 0) || 1;
              const pct = (c.revenue / total) * 100;
              return (
                <ListItem
                  key={c.category}
                  title={c.category}
                  after={<span className="tabular">{formatMoney(c.revenue)}</span>}
                  footer={
                    <span className="mt-1.5 block h-1.5 w-full rounded-full bg-black/5 dark:bg-white/10">
                      <span className="block h-1.5 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </span>
                  }
                />
              );
            })}
          </List>
        </>
      )}
    </Screen>
  );
}
