import { useState } from "react";
import { CornerDownRight, MessageSquareText, Star } from "lucide-react";
import { Button, Link as KLink, Toolbar } from "konsta/react";
import { useReplyReview, useReviews } from "@/hooks/queries";
import type { Review } from "@/api";
import { formatDate, initials, timeAgo } from "@/lib/format";
import { haptic } from "@/lib/native";
import { cn } from "@/lib/utils";
import { ChipBar, Empty, ErrorBlock, Loading, Screen, Sheet } from "../ui";

const QUICK = ["Thank you so much! We're glad you enjoyed it 🙏", "Thanks for the feedback — we'll share it with the kitchen.", "Sorry about this. Please contact us so we can make it right."];

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex gap-0.5", className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn("h-3.5 w-3.5", i < Math.round(value) ? "fill-[#ff9500] text-[#ff9500]" : "fill-black/10 text-transparent dark:fill-white/15")} />
      ))}
    </span>
  );
}

function ReplySheet({ review, onClose }: { review: Review | null; onClose: () => void }) {
  const reply = useReplyReview();
  const [text, setText] = useState("");
  return (
    <Sheet opened={!!review} onBackdropClick={onClose} className="w-full rounded-t-[22px] pb-safe">
      <Toolbar top className="rounded-t-[22px]">
        <KLink toolbar onClick={onClose}>
          Cancel
        </KLink>
        <span className="font-semibold">Reply</span>
        <KLink
          toolbar
          className="font-semibold"
          onClick={() => {
            if (!review || !text.trim()) return;
            haptic.success();
            reply.mutate({ id: review.name, reply: text }, { onSuccess: onClose });
            setText("");
          }}
        >
          Post
        </KLink>
      </Toolbar>
      {review && (
        <div className="space-y-3 p-4">
          <p className="rounded-xl bg-black/5 p-3 text-[15px] dark:bg-white/10">
            <span className="font-semibold">{review.customer_name}: </span>“{review.comment}”
          </p>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {QUICK.map((q) => (
              <button key={q} onClick={() => setText(q)} className="shrink-0 rounded-full bg-primary/10 px-3 py-1.5 text-[13px] text-primary">
                {q.slice(0, 26)}…
              </button>
            ))}
          </div>
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a public reply…"
            className="h-28 w-full resize-none rounded-xl bg-black/5 p-3 text-[16px] outline-none dark:bg-white/10"
          />
        </div>
      )}
    </Sheet>
  );
}

export default function ReviewsScreen() {
  const [filter, setFilter] = useState<"all" | "unreplied" | "5" | "4" | "low">("all");
  const rating = filter === "5" || filter === "4" ? Number(filter) : undefined;
  const { data, isLoading, error, refetch } = useReviews({ filter: filter === "unreplied" ? "unreplied" : "all", rating, page: 1 });
  const [replying, setReplying] = useState<Review | null>(null);
  const s = data?.summary;
  const rows = filter === "low" ? data?.data.filter((r) => r.rating <= 3) : data?.data;

  return (
    <Screen title="Reviews" back tabbar onRefresh={refetch}>
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
                { value: "unreplied", label: "Needs reply", count: s.unreplied },
                { value: "5", label: "5 ★" },
                { value: "4", label: "4 ★" },
                { value: "low", label: "3 ★ & below" },
              ]}
            />
          </div>

          {!rows?.length ? (
            <Empty icon={Star} title="Nothing here" text={filter === "unreplied" ? "You've replied to every review 🎉" : undefined} />
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
                  <p className="mt-3 text-[15px] leading-snug">{r.comment}</p>
                  {r.reply ? (
                    <div className="mt-3 flex gap-2 rounded-xl bg-black/[0.04] p-3 dark:bg-white/5">
                      <CornerDownRight className="mt-0.5 h-4 w-4 shrink-0 text-black/35 dark:text-white/40" />
                      <div>
                        <p className="text-[12px] font-medium text-black/45 dark:text-white/45">You replied · {r.reply_at && formatDate(r.reply_at)}</p>
                        <p className="text-[14px]">{r.reply}</p>
                      </div>
                    </div>
                  ) : (
                    <Button rounded small className="mt-3 !w-auto px-4" onClick={() => setReplying(r)}>
                      <MessageSquareText className="mr-1.5 h-4 w-4" /> Reply
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
      <ReplySheet review={replying} onClose={() => setReplying(null)} />
    </Screen>
  );
}
