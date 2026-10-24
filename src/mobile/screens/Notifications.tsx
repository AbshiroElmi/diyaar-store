import { useNavigate } from "react-router-dom";
import { BellOff, MessageSquareText, Package, ReceiptText, Settings2, Wallet } from "lucide-react";
import { Link as KLink, List, ListItem } from "konsta/react";
import { useMarkNotificationsRead, useNotifications } from "@/hooks/queries";
import type { AppNotification } from "@/api";
import { formatDay, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Empty, ErrorBlock, IconTile, Loading, Screen } from "../ui";

const ICON: Record<AppNotification["type"], [typeof Wallet, string]> = {
  order: [ReceiptText, "bg-[#ff9500]"],
  review: [MessageSquareText, "bg-[#ffcc00]"],
  payout: [Wallet, "bg-[#34c759]"],
  product: [Package, "bg-[#5856d6]"],
  system: [Settings2, "bg-[#8e8e93]"],
};

export default function NotificationsScreen() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useNotifications();
  const markRead = useMarkNotificationsRead();

  const groups = (data?.notifications ?? []).reduce<Record<string, AppNotification[]>>((acc, n) => {
    (acc[formatDay(n.creation)] ??= []).push(n);
    return acc;
  }, {});

  return (
    <Screen
      title="Notifications"
      back
      tabbar
      onRefresh={refetch}
      right={
        !!data?.unread && (
          <KLink navbar onClick={() => markRead.mutate(undefined)}>
            Read all
          </KLink>
        )
      }
    >
      {error ? (
        <ErrorBlock error={error} onRetry={refetch} />
      ) : isLoading ? (
        <Loading />
      ) : !data?.notifications.length ? (
        <Empty icon={BellOff} title="You're all caught up" />
      ) : (
        Object.entries(groups).map(([day, items]) => (
          <div key={day}>
            <p className="px-8 pb-1.5 pt-4 text-[13px] uppercase text-black/45 dark:text-white/45">{day}</p>
            <List strong inset dividers className="!my-0">
              {items.map((n) => {
                const [Icon, color] = ICON[n.type];
                return (
                  <ListItem
                    key={n.name}
                    link={!!n.link}
                    chevron={false}
                    onClick={() => {
                      if (!n.read) markRead.mutate([n.name]);
                      if (n.link) navigate(n.link.replace("/orders?order=", "/orders/"));
                    }}
                    media={<IconTile icon={Icon} className={color} />}
                    title={
                      <span className={cn("flex items-center gap-2", !n.read && "font-semibold")}>
                        {n.title}
                        {!n.read && <span className="h-2 w-2 rounded-full bg-[#007aff]" />}
                      </span>
                    }
                    after={<span className="text-[13px]">{timeAgo(n.creation).replace(" ago", "")}</span>}
                    text={n.body}
                  />
                );
              })}
            </List>
          </div>
        ))
      )}
    </Screen>
  );
}
