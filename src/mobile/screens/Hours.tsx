import { useEffect, useState } from "react";
import { CalendarOff, Plus } from "lucide-react";
import { BlockFooter, BlockTitle, Link as KLink, List, ListInput, ListItem, Toggle } from "konsta/react";
import { useHours, useUpdateHours } from "@/hooks/queries";
import type { StoreHours } from "@/api";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FormSheet, IconTile, Loading, Screen } from "../ui";

const TODAY = new Date().toLocaleDateString("en-US", { weekday: "long" });

export default function HoursScreen() {
  const { data } = useHours();
  const update = useUpdateHours();
  const [hours, setHours] = useState<StoreHours | null>(null);
  const [adding, setAdding] = useState(false);
  const [closure, setClosure] = useState({ title: "", date: "" });

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
          <KLink navbar className={cn("font-semibold", invalid && "opacity-40")} onClick={() => hours && !invalid && update.mutate(hours)}>
            {update.isPending ? "Saving…" : "Save"}
          </KLink>
        )
      }
    >
      {!hours ? (
        <Loading />
      ) : (
        <>
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
          <BlockFooter>Your store opens and closes automatically. You can still close it any time from Home.</BlockFooter>

          <BlockTitle>Holiday closures</BlockTitle>
          <List strong inset dividers>
            {hours.closures.map((c) => (
              <ListItem
                key={c.name}
                media={<IconTile icon={CalendarOff} className="bg-[#ff3b30]" />}
                title={c.title}
                text={formatDate(c.date)}
                after={
                  <button className="text-[15px] text-[#ff3b30]" onClick={() => setHours((h) => h && { ...h, closures: h.closures.filter((x) => x.name !== c.name) })}>
                    Remove
                  </button>
                }
              />
            ))}
            <ListItem link chevron={false} onClick={() => setAdding(true)} title={<span className="flex items-center gap-2 text-primary"><Plus className="h-5 w-5" /> Add closure</span>} />
          </List>
        </>
      )}

      <FormSheet
        opened={adding}
        onClose={() => setAdding(false)}
        title="Holiday closure"
        saveLabel="Add"
        canSave={!!closure.title.trim() && !!closure.date}
        onSave={() => {
          setHours((h) => h && { ...h, closures: [...h.closures, { name: `CL-${Date.now()}`, title: closure.title.trim(), date: new Date(closure.date).toISOString() }] });
          setClosure({ title: "", date: "" });
          setAdding(false);
        }}
      >
        <List strongIos insetIos>
          <ListInput label="Name" placeholder="e.g. Eid al-Adha" value={closure.title} onInput={(e: React.ChangeEvent<HTMLInputElement>) => setClosure((c) => ({ ...c, title: e.target.value }))} />
          <ListInput label="Date" type="date" value={closure.date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClosure((c) => ({ ...c, date: e.target.value }))} />
        </List>
      </FormSheet>
    </Screen>
  );
}
