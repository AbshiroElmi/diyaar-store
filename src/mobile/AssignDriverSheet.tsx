import { useNavigate } from "react-router-dom";
import { Bike, Car, Check, ChevronRight, Phone, Users } from "lucide-react";
import { useAssignDriver, useDrivers } from "@/hooks/queries";
import type { Driver, DriverVehicle, Order } from "@/api";
import { initials } from "@/lib/format";
import { haptic } from "@/lib/native";
import { cn } from "@/lib/utils";
import { Loading, Sheet, SheetClose } from "./ui";

/** Lucide has no bicycle; the bike icon reads fine for both two-wheelers. */
export const VEHICLE: Record<DriverVehicle, { label: string; icon: typeof Bike }> = {
  motorbike: { label: "Motorbike", icon: Bike },
  bicycle: { label: "Bicycle", icon: Bike },
  car: { label: "Car", icon: Car },
};

/** Available first, then busy (fewest orders first), off-duty last. */
const rank = (d: Driver) => (d.is_active ? d.active_orders : 1000);

/** Bottom sheet listing the store's drivers; tapping one assigns them to the order. */
export function AssignDriverSheet({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const navigate = useNavigate();
  const { data: drivers, isLoading } = useDrivers();
  const assign = useAssignDriver();
  const sorted = [...(drivers ?? [])].sort((a, b) => rank(a) - rank(b));

  return (
    <Sheet opened={!!order} onBackdropClick={onClose} className="max-h-[85dvh] w-full overflow-hidden rounded-t-[22px]">
      <div className="flex items-center gap-2 px-2 pb-1 pt-3">
        <SheetClose onClick={onClose} />
        <div className="min-w-0 flex-1 text-center">
          <p className="text-[17px] font-bold">Assign a driver</p>
          {order && (
            <p className="truncate text-[12.5px] text-black/45 dark:text-white/50">
              {order.name} · {order.customer_name}
            </p>
          )}
        </div>
        <span className="w-10" />
      </div>

      <div className="no-scrollbar max-h-[calc(85dvh-64px)] overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3">
        {isLoading ? (
          <Loading />
        ) : (
          <div className="space-y-2">
            {sorted.map((d) => {
              const off = !d.is_active;
              const current = order?.driver === d.name;
              const V = VEHICLE[d.vehicle];
              return (
                <button
                  key={d.name}
                  type="button"
                  disabled={off || assign.isPending}
                  onClick={() => {
                    if (!order) return;
                    haptic.tap();
                    assign.mutate({ orderId: order.name, driverId: d.name }, { onSuccess: onClose });
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border-2 bg-white p-3 text-left transition-transform active:scale-[0.98] disabled:active:scale-100 dark:bg-[#1c1c1d]",
                    current ? "border-primary" : "border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_12px_-8px_rgba(0,0,0,0.2)]",
                    off && "opacity-50",
                  )}
                >
                  <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[14px] font-extrabold text-primary">
                    {initials(d.full_name)}
                    <span className={cn("absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white dark:ring-[#1c1c1d]", off ? "bg-black/25" : d.active_orders ? "bg-[#ff9500]" : "bg-[#34c759]")} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold">{d.full_name}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-[12.5px] text-black/50 dark:text-white/55">
                      <V.icon className="h-3.5 w-3.5" /> {V.label} · {d.deliveries_today} today
                    </span>
                  </span>
                  {current ? (
                    <span className="flex items-center gap-1 rounded-full bg-primary px-2.5 text-[12px] font-bold leading-[24px] text-white">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} /> Assigned
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "rounded-full px-2.5 text-[12px] font-bold leading-[24px]",
                        off ? "bg-black/[0.06] text-black/50 dark:bg-white/10 dark:text-white/55" : d.active_orders ? "bg-[#ff9500]/10 text-[#c76e00]" : "bg-[#34c759]/10 text-[#1a9d4b]",
                      )}
                    >
                      {off ? "Off duty" : d.active_orders ? `${d.active_orders} on the way` : "Available"}
                    </span>
                  )}
                </button>
              );
            })}
            {!sorted.length && <p className="py-6 text-center text-[14px] text-black/50 dark:text-white/55">No drivers available yet.</p>}
          </div>
        )}

        {/* Drivers come from the API, so there's no drivers page to link to for now.
        <button
          type="button"
          onClick={() => {
            onClose();
            navigate("/drivers");
          }}
          className="mt-3 flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-primary/30 p-3 text-left text-primary"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-5 w-5" />
          </span>
          <span className="flex-1 text-[15px] font-bold">See all drivers</span>
          <ChevronRight className="h-5 w-5" />
        </button>
        */}

        {order?.driver_phone && (
          <a href={`tel:${order.driver_phone}`} className="mt-2 flex items-center justify-center gap-1.5 py-2 text-[14px] font-semibold text-primary">
            <Phone className="h-4 w-4" /> Call {order.driver_name}
          </a>
        )}
      </div>
    </Sheet>
  );
}
