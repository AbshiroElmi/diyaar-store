import { format, formatDistanceToNowStrict, isToday, isYesterday } from "date-fns";
import { env } from "./env";

const money = new Intl.NumberFormat(env.locale, { style: "currency", currency: env.currency });
const compact = new Intl.NumberFormat(env.locale, { notation: "compact", maximumFractionDigits: 1 });
const number = new Intl.NumberFormat(env.locale);

export const formatMoney = (value: number) => money.format(value || 0);
export const formatNumber = (value: number) => number.format(value || 0);
export const formatCompact = (value: number) => compact.format(value || 0);
export const formatPercent = (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;

export const formatDate = (iso: string) => format(new Date(iso), "MMM d, yyyy");
export const formatTime = (iso: string) => format(new Date(iso), "h:mm a");
export const formatDateTime = (iso: string) => format(new Date(iso), "MMM d, h:mm a");
export const timeAgo = (iso: string) => formatDistanceToNowStrict(new Date(iso), { addSuffix: true });

export const formatDay = (iso: string) => {
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEE, MMM d");
};

export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
