import { cn } from "@/lib/utils";

type Tone = "neutral" | "info" | "warning" | "success" | "danger" | "primary";

const TONES: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-info/10 text-info",
  warning: "bg-warning/15 text-[hsl(32_90%_36%)] dark:text-warning",
  success: "bg-success/10 text-success",
  danger: "bg-destructive/10 text-destructive",
  primary: "bg-primary/10 text-primary",
};

const STATUS_MAP: Record<string, [string, Tone]> = {
  // orders
  confirming: ["New", "warning"],
  accepted: ["Accepted", "info"],
  preparing: ["Preparing", "primary"],
  ready: ["Ready", "success"],
  picked_up: ["On the way", "info"],
  delivered: ["Delivered", "neutral"],
  completed: ["Completed", "neutral"],
  rejected: ["Rejected", "danger"],
  cancelled: ["Cancelled", "danger"],
  // products
  Active: ["Active", "success"],
  Pending: ["In review", "warning"],
  Inactive: ["Hidden", "neutral"],
  Rejected: ["Rejected", "danger"],
  // promotions
  active: ["Active", "success"],
  scheduled: ["Scheduled", "info"],
  paused: ["Paused", "warning"],
  ended: ["Ended", "neutral"],
  // payouts
  paid: ["Paid", "success"],
  processing: ["Processing", "info"],
  failed: ["Failed", "danger"],
  // tickets
  open: ["Open", "info"],
  pending: ["Awaiting you", "warning"],
  resolved: ["Resolved", "success"],
  closed: ["Closed", "neutral"],
  // team
  invited: ["Invited", "warning"],
  disabled: ["Disabled", "neutral"],
};

export function StatusBadge({ status, className, dot = true }: { status: string; className?: string; dot?: boolean }) {
  const [label, tone] = STATUS_MAP[status] ?? [status, "neutral" as Tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium", TONES[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {label}
    </span>
  );
}

export const statusLabel = (status: string) => STATUS_MAP[status]?.[0] ?? status;
