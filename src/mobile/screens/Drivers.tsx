import { useState } from "react";
import { Bike, Pencil, Phone, Plus, Trash2, UserCheck, UserX } from "lucide-react";
import { ActionsGroup, ActionsLabel, Link as KLink, List, ListInput, Toggle } from "konsta/react";
import { useDeleteDriver, useDrivers, useSaveDriver } from "@/hooks/queries";
import type { Driver, DriverVehicle } from "@/api";
import { initials } from "@/lib/format";
import { haptic } from "@/lib/native";
import { cn } from "@/lib/utils";
import { VEHICLE } from "../AssignDriverSheet";
import { ActionItem, Actions, CARD, Empty, ErrorBlock, FormSheet, Loading, Screen } from "../ui";

type Draft = Pick<Driver, "full_name" | "phone" | "vehicle">;
const EMPTY: Draft = { full_name: "", phone: "+252", vehicle: "motorbike" };

function DriverSheet({ editing, onClose }: { editing: Driver | "new" | null; onClose: () => void }) {
  const save = useSaveDriver();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [openedFor, setOpenedFor] = useState<Driver | "new" | null>(null);

  // Reset the form each time the sheet opens for a different driver.
  if (editing !== openedFor) {
    setOpenedFor(editing);
    if (editing) setDraft(editing === "new" ? EMPTY : { full_name: editing.full_name, phone: editing.phone, vehicle: editing.vehicle });
  }
  const isNew = editing === "new";
  const phoneOk = draft.phone.replace(/\D/g, "").length >= 9;

  return (
    <FormSheet
      opened={!!editing}
      onClose={onClose}
      title={isNew ? "New driver" : "Edit driver"}
      saveLabel={isNew ? "Add" : "Save"}
      saving={save.isPending}
      canSave={!!draft.full_name.trim() && phoneOk}
      onSave={() => save.mutate({ id: isNew || !editing ? undefined : editing.name, data: { ...draft, full_name: draft.full_name.trim(), phone: draft.phone.replace(/\s/g, "") } }, { onSuccess: onClose })}
    >
      <div className="flex justify-center pt-5">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-[26px] font-extrabold text-primary">{draft.full_name.trim() ? initials(draft.full_name) : <Bike className="h-9 w-9" />}</span>
      </div>
      <List strongIos insetIos>
        <ListInput label="Full name" placeholder="e.g. Abdikarim Mohamed" value={draft.full_name} onInput={(e: React.ChangeEvent<HTMLInputElement>) => setDraft((d) => ({ ...d, full_name: e.target.value }))} />
        <ListInput label="Phone" type="tel" inputMode="tel" placeholder="+252 61 234 5678" value={draft.phone} onInput={(e: React.ChangeEvent<HTMLInputElement>) => setDraft((d) => ({ ...d, phone: e.target.value }))} />
      </List>
      <p className="px-5 pb-2 text-[13px] font-bold uppercase tracking-wide text-black/45 dark:text-white/50">Vehicle</p>
      <div className="grid grid-cols-3 gap-2 px-4">
        {(Object.keys(VEHICLE) as DriverVehicle[]).map((v) => {
          const V = VEHICLE[v];
          const active = draft.vehicle === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => {
                haptic.tap();
                setDraft((d) => ({ ...d, vehicle: v }));
              }}
              className={cn("flex flex-col items-center gap-1.5 rounded-2xl border-2 bg-white py-3 text-[13px] font-bold transition-transform active:scale-95 dark:bg-[#1c1c1d]", active ? "border-primary text-primary" : "border-black/[0.06] text-black/60 dark:border-white/10 dark:text-white/65")}
            >
              <V.icon className="h-6 w-6" /> {V.label}
            </button>
          );
        })}
      </div>
    </FormSheet>
  );
}

// The live API can only list drivers for now (no create/update/delete endpoints yet),
// so managing them is switched off. Assigning a driver to an order still works.
// Set to true once those endpoints exist.
const CAN_MANAGE_DRIVERS = false;

