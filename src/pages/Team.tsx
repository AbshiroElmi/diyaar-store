import { useEffect, useState } from "react";
import { Loader2, MoreVertical, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { ResponsiveDialog } from "@/components/shared/ResponsiveDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/shared/States";
import { useInviteMember, useRemoveMember, useTeam, useUpdateMember } from "@/hooks/queries";
import type { TeamMember, TeamRole } from "@/api";
import { initials, timeAgo } from "@/lib/format";

const ROLES: Array<{ role: TeamRole; can: string[] }> = [
  { role: "Owner", can: ["Everything, including payouts and team"] },
  { role: "Manager", can: ["Orders, products, promotions, reports", "Store profile and hours"] },
  { role: "Staff", can: ["Accept and prepare orders", "Mark products sold out"] },
];

function InviteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const invite = useInviteMember();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", role: "Staff" as TeamRole });

  useEffect(() => {
    if (open) setForm({ full_name: "", email: "", phone: "", role: "Staff" });
  }, [open]);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Invite a team member"
      description="They'll get an SMS and email with a link to sign in."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!form.full_name.trim() || !form.email.includes("@") || invite.isPending} onClick={() => invite.mutate(form, { onSuccess: () => onOpenChange(false) })}>
            {invite.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send invite
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="t-name">Full name</Label>
          <Input id="t-name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="t-email">Email</Label>
            <Input id="t-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-phone">Phone</Label>
            <Input id="t-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+252…" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as TeamRole })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Manager">Manager</SelectItem>
              <SelectItem value="Staff">Staff</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{ROLES.find((r) => r.role === form.role)?.can.join(" · ")}</p>
        </div>
      </div>
    </ResponsiveDialog>
  );
}

export default function Team() {
  const { data, isLoading, error, refetch } = useTeam();
  const update = useUpdateMember();
  const remove = useRemoveMember();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removing, setRemoving] = useState<TeamMember | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="Give your staff their own login so you know who did what."
        actions={
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="mr-1.5 h-4 w-4" /> Invite
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          {error ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : isLoading ? (
            <ListSkeleton rows={4} />
          ) : !data?.length ? (
            <EmptyState icon={Users} title="Just you for now" description="Invite your managers and kitchen staff." />
          ) : (
            <div className="divide-y">
              {data.map((m) => (
                <div key={m.name} className="flex items-center gap-3 p-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-accent text-sm font-semibold text-accent-foreground">{initials(m.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      {m.full_name}
                      {m.status !== "active" && <StatusBadge status={m.status} />}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">{m.email}</p>
                    <p className="text-xs text-muted-foreground sm:hidden">{m.role}</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-medium">{m.role}</p>
                    <p className="text-xs text-muted-foreground">{m.last_active ? `Active ${timeAgo(m.last_active)}` : "Not signed in yet"}</p>
                  </div>
                  {m.role === "Owner" ? (
                    <span className="flex h-8 w-8 items-center justify-center text-primary" title="Owner">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Member actions">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Change role</DropdownMenuLabel>
                        {(["Manager", "Staff"] as const).map((r) => (
                          <DropdownMenuItem key={r} disabled={m.role === r} onClick={() => update.mutate({ id: m.name, data: { role: r } })}>
                            {r}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => update.mutate({ id: m.name, data: { status: m.status === "disabled" ? "active" : "disabled" } })}>
                          {m.status === "disabled" ? "Enable access" : "Disable access"}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setRemoving(m)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">What each role can do</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ROLES.map((r) => (
              <div key={r.role}>
                <p className="text-sm font-medium">{r.role}</p>
                <ul className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                  {r.can.map((c) => (
                    <li key={c}>• {c}</li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={`Remove ${removing?.full_name}?`}
        description="They will lose access to your store immediately."
        confirmLabel="Remove"
        destructive
        onConfirm={() => removing && remove.mutate(removing.name)}
      />
    </div>
  );
}
