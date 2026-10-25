import { Landmark, Wallet } from "lucide-react";
import { BlockFooter, BlockTitle, List, ListItem } from "konsta/react";
import { useEarnings } from "@/hooks/queries";
import { formatMoney, formatNumber } from "@/lib/format";
import { ErrorBlock, IconTile, Kpi, Loading, Screen } from "../ui";

export default function EarningsScreen() {
  const { data, isLoading, error, refetch } = useEarnings();

  return (
    <Screen title="Earnings" tabbar onRefresh={refetch}>
      {error ? (
        <ErrorBlock error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <Loading />
      ) : (
        <>
          {/* Balance card */}
          <div className="relative mx-4 mt-2 overflow-hidden rounded-3xl bg-gradient-to-br from-[#2bb5a7] via-[#219186] to-[#155e57] p-5 text-white shadow-lg shadow-[#219186]/25">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-16 right-10 h-32 w-32 rounded-full bg-white/5" />
            <p className="relative flex items-center gap-2 text-[15px] opacity-90">
              <Wallet className="h-4 w-4" /> Your earnings to be paid
            </p>
            <p className="tabular relative mt-1 text-[40px] font-bold leading-tight tracking-tight">{formatMoney(data.pending_payout)}</p>
            <p className="relative text-[14px] opacity-85">
              From {formatNumber(data.order_count)} completed orders, after {data.commission_rate}% commission
            </p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 px-4">
            <Kpi label="This month (net)" value={formatMoney(data.this_month_net)} hint={`${formatMoney(data.this_month_gross)} sales`} />
            <Kpi label="Commission" value={`${data.commission_rate}%`} hint={`${formatMoney(data.commission_paid)} all time`} />
          </div>

          <BlockTitle>All time</BlockTitle>
          <List strong inset dividers>
            <ListItem title="Sales" after={<span className="tabular">{formatMoney(data.total_revenue)}</span>} />
            <ListItem title="Commission" after={<span className="tabular">−{formatMoney(data.commission_paid)}</span>} />
            <ListItem title={<span className="font-semibold">You earned</span>} after={<span className="tabular font-semibold text-black dark:text-white">{formatMoney(data.total_earned)}</span>} />
          </List>

          <BlockTitle>Payouts go to</BlockTitle>
          <List strong inset dividers>
            {data.payout_accounts.length ? (
              data.payout_accounts.map((a) => <ListItem key={a} media={<IconTile icon={Landmark} className="bg-[#219186]" />} title={a} />)
            ) : (
              <ListItem title={<span className="text-black/50 dark:text-white/50">No payout account yet</span>} />
            )}
          </List>
          <BlockFooter>Diyaar sends your payouts. To change the account, use Settings → Payouts on the Diyaar web panel.</BlockFooter>
        </>
      )}
    </Screen>
  );
}
