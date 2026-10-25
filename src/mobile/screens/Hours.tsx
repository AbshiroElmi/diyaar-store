import { useEffect, useState } from "react";
import { Hourglass } from "lucide-react";
import { BlockFooter, BlockTitle, Link as KLink, List, ListItem, Toggle } from "konsta/react";
import { useHours, useStore, useSubmitHours } from "@/hooks/queries";
import type { StoreHours } from "@/api";
import { cn } from "@/lib/utils";
import { Loading, Screen } from "../ui";

const TODAY = new Date().toLocaleDateString("en-US", { weekday: "long" });

export default function HoursScreen() {
  const { data } = useHours();
  const { data: store } = useStore();
  const update = useSubmitHours();
  const [hours, setHours] = useState<StoreHours | null>(null);

  useEffect(() => {
    if (data) setHours(structuredClone(data));
  }, [data]);

  const dirty = !!hours && JSON.stringify(hours) !== JSON.stringify(data);
  const invalid = hours?.weekly.some((d) => d.is_open && d.close_time <= d.open_time);
  const setDay = (i: number, patch: Partial<StoreHours["weekly"][number]>) => setHours((h) => h && { ...h, weekly: h.weekly.map((d, j) => (j === i ? { ...d, ...patch } : d)) });

  return (
    <Screen
      title="Opening Hours"
      back
      tabbar
      right={
        dirty && (
          <KLink navbar className={cn("font-semibold", invalid && "opacity-40")} onClick={() => hours && !invalid && update.mutate(hours, { onSuccess: () => data && setHours(structuredClone(data)) })}>
            {update.isPending ? "Sending…" : "Send"}
          </KLink>
        )
      }
    >
      {!hours ? (
        <Loading />
      ) : (
        <>
          {store?.pending_approval && (
            <div className="mx-4 mt-4 flex gap-2 rounded-xl bg-[#ff9500]/10 p-3 text-[14px] text-[#b86500]">
              <Hourglass className="mt-0.5 h-4 w-4 shrink-0" /> Your last changes are waiting for Diyaar to approve them. These are your current hours.
            </div>
          )}
          <BlockTitle>Weekly schedule</BlockTitle>
          <List strong inset dividers>
            {hours.weekly.map((d, i) => (
              <ListItem
                key={d.day}
                title={
                  <span className={cn(d.day === TODAY && "font-semibold")}>
                    {d.day}
                    {d.day === TODAY && <span className="ml-1.5 text-[12px] font-medium text-primary">Today</span>}
                  </span>
                }
                text={!d.is_open && "Closed"}
                // Not `text`: Konsta line-clamps it, which clips the pickers and ellipsizes the dash.
                innerChildren={
                  d.is_open && (
                    <div className="mt-2 flex items-center gap-2">
                      <input type="time" value={d.open_time} onChange={(e) => setDay(i, { open_time: e.target.value })} className="time-pill" />
                      <span className="shrink-0 text-black/40 dark:text-white/40">–</span>
                      <input type="time" value={d.close_time} onChange={(e) => setDay(i, { close_time: e.target.value })} className={cn("time-pill", d.close_time <= d.open_time && "ring-2 ring-[#ff3b30]")} />
                    </div>
                  )
                }
                after={<Toggle checked={d.is_open} onChange={() => setDay(i, { is_open: !d.is_open })} />}
              />
            ))}
          </List>
          <BlockFooter>New hours go to Diyaar for approval. Your store opens and closes automatically, and you can still close it any time from Home.</BlockFooter>
        </>
      )}
    </Screen>
  );
}
