import { useState } from "react";
import { Check, ChefHat, Loader2, PackageCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveDialog } from "@/components/shared/ResponsiveDialog";
import { useUpdateOrderStatus } from "@/hooks/queries";
import type { Order } from "@/api";
import { cn } from "@/lib/utils";

const REJECT_REASONS = ["Item out of stock", "Kitchen too busy", "Closing soon", "Delivery area too far", "Other"];

export const isPickup = (o: Order) => o.delivery_type.includes("pickup");

/** The next-step buttons for an order, based on its status. */
export function OrderActions({ order, className, size = "default" }: { order: Order; className?: string; size?: "sm" | "default" }) {
  const update = useUpdateOrderStatus();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState(REJECT_REASONS[0]);
  const [other, setOther] = useState("");

  const pending = update.isPending;
  const run = (status: Order["status"], r?: string) => update.mutate({ id: order.name, status, reason: r });
  const spin = <Loader2 className="mr-2 h-4 w-4 animate-spin" />;

  let content: React.ReactNode = null;

  if (order.status === "confirming") {
    content = (
      <>
        <Button size={size} variant="outline" className="text-destructive hover:text-destructive" disabled={pending} onClick={() => setRejectOpen(true)}>
          <X className="mr-1.5 h-4 w-4" /> Reject
        </Button>
        <Button size={size} disabled={pending} onClick={() => run("accepted")}>
          {pending ? spin : <Check className="mr-1.5 h-4 w-4" />} Accept
        </Button>
      </>
    );
  } else if (order.status === "accepted") {
    content = (
      <Button size={size} disabled={pending} onClick={() => run("preparing")}>
        {pending ? spin : <ChefHat className="mr-1.5 h-4 w-4" />} Start preparing
      </Button>
    );
  } else if (order.status === "preparing") {
    content = (
      <Button size={size} disabled={pending} onClick={() => run("ready")} className="bg-success text-success-foreground hover:bg-success/90">
        {pending ? spin : <PackageCheck className="mr-1.5 h-4 w-4" />} Mark ready
      </Button>
    );
  } else if (order.status === "ready" && isPickup(order)) {
    content = (
      <Button size={size} disabled={pending} onClick={() => run("completed")}>
        {pending ? spin : <Check className="mr-1.5 h-4 w-4" />} Picked up by customer
      </Button>
    );
  } else if (order.status === "ready") {
    content = <p className="text-sm text-muted-foreground">{order.driver_name ? `Driver ${order.driver_name} is on the way` : "Waiting for a driver…"}</p>;
  }

  if (!content) return null;

  return (
    <>
      <div className={cn("flex items-center gap-2 [&>button]:flex-1 sm:[&>button]:flex-none", className)}>{content}</div>

      <ResponsiveDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title={`Reject order ${order.name}?`}
        description="The customer will be notified and refunded if they already paid."
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Keep order
            </Button>
            <Button
              variant="destructive"
              disabled={pending || (reason === "Other" && !other.trim())}
              onClick={() => {
                run("rejected", reason === "Other" ? other.trim() : reason);
                setRejectOpen(false);
              }}
            >
              Reject order
            </Button>
          </>
        }
      >
        <RadioGroup value={reason} onValueChange={setReason} className="gap-2">
          {REJECT_REASONS.map((r) => (
            <Label key={r} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 font-normal has-[:checked]:border-primary has-[:checked]:bg-accent/50">
              <RadioGroupItem value={r} /> {r}
            </Label>
          ))}
        </RadioGroup>
        {reason === "Other" && <Textarea className="mt-3" placeholder="Tell the customer why…" value={other} onChange={(e) => setOther(e.target.value)} />}
      </ResponsiveDialog>
    </>
  );
}
