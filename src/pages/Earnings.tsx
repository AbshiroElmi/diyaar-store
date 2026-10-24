import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Banknote, CalendarClock, Download, Landmark, Loader2, Percent, Receipt, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { SegmentedTabs } from "@/components/shared/SegmentedTabs";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ErrorState } from "@/components/shared/States";
import { useEarnings, useRequestPayout } from "@/hooks/queries";
import type { Transaction } from "@/api";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type TxFilter = "all" | Transaction["type"];

function downloadCsv(rows: Transaction[]) {
  const header = "Date,Type,Reference,Description,Amount";
  const body = rows.map((t) => [t.creation, t.type, t.reference, `"${t.description}"`, t.amount.toFixed(2)].join(","));
  const blob = new Blob([[header, ...body].join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `diyaar-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function Earnings() {
  const { data, isLoading, error, refetch } = useEarnings();
  const payout = useRequestPayout();
  const [confirm, setConfirm] = useState(false);
  const [tab, setTab] = useState<"transactions" | "payouts">("transactions");
  const [txFilter, setTxFilter] = useState<TxFilter>("all");

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const s = data?.summary;
  const tx = (data?.transactions ?? []).filter((t) => txFilter === "all" || t.type === txFilter);
  const processing = data?.payouts[0]?.status === "processing";

  return (
    <div className="space-y-6">
      <PageHeader title="Earnings" description="Your balance, Diyaar commission and payouts." />

      {/* Balance hero */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary to-[hsl(190_70%_32%)] text-primary-foreground">
        <CardContent className="flex flex-col gap-6 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div>
            <p className="flex items-center gap-2 text-sm opacity-90">
              <Wallet className="h-4 w-4" /> Available balance
            </p>
            {isLoading ? <Skeleton className="mt-2 h-10 w-40 bg-white/20" /> : <p className="tabular mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{formatMoney(s!.available_balance)}</p>}
            <p className="mt-2 text-sm opacity-90">
              {s ? `${formatMoney(s.pending_balance)} pending · next automatic payout ${formatDate(s.next_payout_date)}` : " "}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Button variant="secondary" className="bg-white text-primary hover:bg-white/90" disabled={!s || processing || payout.isPending} onClick={() => setConfirm(true)}>
              {payout.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Banknote className="mr-2 h-4 w-4" />}
              {processing ? "Payout processing" : "Withdraw now"}
            </Button>
            {data && (
              <p className="flex items-center gap-1.5 text-xs opacity-90">
                <Landmark className="h-3.5 w-3.5" /> {data.account.bank_name} · {data.account.account_number_masked}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard loading={isLoading} label="This month (gross)" value={formatMoney(s?.this_month_gross ?? 0)} icon={Receipt} hint="Last 30 days of sales" />
        <StatCard loading={isLoading} label="This month (net)" value={formatMoney(s?.this_month_net ?? 0)} icon={ArrowDownLeft} hint="After commission" />
        <StatCard loading={isLoading} label="Commission rate" value={`${s?.commission_rate ?? 0}%`} icon={Percent} hint={`${formatMoney(s?.commission_paid ?? 0)} paid all time`} />
        <StatCard loading={isLoading} label="Total earned" value={formatMoney(s?.total_earned ?? 0)} icon={CalendarClock} hint="Net, all time" />
      </div>

      <Card>
        <CardHeader className="flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-lg border bg-muted/50 p-1">
            {(["transactions", "payouts"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn("rounded-md px-4 py-1.5 text-sm font-medium capitalize", tab === t ? "bg-background shadow-sm" : "text-muted-foreground")}
              >
                {t}
              </button>
            ))}
          </div>
          {tab === "transactions" && (
            <Button variant="outline" size="sm" onClick={() => downloadCsv(tx)} disabled={!tx.length}>
              <Download className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {tab === "transactions" ? (
            <>
              <div className="px-4 pb-3 sm:px-6">
                <SegmentedTabs
                  value={txFilter}
                  onChange={setTxFilter}
                  segments={[
                    { value: "all", label: "All" },
                    { value: "order", label: "Sales" },
                    { value: "commission", label: "Commission" },
                    { value: "payout", label: "Payouts" },
                    { value: "refund", label: "Refunds" },
                  ]}
                />
              </div>
              <div className="divide-y border-t">
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="mx-6 my-3 h-10" />)
                  : tx.slice(0, 60).map((t) => {
                      const incoming = t.amount > 0;
                      return (
                        <div key={t.name} className="flex items-center gap-3 px-4 py-3 sm:px-6">
                          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", incoming ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
                            {incoming ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{t.description}</p>
                            <p className="text-xs text-muted-foreground">{formatDateTime(t.creation)}</p>
                          </div>
                          <span className={cn("tabular text-sm font-medium", incoming ? "text-success" : "text-foreground")}>
                            {incoming ? "+" : "−"}
                            {formatMoney(Math.abs(t.amount))}
                          </span>
                        </div>
                      );
                    })}
              </div>
            </>
          ) : (
            <>
              <div className="divide-y md:hidden">
                {data?.payouts.map((p) => (
                  <div key={p.name} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{formatMoney(p.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(p.period_start)} – {formatDate(p.period_end)}
                      </p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Payout</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="pr-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.payouts.map((p) => (
                    <TableRow key={p.name}>
                      <TableCell className="pl-6 font-medium">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(p.period_start)} – {formatDate(p.period_end)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.method} {p.account}
                      </TableCell>
                      <TableCell className="tabular text-right font-medium">{formatMoney(p.amount)}</TableCell>
                      <TableCell className="pr-6">
                        <StatusBadge status={p.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Withdraw ${formatMoney(s?.available_balance ?? 0)}?`}
        description={data ? `The money will be sent to ${data.account.bank_name} (${data.account.account_number_masked}), usually within 24 hours.` : undefined}
        confirmLabel="Withdraw"
        onConfirm={() => payout.mutate()}
      />
    </div>
  );
}
