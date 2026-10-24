import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BellOff, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { SegmentedTabs } from "@/components/shared/SegmentedTabs";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/shared/States";
import { NotificationRow } from "@/layouts/NotificationsPopover";
import { useMarkNotificationsRead, useNotifications } from "@/hooks/queries";
import type { AppNotification } from "@/api";
import { formatDay } from "@/lib/format";

type Filter = "all" | "unread" | AppNotification["type"];

export default function Notifications() {
  const { data, isLoading, error, refetch } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const rows = (data?.notifications ?? []).filter((n) => (filter === "all" ? true : filter === "unread" ? !n.read : n.type === filter));
  const groups = rows.reduce<Record<string, AppNotification[]>>((acc, n) => {
    const day = formatDay(n.creation);
    (acc[day] ??= []).push(n);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        actions={
          <Button variant="outline" size="sm" disabled={!data?.unread} onClick={() => markRead.mutate(undefined)}>
            <CheckCheck className="mr-1.5 h-4 w-4" /> Mark all read
          </Button>
        }
      />
      <SegmentedTabs
        value={filter}
        onChange={setFilter}
        segments={[
          { value: "all", label: "All" },
          { value: "unread", label: "Unread", count: data?.unread },
          { value: "order", label: "Orders" },
          { value: "review", label: "Reviews" },
          { value: "payout", label: "Payouts" },
          { value: "product", label: "Products" },
          { value: "system", label: "Updates" },
        ]}
      />
      {isLoading ? (
        <Card>
          <ListSkeleton rows={6} />
        </Card>
      ) : !rows.length ? (
        <Card>
          <EmptyState icon={BellOff} title="You're all caught up" description="New notifications will appear here." />
        </Card>
      ) : (
        Object.entries(groups).map(([day, items]) => (
          <section key={day}>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{day}</h2>
            <Card className="divide-y overflow-hidden">
              {items.map((n) => (
                <NotificationRow
                  key={n.name}
                  n={n}
                  onClick={() => {
                    if (!n.read) markRead.mutate([n.name]);
                    if (n.link) navigate(n.link);
                  }}
                />
              ))}
            </Card>
          </section>
        ))
      )}
    </div>
  );
}
