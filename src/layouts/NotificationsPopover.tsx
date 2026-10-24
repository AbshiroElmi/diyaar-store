import { Bell, CheckCheck, MessageSquareText, Package, ReceiptText, Settings2, Wallet } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMarkNotificationsRead, useNotifications } from "@/hooks/queries";
import type { AppNotification } from "@/api";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export const NOTIFICATION_ICONS: Record<AppNotification["type"], typeof Bell> = {
  order: ReceiptText,
  review: MessageSquareText,
  payout: Wallet,
  product: Package,
  system: Settings2,
};

export function NotificationRow({ n, onClick }: { n: AppNotification; onClick?: () => void }) {
  const Icon = NOTIFICATION_ICONS[n.type];
  return (
    <button onClick={onClick} className={cn("flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60", !n.read && "bg-accent/40")}>
      <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", n.type === "order" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground")}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium">{n.title}</span>
          {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
        </span>
        <span className="line-clamp-2 text-xs text-muted-foreground">{n.body}</span>
        <span className="mt-1 block text-[11px] text-muted-foreground">{timeAgo(n.creation)}</span>
      </span>
    </button>
  );
}

export function NotificationsPopover() {
  const { data } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const navigate = useNavigate();
  const unread = data?.unread ?? 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="tabular absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="font-semibold">Notifications</p>
          <Button variant="ghost" size="sm" className="h-7 text-xs" disabled={!unread} onClick={() => markRead.mutate(undefined)}>
            <CheckCheck className="mr-1 h-3.5 w-3.5" /> Mark all read
          </Button>
        </div>
        <ScrollArea className="h-[22rem]">
          <div className="divide-y">
            {data?.notifications.slice(0, 12).map((n) => (
              <NotificationRow
                key={n.name}
                n={n}
                onClick={() => {
                  if (!n.read) markRead.mutate([n.name]);
                  if (n.link) navigate(n.link);
                }}
              />
            ))}
          </div>
        </ScrollArea>
        <div className="border-t p-2">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link to="/notifications">View all notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
