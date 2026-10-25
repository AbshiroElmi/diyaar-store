import { useState } from "react";
import { Star } from "lucide-react";
import { useReviews, useReviewSummary } from "@/hooks/queries";
import { initials, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ChipBar, Empty, ErrorBlock, Loading, Screen } from "../ui";

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex gap-0.5", className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn("h-3.5 w-3.5", i < Math.round(value) ? "fill-[#ff9500] text-[#ff9500]" : "fill-black/10 text-transparent dark:fill-white/15")} />
      ))}
    </span>
  );
}

export default function ReviewsScreen() {
  // Replying isn't available yet: the backend doesn't save replies.
  const [filter, setFilter] = useState<"all" | "5" | "4" | "low">("all");
  const rating = filter === "5" || filter === "4" ? Number(filter) : undefined;
  const { data, isLoading, error, refetch } = useReviews({ rating, max_rating: filter === "low" ? 3 : undefined, page: 1 });
  const { data: s, refetch: refetchSummary } = useReviewSummary();
  const rows = data?.data;

  return (
    <Screen title="Reviews" back tabbar onRefresh={() => Promise.all([refetch(), refetchSummary()])}>
      {error ? (
        <ErrorBlock error={error} onRetry={refetch} />
      ) : isLoading || !s ? (
        <Loading />
      ) : (
        <>
          <div className="mx-4 mt-4 flex items-center gap-5 rounded-2xl border border-black/[0.06] bg-white p-5 dark:bg-[#1c1c1d]">
            <div className="text-center">
              <p className="tabular text-[44px] font-bold leading-none tracking-tight">{s.average.toFixed(1)}</p>
              <Stars value={s.average} className="mt-2" />
              <p className="mt-1 text-[12px] text-black/45 dark:text-white/45">{s.total} reviews</p>
            </div>
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((n) => {
                const c = s.distribution[n as 1 | 2 | 3 | 4 | 5];
                return (
                  <div key={n} className="flex items-center gap-2 text-[11px] text-black/45 dark:text-white/45">
                    <span className="w-2">{n}</span>
                    <span className="h-1.5 flex-1 rounded-full bg-black/5 dark:bg-white/10">
                      <span className="block h-1.5 rounded-full bg-[#ff9500]" style={{ width: `${s.total ? (c / s.total) * 100 : 0}%` }} />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2">
            <ChipBar
              value={filter}
              onChange={setFilter}
              items={[
                { value: "all", label: "All" },
                { value: "5", label: "5 ★" },
                { value: "4", label: "4 ★" },
                { value: "low", label: "3 ★ & below" },
              ]}
            />
          </div>

          {!rows?.length ? (
            <Empty icon={Star} title="Nothing here" />
          ) : (
            <div className="space-y-2 px-4 pt-2">
              {rows.map((r) => (
                <div key={r.name} className="rounded-2xl border border-black/[0.06] bg-white p-4 dark:bg-[#1c1c1d]">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-[14px] font-semibold text-primary">{initials(r.customer_name)}</span>
                    <div className="flex-1">
                      <p className="text-[15px] font-semibold">{r.customer_name}</p>
                      <div className="flex items-center gap-2">
                        <Stars value={r.rating} />
                        <span className="text-[12px] text-black/40 dark:text-white/40">{timeAgo(r.creation)}</span>
                      </div>
                    </div>
                  </div>
                  {r.comment && <p className="mt-3 text-[15px] leading-snug">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Screen>
  );
}
