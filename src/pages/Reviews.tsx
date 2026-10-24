import { useState } from "react";
import { CornerDownRight, Loader2, MessageSquareText, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/PageHeader";
import { SegmentedTabs } from "@/components/shared/SegmentedTabs";
import { EmptyState, ErrorState } from "@/components/shared/States";
import { useReplyReview, useReviews } from "@/hooks/queries";
import type { Review } from "@/api";
import { formatDate, initials, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

function Stars({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn(size, i < Math.round(value) ? "fill-warning text-warning" : "fill-muted text-muted")} />
      ))}
    </span>
  );
}

const QUICK_REPLIES = ["Thank you so much! We're glad you enjoyed it 🙏", "Thanks for the feedback — we'll share it with the kitchen team.", "Sorry about this. Please contact us so we can make it right."];

function ReviewCard({ review }: { review: Review }) {
  const reply = useReplyReview();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  return (
    <div className="p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">{initials(review.customer_name)}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <p className="font-medium">{review.customer_name}</p>
            <span className="text-xs text-muted-foreground">{timeAgo(review.creation)}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <Stars value={review.rating} size="h-3.5 w-3.5" />
            <span className="text-xs text-muted-foreground">Order {review.order}</span>
          </div>
          <p className="mt-2 text-sm">{review.comment}</p>

          {review.reply ? (
            <div className="mt-3 flex gap-2 rounded-lg bg-muted/60 p-3 text-sm">
              <CornerDownRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Your reply · {review.reply_at && formatDate(review.reply_at)}</p>
                <p className="mt-0.5">{review.reply}</p>
              </div>
            </div>
          ) : open ? (
            <div className="mt-3 space-y-2">
              <div className="scrollbar-none flex gap-2 overflow-x-auto">
                {QUICK_REPLIES.map((q) => (
                  <button key={q} onClick={() => setText(q)} className="shrink-0 rounded-full border px-3 py-1 text-xs hover:bg-muted">
                    {q.length > 32 ? `${q.slice(0, 32)}…` : q}
                  </button>
                ))}
              </div>
              <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a public reply…" autoFocus />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" disabled={!text.trim() || reply.isPending} onClick={() => reply.mutate({ id: review.name, reply: text }, { onSuccess: () => setOpen(false) })}>
                  {reply.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Post reply
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setOpen(true)}>
              <MessageSquareText className="mr-1.5 h-4 w-4" /> Reply
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Reviews() {
  const [filter, setFilter] = useState<"all" | "unreplied" | "5" | "4" | "3" | "low">("all");
  const rating = ["5", "4", "3"].includes(filter) ? Number(filter) : undefined;
  const { data, isLoading, error, refetch } = useReviews({ filter: filter === "unreplied" ? "unreplied" : "all", rating, page: 1 });
  const s = data?.summary;
  const rows = filter === "low" ? data?.data.filter((r) => r.rating <= 2) : data?.data;

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Reviews" description="Replying to reviews builds trust — especially the critical ones." />

      <Card>
        <CardContent className="grid gap-6 p-5 sm:grid-cols-[auto,1fr] sm:items-center sm:p-6">
          <div className="text-center sm:border-r sm:pr-8">
            {isLoading ? <Skeleton className="mx-auto h-12 w-16" /> : <p className="tabular text-5xl font-semibold tracking-tight">{s?.average.toFixed(1)}</p>}
            <div className="mt-2">
              <Stars value={s?.average ?? 0} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{s?.total ?? 0} reviews</p>
          </div>
          <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((n) => {
              const count = s?.distribution[n as 1 | 2 | 3 | 4 | 5] ?? 0;
              const pct = s?.total ? (count / s.total) * 100 : 0;
              return (
                <div key={n} className="flex items-center gap-3 text-sm">
                  <span className="tabular w-3 text-muted-foreground">{n}</span>
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                  <div className="h-2 flex-1 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-warning" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="tabular w-8 text-right text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <SegmentedTabs
        value={filter}
        onChange={setFilter}
        segments={[
          { value: "all", label: "All" },
          { value: "unreplied", label: "Needs reply", count: s?.unreplied },
          { value: "5", label: "5 ★" },
          { value: "4", label: "4 ★" },
          { value: "3", label: "3 ★" },
          { value: "low", label: "1–2 ★" },
        ]}
      />

      <Card className="divide-y overflow-hidden">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="m-5 h-20" />)
        ) : !rows?.length ? (
          <EmptyState icon={Star} title="No reviews here" description={filter === "unreplied" ? "You've replied to every review. Nice work!" : "Try another filter."} />
        ) : (
          rows.map((r) => <ReviewCard key={r.name} review={r} />)
        )}
      </Card>
    </div>
  );
}
