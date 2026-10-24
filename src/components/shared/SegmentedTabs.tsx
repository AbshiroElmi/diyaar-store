import { cn } from "@/lib/utils";

export interface Segment<T extends string> {
  value: T;
  label: string;
  count?: number;
}

/** Horizontally scrollable pill tabs — works well on phones. */
export function SegmentedTabs<T extends string>({
  value,
  onChange,
  segments,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  segments: Segment<T>[];
  className?: string;
}) {
  return (
    <div className={cn("scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0", className)} role="tablist">
      {segments.map((s) => {
        const active = s.value === value;
        return (
          <button
            key={s.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(s.value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              active ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {s.label}
            {s.count !== undefined && s.count > 0 && (
              <span
                className={cn(
                  "tabular rounded-full px-1.5 text-[11px] leading-[18px]",
                  active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-foreground",
                )}
              >
                {s.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
