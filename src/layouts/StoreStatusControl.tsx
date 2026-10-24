import { useState } from "react";
import { ChevronDown, Flame, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useSetBusy, useSetStoreOpen, useStore } from "@/hooks/queries";
import { cn } from "@/lib/utils";

/** Open / Busy / Closed switch shown in the top bar. */
export function StoreStatusControl({ compact = false }: { compact?: boolean }) {
  const { data: store } = useStore();
  const setOpen = useSetStoreOpen();
  const setBusy = useSetBusy();
  const [confirmClose, setConfirmClose] = useState(false);

  if (!store) return <div className="h-9 w-28 animate-pulse rounded-full bg-muted" />;

  const state = !store.is_open ? "closed" : store.busy_mode ? "busy" : "open";
  const styles = {
    open: { label: "Open", dot: "bg-success", ring: "border-success/30 bg-success/10 text-success" },
    busy: { label: "Busy", dot: "bg-warning", ring: "border-warning/40 bg-warning/10 text-[hsl(32_90%_36%)] dark:text-warning" },
    closed: { label: "Closed", dot: "bg-muted-foreground", ring: "border-border bg-muted text-muted-foreground" },
  }[state];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors",
              styles.ring,
            )}
            aria-label={`Store is ${styles.label}. Change status`}
          >
            <span className="relative flex h-2 w-2">
              {state === "open" && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />}
              <span className={cn("relative inline-flex h-2 w-2 rounded-full", styles.dot)} />
            </span>
            {!compact && <span>{styles.label}</span>}
            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Store status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={state === "open"} onClick={() => (store.busy_mode ? setBusy.mutate(false) : setOpen.mutate(true))} className="items-start gap-3 py-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-success" />
            <div>
              <p className="font-medium">Open</p>
              <p className="text-xs text-muted-foreground">Accepting orders normally</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem disabled={state !== "open"} onClick={() => setBusy.mutate(true)} className="items-start gap-3 py-2">
            <Flame className="mt-0.5 h-4 w-4 text-warning" />
            <div>
              <p className="font-medium">Busy</p>
              <p className="text-xs text-muted-foreground">Still open, longer prep times shown</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem disabled={state === "closed"} onClick={() => setConfirmClose(true)} className="items-start gap-3 py-2">
            <Power className="mt-0.5 h-4 w-4 text-destructive" />
            <div>
              <p className="font-medium">Close store</p>
              <p className="text-xs text-muted-foreground">Stop receiving new orders</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title="Close your store?"
        description="Customers won't be able to order until you open again. Orders already in progress are not affected."
        confirmLabel="Close store"
        destructive
        onConfirm={() => setOpen.mutate(false)}
      />
    </>
  );
}

export function OpenStoreButton() {
  const setOpen = useSetStoreOpen();
  return (
    <Button size="sm" onClick={() => setOpen.mutate(true)} disabled={setOpen.isPending}>
      <Power className="mr-2 h-4 w-4" /> Open store
    </Button>
  );
}
