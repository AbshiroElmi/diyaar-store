import { api } from "../client";
import { ENDPOINTS } from "../endpoints";
import type { EarningsData } from "../types";
import { currentStore } from "./store";

interface EarningsRow {
  total_revenue: number;
  commission_paid: number;
  pending_payout: number;
  this_month: number;
  orderCount: number;
  commission_rate: number;
}

interface PayoutAccounts {
  bankAccounts: Array<{ bankName: string; accountNumber: string }>;
  mobileMoneyAccounts: Array<{ provider: string; mobileNumber: string }>;
}

const last4 = (s: string) => `•••• ${String(s ?? "").slice(-4)}`;

export const earningsService = {
  get: async (): Promise<EarningsData> => {
    const [{ earnings: e }, { settings: s }] = await Promise.all([
      api.get<{ earnings: EarningsRow }>(ENDPOINTS.getEarnings, { store_id: currentStore.id }),
      api.get<{ settings: PayoutAccounts }>(ENDPOINTS.getSettings, { store_id: currentStore.id }),
    ]);
    const rate = Number(e.commission_rate) || 0;
    return {
      pending_payout: e.pending_payout,
      total_revenue: e.total_revenue,
      total_earned: e.total_revenue - e.commission_paid,
      commission_paid: e.commission_paid,
      commission_rate: rate,
      this_month_gross: e.this_month,
      this_month_net: e.this_month * (1 - rate / 100),
      order_count: e.orderCount,
      payout_accounts: [
        ...(s.bankAccounts ?? []).map((b) => `${b.bankName} · ${last4(b.accountNumber)}`),
        ...(s.mobileMoneyAccounts ?? []).map((m) => `${m.provider} · ${last4(m.mobileNumber)}`),
      ],
    };
  },
};
