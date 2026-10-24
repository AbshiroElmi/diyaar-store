import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Landmark, Wallet } from "lucide-react";
import { Actions, ActionsButton, ActionsGroup, ActionsLabel, BlockTitle, List, ListItem, Segmented, SegmentedButton } from "konsta/react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useEarnings, useRequestPayout } from "@/hooks/queries";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { haptic } from "@/lib/native";
import { cn } from "@/lib/utils";
import { ErrorBlock, Kpi, Loading, Screen } from "../ui";

export default function EarningsScreen() {
  const { data, isLoading, error, refetch } = useEarnings();
  const payout = useRequestPayout();
  const [tab, setTab] = useState<"activity" | "payouts">("activity");
  const [confirm, setConfirm] = useState(false);

  const s = data?.summary;
  const processing = data?.payouts[0]?.status === "processing";

  return (
    <Screen title="Earnings" large tabbar onRefresh={refetch}>
      {error ? (
        <ErrorBlock error={error} onRetry={refetch} />
      ) : isLoading || !data || !s ? (
        <Loading />
      ) : (
        <>
          {/* Balance card */}
          <div className="relative mx-4 mt-2 overflow-hidden rounded-3xl bg-gradient-to-br from-[#2bb5a7] via-[#219186] to-[#155e57] p-5 text-white shadow-lg shadow-[#219186]/25">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-16 right-10 h-32 w-32 rounded-full bg-white/5" />
            <p className="relative flex items-center gap-2 text-[15px] opacity-90">
              <Wallet className="h-4 w-4" /> Available balance
            </p>
            <p className="tabular relative mt-1 text-[40px] font-bold leading-tight tracking-tight">{formatMoney(s.available_balance)}</p>
            <p className="relative text-[14px] opacity-85">
              {formatMoney(s.pending_balance)} pending · next payout {formatDate(s.next_payout_date)}
            </p>
            <div className="relative mt-4 flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-1.5 text-[13px] opacity-90">
                <Landmark className="h-4 w-4 shrink-0" />
                <span className="truncate">{data.account.bank_name}</span>
              </span>
              <button
                disabled={processing || payout.isPending}
                onClick={() => {
                  haptic.tap();
                  setConfirm(true);
                }}
                className="shrink-0 rounded-full bg-white px-5 py-2.5 text-[15px] font-semibold text-[#155e57] disabled:opacity-60"
              >
                {processing ? "Processing…" : "Withdraw"}
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 px-4">
            <Kpi label="This month (net)" value={formatMoney(s.this_month_net)} hint={`${formatMoney(s.this_month_gross)} gross`} />
            <Kpi label="Commission" value={`${s.commission_rate}%`} hint={`${formatMoney(s.commission_paid)} all time`} />
          </div>

          <div className="px-4 pb-1 pt-6">
            <Segmented strong rounded>
              <SegmentedButton strong rounded active={tab === "activity"} onClick={() => setTab("activity")}>
                Activity
              </SegmentedButton>
              <SegmentedButton strong rounded active={tab === "payouts"} onClick={() => setTab("payouts")}>
                Payouts
              </SegmentedButton>
            </Segmented>
          </div>

          {tab === "activity" ? (
            <List strong inset dividers>
              {data.transactions.slice(0, 40).map((t) => {
                const incoming = t.amount > 0;
                return (
                  <ListItem
                    key={t.name}
                    media={
                      <span className={cn("flex h-9 w-9 items-center justify-center rounded-full", incoming ? "bg-[#34c759]/15 text-[#34c759]" : "bg-black/5 text-black/50 dark:bg-white/10 dark:text-white/60")}>
                        {incoming ? <ArrowDownLeft className="h-[18px] w-[18px]" /> : <ArrowUpRight className="h-[18px] w-[18px]" />}
                      </span>
                    }
                    title={t.description}
                    text={formatDateTime(t.creation)}
                    after={
                      <span className={cn("tabular font-medium", incoming ? "text-[#34c759]" : "text-black dark:text-white")}>
                        {incoming ? "+" : "−"}
                        {formatMoney(Math.abs(t.amount))}
                      </span>
                    }
                  />
                );
              })}
            </List>
          ) : (
            <>
              <BlockTitle>Sent to {data.account.account_number_masked}</BlockTitle>
              <List strong inset dividers>
                {data.payouts.map((p) => (
                  <ListItem
                    key={p.name}
                    title={<span className="tabular font-semibold">{formatMoney(p.amount)}</span>}
                    text={`${formatDate(p.period_start)} – ${formatDate(p.period_end)}`}
                    after={<StatusBadge status={p.status} />}
                  />
                ))}
              </List>
            </>
          )}

          <Actions opened={confirm} onBackdropClick={() => setConfirm(false)}>
            <ActionsGroup>
              <ActionsLabel>
                Withdraw {formatMoney(s.available_balance)} to {data.account.bank_name}? It usually arrives within 24 hours.
              </ActionsLabel>
              <ActionsButton
                bold
                onClick={() => {
                  setConfirm(false);
                  haptic.success();
                  payout.mutate();
                }}
              >
                Withdraw {formatMoney(s.available_balance)}
              </ActionsButton>
            </ActionsGroup>
            <ActionsGroup>
              <ActionsButton onClick={() => setConfirm(false)}>Cancel</ActionsButton>
            </ActionsGroup>
          </Actions>
        </>
      )}
    </Screen>
  );
}