export default function DriversScreen() {
  const { data, isLoading, error, refetch } = useDrivers();
  const save = useSaveDriver();
  const remove = useDeleteDriver();
  const [editing, setEditing] = useState<Driver | "new" | null>(null);
  const [selected, setSelected] = useState<Driver | null>(null);
  const onDuty = data?.filter((d) => d.is_active).length ?? 0;

  return (
    <Screen
      title="Delivery drivers"
      subtitle={data ? `${onDuty} on duty` : undefined}
      back
      tabbar
      onRefresh={refetch}
      right={
        CAN_MANAGE_DRIVERS && (
          <KLink navbar iconOnly onClick={() => setEditing("new")}>
            <Plus className="h-7 w-7" />
          </KLink>
        )
      }
    >
      {error ? (
        <ErrorBlock error={error} onRetry={refetch} />
      ) : isLoading ? (
        <Loading />
      ) : !data?.length ? (
        <Empty
          icon={Bike}
          title="No drivers yet"
          text={CAN_MANAGE_DRIVERS ? "Add the people who deliver for you, then assign them when an order is ready." : "Your delivery drivers will show up here."}
          action={
            CAN_MANAGE_DRIVERS && (
              <button className="font-semibold text-primary" onClick={() => setEditing("new")}>
                Add a driver
              </button>
            )
          }
        />
      ) : (
        <>
          <div className={cn(CARD, "mx-4 mt-4 divide-y divide-black/[0.06] overflow-hidden dark:divide-white/10")}>
            {data.map((d) => {
              const off = !d.is_active;
              const V = VEHICLE[d.vehicle];
              return (
                <div key={d.name} className="flex items-center gap-3 px-3.5 py-3">
                  <button type="button" onClick={() => setSelected(d)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <span className={cn("relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[14px] font-extrabold", off ? "bg-black/[0.06] text-black/40 dark:bg-white/10 dark:text-white/45" : "bg-primary/10 text-primary")}>
                      {initials(d.full_name)}
                      <span className={cn("absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white dark:ring-[#1c1c1d]", off ? "bg-black/25" : d.active_orders ? "bg-[#ff9500]" : "bg-[#34c759]")} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate text-[15px] font-bold", off && "text-black/45 dark:text-white/45")}>{d.full_name}</span>
                      <span className="mt-0.5 flex items-center gap-1 truncate text-[12.5px] text-black/50 dark:text-white/55">
                        <V.icon className="h-3.5 w-3.5 shrink-0" />
                        {off ? "Off duty" : d.active_orders ? `${d.active_orders} on the way` : "Available"} · {d.deliveries_today} today
                      </span>
                    </span>
                  </button>
                  {CAN_MANAGE_DRIVERS ? (
                    <Toggle checked={!off} onChange={() => save.mutate({ id: d.name, data: { is_active: off ? 1 : 0 }, silent: true })} />
                  ) : (
                    <a href={`tel:${d.phone}`} aria-label={`Call ${d.full_name}`} className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
          <p className="px-5 pt-3 text-[13px] leading-snug text-black/45 dark:text-white/50">
            {CAN_MANAGE_DRIVERS ? "Switch a driver off when they're not working — they won't show up when you assign orders." : "Assign these drivers from an order once it's ready."}
          </p>
        </>
      )}

      {CAN_MANAGE_DRIVERS && <DriverSheet editing={editing} onClose={() => setEditing(null)} />}

      <Actions opened={!!selected} onBackdropClick={() => setSelected(null)}>
        <ActionsGroup>
          <ActionsLabel>{selected?.full_name}</ActionsLabel>
          <ActionItem icon={Phone} onClick={() => (selected && window.open(`tel:${selected.phone}`), setSelected(null))}>
            Call {selected?.phone}
          </ActionItem>
          {CAN_MANAGE_DRIVERS && (
            <>
              <ActionItem icon={Pencil} onClick={() => (selected && setEditing(selected), setSelected(null))}>
                Edit driver
              </ActionItem>
              <ActionItem icon={selected?.is_active ? UserX : UserCheck} onClick={() => (selected && save.mutate({ id: selected.name, data: { is_active: selected.is_active ? 0 : 1 }, silent: true }), setSelected(null))}>
                {selected?.is_active ? "Set off duty" : "Set on duty"}
              </ActionItem>
              <ActionItem icon={Trash2} danger onClick={() => (selected && remove.mutate(selected.name), setSelected(null))}>
                Remove driver
              </ActionItem>
            </>
          )}
        </ActionsGroup>
      </Actions>
    </Screen>
  );
}
