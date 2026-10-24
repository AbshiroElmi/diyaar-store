import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  current?: number;
  previous?: number;
  compareLabel?: string;
  /** For metrics where lower is better (cancel rate, prep time). */
  invert?: boolean;
  hint?: string;
  loading?: boolean;
}

export function StatCard({ label, value, icon: Icon, current, previous, compareLabel = "vs previous", invert, hint, loading }: StatCardProps) {
  const hasDelta = current !== undefined && previous !== undefined;
  const delta = hasDelta ? (previous ? ((current - previous) / previous) * 100 : current ? 100 : 0) : 0;
  const good = invert ? delta < 0 : delta > 0;
  const flat = Math.abs(delta) < 0.5;
  const Arrow = flat ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      {loading ? (
        <>
          <Skeleton className="mt-2 h-7 w-24" />
          <Skeleton className="mt-2 h-3 w-28" />
        </>
      ) : (
        <>
          <p className="tabular mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{value}</p>
          {hasDelta ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-medium",
                  flat ? "text-muted-foreground" : good ? "text-success" : "text-destructive",
                )}
              >
                <Arrow className="h-3.5 w-3.5" />
                {Math.abs(delta).toFixed(1)}%
              </span>
              <span className="truncate">{compareLabel}</span>
            </p>
          ) : (
            hint && <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>
          )}
        </>
      )}
    </Card>
  );
}
